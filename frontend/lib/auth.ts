import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) { set({ loading: false }); return; }
      const user = await authApi.me();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    set({ user: null });
    window.location.href = '/';
  },
}));
