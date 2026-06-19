import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, SyncStatus, SyncStats } from '@/types';
import * as syncService from '@/services/syncService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  syncQueue: Promise<unknown>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  enqueueSync: <T>(
    task: () => Promise<T>,
    type: 'push' | 'pull' | 'full'
  ) => Promise<T>;
  setSyncing: (
    isSyncing: boolean,
    type: 'push' | 'pull' | 'full' | null
  ) => void;
  setLastSync: (
    direction: 'push' | 'pull' | 'full',
    serverTime: number,
    stats: Partial<SyncStats>,
    message: string
  ) => void;
  setSyncError: (error: string | undefined) => void;
  setPendingChanges: (count: number) => void;
  setJustLoggedIn: (value: boolean) => void;
  clearError: () => void;
}

const initialSyncStats: SyncStats = {
  recordsPushed: 0,
  dogsPushed: 0,
  recordsPulled: 0,
  dogsPulled: 0,
  recordsMerged: 0,
  dogsMerged: 0,
  deletedLocal: 0,
};

const initialSyncStatus: SyncStatus = {
  lastSyncAt: 0,
  lastSyncDirection: null,
  lastSyncSuccess: false,
  lastSyncMessage: '',
  pendingChanges: 0,
  isSyncing: false,
  currentSyncType: null,
  lastError: undefined,
  lastSyncStats: initialSyncStats,
  queueSize: 0,
  justLoggedIn: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      syncStatus: initialSyncStatus,
      syncQueue: Promise.resolve(),

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await syncService.login(username, password);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              justLoggedIn: true,
            },
          }));
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
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              justLoggedIn: true,
            },
          }));
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
          syncQueue: Promise.resolve(),
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

      enqueueSync: async <T,>(
        task: () => Promise<T>,
        type: 'push' | 'pull' | 'full'
      ): Promise<T> => {
        const state = get();
        const currentQueue = state.syncQueue;

        set((s) => ({
          syncStatus: {
            ...s.syncStatus,
            queueSize: s.syncStatus.queueSize + 1,
          },
        }));

        const nextTask = currentQueue
          .catch(() => {})
          .then(async () => {
            const { isSyncing } = get().syncStatus;
            if (!isSyncing) {
              set((s) => ({
                syncStatus: {
                  ...s.syncStatus,
                  isSyncing: true,
                  currentSyncType: type,
                  lastError: undefined,
                },
              }));
            }

            try {
              const result = await task();
              return result;
            } finally {
              set((s) => {
                const newSize = s.syncStatus.queueSize - 1;
                return {
                  syncStatus: {
                    ...s.syncStatus,
                    queueSize: newSize,
                    isSyncing: newSize > 0 ? s.syncStatus.isSyncing : false,
                    currentSyncType:
                      newSize > 0 ? s.syncStatus.currentSyncType : null,
                  },
                };
              });
            }
          });

        set({ syncQueue: nextTask });

        return nextTask as Promise<T>;
      },

      setSyncing: (isSyncing: boolean, type: 'push' | 'pull' | 'full' | null) => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            isSyncing,
            currentSyncType: type,
          },
        }));
      },

      setLastSync: (
        direction: 'push' | 'pull' | 'full',
        serverTime: number,
        stats: Partial<SyncStats>,
        message: string
      ) => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            lastSyncAt: serverTime,
            lastSyncDirection: direction,
            lastSyncSuccess: true,
            lastSyncMessage: message,
            lastSyncStats: {
              ...state.syncStatus.lastSyncStats,
              ...stats,
            },
            lastError: undefined,
          },
        }));
      },

      setSyncError: (error: string | undefined) => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            lastError: error,
            lastSyncSuccess: false,
            lastSyncMessage: error || '',
          },
        }));
      },

      setPendingChanges: (count: number) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, pendingChanges: count },
        }));
      },

      setJustLoggedIn: (value: boolean) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, justLoggedIn: value },
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
          currentSyncType: null,
          queueSize: 0,
          justLoggedIn: false,
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncStatus.isSyncing = false;
          state.syncStatus.currentSyncType = null;
          state.syncStatus.queueSize = 0;
          state.syncStatus.justLoggedIn = false;
          state.isLoading = false;
          state.error = null;
          state.syncQueue = Promise.resolve();
        }
      },
    }
  )
);
