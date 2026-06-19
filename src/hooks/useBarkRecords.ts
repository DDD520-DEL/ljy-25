import { useMemo, useCallback } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import { BarkRecord } from '@/types';
import { getTodayRecords, groupRecordsByDate } from '@/utils/statistics';

interface AudioData {
  data: string;
  mimeType: string;
  duration: number;
}

export function useBarkRecords() {
  const records = useBarkStore((state) => state.records);
  const addRecord = useBarkStore((state) => state.addRecord);
  const updateRecord = useBarkStore((state) => state.updateRecord);
  const deleteRecord = useBarkStore((state) => state.deleteRecord);
  const clearAllRecords = useBarkStore((state) => state.clearAllRecords);
  const importRecords = useBarkStore((state) => state.importRecords);
  const settings = useBarkStore((state) => state.settings);
  const updateSettings = useBarkStore((state) => state.updateSettings);

  const todayRecords = useMemo(() => getTodayRecords(records), [records]);
  
  const todayCount = useMemo(() => todayRecords.length, [todayRecords]);
  
  const lastRecord = useMemo(() => 
    records.length > 0 ? records[0] : null,
    [records]
  );
  
  const groupedRecords = useMemo(() => groupRecordsByDate(records), [records]);

  const handleAddRecord = useCallback((timestamp?: number, data?: Partial<BarkRecord>) => {
    const record = addRecord(timestamp, data);
    
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    return record;
  }, [addRecord, settings.vibrationEnabled]);

  const handleQuickRecord = useCallback((audio?: AudioData, dogId?: string) => {
    const data: Partial<BarkRecord> = {};
    if (audio) {
      data.audioData = audio.data;
      data.audioMimeType = audio.mimeType;
      data.audioDuration = audio.duration;
    }
    if (dogId) {
      data.dogId = dogId;
    }
    return handleAddRecord(undefined, data);
  }, [handleAddRecord]);

  return {
    records,
    todayRecords,
    todayCount,
    lastRecord,
    groupedRecords,
    addRecord: handleAddRecord,
    quickRecord: handleQuickRecord,
    updateRecord,
    deleteRecord,
    clearAllRecords,
    importRecords,
    settings,
    updateSettings,
  };
}
