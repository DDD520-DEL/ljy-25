import { useState } from 'react';
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
} from 'lucide-react';
import { useBarkStore } from '@/store/useBarkStore';
import { useReminders } from '@/hooks/useReminders';

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

  const [showAddTime, setShowAddTime] = useState(false);
  const [newHour, setNewHour] = useState(9);
  const [newMinute, setNewMinute] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHour, setEditHour] = useState(0);
  const [editMinute, setEditMinute] = useState(0);

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
