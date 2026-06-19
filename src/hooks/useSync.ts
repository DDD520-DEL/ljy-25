import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBarkStore } from '@/store/useBarkStore';
import * as syncService from '@/services/syncService';

export interface SyncResult {
  success: boolean;
  message?: string;
  pushedRecords?: number;
  pulledRecords?: number;
  mergedRecords?: number;
  mergedDogs?: number;
  deletedLocal?: number;
}

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastSyncAt = useAuthStore((s) => s.syncStatus.lastSyncAt);
  const setSyncing = useAuthStore((s) => s.setSyncing);
  const setLastSync = useAuthStore((s) => s.setLastSync);
  const setSyncError = useAuthStore((s) => s.setSyncError);
  const setPendingChanges = useAuthStore((s) => s.setPendingChanges);
  const logout = useAuthStore((s) => s.logout);

  const getPendingSyncData = useBarkStore((s) => s.getPendingSyncData);
  const markAllSynced = useBarkStore((s) => s.markAllSynced);
  const mergeRemoteChanges = useBarkStore((s) => s.mergeRemoteChanges);
  const replaceAllData = useBarkStore((s) => s.replaceAllData);
  const settings = useBarkStore((s) => s.settings);
  const records = useBarkStore((s) => s.records);
  const dogs = useBarkStore((s) => s.dogs);

  const syncLockRef = useRef(false);

  const updatePendingCount = useCallback(() => {
    const pending = getPendingSyncData();
    const count =
      pending.records.length +
      pending.dogs.length +
      pending.deletedRecordIds.length +
      pending.deletedDogIds.length;
    setPendingChanges(count);
  }, [getPendingSyncData, setPendingChanges]);

  useEffect(() => {
    if (isAuthenticated) {
      updatePendingCount();
    }
  }, [records, dogs, isAuthenticated, updatePendingCount]);

  const handleAuthError = useCallback(
    async (error: Error) => {
      const msg = error.message;
      if (msg.includes('登录已过期') || msg.includes('身份不匹配')) {
        await logout();
        setSyncError('登录已过期，请重新登录');
        return true;
      }
      return false;
    },
    [logout, setSyncError]
  );

  const pushLocalChanges = useCallback(async (): Promise<{ serverTime: number }> => {
    if (!user?.token || !user.id) {
      throw new Error('未登录');
    }

    const pending = getPendingSyncData();
    const result = await syncService.pushChanges(user.token, {
      userId: user.id,
      records: pending.records,
      dogs: pending.dogs,
      deletedRecordIds: pending.deletedRecordIds,
      deletedDogIds: pending.deletedDogIds,
      lastSyncAt,
    });

    markAllSynced();
    return { serverTime: result.serverTime };
  }, [user, lastSyncAt, getPendingSyncData, markAllSynced]);

  const pullRemoteChanges = useCallback(async (): Promise<SyncResult> => {
    if (!user?.token || !user.id) {
      throw new Error('未登录');
    }

    const response = await syncService.pullChanges(user.token, user.id, lastSyncAt);

    const mergeResult = mergeRemoteChanges(
      response.records,
      response.dogs,
      response.deletedRecordIds,
      response.deletedDogIds
    );

    setLastSync('pull', response.serverTime);

    return {
      success: true,
      pulledRecords: response.records.length + response.dogs.length,
      mergedRecords: mergeResult.mergedRecords,
      mergedDogs: mergeResult.mergedDogs,
      deletedLocal: mergeResult.deletedLocal,
    };
  }, [user, lastSyncAt, mergeRemoteChanges, setLastSync]);

  const syncIncremental = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录' };
    }

    if (syncLockRef.current) {
      return { success: false, message: '同步进行中' };
    }

    syncLockRef.current = true;
    setSyncing(true);
    setSyncError(undefined);

    try {
      const pushResult = await pushLocalChanges();
      setLastSync('push', pushResult.serverTime);

      const pending = getPendingSyncData();
      const pushedCount =
        pending.records.length +
        pending.dogs.length +
        pending.deletedRecordIds.length +
        pending.deletedDogIds.length;

      const pullResult = await pullRemoteChanges();

      setLastSync('push', Math.max(pushResult.serverTime, pullResult.mergedRecords || 0 > 0 ? Date.now() : pushResult.serverTime));

      updatePendingCount();

      return {
        success: true,
        pushedRecords: pushedCount,
        ...pullResult,
      };
    } catch (error) {
      const err = error as Error;
      const isAuthErr = await handleAuthError(err);
      if (!isAuthErr) {
        setSyncError(err.message || '同步失败');
      }
      return {
        success: false,
        message: err.message || '同步失败',
      };
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }, [isAuthenticated, user, pushLocalChanges, pullRemoteChanges, getPendingSyncData, setSyncing, setSyncError, setLastSync, updatePendingCount, handleAuthError]);

  const pushOnLogin = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录' };
    }

    if (syncLockRef.current) {
      return { success: false, message: '同步进行中' };
    }

    syncLockRef.current = true;
    setSyncing(true);
    setSyncError(undefined);

    try {
      const pushResult = await pushLocalChanges();
      setLastSync('push', pushResult.serverTime);
      updatePendingCount();

      return {
        success: true,
        message: '本地数据已上传至云端',
      };
    } catch (error) {
      const err = error as Error;
      const isAuthErr = await handleAuthError(err);
      if (!isAuthErr) {
        setSyncError(err.message || '上传失败');
      }
      return {
        success: false,
        message: err.message || '上传失败',
      };
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }, [isAuthenticated, user, pushLocalChanges, setSyncing, setSyncError, setLastSync, updatePendingCount, handleAuthError]);

  const pullOnStartup = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录' };
    }

    if (syncLockRef.current) {
      return { success: false, message: '同步进行中' };
    }

    syncLockRef.current = true;
    setSyncing(true);
    setSyncError(undefined);

    try {
      const result = await pullRemoteChanges();
      updatePendingCount();
      return {
        ...result,
        message: '已从云端同步最新数据',
      };
    } catch (error) {
      const err = error as Error;
      const isAuthErr = await handleAuthError(err);
      if (!isAuthErr) {
        setSyncError(err.message || '拉取失败');
      }
      return {
        success: false,
        message: err.message || '拉取失败',
      };
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }, [isAuthenticated, user, pullRemoteChanges, setSyncing, setSyncError, updatePendingCount, handleAuthError]);

  const forceFullSync = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录' };
    }

    if (syncLockRef.current) {
      return { success: false, message: '同步进行中' };
    }

    syncLockRef.current = true;
    setSyncing(true);
    setSyncError(undefined);

    try {
      const pushRes = await syncService.pushFull(
        user.token,
        user.id,
        records,
        dogs,
        settings
      );

      const pullRes = await syncService.pullAll(user.token, user.id);

      replaceAllData(pullRes.records, pullRes.dogs, pullRes.settings);

      setLastSync('full', Math.max(pushRes.serverTime, pullRes.serverTime));
      updatePendingCount();

      return {
        success: true,
        message: '全量同步完成',
        pushedRecords: records.length + dogs.length,
        pulledRecords: pullRes.records.length + pullRes.dogs.length,
      };
    } catch (error) {
      const err = error as Error;
      const isAuthErr = await handleAuthError(err);
      if (!isAuthErr) {
        setSyncError(err.message || '全量同步失败');
      }
      return {
        success: false,
        message: err.message || '全量同步失败',
      };
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }, [isAuthenticated, user, records, dogs, settings, replaceAllData, setSyncing, setSyncError, setLastSync, updatePendingCount, handleAuthError]);

  return {
    syncIncremental,
    pushOnLogin,
    pullOnStartup,
    forceFullSync,
    updatePendingCount,
  };
}
