import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, Clock, Activity, CheckCircle, Circle } from 'lucide-react';
import { ReminderTime } from '@/types';

interface DailyReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderTime[];
  todayCount: number;
  formatReminderTime: (time: ReminderTime) => string;
  getTodayReminderStatus: () => {
    triggered: ReminderTime[];
    pending: ReminderTime[];
    missed: ReminderTime[];
    total: number;
  };
}

export function DailyReminderPopup({
  isOpen,
  onClose,
  reminders,
  todayCount,
  formatReminderTime,
  getTodayReminderStatus,
}: DailyReminderPopupProps) {
  const reminderStatus = getTodayReminderStatus();
  const enabledTimes = reminders.filter((t) => t.enabled);
  const todayStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const getTimeStatus = (time: ReminderTime) => {
    if (reminderStatus.triggered.some((t) => t.id === time.id)) {
      return 'triggered';
    }
    if (reminderStatus.missed.some((t) => t.id === time.id)) {
      return 'missed';
    }
    return 'pending';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-white rounded-t-3xl shadow-2xl">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                      <BellRing size={24} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-gray-800">
                        今日提醒
                      </h2>
                      <p className="text-sm text-gray-500">{todayStr}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-amber-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">
                        提醒时间点
                      </span>
                    </div>
                    <div className="font-display text-3xl font-bold text-amber-800">
                      {enabledTimes.length}
                      <span className="text-base font-normal text-amber-600 ml-1">
                        个
                      </span>
                    </div>
                  </div>
                  <div className="bg-mint-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-mint-600" />
                      <span className="text-sm text-mint-700 font-medium">
                        今日记录
                      </span>
                    </div>
                    <div className="font-display text-3xl font-bold text-mint-800">
                      {todayCount}
                      <span className="text-base font-normal text-mint-600 ml-1">
                        次
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    今日提醒时间
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {enabledTimes.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <BellRing size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂无提醒时间</p>
                        <p className="text-xs mt-1">前往设置页面添加</p>
                      </div>
                    ) : (
                      enabledTimes.map((time) => {
                        const status = getTimeStatus(time);
                        return (
                          <div
                            key={time.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {status === 'triggered' ? (
                                <CheckCircle
                                  size={20}
                                  className="text-green-500"
                                />
                              ) : status === 'missed' ? (
                                <Circle
                                  size={20}
                                  className="text-gray-300"
                                />
                              ) : (
                                <Circle
                                  size={20}
                                  className="text-amber-400"
                                />
                              )}
                              <span
                                className={`font-display text-lg font-bold ${
                                  status === 'triggered'
                                    ? 'text-green-600'
                                    : status === 'missed'
                                    ? 'text-gray-400 line-through'
                                    : 'text-gray-800'
                                }`}
                              >
                                {formatReminderTime(time)}
                              </span>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                status === 'triggered'
                                  ? 'bg-green-100 text-green-600'
                                  : status === 'missed'
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              {status === 'triggered'
                                ? '已提醒'
                                : status === 'missed'
                                ? '已错过'
                                : '待提醒'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-98"
                >
                  我知道了
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
