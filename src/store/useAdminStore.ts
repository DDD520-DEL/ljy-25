import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AdminUser } from '@/types';
import { BackupAdminData } from '@/utils/storage';
import * as syncService from '@/services/syncService';

interface AdminState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  clearError: () => void;
  restoreAdminData: (data: BackupAdminData) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const admin = await syncService.adminLogin(username, password);
          set({
            admin,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '登录失败',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        const { admin } = get();
        if (admin?.token) {
          try {
            await syncService.adminLogout(admin.token);
          } catch {
            // ignore logout errors
          }
        }
        set({
          admin: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      validateSession: async () => {
        const { admin } = get();
        if (!admin?.token) return false;
        try {
          const validated = await syncService.validateAdminToken(admin.token);
          if (validated) {
            set({ admin: validated, isAuthenticated: true });
            return true;
          }
          set({ admin: null, isAuthenticated: false });
          return false;
        } catch {
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      restoreAdminData: (data: BackupAdminData) => {
        set({
          admin: data.admin,
          isAuthenticated: data.isAuthenticated,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'bark-admin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
