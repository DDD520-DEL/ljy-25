import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Settings as SettingsIcon,
  Volume2,
  Smartphone,
  Check,
  X,
  User,
  LogOut,
  Cloud,
  CloudUpload,
  Loader2,
  RefreshCw,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Info,
  MapPin,
  Shield,
  Ruler,
  Thermometer,
  Download,
  Upload,
  HardDrive,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { useBarkStore } from '@/store/useBarkStore';
import { useReminders } from '@/hooks/useReminders';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { useSync } from '@/hooks/useSync';
import { useLocationSharing, CleanupLogEntry, HeatmapStats } from '@/hooks/useLocationSharing';
import * as heatmapService from '@/services/heatmapService';
import { getGridSizeMeters } from '@/services/locationService';
import {
  createBackupBundle,
  exportBackupAsFileWithProgress,
  parseBackupBundleWithProgress,
  readFileAsTextWithProgress,
  getRestoreSummary,
  BackupDataBundle,
  RestoreSummary,
  ExportProgress,
  ImportProgress,
} from '@/utils/storage';

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '从未同步';
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SettingsPage() {
  const { settings, updateSettings } = useBarkStore();
  const {
    reminders,
    permission,
    requestNotificationPermission,
    toggleReminders,
    addReminderTime,
    updateReminderTime,
    removeReminderTime,
    formatReminderTime,
  } = useReminders();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const clearAuthError = useAuthStore((s) => s.clearError);

  const { syncIncremental } = useSync();

  const {
    isSharingEnabled,
    permissionState,
    precision,
    currentLocation,
    toggleSharing,
    setPrecision,
    enableSharing,
    getHeatmapStats,
    getCleanupHistory,
    manualCleanup,
    forceAggregate,
  } = useLocationSharing();

  const [showAddTime, setShowAddTime] = useState(false);
  const [newHour, setNewHour] = useState(9);
  const [newMinute, setNewMinute] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHour, setEditHour] = useState(0);
  const [editMinute, setEditMinute] = useState(0);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const [heatmapStats, setHeatmapStats] = useState<HeatmapStats | null>(null);
  const [cleanupHistory, setCleanupHistory] = useState<CleanupLogEntry[]>([]);
  const [cleanupMessage, setCleanupMessage] = useState<string>('');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const [pendingRestore, setPendingRestore] = useState<{
    bundle: BackupDataBundle;
    summary: RestoreSummary;
    fileName: string;
  } | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [includeAuthInBackup, setIncludeAuthInBackup] = useState(true);

  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string>('');

  const replaceAllData = useBarkStore((s) => s.replaceAllData);
  const restoreAuthData = useAuthStore((s) => s.restoreAuthData);
  const restoreAdminData = useAdminStore((s) => s.restoreAdminData);

  const refreshStats = async () => {
    const stats = await getHeatmapStats();
    setHeatmapStats(stats);
    const history = getCleanupHistory();
    setCleanupHistory(history);
  };

  useEffect(() => {
    if (isSharingEnabled) {
      refreshStats();
    }
  }, [isSharingEnabled]);

  const handleToggleLocationSharing = async () => {
    const enabled = await toggleSharing();
    if (enabled) {
      await refreshStats();
    }
  };

  const handleEnableLocationSharing = async () => {
    const enabled = await enableSharing();
    if (enabled) {
      await refreshStats();
    }
  };

  const handleManualAggregate = async () => {
    await forceAggregate();
    await refreshStats();
  };

  const handleManualCleanup = () => {
    const result = manualCleanup(heatmapStats?.dataRetentionDays || 30);
    setCleanupMessage(
      result.removed > 0
        ? `已清理 ${result.removed} 条过期记录，剩余 ${result.afterCount} 条`
        : `没有需要清理的过期记录，当前保留 ${result.afterCount} 条`
    );
    refreshStats();
    setTimeout(() => setCleanupMessage(''), 5000);
  };

  const gridSizeMeters = currentLocation
    ? getGridSizeMeters(precision, currentLocation.lat)
    : 0;

  const getLocationPermissionStatus = () => {
    switch (permissionState) {
      case 'granted':
        return {
          text: '位置权限已开启',
          color: 'text-mint-600',
          bg: 'bg-mint-50',
          borderColor: 'border-mint-200',
        };
      case 'denied':
        return {
          text: '位置权限被拒绝',
          color: 'text-coral-600',
          bg: 'bg-coral-50',
          borderColor: 'border-coral-200',
        };
      case 'unsupported':
        return {
          text: '当前浏览器不支持位置功能',
          color: 'text-gray-500',
          bg: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      case 'prompt':
      case 'loading':
      default:
        return {
          text: '尚未授权位置权限',
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          borderColor: 'border-amber-200',
        };
    }
  };

  const locPermStatus = getLocationPermissionStatus();

  useEffect(() => {
    if (authError) {
      setFormError(authError);
    }
  }, [authError]);

  const handleEnableReminders = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return;
      }
    }
    toggleReminders(enabled);
  };

  const handleAddTime = () => {
    addReminderTime(newHour, newMinute);
    setShowAddTime(false);
  };

  const startEditing = (id: string, hour: number, minute: number) => {
    setEditingId(id);
    setEditHour(hour);
    setEditMinute(minute);
  };

  const saveEditing = (id: string) => {
    updateReminderTime(id, { hour: editHour, minute: editMinute });
    setEditingId(null);
  };

  const getPermissionStatus = () => {
    if (!('Notification' in window)) {
      return { text: '当前浏览器不支持通知', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
    switch (permission) {
      case 'granted':
        return { text: '通知权限已开启', color: 'text-mint-600', bg: 'bg-mint-50' };
      case 'denied':
        return { text: '通知权限被拒绝，请在浏览器设置中开启', color: 'text-coral-600', bg: 'bg-coral-50' };
      default:
        return { text: '尚未授权通知权限', color: 'text-amber-600', bg: 'bg-amber-50' };
    }
  };

  const permStatus = getPermissionStatus();

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    clearAuthError();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearAuthError();

    if (!username || !password) {
      setFormError('请输入用户名和密码');
      return;
    }

    try {
      await login(username.trim(), password);
      resetForm();
    } catch {
      // error handled in store
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearAuthError();

    if (!username || !email || !password) {
      setFormError('请填写完整的注册信息');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setFormError('密码至少需要6个字符');
      return;
    }

    try {
      await register(username.trim(), email.trim(), password);
      resetForm();
    } catch {
      // error handled in store
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSyncNow = async () => {
    await syncIncremental();
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setImportError('');
    setImportSuccess('');
    setExportProgress({
      stage: 'collecting',
      stageLabel: '正在收集数据',
      percent: 5,
      message: '正在准备导出数据...',
    });

    try {
      const barkState = useBarkStore.getState();
      const authState = useAuthStore.getState();
      const adminState = useAdminStore.getState();

      const barkData = {
        records: barkState.records,
        dogs: barkState.dogs,
        settings: barkState.settings,
        deletedRecordIds: barkState.deletedRecordIds,
        deletedDogIds: barkState.deletedDogIds,
      };

      const authData = includeAuthInBackup
        ? {
            user: authState.user,
            isAuthenticated: authState.isAuthenticated,
            syncStatus: authState.syncStatus,
          }
        : undefined;

      const adminData = includeAuthInBackup
        ? {
            admin: adminState.admin,
            isAuthenticated: adminState.isAuthenticated,
          }
        : undefined;

      setExportProgress({
        stage: 'collecting',
        stageLabel: '正在收集数据',
        percent: 8,
        message: `收集到 ${barkData.records.length} 条记录，${barkData.dogs.length} 只狗狗资料`,
        recordCount: barkData.records.length,
        dogCount: barkData.dogs.length,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const bundle = createBackupBundle(barkData, authData, adminData);

      await exportBackupAsFileWithProgress(bundle, (progress) => {
        setExportProgress(progress);
      });

      const count = barkData.records.length;
      const dogCount = barkData.dogs.length;
      setImportSuccess(`备份成功！已导出 ${count} 条记录，${dogCount} 只狗狗资料`);
      setTimeout(() => {
        setImportSuccess('');
        setExportProgress(null);
      }, 5000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '导出备份失败');
      setExportProgress(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');
    setIsImporting(true);
    setPendingRestore(null);
    setImportProgress({
      stage: 'reading',
      stageLabel: '开始读取',
      percent: 0,
      message: `准备读取文件：${file.name}`,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      fileName: file.name,
      totalBytes: file.size,
    });

    try {
      const content = await readFileAsTextWithProgress(file, (progress) => {
        setImportProgress(progress);
      });

      const bundle = await parseBackupBundleWithProgress(
        content,
        file.size,
        file.name,
        (progress) => {
          setImportProgress(progress);
        }
      );
      const summary = getRestoreSummary(bundle);

      setPendingRestore({ bundle, summary, fileName: file.name });

      await new Promise(resolve => setTimeout(resolve, 300));
      setImportProgress(null);
      setShowConfirmRestore(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '读取备份文件失败');
      setImportProgress(null);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;

    setIsRestoring(true);
    setRestoreError('');

    try {
      const { bundle } = pendingRestore;
      const { bark, auth, admin } = bundle.data;

      replaceAllData(
        bark.records,
        bark.dogs,
        bark.settings,
        bark.deletedRecordIds,
        bark.deletedDogIds
      );

      if (auth) {
        restoreAuthData(auth);
      }
      if (admin) {
        restoreAdminData(admin);
      }

      const count = bark.records.length;
      const dogCount = bark.dogs.length;
      setImportSuccess(`恢复成功！已导入 ${count} 条记录，${dogCount} 只狗狗资料`);
      setTimeout(() => setImportSuccess(''), 5000);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : '恢复数据失败');
    } finally {
      setIsRestoring(false);
      if (!restoreError) {
        setShowConfirmRestore(false);
        setPendingRestore(null);
      }
    }
  };

  const handleCancelRestore = () => {
    setShowConfirmRestore(false);
    setPendingRestore(null);
    setRestoreError('');
  };

  const renderAuthSection = () => {
    if (isAuthenticated && user) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-gray-800 truncate">
                {user.username}
              </h2>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="p-4">
            <div
              className={`rounded-xl p-4 mb-4 ${
                syncStatus.isSyncing
                  ? 'bg-blue-50 border border-blue-200'
                  : syncStatus.lastSyncAt > 0 && syncStatus.lastSyncSuccess
                  ? 'bg-mint-50 border border-mint-200'
                  : syncStatus.lastSyncAt > 0
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    syncStatus.isSyncing
                      ? 'bg-blue-100'
                      : syncStatus.lastSyncAt > 0 && syncStatus.lastSyncSuccess
                      ? 'bg-mint-100'
                      : syncStatus.lastSyncAt > 0
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {syncStatus.isSyncing ? (
                    <Loader2 className="text-blue-600 animate-spin" size={20} />
                  ) : syncStatus.lastSyncAt > 0 && syncStatus.lastSyncSuccess ? (
                    <Check className="text-mint-600" size={20} />
                  ) : syncStatus.lastSyncAt > 0 ? (
                    <AlertCircle className="text-amber-600" size={20} />
                  ) : (
                    <Cloud className="text-gray-500" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium ${
                      syncStatus.isSyncing
                        ? 'text-blue-800'
                        : syncStatus.lastSyncAt > 0 && syncStatus.lastSyncSuccess
                        ? 'text-mint-800'
                        : syncStatus.lastSyncAt > 0
                        ? 'text-amber-800'
                        : 'text-gray-700'
                    }`}
                  >
                    {syncStatus.isSyncing && syncStatus.loginSyncPhase === 'pushing'
                      ? '正在上传本地数据...'
                      : syncStatus.isSyncing && syncStatus.loginSyncPhase === 'pulling'
                      ? '正在拉取云端数据...'
                      : syncStatus.isSyncing && syncStatus.currentSyncType === 'push'
                      ? '正在上传本地数据...'
                      : syncStatus.isSyncing && syncStatus.currentSyncType === 'pull'
                      ? '正在拉取云端数据...'
                      : syncStatus.isSyncing && syncStatus.currentSyncType === 'full'
                      ? '正在全量同步...'
                      : syncStatus.isSyncing
                      ? '正在同步数据...'
                      : syncStatus.lastSyncAt > 0
                      ? syncStatus.lastSyncDirection === 'login'
                        ? '登录同步已完成'
                        : '云端同步正常'
                      : '尚未同步过数据'}
                  </div>
                  <div
                    className={`text-xs ${
                      syncStatus.isSyncing
                        ? 'text-blue-600'
                        : syncStatus.lastSyncAt > 0 && syncStatus.lastSyncSuccess
                        ? 'text-mint-600'
                        : syncStatus.lastSyncAt > 0
                        ? 'text-amber-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {syncStatus.isSyncing
                      ? syncStatus.queueSize > 1
                        ? `队列中还有 ${syncStatus.queueSize - 1} 个任务`
                        : '请稍候'
                      : syncStatus.lastSyncAt > 0
                      ? `上次同步：${formatDateTime(syncStatus.lastSyncAt)}`
                      : '登录后自动开始同步'}
                  </div>
                </div>
              </div>

              {syncStatus.isSyncing && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div
                    className={`text-center p-2 rounded-lg ${
                      syncStatus.loginSyncPhase === 'pushing' ||
                      syncStatus.currentSyncType === 'push'
                        ? 'bg-blue-100 text-blue-700'
                        : syncStatus.loginSyncPhase === 'pulling' ||
                          syncStatus.loginSyncPhase === 'done'
                        ? 'bg-mint-100 text-mint-700'
                        : syncStatus.currentSyncType === 'pull' ||
                          syncStatus.currentSyncType === 'full'
                        ? 'bg-mint-100 text-mint-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-medium">① 上传本地</div>
                    <div className="text-xs mt-0.5">
                      {syncStatus.loginSyncPhase === 'pushing' ||
                      syncStatus.currentSyncType === 'push'
                        ? '进行中...'
                        : '等待中'}
                    </div>
                  </div>
                  <div
                    className={`text-center p-2 rounded-lg ${
                      syncStatus.loginSyncPhase === 'pulling' ||
                      syncStatus.currentSyncType === 'pull'
                        ? 'bg-blue-100 text-blue-700'
                        : syncStatus.loginSyncPhase === 'done' ||
                          syncStatus.currentSyncType === 'full'
                        ? 'bg-mint-100 text-mint-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-medium">② 拉取云端</div>
                    <div className="text-xs mt-0.5">
                      {syncStatus.loginSyncPhase === 'pulling' ||
                      syncStatus.currentSyncType === 'pull'
                        ? '进行中...'
                        : syncStatus.loginSyncPhase === 'pushing'
                        ? '等待中'
                        : syncStatus.currentSyncType === 'push'
                        ? '等待中'
                        : '等待中'}
                    </div>
                  </div>
                </div>
              )}

              {!syncStatus.isSyncing &&
                syncStatus.lastLoginSyncResult &&
                syncStatus.lastSyncDirection === 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 mb-3"
                  >
                    <div
                      className={`p-2.5 rounded-lg ${
                        syncStatus.lastLoginSyncResult.pushSuccess
                          ? 'bg-mint-100'
                          : 'bg-coral-100'
                      }`}
                    >
                      <div
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          syncStatus.lastLoginSyncResult.pushSuccess
                            ? 'text-mint-700'
                            : 'text-coral-700'
                        }`}
                      >
                        {syncStatus.lastLoginSyncResult.pushSuccess ? (
                          <Check size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        步骤①：上传本地数据
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          syncStatus.lastLoginSyncResult.pushSuccess
                            ? 'text-mint-600'
                            : 'text-coral-600'
                        }`}
                      >
                        {syncStatus.lastLoginSyncResult.pushMessage}
                        {syncStatus.lastLoginSyncResult.pushError &&
                          !syncStatus.lastLoginSyncResult.pushSuccess && (
                            <span className="block mt-1 font-medium">
                              错误原因：{syncStatus.lastLoginSyncResult.pushError}
                            </span>
                          )}
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-lg ${
                        syncStatus.lastLoginSyncResult.pullSuccess
                          ? 'bg-mint-100'
                          : 'bg-coral-100'
                      }`}
                    >
                      <div
                        className={`text-xs font-medium flex items-center gap-1.5 ${
                          syncStatus.lastLoginSyncResult.pullSuccess
                            ? 'text-mint-700'
                            : 'text-coral-700'
                        }`}
                      >
                        {syncStatus.lastLoginSyncResult.pullSuccess ? (
                          <Check size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        步骤②：拉取云端数据
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          syncStatus.lastLoginSyncResult.pullSuccess
                            ? 'text-mint-600'
                            : 'text-coral-600'
                        }`}
                      >
                        {syncStatus.lastLoginSyncResult.pullMessage}
                        {syncStatus.lastLoginSyncResult.pullError &&
                          !syncStatus.lastLoginSyncResult.pullSuccess && (
                            <span className="block mt-1 font-medium">
                              错误原因：{syncStatus.lastLoginSyncResult.pullError}
                            </span>
                          )}
                      </div>
                    </div>

                    {!syncStatus.lastLoginSyncResult.pushSuccess &&
                      syncStatus.lastLoginSyncResult.pullSuccess && (
                        <div className="p-2.5 rounded-lg bg-amber-100 border border-amber-200">
                          <div className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                            <Info size={14} />
                            提示
                          </div>
                          <div className="text-xs mt-1 text-amber-600">
                            云端数据已拉取成功，您可以看到云端已有记录。本地数据未上传成功，您可以点击下方「立即同步」重试上传。
                          </div>
                        </div>
                      )}
                  </motion.div>
                )}

              {!syncStatus.isSyncing &&
                syncStatus.lastSyncMessage &&
                syncStatus.lastSyncAt > 0 &&
                syncStatus.lastSyncDirection !== 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm mb-3 p-2.5 rounded-lg ${
                      syncStatus.lastSyncSuccess
                        ? 'bg-mint-100 text-mint-800'
                        : 'bg-coral-100 text-coral-800'
                    }`}
                  >
                    {syncStatus.lastSyncSuccess ? '✓ ' : '✗ '}
                    {syncStatus.lastSyncMessage}
                  </motion.div>
                )}

              <div className="flex flex-wrap gap-2 mb-3">
                {syncStatus.pendingChanges > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    <CloudUpload size={12} />
                    {syncStatus.pendingChanges} 项待上传
                  </span>
                )}
                {syncStatus.lastSyncDirection && syncStatus.lastSyncAt > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {syncStatus.lastSyncDirection === 'push' && '上次：上传'}
                    {syncStatus.lastSyncDirection === 'pull' && '上次：拉取'}
                    {syncStatus.lastSyncDirection === 'full' && '上次：全量'}
                    {syncStatus.lastSyncDirection === 'login' && '上次：登录同步'}
                  </span>
                )}
                {syncStatus.queueSize > 0 && syncStatus.isSyncing && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    队列 {syncStatus.queueSize}
                  </span>
                )}
              </div>

              {syncStatus.lastSyncAt > 0 &&
                (syncStatus.lastSyncStats.recordsPushed > 0 ||
                  syncStatus.lastSyncStats.dogsPushed > 0 ||
                  syncStatus.lastSyncStats.recordsMerged > 0 ||
                  syncStatus.lastSyncStats.dogsMerged > 0 ||
                  syncStatus.lastSyncStats.deletedLocal > 0) && (
                  <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-white/60 rounded-xl">
                    {(syncStatus.lastSyncStats.recordsPushed > 0 ||
                      syncStatus.lastSyncStats.dogsPushed > 0) && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">
                          {syncStatus.lastSyncStats.recordsPushed +
                            syncStatus.lastSyncStats.dogsPushed}
                        </div>
                        <div className="text-xs text-gray-500">上传</div>
                      </div>
                    )}
                    {(syncStatus.lastSyncStats.recordsMerged > 0 ||
                      syncStatus.lastSyncStats.dogsMerged > 0) && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {syncStatus.lastSyncStats.recordsMerged +
                            syncStatus.lastSyncStats.dogsMerged}
                        </div>
                        <div className="text-xs text-gray-500">新增/更新</div>
                      </div>
                    )}
                    {syncStatus.lastSyncStats.deletedLocal > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-coral-600">
                          {syncStatus.lastSyncStats.deletedLocal}
                        </div>
                        <div className="text-xs text-gray-500">清理</div>
                      </div>
                    )}
                  </div>
                )}

              <button
                onClick={handleSyncNow}
                disabled={syncStatus.isSyncing}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {syncStatus.isSyncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    同步中...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    立即同步
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• 登录后自动上传并拉取云端数据</p>
              <p>• 即使上传失败，也会自动拉取云端数据</p>
              <p>• 同步冲突以时间戳较新的数据为准</p>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Cloud className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-gray-800">云端同步</h2>
            <p className="text-xs text-gray-500">登录后自动备份数据到云端</p>
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setAuthMode('login');
                resetForm();
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LogIn size={16} />
              登录
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                resetForm();
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                authMode === 'register'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserPlus size={16} />
              注册
            </button>
          </div>

          <form
            onSubmit={authMode === 'login' ? handleLogin : handleRegister}
            className="space-y-3"
          >
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            {authMode === 'register' && (
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            {authMode === 'register' && (
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="确认密码"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl"
              >
                <AlertCircle className="text-coral-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-coral-700">{formError}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  处理中...
                </>
              ) : authMode === 'login' ? (
                <>
                  <LogIn size={18} />
                  登录并同步
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  创建账号
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
            <p className="text-xs text-indigo-700 space-y-1">
              <span className="font-medium">💡 提示：</span>
              <br />
              • 注册后将自动创建云端存储空间
              <br />
              • 数据使用端到端加密存储，保障隐私
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-amber-800 mb-2">
            ⚙️ 设置
          </h1>
          <p className="text-amber-600 text-sm">
            个性化你的狗叫记录体验
          </p>
        </motion.div>

        {renderAuthSection()}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BellRing className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-gray-800">每日定时提醒</h2>
              <p className="text-xs text-gray-500">到时间推送通知，提醒你记录狗叫</p>
            </div>
            <div
              role="switch"
              aria-checked={reminders.enabled}
              tabIndex={0}
              onClick={() => handleEnableReminders(!reminders.enabled)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEnableReminders(!reminders.enabled);
                }
              }}
              className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative ${
                reminders.enabled ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: reminders.enabled ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full bg-white shadow-md absolute top-1"
              />
            </div>
          </div>

          <AnimatePresence>
            {reminders.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-4 mx-4 mt-4 rounded-xl ${permStatus.bg}`}>
                  <div className="flex items-center gap-2">
                    {permission === 'granted' ? (
                      <Check className={permStatus.color} size={18} />
                    ) : permission === 'denied' ? (
                      <AlertCircle className={permStatus.color} size={18} />
                    ) : (
                      <Bell className={permStatus.color} size={18} />
                    )}
                    <span className={`text-sm ${permStatus.color}`}>
                      {permStatus.text}
                    </span>
                  </div>
                  {permission === 'default' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="mt-3 w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      开启通知权限
                    </button>
                  )}
                  {permission === 'denied' && (
                    <p className="mt-2 text-xs text-coral-500">
                      请在浏览器地址栏左侧的权限设置中手动开启通知权限
                    </p>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-500" size={18} />
                      <span className="font-medium text-gray-700">提醒时间</span>
                      <span className="text-xs text-gray-400">
                        ({reminders.times.filter((t) => t.enabled).length} 个已启用)
                      </span>
                    </div>
                    {!showAddTime && (
                      <button
                        onClick={() => setShowAddTime(true)}
                        className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        <Plus size={18} />
                        添加
                      </button>
                    )}
                  </div>

                  {showAddTime && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-gray-600">时间：</span>
                        <select
                          value={newHour}
                          onChange={(e) => setNewHour(parseInt(e.target.value))}
                          className="px-3 py-2 bg-white rounded-lg border border-amber-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}时
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-500">:</span>
                        <select
                          value={newMinute}
                          onChange={(e) => setNewMinute(parseInt(e.target.value))}
                          className="px-3 py-2 bg-white rounded-lg border border-amber-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i * 5}>
                              {(i * 5).toString().padStart(2, '0')}分
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddTime}
                          className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                          确认添加
                        </button>
                        <button
                          onClick={() => setShowAddTime(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    {reminders.times.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Clock size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">还没有设置提醒时间</p>
                        <p className="text-xs mt-1">点击上方「添加」按钮创建</p>
                      </div>
                    )}
                    {reminders.times.map((time) => (
                      <motion.div
                        key={time.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="text-amber-600" size={18} />
                        </div>

                        {editingId === time.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={editHour}
                              onChange={(e) => setEditHour(parseInt(e.target.value))}
                              className="px-2 py-1.5 bg-white rounded-lg border border-amber-200 text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}时
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-500">:</span>
                            <select
                              value={editMinute}
                              onChange={(e) => setEditMinute(parseInt(e.target.value))}
                              className="px-2 py-1.5 bg-white rounded-lg border border-amber-200 text-sm"
                            >
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i * 5}>
                                  {(i * 5).toString().padStart(2, '0')}分
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => saveEditing(time.id)}
                              className="p-1.5 text-mint-600 hover:bg-mint-100 rounded-lg"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1" onClick={() => startEditing(time.id, time.hour, time.minute)}>
                              <div className="font-display text-xl font-bold text-gray-800">
                                {formatReminderTime(time)}
                              </div>
                              <div className="text-xs text-gray-400">点击可修改时间</div>
                            </div>
                            <div
                              role="switch"
                              aria-checked={time.enabled}
                              tabIndex={0}
                              onClick={() =>
                                updateReminderTime(time.id, { enabled: !time.enabled })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  updateReminderTime(time.id, { enabled: !time.enabled });
                                }
                              }}
                              className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                                time.enabled ? 'bg-amber-500' : 'bg-gray-300'
                              }`}
                            >
                              <motion.div
                                animate={{ x: time.enabled ? 22 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5"
                              />
                            </div>
                            <button
                              onClick={() => removeReminderTime(time.id)}
                              className="p-2 text-gray-400 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-gray-800">位置分享</h2>
              <p className="text-xs text-gray-500">匿名分享位置，查看周边狗叫热点</p>
            </div>
            <div
              role="switch"
              aria-checked={isSharingEnabled}
              tabIndex={0}
              onClick={permissionState === 'granted' ? handleToggleLocationSharing : handleEnableLocationSharing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  permissionState === 'granted' ? handleToggleLocationSharing() : handleEnableLocationSharing();
                }
              }}
              className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative ${
                isSharingEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: isSharingEnabled ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full bg-white shadow-md absolute top-1"
              />
            </div>
          </div>

          <AnimatePresence>
            {isSharingEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`p-4 mx-4 mt-4 rounded-xl border ${locPermStatus.bg} ${locPermStatus.borderColor}`}>
                  <div className="flex items-center gap-2">
                    {permissionState === 'granted' ? (
                      <Check className={locPermStatus.color} size={18} />
                    ) : permissionState === 'denied' ? (
                      <AlertCircle className={locPermStatus.color} size={18} />
                    ) : (
                      <MapPin className={locPermStatus.color} size={18} />
                    )}
                    <span className={`text-sm ${locPermStatus.color}`}>
                      {locPermStatus.text}
                    </span>
                  </div>
                  {(permissionState === 'prompt' || permissionState === 'loading') && (
                    <button
                      onClick={handleEnableLocationSharing}
                      className="mt-3 w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      开启位置权限
                    </button>
                  )}
                  {permissionState === 'denied' && (
                    <p className="mt-2 text-xs text-coral-500">
                      请在浏览器地址栏左侧的权限设置中手动开启位置权限
                    </p>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Ruler className="text-gray-500" size={16} />
                      <span className="text-sm font-medium text-gray-700">分享精度</span>
                      <span className="text-xs text-gray-400">
                        (当前: ~{gridSizeMeters || 2000}米)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['coarse', 'medium', 'fine'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPrecision(p)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            precision === p
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {p === 'coarse' && '粗略'}
                          {p === 'medium' && '中等'}
                          {p === 'fine' && '精细'}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      精度越高，网格划分越细，隐私保护越弱。推荐使用中等精度。
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">隐私保护说明</p>
                        <ul className="text-xs text-blue-600 space-y-1">
                          <li>• 位置数据会被脱敏到指定精度的网格</li>
                          <li>• 不会记录您的具体位置和个人信息</li>
                          <li>• 所有数据匿名汇总，无法追溯到个人</li>
                          <li>• 可随时关闭位置分享功能</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {heatmapStats && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Thermometer className="text-orange-500" size={16} />
                        <span className="text-sm font-medium text-gray-700">热力数据统计</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {heatmapStats.totalRecords}
                          </div>
                          <div className="text-xs text-gray-500">总匿名记录</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {heatmapStats.totalCells}
                          </div>
                          <div className="text-xs text-gray-500">覆盖区域</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {heatmapStats.rawRecordCount}
                          </div>
                          <div className="text-xs text-gray-500">原始记录</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-mint-600">
                            {heatmapStats.dataRetentionDays}
                          </div>
                          <div className="text-xs text-gray-500">保留天数</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>数据日期:</span>
                          <span className="font-medium">{heatmapStats.dataDate || '暂无'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>上次聚合:</span>
                          <span className="font-medium">
                            {heatmapStats.lastAggregatedAt
                              ? new Date(heatmapStats.lastAggregatedAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '暂无'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>上次清理:</span>
                          <span className="font-medium text-mint-600">
                            {heatmapStats.lastCleanupAt
                              ? new Date(heatmapStats.lastCleanupAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '暂无'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>下次聚合:</span>
                          <span className="font-medium text-amber-600">
                            每日凌晨 00:00
                          </span>
                        </div>
                      </div>

                      {cleanupHistory.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <div className="text-xs font-medium text-gray-700 mb-2">最近清理记录</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {cleanupHistory.slice().reverse().slice(0, 5).map((log, index) => (
                              <div key={index} className="text-xs text-gray-500 flex justify-between">
                                <span>
                                  {log.trigger === 'startup' && '🚀 启动时'}
                                  {log.trigger === 'aggregation' && '⏰ 聚合时'}
                                  {log.trigger === 'manual' && '👆 手动'}
                                </span>
                                <span className="text-coral-600">-{log.removedCount}条</span>
                                <span>
                                  {new Date(log.timestamp).toLocaleString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {cleanupMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-3 p-2 bg-mint-50 border border-mint-200 rounded-lg text-xs text-mint-700 text-center"
                          >
                            {cleanupMessage}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleManualAggregate}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={12} />
                          立即刷新数据
                        </button>
                        <button
                          onClick={handleManualCleanup}
                          className="flex-1 py-2 bg-coral-100 text-coral-700 rounded-lg text-xs font-medium hover:bg-coral-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} />
                          清理过期数据
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <HardDrive className="text-purple-600" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-gray-800">数据备份与恢复</h2>
              <p className="text-xs text-gray-500">导出本地数据为JSON文件，或从备份文件恢复</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <AnimatePresence>
              {importSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 p-3 bg-mint-50 border border-mint-200 rounded-xl"
                >
                  <Check className="text-mint-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-mint-700">{importSuccess}</p>
                </motion.div>
              )}
              {importError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl"
                >
                  <AlertCircle className="text-coral-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-coral-700">{importError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-2">
                <Info className="text-purple-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-purple-700 space-y-1">
                  <p className="font-medium">备份内容包括：</p>
                  <p>• 狗叫记录、狗狗档案、应用设置</p>
                  <p>• 可选：登录凭据、同步状态</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">包含登录信息</div>
                <div className="text-xs text-gray-500">
                  备份中将包含云端登录凭据（如已登录）
                </div>
              </div>
              <div
                role="switch"
                aria-checked={includeAuthInBackup}
                tabIndex={0}
                onClick={() => setIncludeAuthInBackup(!includeAuthInBackup)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIncludeAuthInBackup(!includeAuthInBackup);
                  }
                }}
                className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${
                  includeAuthInBackup ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  animate={{ x: includeAuthInBackup ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {exportProgress ? (
                <motion.div
                  key="export-progress"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Loader2 size={20} className="text-purple-600 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-800">
                          {exportProgress.stageLabel}
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {exportProgress.percent}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {exportProgress.message}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress.percent}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>

                  {(exportProgress.recordCount !== undefined || exportProgress.estimatedSize) && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {exportProgress.recordCount !== undefined && (
                        <div className="bg-white/70 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {exportProgress.recordCount}
                          </div>
                          <div className="text-xs text-gray-500">条记录</div>
                        </div>
                      )}
                      {exportProgress.dogCount !== undefined && (
                        <div className="bg-white/70 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-indigo-600">
                            {exportProgress.dogCount}
                          </div>
                          <div className="text-xs text-gray-500">只狗狗</div>
                        </div>
                      )}
                      {exportProgress.estimatedSize && (
                        <div className="bg-white/70 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {exportProgress.estimatedSize}
                          </div>
                          <div className="text-xs text-gray-500">文件大小</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    {(['collecting', 'serializing', 'creating-file', 'downloading'] as const).map((stage, idx) => {
                      const stageLabels: Record<string, string> = {
                        'collecting': '收集数据',
                        'serializing': '序列化',
                        'creating-file': '生成文件',
                        'downloading': '下载',
                      };
                      const stageOrder = ['collecting', 'serializing', 'creating-file', 'downloading'];
                      const currentIdx = stageOrder.indexOf(exportProgress.stage);
                      const thisIdx = stageOrder.indexOf(stage);
                      const isDone = thisIdx < currentIdx;
                      const isCurrent = thisIdx === currentIdx;

                      return (
                        <div key={stage} className="flex items-center gap-1 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isDone
                                ? 'bg-mint-500'
                                : isCurrent
                                ? 'bg-purple-500 ring-2 ring-purple-200'
                                : 'bg-gray-300'
                            }`}
                          >
                            {isDone ? (
                              <Check size={10} className="text-white" />
                            ) : isCurrent ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            ) : null}
                          </div>
                          <span
                            className={`text-xs truncate ${
                              isDone || isCurrent ? 'text-gray-700' : 'text-gray-400'
                            }`}
                          >
                            {stageLabels[stage]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="export-button"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={handleExportBackup}
                  disabled={isExporting || isImporting}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-purple-200 overflow-hidden"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      正在导出...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      一键导出备份 (JSON)
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-gray-400">或</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {importProgress ? (
                <motion.div
                  key="import-progress"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Loader2 size={20} className="text-purple-600 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-800">
                          {importProgress.stageLabel}
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {importProgress.percent}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {importProgress.message}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner mb-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress.percent}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>

                  {importProgress.fileName && (
                    <div className="bg-white/70 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileJson size={16} className="text-purple-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {importProgress.fileName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {importProgress.fileSize && (
                          <div>
                            <span className="text-gray-500">文件大小：</span>
                            <span className="font-medium text-gray-700">{importProgress.fileSize}</span>
                          </div>
                        )}
                        {importProgress.readBytes !== undefined && importProgress.totalBytes !== undefined && (
                          <div>
                            <span className="text-gray-500">已读取：</span>
                            <span className="font-medium text-purple-600">
                              {Math.round((importProgress.readBytes / importProgress.totalBytes) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    {(['reading', 'parsing', 'validating', 'ready'] as const).map((stage, idx) => {
                      const stageLabels: Record<string, string> = {
                        'reading': '读取文件',
                        'parsing': '解析JSON',
                        'validating': '校验格式',
                        'ready': '完成',
                      };
                      const stageOrder = ['reading', 'parsing', 'validating', 'ready'];
                      const currentIdx = stageOrder.indexOf(importProgress.stage);
                      const thisIdx = stageOrder.indexOf(stage);
                      const isDone = thisIdx < currentIdx;
                      const isCurrent = thisIdx === currentIdx;

                      return (
                        <div key={stage} className="flex items-center gap-1 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isDone
                                ? 'bg-mint-500'
                                : isCurrent
                                ? 'bg-purple-500 ring-2 ring-purple-200'
                                : 'bg-gray-300'
                            }`}
                          >
                            {isDone ? (
                              <Check size={10} className="text-white" />
                            ) : isCurrent ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            ) : null}
                          </div>
                          <span
                            className={`text-xs truncate ${
                              isDone || isCurrent ? 'text-gray-700' : 'text-gray-400'
                            }`}
                          >
                            {stageLabels[stage]}
                          </span>
                          {idx < 3 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.label
                  key="import-button"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block w-full overflow-hidden"
                >
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFileSelect}
                    className="hidden"
                    disabled={isImporting || isExporting}
                  />
                  <div
                    className={`w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isImporting || isExporting
                        ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400'
                    }`}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        正在读取...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        选择备份文件恢复
                      </>
                    )}
                  </div>
                </motion.label>
              )}
            </AnimatePresence>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-amber-700 space-y-1">
                <p className="font-medium">⚠️ 恢复数据将覆盖当前所有本地数据</p>
                <p>建议在恢复前先导出当前数据作为备份</p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showConfirmRestore && pendingRestore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={handleCancelRestore}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="text-amber-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-gray-800 text-lg">确认恢复数据？</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{pendingRestore.fileName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {restoreError && (
                    <div className="flex items-start gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl">
                      <AlertCircle className="text-coral-500 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-coral-700">{restoreError}</p>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ 此操作将覆盖当前所有本地数据，且无法撤销。
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="text-purple-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">备份内容预览</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {pendingRestore.summary.recordsCount}
                        </div>
                        <div className="text-gray-500">条记录</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-indigo-600">
                          {pendingRestore.summary.dogsCount}
                        </div>
                        <div className="text-gray-500">只狗狗</div>
                      </div>
                    </div>
                    <div className="space-y-1 pt-1">
                      {pendingRestore.summary.hasSettings && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Check size={14} className="text-mint-600" />
                          包含应用设置
                        </div>
                      )}
                      {pendingRestore.summary.hasAuth && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Check size={14} className="text-mint-600" />
                          包含登录信息
                        </div>
                      )}
                      {pendingRestore.summary.hasAdmin && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Check size={14} className="text-mint-600" />
                          包含管理员信息
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                        <Clock size={12} />
                        导出时间：{new Date(pendingRestore.summary.exportedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={handleCancelRestore}
                    disabled={isRestoring}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-coral-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-coral-600 transition-all shadow-md shadow-amber-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        正在恢复...
                      </>
                    ) : (
                      '确认恢复'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-100 flex items-center justify-center">
              <SettingsIcon className="text-mint-600" size={20} />
            </div>
            <h2 className="font-display font-bold text-gray-800">通用设置</h2>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center">
                <Smartphone className="text-coral-600" size={18} />
              </div>
              <div>
                <div className="font-medium text-gray-800">振动反馈</div>
                <div className="text-xs text-gray-500">点击记录按钮时手机震动</div>
              </div>
            </div>
            <div
              role="switch"
              aria-checked={settings.vibrationEnabled}
              tabIndex={0}
              onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  updateSettings({ vibrationEnabled: !settings.vibrationEnabled });
                }
              }}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${
                settings.vibrationEnabled ? 'bg-coral-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: settings.vibrationEnabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Volume2 className="text-blue-600" size={18} />
              </div>
              <div>
                <div className="font-medium text-gray-800">声音提示</div>
                <div className="text-xs text-gray-500">点击记录按钮时播放提示音</div>
              </div>
            </div>
            <div
              role="switch"
              aria-checked={settings.soundEnabled}
              tabIndex={0}
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  updateSettings({ soundEnabled: !settings.soundEnabled });
                }
              }}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative ${
                settings.soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: settings.soundEnabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-gray-400 mt-8"
        >
          🐕 狗叫记录器 · 科学记录，平和沟通
        </motion.div>
      </div>
    </div>
  );
}
