import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, TrendingUp, BellRing, BellOff, Dog } from 'lucide-react';
import { BarkButton } from '@/components/BarkButton';
import { StatsCard } from '@/components/StatsCard';
import { DogMood } from '@/components/DogMood';
import { DogProfileManager } from '@/components/DogProfileManager';
import { RecordItem } from '@/components/RecordItem';
import { useBarkRecords } from '@/hooks/useBarkRecords';
import { useStats } from '@/hooks/useStats';
import { useReminders } from '@/hooks/useReminders';
import { useBarkStore } from '@/store/useBarkStore';
import { getDogMood } from '@/types';
import { formatFriendlyDateTime } from '@/utils/date';
import { Link } from 'react-router-dom';

export function HomePage() {
  const {
    todayCount,
    todayRecords,
    lastRecord,
    quickRecord,
    deleteRecord,
    updateRecord,
  } = useBarkRecords();

  const { peakHourInfo, summaryStats } = useStats();
  const { reminders, getTodayReminderStatus, formatReminderTime } = useReminders();
  const dogs = useBarkStore((s) => s.dogs);

  const [selectedDogId, setSelectedDogId] = useState<string | undefined>(undefined);
  const [showDogManager, setShowDogManager] = useState(false);

  const dogMood = getDogMood(todayCount);

  const recentRecords = todayRecords.slice(0, 5);
  const reminderStatus = getTodayReminderStatus();

  const handleQuickRecord = (audioData?: { data: string; mimeType: string; duration: number }) => {
    quickRecord(audioData, selectedDogId);
  };

  const renderReminderCard = () => {
    if (!reminders.enabled) {
      return (
        <Link to="/settings" className="block">
          <motion.div
            className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4 hover:bg-gray-50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className="p-3 rounded-xl bg-gray-100 text-gray-400">
              <BellOff size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-500 text-sm mb-1">定时提醒</div>
              <div className="font-display text-lg font-bold text-gray-500">
                尚未开启
              </div>
              <div className="text-xs text-gray-400 mt-0.5">点击前往设置页开启</div>
            </div>
          </motion.div>
        </Link>
      );
    }

    const nextReminder = reminderStatus.pending[0];

    return (
      <Link to="/settings" className="block">
        <motion.div
          className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4 hover:bg-gray-50 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 relative">
            <BellRing size={24} />
            {reminderStatus.pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse-soft" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-500 text-sm mb-1">今日提醒</div>
            <div className="font-display text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-mint-600">{reminderStatus.triggered.length}</span>
              <span className="text-gray-400">/</span>
              <span>{reminderStatus.total}</span>
              <span className="text-sm font-normal text-gray-500">已提醒</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {nextReminder
                ? `下一次提醒：${formatReminderTime(nextReminder)}`
                : reminderStatus.missed.length > 0
                ? `错过 ${reminderStatus.missed.length} 个提醒`
                : '今日所有提醒已完成 ✓'}
            </div>
          </div>
        </motion.div>
      </Link>
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
            🐕 狗叫记录器
          </h1>
          <p className="text-amber-600 text-sm">
            科学记录，平和沟通
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <DogMood mood={dogMood} size="md" />
        </motion.div>

        <div className="flex justify-center mb-2">
          <BarkButton onClick={handleQuickRecord} />
        </div>

        {dogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Dog size={14} />
                选择狗狗：
              </span>
              <button
                onClick={() => setSelectedDogId(undefined)}
                className={`px-3 py-1 text-sm rounded-full border transition-all ${
                  selectedDogId === undefined
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                }`}
              >
                未指定
              </button>
              {dogs.map((dog) => (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-all ${
                    selectedDogId === dog.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {dog.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowDogManager((prev) => !prev)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-soft hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Dog className="text-amber-600" size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-800">狗狗档案管理</div>
                <div className="text-xs text-gray-500">
                  {dogs.length > 0
                    ? `已创建 ${dogs.length} 只狗狗档案`
                    : '创建狗狗档案，记录时选择是哪只狗'}
                </div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showDogManager ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400"
            >
              ▼
            </motion.div>
          </button>
          <motion.div
            initial={false}
            animate={{
              height: showDogManager ? 'auto' : 0,
              opacity: showDogManager ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              <DogProfileManager />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {renderReminderCard()}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8">
          <StatsCard
            icon={Activity}
            label="今日记录"
            value={`${todayCount} 次`}
            subValue={
              peakHourInfo
                ? `最频繁时段：${peakHourInfo.label}`
                : '继续记录发现规律'
            }
            color="amber"
            delay={0.3}
          />
          
          <StatsCard
            icon={Clock}
            label="最近记录"
            value={
              lastRecord
                ? formatFriendlyDateTime(lastRecord.timestamp)
                : '暂无记录'
            }
            subValue={lastRecord?.location || '点击上方按钮开始记录'}
            color="mint"
            delay={0.4}
          />
          
          <StatsCard
            icon={TrendingUp}
            label="累计记录"
            value={`${summaryStats.totalRecords} 次`}
            subValue={
              summaryStats.totalRecords > 0
                ? `日均 ${summaryStats.dailyAverage.toFixed(1)} 次`
                : '数据越多分析越准'
            }
            color="coral"
            delay={0.5}
          />
        </div>

        {recentRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="font-display text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" />
              最近记录
            </h2>
            <div className="space-y-3">
              {recentRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <RecordItem
                    record={record}
                    onDelete={deleteRecord}
                    onUpdate={updateRecord}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {todayCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-12 bg-white/50 rounded-2xl"
          >
            <div className="text-6xl mb-4">☝️</div>
            <p className="text-amber-700 font-medium">
              听到狗叫时点击上方大按钮
            </p>
            <p className="text-amber-500 text-sm mt-2">
              持续记录几天后，就能看到有趣的分析结果啦~
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
