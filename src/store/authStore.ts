import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'pharmacist';
  specialty: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => {
    localStorage.setItem('mcms_user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('mcms_user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const saved = localStorage.getItem('mcms_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        set({ user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('mcms_user');
      }
    }
  }
}));
