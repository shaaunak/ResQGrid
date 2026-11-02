const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('resqgrid_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('resqgrid_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('resqgrid_token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Operational request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

