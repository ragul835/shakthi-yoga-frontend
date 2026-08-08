import { reportClientError } from '@/lib/logger';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:3001/api';
};
const API_URL = getApiUrl();

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/images/')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) return fallback;
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.filter(item => typeof item === 'string').join('. ') || fallback;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...rest,
    });
  } catch (error) {
    reportClientError(error, { source: 'api_error', path: endpoint.split('?')[0] });
    throw error;
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      // Auto logout on 401 (expired token)
      localStorage.removeItem('zen_token');
      localStorage.removeItem('zen_refresh');
      localStorage.removeItem('zen_user');
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
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    });
  } catch (error) {
    reportClientError(error, { source: 'api_error', path: endpoint.split('?')[0] });
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('zen_token');
      localStorage.removeItem('zen_refresh');
      localStorage.removeItem('zen_user');
      window.location.href = '/signin?session_expired=true';
    }
    const error: unknown = await response.json().catch(() => ({ message: 'Unable to submit payment proof' }));
    throw new Error(getApiErrorMessage(error, `HTTP ${response.status}`));
  }

  return response.json();
}

export async function apiFormPatch<T = unknown>(endpoint: string, body: FormData, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    });
  } catch (error) {
    reportClientError(error, { source: 'api_error', path: endpoint.split('?')[0] });
    throw error;
  }

  if (!response.ok) {
    const error: unknown = await response.json().catch(() => ({ message: 'Unable to review payment' }));
    throw new Error(getApiErrorMessage(error, `HTTP ${response.status}`));
  }

  return response.json();
}

export async function apiGetBlob(endpoint: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error: unknown = await response.json().catch(() => ({ message: 'Unable to download file' }));
    throw new Error(getApiErrorMessage(error, `HTTP ${response.status}`));
  }
  return response.blob();
}
