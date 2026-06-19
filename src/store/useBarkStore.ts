import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BarkRecord, AppSettings, ReminderTime, DogProfile } from '@/types';
import { generateId } from '@/utils/storage';

interface BarkState {
  records: BarkRecord[];
  dogs: DogProfile[];
  settings: AppSettings;
  deletedRecordIds: string[];
  deletedDogIds: string[];
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
  markDailyPopupShown: (dateStr: string) => void;
  addDog: (data: Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>) => DogProfile;
  updateDog: (id: string, data: Partial<Omit<DogProfile, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteDog: (id: string) => void;
  getAllBreeds: () => string[];
  batchUpdateRecords: (ids: string[], data: Partial<BarkRecord>) => number;
  batchDeleteRecords: (ids: string[]) => number;
  batchAddTags: (ids: string[], tags: string[]) => number;
  getPendingSyncData: () => {
    records: BarkRecord[];
    dogs: DogProfile[];
    deletedRecordIds: string[];
    deletedDogIds: string[];
  };
  markAllSynced: () => void;
  mergeRemoteChanges: (
    remoteRecords: BarkRecord[],
    remoteDogs: DogProfile[],
    remoteDeletedRecordIds: string[],
    remoteDeletedDogIds: string[]
  ) => { mergedRecords: number; mergedDogs: number; deletedLocal: number };
  replaceAllData: (
    records: BarkRecord[],
    dogs: DogProfile[],
    settings?: AppSettings
  ) => void;
  clearDeletedTracking: () => void;
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
    lastDailyPopupDate: '',
  },
  locationSharing: {
    enabled: false,
    precision: 'medium',
    lastGrantedAt: 0,
    lastDeniedAt: 0,
  },
};

export const useBarkStore = create<BarkState>()(
  persist(
    (set, get) => ({
      records: [],
      dogs: [],
      settings: initialSettings,
      deletedRecordIds: [],
      deletedDogIds: [],

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
          deletedRecordIds: state.deletedRecordIds.includes(id)
            ? state.deletedRecordIds
            : [...state.deletedRecordIds, id],
        }));
      },

      clearAllRecords: () => {
        set((state) => ({
          records: [],
          deletedRecordIds: Array.from(
            new Set([
              ...state.deletedRecordIds,
              ...state.records.map((r) => r.id),
            ])
          ),
        }));
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

      markDailyPopupShown: (dateStr: string) => {
        set((state) => ({
          settings: {
            ...state.settings,
            reminders: {
              ...state.settings.reminders,
              lastDailyPopupDate: dateStr,
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
          deletedDogIds: state.deletedDogIds.includes(id)
            ? state.deletedDogIds
            : [...state.deletedDogIds, id],
          records: state.records.map((record) =>
            record.dogId === id ? { ...record, dogId: undefined, updatedAt: Date.now() } : record
          ),
        }));
      },

      getAllBreeds: () => {
        const state = get();
        const breedSet = new Set<string>();
        state.dogs.forEach((dog) => {
          if (dog.breed?.trim()) {
            breedSet.add(dog.breed.trim());
          }
        });
        return Array.from(breedSet).sort();
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
          deletedRecordIds: Array.from(
            new Set([
              ...state.deletedRecordIds,
              ...ids.filter((id) => state.records.some((r) => r.id === id)),
            ])
          ),
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

      getPendingSyncData: () => {
        const state = get();
        return {
          records: [...state.records],
          dogs: [...state.dogs],
          deletedRecordIds: [...state.deletedRecordIds],
          deletedDogIds: [...state.deletedDogIds],
        };
      },

      markAllSynced: () => {
        set({
          deletedRecordIds: [],
          deletedDogIds: [],
        });
      },

      mergeRemoteChanges: (
        remoteRecords: BarkRecord[],
        remoteDogs: DogProfile[],
        remoteDeletedRecordIds: string[],
        remoteDeletedDogIds: string[]
      ) => {
        const state = get();
        let mergedRecords = 0;
        let mergedDogs = 0;
        let deletedLocal = 0;

        const localRecordMap = new Map(state.records.map((r) => [r.id, r]));
        remoteRecords.forEach((remote) => {
          const local = localRecordMap.get(remote.id);
          if (!local) {
            localRecordMap.set(remote.id, remote);
            mergedRecords++;
          } else if (remote.updatedAt > local.updatedAt) {
            localRecordMap.set(remote.id, remote);
            mergedRecords++;
          }
        });

        remoteDeletedRecordIds.forEach((id) => {
          if (localRecordMap.has(id)) {
            localRecordMap.delete(id);
            deletedLocal++;
          }
        });

        const localDogMap = new Map(state.dogs.map((d) => [d.id, d]));
        remoteDogs.forEach((remote) => {
          const local = localDogMap.get(remote.id);
          if (!local) {
            localDogMap.set(remote.id, remote);
            mergedDogs++;
          } else if (remote.updatedAt > local.updatedAt) {
            localDogMap.set(remote.id, remote);
            mergedDogs++;
          }
        });

        remoteDeletedDogIds.forEach((id) => {
          if (localDogMap.has(id)) {
            localDogMap.delete(id);
            deletedLocal++;
          }
        });

        const finalDeletedRecordIds = state.deletedRecordIds.filter(
          (id) => !remoteDeletedRecordIds.includes(id)
        );
        const finalDeletedDogIds = state.deletedDogIds.filter(
          (id) => !remoteDeletedDogIds.includes(id)
        );

        set({
          records: Array.from(localRecordMap.values()).sort(
            (a, b) => b.timestamp - a.timestamp
          ),
          dogs: Array.from(localDogMap.values()),
          deletedRecordIds: finalDeletedRecordIds,
          deletedDogIds: finalDeletedDogIds,
        });

        return { mergedRecords, mergedDogs, deletedLocal };
      },

      replaceAllData: (
        records: BarkRecord[],
        dogs: DogProfile[],
        settings?: AppSettings
      ) => {
        set((state) => ({
          records: [...records].sort((a, b) => b.timestamp - a.timestamp),
          dogs: [...dogs],
          settings: settings ?? state.settings,
          deletedRecordIds: [],
          deletedDogIds: [],
        }));
      },

      clearDeletedTracking: () => {
        set({
          deletedRecordIds: [],
          deletedDogIds: [],
        });
      },
    }),
    {
      name: 'bark-recorder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        dogs: state.dogs,
        settings: state.settings,
        deletedRecordIds: state.deletedRecordIds,
        deletedDogIds: state.deletedDogIds,
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
        if (state && state.settings.reminders && state.settings.reminders.lastDailyPopupDate === undefined) {
          state.settings.reminders.lastDailyPopupDate = '';
        }
        if (state && !state.settings.locationSharing) {
          state.settings.locationSharing = initialSettings.locationSharing;
        }
        if (state && !state.deletedRecordIds) {
          state.deletedRecordIds = [];
        }
        if (state && !state.deletedDogIds) {
          state.deletedDogIds = [];
        }
      },
    }
  )
);
