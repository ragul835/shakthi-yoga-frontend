const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

export const apiDelete = <T = unknown>(endpoint: string, token?: string) =>
  api<T>(endpoint, { method: 'DELETE', token });
