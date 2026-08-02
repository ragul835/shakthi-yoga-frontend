const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:3001/api';
};
const API_URL = getApiUrl();

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      // Auto logout on 401 (expired token)
      localStorage.removeItem('zen_token');
      localStorage.removeItem('zen_refresh');
      localStorage.removeItem('zen_user');
      window.location.href = '/signin?session_expired=true';
    }
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiGet = <T = unknown>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'GET', token });

export const apiPost = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token });

export const apiPatch = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token });

export const apiPut = <T = unknown>(endpoint: string, body: unknown, token?: string) =>
  api<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token });

export const apiDelete = <T = unknown>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'DELETE', token });
