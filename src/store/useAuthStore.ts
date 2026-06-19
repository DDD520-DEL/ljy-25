import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, SyncStatus } from '@/types';
import * as syncService from '@/services/syncService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  setSyncing: (isSyncing: boolean) => void;
  setLastSync: (direction: 'push' | 'pull' | 'full', serverTime: number) => void;
  setSyncError: (error: string | undefined) => void;
  setPendingChanges: (count: number) => void;
  clearError: () => void;
}

const initialSyncStatus: SyncStatus = {
  lastSyncAt: 0,
  lastSyncDirection: null,
  pendingChanges: 0,
  isSyncing: false,
  lastError: undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      syncStatus: initialSyncStatus,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await syncService.login(username, password);
          set({
            user,
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

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await syncService.register(username, email, password);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '注册失败',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        const { user } = get();
        if (user?.token) {
          try {
            await syncService.logout(user.token);
          } catch {
            // ignore logout errors
          }
        }
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          syncStatus: initialSyncStatus,
        });
      },

      validateSession: async () => {
        const { user } = get();
        if (!user?.token) return false;
        try {
          const validated = await syncService.validateToken(user.token);
          if (validated) {
            set({ user: validated, isAuthenticated: true });
            return true;
          }
          set({ user: null, isAuthenticated: false });
          return false;
        } catch {
          return false;
        }
      },

      setSyncing: (isSyncing: boolean) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, isSyncing },
        }));
      },

      setLastSync: (direction: 'push' | 'pull' | 'full', serverTime: number) => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            lastSyncAt: serverTime,
            lastSyncDirection: direction,
            lastError: undefined,
          },
        }));
      },

      setSyncError: (error: string | undefined) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, lastError: error },
        }));
      },

      setPendingChanges: (count: number) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, pendingChanges: count },
        }));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'bark-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        syncStatus: {
          ...state.syncStatus,
          isSyncing: false,
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncStatus.isSyncing = false;
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
