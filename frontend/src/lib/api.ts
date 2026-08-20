const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser, use relative path /api/v1 for same-origin proxy routing
    return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  }
  // Server-side rendering fallback
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.INTERNAL_API_URL ||
    'http://localhost:5000/api/v1'
  );
};

export interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try localStorage first
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;

  // Fallback to cookie search
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const baseUrl = getBaseUrl().replace(/\/+$/, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
