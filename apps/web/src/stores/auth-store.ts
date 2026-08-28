'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserDTO, RegisterInput, LoginInput } from '@social/shared';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserDTO, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  updateUserProfile: (user: Partial<UserDTO>) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        // Set default Authorization header on apiClient
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
      },

      setAccessToken: (accessToken) => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ accessToken });
      },

      updateUserProfile: (updatedUser) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updatedUser } });
        }
      },

      login: async (input) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', input);
          const { user, accessToken } = response.data.data;
          get().setAuth(user, accessToken);
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (input) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/register', input);
          const { user, accessToken } = response.data.data;
          get().setAuth(user, accessToken);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Ignore logout network errors
        } finally {
          delete apiClient.defaults.headers.common['Authorization'];
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      refreshSession: async () => {
        try {
          const response = await apiClient.post('/auth/refresh');
          const { accessToken } = response.data.data;
          get().setAccessToken(accessToken);
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await apiClient.get('/auth/me');
          const { user } = response.data.data;
          set({ user, isAuthenticated: true });
        } catch {
          // If token expired or invalid, attempt refresh
          const refreshed = await get().refreshSession();
          if (!refreshed) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'social-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
