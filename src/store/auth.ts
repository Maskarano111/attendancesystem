import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin' | 'department_head';
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => void;
  isTokenExpired: () => boolean;
}

const safeStorage: PersistStorage<AuthState> = {
  getItem: (name) => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    try {
      return JSON.parse(value) as StorageValue<AuthState>;
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
      
      setAuth: (user, token, refreshToken) => {
        const tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        set({ user, token, refreshToken, tokenExpiry });
      },
      
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        return tokenExpiry ? Date.now() > tokenExpiry - 60000 : false; // Refresh 1 min before expiry
      },
      
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            get().logout();
            return null;
          }

          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            get().logout();
            return null;
          }

          const data = await response.json();
          const newToken = data.token;
          const newTokenExpiry = Date.now() + 15 * 60 * 1000;
          
          set({ token: newToken, tokenExpiry: newTokenExpiry });
          return newToken;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          return null;
        }
      },
      
      logout: () => set({ user: null, token: null, refreshToken: null, tokenExpiry: null }),
    }),
    {
      name: 'auth-storage',
      storage: safeStorage,
    }
  )
);
