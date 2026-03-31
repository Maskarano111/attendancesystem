import { useAuthStore } from '../store/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const authStore = useAuthStore.getState();
  let token = authStore.token;
  
  // Check if token is expired and refresh if needed
  if (authStore.isTokenExpired() && authStore.refreshToken) {
    const newToken = await authStore.refreshAccessToken();
    if (!newToken) {
      throw new Error('Session expired. Please login again.');
    }
    token = newToken;
  }
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token might be invalid, logout
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(data?.message || response.statusText || `Request failed (${response.status})`);
  }

  return data;
};
