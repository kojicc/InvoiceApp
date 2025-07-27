import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  clientId?: number;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isHydrated: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await api.post('/api/auth/login', { email, password });
          const { token, user } = response.data;

          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            clientId: user.clientId,
          };

          // Set Authorization header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user: userData,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          notifications.show({
            title: 'Login Successful',
            message: `Welcome back, ${user.username}!`,
            color: 'green',
          });
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          notifications.show({
            title: 'Login Failed',
            message,
            color: 'red',
          });
          throw new Error(message);
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          set({ isLoading: true });
          await api.post('/api/auth/register', { username, email, password });

          notifications.show({
            title: 'Registration Successful',
            message: 'Please login with your credentials',
            color: 'green',
          });

          // Auto-login after registration
          await get().login(email, password);
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Registration failed';
          notifications.show({
            title: 'Registration Failed',
            message,
            color: 'red',
          });
          throw new Error(message);
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        // Clear any stored return path
        sessionStorage.removeItem('returnTo');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        notifications.show({
          title: 'Logged Out',
          message: 'You have been successfully logged out',
          color: 'blue',
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        console.log('🔄 Auth store rehydrating...', { state, error });

        // Set the auth header when rehydrating from storage
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          console.log('✅ Auth header set from rehydrated token');
        }

        // Always set hydrated to true after rehydration attempt
        setTimeout(() => {
          useAuthStore.setState({ isHydrated: true });
          console.log('✅ Auth store hydration complete');
        }, 0);
      },
    }
  )
);
