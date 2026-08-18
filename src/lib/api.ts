import { reportClientError } from '@/lib/logger';

const API_URL = '/api';

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

interface FetchOptions extends RequestInit {
  token?: string;
  retriedAfterRefresh?: boolean;
  allowUnauthenticated?: boolean;
}

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = 'shakthi_csrf=';
  const value = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined;
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) return fallback;
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.filter(item => typeof item === 'string').join('. ') || fallback;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, retriedAfterRefresh = false, allowUnauthenticated = false, ...rest } = options;
  const method = (rest.method || 'GET').toUpperCase();
  const csrfToken = !['GET', 'HEAD', 'OPTIONS'].includes(method) ? getCsrfToken() : undefined;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && token !== 'cookie-session' ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...headers,
      },
      ...rest,
    });
  } catch (error) {
    reportClientError(error, { source: 'api_error', path: endpoint.split('?')[0] });
    throw error;
  }

  if (!res.ok) {
    if (res.status === 401 && !retriedAfterRefresh && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      const refreshCsrf = getCsrfToken();
      const refreshed = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: refreshCsrf ? { 'X-CSRF-Token': refreshCsrf } : undefined,
      });
      if (refreshed.ok) return api<T>(endpoint, { ...options, retriedAfterRefresh: true });
    }
    if (res.status === 401 && typeof window !== 'undefined' && !allowUnauthenticated) {
      window.location.href = '/signin?session_expired=true';
    }
    const error: unknown = await res.json().catch(() => ({ message: 'An error occurred' }));
    const message = getApiErrorMessage(error, `HTTP ${res.status}`);
    if (res.status >= 500) {
      reportClientError(new Error(message), {
        source: 'api_error',
        path: endpoint.split('?')[0],
        digest: res.headers.get('x-request-id') || undefined,
      });
    }
    throw new Error(message);
  }

  return res.json();
}

export const apiGet = <T = unknown>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'GET', token, cache: 'no-store' });

export const apiPost = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token });

export const apiPublicPost = <T = unknown>(endpoint: string, body: unknown) =>
  api<T>(endpoint, { method: 'POST', body: JSON.stringify(body), allowUnauthenticated: true });

export const apiPatch = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token });

export const apiPut = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token });

export const apiDelete = <T = unknown>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'DELETE', token });

export async function apiFormPost<T = unknown>(endpoint: string, body: FormData, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && token !== 'cookie-session' ? { Authorization: `Bearer ${token}` } : {}),
        ...(getCsrfToken() ? { 'X-CSRF-Token': getCsrfToken()! } : {}),
      },
      body,
    });
  } catch (error) {
    reportClientError(error, { source: 'api_error', path: endpoint.split('?')[0] });
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/signin?session_expired=true';
    }
    const error: unknown = await response.json().catch(() => ({ message: 'Unable to submit request' }));
    throw new Error(getApiErrorMessage(error, `HTTP ${response.status}`));
  }

  return response.json();
}

export async function apiGetBlob(endpoint: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      ...(token !== 'cookie-session' ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error: unknown = await response.json().catch(() => ({ message: 'Unable to download file' }));
    throw new Error(getApiErrorMessage(error, `HTTP ${response.status}`));
  }
  return response.blob();
}
