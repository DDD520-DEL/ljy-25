import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BarkRecord, AppSettings, ReminderTime, DogProfile } from '@/types';
import { generateId } from '@/utils/storage';

interface BarkState {
  records: BarkRecord[];
  dogs: DogProfile[];
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
  addReminderTime: (hour: number, minute: number) => void;
  updateReminderTime: (id: string, data: Partial<ReminderTime>) => void;
  removeReminderTime: (id: string) => void;
  toggleReminders: (enabled: boolean) => void;
  markReminderTriggered: (reminderId: string, dateStr: string) => void;
  addDog: (data: Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>) => DogProfile;
  updateDog: (id: string, data: Partial<Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteDog: (id: string) => void;
  batchUpdateRecords: (ids: string[], data: Partial<BarkRecord>) => number;
  batchDeleteRecords: (ids: string[]) => number;
  batchAddTags: (ids: string[], tags: string[]) => number;
}

const initialSettings: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: false,
  theme: 'light',
  reminders: {
    enabled: false,
    times: [
      { id: generateId(), hour: 8, minute: 0, enabled: true },
      { id: generateId(), hour: 20, minute: 0, enabled: true },
    ],
    lastTriggeredDates: {},
  },
};

export const useBarkStore = create<BarkState>()(
  persist(
    (set, get) => ({
      records: [],
      dogs: [],
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
        const state = get();
        const tagSet = new Set<string>();
        state.records.forEach((record) => {
          record.tags?.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
      },

      addReminderTime: (hour: number, minute: number) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              times: [
                ...state.settings.reminders.times,
                { id: generateId(), hour, minute, enabled: true },
              ].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
            },
          },
        }));
      },

      updateReminderTime: (id: string, data: Partial<ReminderTime>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              times: state.settings.reminders.times
                .map((t) => (t.id === id ? { ...t, ...data } : t))
                .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
            },
          },
        }));
      },

      removeReminderTime: (id: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              times: state.settings.reminders.times.filter((t) => t.id !== id),
            },
          },
        }));
      },

      toggleReminders: (enabled: boolean) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              enabled,
            },
          },
        }));
      },

      markReminderTriggered: (reminderId: string, dateStr: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              lastTriggeredDates: {
                ...state.settings.reminders.lastTriggeredDates,
                [reminderId]: dateStr,
              },
            },
          },
        }));
      },

      addDog: (data: Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = Date.now();
        const newDog: DogProfile = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          dogs: [...state.dogs, newDog],
        }));
        return newDog;
      },

      updateDog: (id: string, data: Partial<Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
        set((state) => ({
          dogs: state.dogs.map((dog) =>
            dog.id === id ? { ...dog, ...data, updatedAt: Date.now() } : dog
          ),
        }));
      },

      deleteDog: (id: string) => {
        set((state) => ({
          dogs: state.dogs.filter((dog) => dog.id !== id),
          records: state.records.map((record) =>
            record.dogId === id ? { ...record, dogId: undefined } : record
          ),
        }));
      },

      batchUpdateRecords: (ids: string[], data: Partial<BarkRecord>) => {
        const idSet = new Set(ids);
        let updatedCount = 0;
        set((state) => ({
          records: state.records.map((record) => {
            if (idSet.has(record.id)) {
              updatedCount++;
              return { ...record, ...data, updatedAt: Date.now() };
            }
            return record;
          }),
        }));
        return updatedCount;
      },

      batchDeleteRecords: (ids: string[]) => {
        const idSet = new Set(ids);
        const initialLength = get().records.length;
        set((state) => ({
          records: state.records.filter((record) => !idSet.has(record.id)),
        }));
        return initialLength - get().records.length;
      },

      batchAddTags: (ids: string[], tags: string[]) => {
        const idSet = new Set(ids);
        let updatedCount = 0;
        set((state) => ({
          records: state.records.map((record) => {
            if (idSet.has(record.id)) {
              updatedCount++;
              const newTags = Array.from(new Set([...(record.tags || []), ...tags]));
              return { ...record, tags: newTags, updatedAt: Date.now() };
            }
            return record;
          }),
        }));
        return updatedCount;
      },
    }),
    {
      name: 'bark-recorder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        dogs: state.dogs,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.dogs) {
          state.dogs = [];
        }
        if (state && !state.settings.reminders) {
          state.settings.reminders = initialSettings.reminders;
        }
        if (state && state.settings.reminders && !state.settings.reminders.lastTriggeredDates) {
          state.settings.reminders.lastTriggeredDates = {};
        }
        if (state && state.settings.reminders && !state.settings.reminders.times) {
          state.settings.reminders.times = initialSettings.reminders.times;
        }
      },
    }
  )
);
