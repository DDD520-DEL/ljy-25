import { useMemo } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import {
  filterRecordsByDateRange,
  calculateComparisonStats,
} from '@/utils/statistics';
import { getDateRangeForPreset } from '@/utils/date';
import { TimePeriodPreset, ComparisonStats } from '@/types';

export function useComparisonStats(
  period1Preset: TimePeriodPreset,
  period2Preset: TimePeriodPreset,
  period1CustomStart?: number,
  period1CustomEnd?: number,
  period2CustomStart?: number,
  period2CustomEnd?: number,
  dogId?: string
): {
  comparisonStats: ComparisonStats | null;
  period1Label: string;
  period2Label: string;
  hasData: boolean;
} {
  const records = useBarkStore((state) => state.records);

  const filteredRecords = useMemo(() => {
    if (dogId === undefined || dogId === '__all__') return records;
    return records.filter((r) => r.dogId === dogId);
  }, [records, dogId]);

  const period1Range = useMemo(
    () => getDateRangeForPreset(period1Preset, period1CustomStart, period1CustomEnd),
    [period1Preset, period1CustomStart, period1CustomEnd]
  );

  const period2Range = useMemo(
    () => getDateRangeForPreset(period2Preset, period2CustomStart, period2CustomEnd),
    [period2Preset, period2CustomStart, period2CustomEnd]
  );

  const period1Records = useMemo(
    () => filterRecordsByDateRange(filteredRecords, period1Range),
    [filteredRecords, period1Range]
  );

  const period2Records = useMemo(
    () => filterRecordsByDateRange(filteredRecords, period2Range),
    [filteredRecords, period2Range]
  );

  const comparisonStats = useMemo(() => {
    if (period1Records.length === 0 && period2Records.length === 0) {
      return null;
    }
    return calculateComparisonStats(
      period1Records,
      period2Records,
      period1Range.label,
      period2Range.label
    );
  }, [period1Records, period2Records, period1Range.label, period2Range.label]);

  return {
    comparisonStats,
    period1Label: period1Range.label,
    period2Label: period2Range.label,
    hasData: period1Records.length > 0 || period2Records.length > 0,
  };
}
