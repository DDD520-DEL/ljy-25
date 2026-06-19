import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBarkStore } from '@/store/useBarkStore';
import * as syncService from '@/services/syncService';
import { SyncStats } from '@/types';

export interface SyncResult {
  success: boolean;
  message: string;
  stats: SyncStats;
  serverTime?: number;
}

const emptyStats: SyncStats = {
  recordsPushed: 0,
  dogsPushed: 0,
  recordsPulled: 0,
  dogsPulled: 0,
  recordsMerged: 0,
  dogsMerged: 0,
  deletedLocal: 0,
};

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastSyncAt = useAuthStore((s) => s.syncStatus.lastSyncAt);
  const justLoggedIn = useAuthStore((s) => s.syncStatus.justLoggedIn);
  const enqueueSync = useAuthStore((s) => s.enqueueSync);
  const setLastSync = useAuthStore((s) => s.setLastSync);
  const setSyncError = useAuthStore((s) => s.setSyncError);
  const setPendingChanges = useAuthStore((s) => s.setPendingChanges);
  const setJustLoggedIn = useAuthStore((s) => s.setJustLoggedIn);
  const setLoginSyncPhase = useAuthStore((s) => s.setLoginSyncPhase);
  const setLastLoginSyncResult = useAuthStore((s) => s.setLastLoginSyncResult);
  const appendLoginSyncResult = useAuthStore((s) => s.appendLoginSyncResult);
  const logout = useAuthStore((s) => s.logout);

  const getPendingSyncData = useBarkStore((s) => s.getPendingSyncData);
  const markAllSynced = useBarkStore((s) => s.markAllSynced);
  const mergeRemoteChanges = useBarkStore((s) => s.mergeRemoteChanges);
  const replaceAllData = useBarkStore((s) => s.replaceAllData);
  const settings = useBarkStore((s) => s.settings);
  const records = useBarkStore((s) => s.records);
  const dogs = useBarkStore((s) => s.dogs);

  const hasInitRef = useRef(false);

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

  const pushLocalChanges = useCallback(async (): Promise<{
    serverTime: number;
    stats: SyncStats;
  }> => {
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

    const stats: SyncStats = {
      ...emptyStats,
      recordsPushed: pending.records.length,
      dogsPushed: pending.dogs.length,
    };

    return { serverTime: result.serverTime, stats };
  }, [user, lastSyncAt, getPendingSyncData, markAllSynced]);

  const pullRemoteChanges = useCallback(async (): Promise<{
    serverTime: number;
    stats: SyncStats;
  }> => {
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

    const stats: SyncStats = {
      ...emptyStats,
      recordsPulled: response.records.length,
      dogsPulled: response.dogs.length,
      recordsMerged: mergeResult.mergedRecords,
      dogsMerged: mergeResult.mergedDogs,
      deletedLocal: mergeResult.deletedLocal,
    };

    return { serverTime: response.serverTime, stats };
  }, [user, lastSyncAt, mergeRemoteChanges]);

  const syncOnLogin = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录', stats: emptyStats };
    }

    return enqueueSync(async () => {
      setLoginSyncPhase('pushing');
      setLastLoginSyncResult(null);

      let pushServerTime = 0;
      let pushStats: SyncStats = { ...emptyStats };
      let pushSuccess = true;
      let pushMessage = '';
      let pushError: string | undefined;

      try {
        const result = await pushLocalChanges();
        pushServerTime = result.serverTime;
        pushStats = result.stats;
        const totalPushed = pushStats.recordsPushed + pushStats.dogsPushed;
        pushMessage =
          totalPushed > 0
            ? `成功上传 ${pushStats.recordsPushed} 条记录、${pushStats.dogsPushed} 只狗狗档案`
            : '本地数据已是最新，无需上传';
        appendLoginSyncResult('push', true, pushMessage);
      } catch (error) {
        pushSuccess = false;
        pushError = error instanceof Error ? error.message : '上传失败';
        pushMessage = pushError;
        appendLoginSyncResult('push', false, pushMessage, pushError);

        const isAuthErr = await handleAuthError(error as Error);
        if (isAuthErr) {
          setLoginSyncPhase('done');
          setJustLoggedIn(false);
          return {
            success: false,
            message: pushError,
            stats: pushStats,
          };
        }
      }

      setLoginSyncPhase('pulling');

      let pullServerTime = 0;
      let pullStats: SyncStats = { ...emptyStats };
      let pullSuccess = true;
      let pullMessage = '';
      let pullError: string | undefined;

      try {
        const result = await pullRemoteChanges();
        pullServerTime = result.serverTime;
        pullStats = result.stats;
        const totalChanged =
          pullStats.recordsMerged + pullStats.dogsMerged + pullStats.deletedLocal;
        pullMessage =
          totalChanged > 0
            ? `从云端拉取：新增/更新 ${pullStats.recordsMerged + pullStats.dogsMerged} 项，清理 ${pullStats.deletedLocal} 项`
            : '云端数据已是最新，无需拉取';
        appendLoginSyncResult('pull', true, pullMessage);
      } catch (error) {
        pullSuccess = false;
        pullError = error instanceof Error ? error.message : '拉取失败';
        pullMessage = pullError;
        appendLoginSyncResult('pull', false, pullMessage, pullError);
        await handleAuthError(error as Error);
      }

      setLoginSyncPhase('done');

      const combinedStats: SyncStats = {
        ...pushStats,
        recordsPulled: pullStats.recordsPulled,
        dogsPulled: pullStats.dogsPulled,
        recordsMerged: pullStats.recordsMerged,
        dogsMerged: pullStats.dogsMerged,
        deletedLocal: pullStats.deletedLocal,
      };

      const serverTime = Math.max(
        pushServerTime || Date.now(),
        pullServerTime || Date.now()
      );

      const overallSuccess = pushSuccess || pullSuccess;
      const parts: string[] = [];
      if (pushSuccess) {
        const p = pushStats.recordsPushed + pushStats.dogsPushed;
        if (p > 0) parts.push(`上传 ${p} 项`);
        else parts.push('无需上传');
      } else {
        parts.push(`上传失败：${pushError || '未知原因'}`);
      }
      if (pullSuccess) {
        const m = pullStats.recordsMerged + pullStats.dogsMerged;
        if (m > 0) parts.push(`拉取/合并 ${m} 项`);
        else parts.push('无需拉取');
      } else {
        parts.push(`拉取失败：${pullError || '未知原因'}`);
      }

      const finalMessage = parts.join('；');

      setLastSync('login', serverTime, combinedStats, finalMessage, overallSuccess);
      updatePendingCount();
      setJustLoggedIn(false);

      return {
        success: overallSuccess,
        message: finalMessage,
        stats: combinedStats,
        serverTime,
      };
    }, 'push');
  }, [
    isAuthenticated,
    user,
    enqueueSync,
    pushLocalChanges,
    pullRemoteChanges,
    appendLoginSyncResult,
    handleAuthError,
    setLastSync,
    updatePendingCount,
    setJustLoggedIn,
    setLoginSyncPhase,
    setLastLoginSyncResult,
  ]);

  const pushOnLogin = useCallback(async (): Promise<SyncResult> => {
    return syncOnLogin();
  }, [syncOnLogin]);

  const pullOnStartup = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录', stats: emptyStats };
    }

    return enqueueSync(async () => {
      try {
        const { serverTime, stats } = await pullRemoteChanges();
        const totalChanged =
          stats.recordsMerged + stats.dogsMerged + stats.deletedLocal;
        const message =
          totalChanged > 0
            ? `同步完成：新增/更新 ${stats.recordsMerged + stats.dogsMerged} 项，清理 ${stats.deletedLocal} 项`
            : '数据已是最新';

        setLastSync('pull', serverTime, stats, message);
        updatePendingCount();

        return { success: true, message, stats, serverTime };
      } catch (error) {
        const err = error as Error;
        const isAuthErr = await handleAuthError(err);
        if (!isAuthErr) {
          setSyncError(err.message || '拉取失败');
        }
        return {
          success: false,
          message: err.message || '拉取失败',
          stats: emptyStats,
        };
      }
    }, 'pull');
  }, [
    isAuthenticated,
    user,
    enqueueSync,
    pullRemoteChanges,
    setLastSync,
    updatePendingCount,
    handleAuthError,
    setSyncError,
  ]);

  const syncIncremental = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录', stats: emptyStats };
    }

    return enqueueSync(async () => {
      try {
        const pushResult = await pushLocalChanges();
        const pullResult = await pullRemoteChanges();

        const combinedStats: SyncStats = {
          recordsPushed: pushResult.stats.recordsPushed,
          dogsPushed: pushResult.stats.dogsPushed,
          recordsPulled: pullResult.stats.recordsPulled,
          dogsPulled: pullResult.stats.dogsPulled,
          recordsMerged: pullResult.stats.recordsMerged,
          dogsMerged: pullResult.stats.dogsMerged,
          deletedLocal: pullResult.stats.deletedLocal,
        };

        const serverTime = Math.max(pushResult.serverTime, pullResult.serverTime);
        const totalPushed = combinedStats.recordsPushed + combinedStats.dogsPushed;
        const totalMerged =
          combinedStats.recordsMerged + combinedStats.dogsMerged;

        const parts: string[] = [];
        if (totalPushed > 0) parts.push(`上传 ${totalPushed} 项`);
        if (totalMerged > 0) parts.push(`合并 ${totalMerged} 项`);
        if (combinedStats.deletedLocal > 0)
          parts.push(`清理 ${combinedStats.deletedLocal} 项`);

        const message =
          parts.length > 0 ? `同步完成：${parts.join('，')}` : '数据已是最新';

        setLastSync('pull', serverTime, combinedStats, message);
        updatePendingCount();

        return { success: true, message, stats: combinedStats, serverTime };
      } catch (error) {
        const err = error as Error;
        const isAuthErr = await handleAuthError(err);
        if (!isAuthErr) {
          setSyncError(err.message || '同步失败');
        }
        return {
          success: false,
          message: err.message || '同步失败',
          stats: emptyStats,
        };
      }
    }, 'pull');
  }, [
    isAuthenticated,
    user,
    enqueueSync,
    pushLocalChanges,
    pullRemoteChanges,
    setLastSync,
    updatePendingCount,
    handleAuthError,
    setSyncError,
  ]);

  const forceFullSync = useCallback(async (): Promise<SyncResult> => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '未登录', stats: emptyStats };
    }

    return enqueueSync(async () => {
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

        const stats: SyncStats = {
          recordsPushed: records.length,
          dogsPushed: dogs.length,
          recordsPulled: pullRes.records.length,
          dogsPulled: pullRes.dogs.length,
          recordsMerged: pullRes.records.length,
          dogsMerged: pullRes.dogs.length,
          deletedLocal: 0,
        };

        const serverTime = Math.max(pushRes.serverTime, pullRes.serverTime);
        const message = `全量同步完成：上传 ${records.length} 条记录、${dogs.length} 只狗狗；拉取 ${pullRes.records.length} 条记录、${pullRes.dogs.length} 只狗狗`;

        setLastSync('full', serverTime, stats, message);
        updatePendingCount();

        return { success: true, message, stats, serverTime };
      } catch (error) {
        const err = error as Error;
        const isAuthErr = await handleAuthError(err);
        if (!isAuthErr) {
          setSyncError(err.message || '全量同步失败');
        }
        return {
          success: false,
          message: err.message || '全量同步失败',
          stats: emptyStats,
        };
      }
    }, 'full');
  }, [
    isAuthenticated,
    user,
    records,
    dogs,
    settings,
    enqueueSync,
    replaceAllData,
    setLastSync,
    updatePendingCount,
    handleAuthError,
    setSyncError,
  ]);

  useEffect(() => {
    if (justLoggedIn && isAuthenticated && !hasInitRef.current) {
      hasInitRef.current = true;
      pushOnLogin();
    }
    if (!justLoggedIn) {
      hasInitRef.current = false;
    }
  }, [justLoggedIn, isAuthenticated, pushOnLogin]);

  return {
    syncIncremental,
    pushOnLogin,
    pullOnStartup,
    forceFullSync,
    updatePendingCount,
  };
}
