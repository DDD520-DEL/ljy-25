import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Activity,
} from 'lucide-react';
import { AdminDashboardStats } from '@/types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color,
  bgColor,
  borderColor,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl shadow-soft overflow-hidden border ${borderColor}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}
          >
            {icon}
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                isPositive
                  ? 'bg-mint-50 text-mint-600'
                  : 'bg-coral-50 text-coral-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className={`text-3xl font-display font-bold ${color} mb-1`}>
          {value}
        </div>
        <div className="text-sm text-gray-500">{title}</div>
        {changeLabel && (
          <div className="text-xs text-gray-400 mt-1">{changeLabel}</div>
        )}
      </div>
    </motion.div>
  );
}

interface AdminStatsCardProps {
  stats: AdminDashboardStats;
}

export function AdminStatsCard({ stats }: AdminStatsCardProps) {
  const calculateChange = (today: number, yesterday: number) => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  const activeUserChange = calculateChange(
    stats.activeUsersToday,
    stats.activeUsersYesterday
  );
  const newUserChange = calculateChange(
    stats.newUsersToday,
    stats.newUsersYesterday
  );
  const recordsChange = calculateChange(
    stats.recordsToday,
    stats.recordsYesterday
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="总用户数"
        value={stats.totalUsers.toLocaleString()}
        icon={<Users className="text-indigo-600" size={24} />}
        color="text-indigo-600"
        bgColor="bg-indigo-50"
        borderColor="border-indigo-100"
      />
      <StatCard
        title="总记录数"
        value={stats.totalRecords.toLocaleString()}
        icon={<FileText className="text-amber-600" size={24} />}
        color="text-amber-600"
        bgColor="bg-amber-50"
        borderColor="border-amber-100"
      />
      <StatCard
        title="今日活跃用户"
        value={stats.activeUsersToday.toLocaleString()}
        icon={<Activity className="text-mint-600" size={24} />}
        change={activeUserChange}
        changeLabel={`昨日 ${stats.activeUsersYesterday} 人`}
        color="text-mint-600"
        bgColor="bg-mint-50"
        borderColor="border-mint-100"
      />
      <StatCard
        title="今日新增用户"
        value={stats.newUsersToday.toLocaleString()}
        icon={<UserPlus className="text-purple-600" size={24} />}
        change={newUserChange}
        changeLabel={`昨日 ${stats.newUsersYesterday} 人`}
        color="text-purple-600"
        bgColor="bg-purple-50"
        borderColor="border-purple-100"
      />
      <StatCard
        title="今日记录数"
        value={stats.recordsToday.toLocaleString()}
        icon={<FileText className="text-blue-600" size={24} />}
        change={recordsChange}
        changeLabel={`昨日 ${stats.recordsYesterday} 条`}
        color="text-blue-600"
        bgColor="bg-blue-50"
        borderColor="border-blue-100"
      />
      <StatCard
        title="人均记录数"
        value={stats.averageRecordsPerUser.toFixed(1)}
        icon={<TrendingUp className="text-coral-600" size={24} />}
        color="text-coral-600"
        bgColor="bg-coral-50"
        borderColor="border-coral-100"
      />
    </div>
  );
}
