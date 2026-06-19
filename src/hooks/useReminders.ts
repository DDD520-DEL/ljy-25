import { useEffect, useRef, useCallback, useState } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import { ReminderTime } from '@/types';

function getTodayStr(): string {
  return new Date().toDateString();
}

function formatReminderTime(time: ReminderTime): string {
  return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
}

function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🐕 狗叫记录提醒', {
        body: '该去记录狗叫了',
        icon: '/favicon.svg',
        tag: 'bark-reminder',
        requireInteraction: false,
      });
    } catch (e) {
      console.warn('Failed to show notification:', e);
    }
  }
}

export function useReminders() {
  const {
    settings,
    toggleReminders,
    addReminderTime,
    updateReminderTime,
    removeReminderTime,
    markReminderTriggered,
  } = useBarkStore();

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const timerRef = useRef<number | null>(null);
  const reminders = settings.reminders;

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }
    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return false;
    }
  }, []);

  const checkAndTriggerReminders = useCallback(() => {
    if (!reminders.enabled) return;

    const now = new Date();
    const todayStr = getTodayStr();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    reminders.times.forEach((time) => {
      if (!time.enabled) return;

      const reminderMinutes = time.hour * 60 + time.minute;
      const lastTriggered = reminders.lastTriggeredDates[time.id];
      const alreadyTriggeredToday = lastTriggered === todayStr;

      if (!alreadyTriggeredToday && currentMinutes >= reminderMinutes && currentMinutes - reminderMinutes < 2) {
        showNotification();
        markReminderTriggered(time.id, todayStr);
      }
    });
  }, [reminders, markReminderTriggered]);

  useEffect(() => {
    if (reminders.enabled) {
      checkAndTriggerReminders();
      timerRef.current = window.setInterval(checkAndTriggerReminders, 30 * 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [reminders.enabled, checkAndTriggerReminders]);

  const getTodayReminderStatus = useCallback(() => {
    const todayStr = getTodayStr();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const enabledTimes = reminders.times.filter((t) => t.enabled);

    const triggered = enabledTimes.filter(
      (t) => reminders.lastTriggeredDates[t.id] === todayStr
    );
    const pending = enabledTimes.filter(
      (t) =>
        reminders.lastTriggeredDates[t.id] !== todayStr &&
        t.hour * 60 + t.minute > currentMinutes
    );
    const missed = enabledTimes.filter(
      (t) =>
        reminders.lastTriggeredDates[t.id] !== todayStr &&
        t.hour * 60 + t.minute <= currentMinutes
    );

    return { triggered, pending, missed, total: enabledTimes.length };
  }, [reminders]);

  return {
    reminders,
    permission,
    requestNotificationPermission,
    toggleReminders,
    addReminderTime,
    updateReminderTime,
    removeReminderTime,
    getTodayReminderStatus,
    formatReminderTime,
  };
}
