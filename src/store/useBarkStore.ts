import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BarkRecord, AppSettings } from '@/types';
import { generateId } from '@/utils/storage';

interface BarkState {
  records: BarkRecord[];
  settings: AppSettings;
  addRecord: (timestamp?: number, data?: Partial<BarkRecord>) => BarkRecord;
  updateRecord: (id: string, data: Partial<BarkRecord>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importRecords: (records: BarkRecord[]) => void;
  addTagToRecord: (id: string, tag: string) => void;
  removeTagFromRecord: (id: string, tag: string) => void;
  getAllTags: () => string[];
}

const initialSettings: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: false,
  theme: 'light',
};

export const useBarkStore = create<BarkState>()(
  persist(
    (set) => ({
      records: [],
      settings: initialSettings,

      addRecord: (timestamp?: number, data?: Partial<BarkRecord>) => {
        const now = Date.now();
        const newRecord: BarkRecord = {
          id: generateId(),
          timestamp: timestamp ?? now,
          createdAt: now,
          updatedAt: now,
          ...data,
        };

        set((state) => ({
          records: [newRecord, ...state.records],
        }));

        return newRecord;
      },

      updateRecord: (id: string, data: Partial<BarkRecord>) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? { ...record, ...data, updatedAt: Date.now() }
              : record
          ),
        }));
      },

      deleteRecord: (id: string) => {
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        }));
      },

      clearAllRecords: () => {
        set({ records: [] });
      },

      updateSettings: (settings: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      importRecords: (records: BarkRecord[]) => {
        set((state) => {
          const existingIds = new Set(state.records.map((r) => r.id));
          const newRecords = records.filter((r) => !existingIds.has(r.id));
          return {
            records: [...state.records, ...newRecords].sort(
              (a, b) => b.timestamp - a.timestamp
            ),
          };
        });
      },

      addTagToRecord: (id: string, tag: string) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? {
                  ...record,
                  tags: Array.from(new Set([...(record.tags || []), tag])),
                  updatedAt: Date.now(),
                }
              : record
          ),
        }));
      },

      removeTagFromRecord: (id: string, tag: string) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? {
                  ...record,
                  tags: (record.tags || []).filter((t) => t !== tag),
                  updatedAt: Date.now(),
                }
              : record
          ),
        }));
      },

      getAllTags: () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const state = useBarkStore.getState();
        const tagSet = new Set<string>();
        state.records.forEach((record) => {
          record.tags?.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
      },
    }),
    {
      name: 'bark-recorder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        settings: state.settings,
      }),
    }
  )
);
