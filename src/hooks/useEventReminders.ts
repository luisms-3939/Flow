import { useEffect, useRef, useCallback } from "react";
import { Event } from "@/types/event";
import { useNotifications } from "./useNotifications";
import { format, isToday, isTomorrow, differenceInMinutes, parse, setHours, setMinutes } from "date-fns";

const REMINDER_CHECK_INTERVAL = 30000; // Check every 30 seconds
const NOTIFIED_KEY = "synapflow-notified-reminders";

// Parse reminder string like "15 minutes before" to minutes
const parseReminderMinutes = (reminder: string): number => {
  const match = reminder.match(/(\d+)\s*(minute|hour|day)/i);
  if (!match) return 15;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case "minute": return value;
    case "hour": return value * 60;
    case "day": return value * 60 * 24;
    default: return 15;
  }
};

// Get event datetime
const getEventDateTime = (event: Event): Date | null => {
  if (!event.startTime) return null;
  
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.startTime.split(":").map(Number);
  
  return setMinutes(setHours(eventDate, hours), minutes);
};

export const useEventReminders = (events: Event[], enabled: boolean = true) => {
  const { permission, showNotification, requestPermission } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load notified reminders from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFIED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep notifications from today
        const today = format(new Date(), "yyyy-MM-dd");
        const filtered = parsed.filter((id: string) => id.startsWith(today));
        notifiedRef.current = new Set(filtered);
      }
    } catch (error) {
      console.error("Failed to load notified reminders:", error);
    }
  }, []);

  // Save notified reminders
  const saveNotified = useCallback(() => {
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notifiedRef.current]));
    } catch (error) {
      console.error("Failed to save notified reminders:", error);
    }
  }, []);

  const checkReminders = useCallback(() => {
    if (permission !== "granted" || !enabled) return;

    const now = new Date();

    events.forEach((event) => {
      if (!event.reminders || event.reminders.length === 0) return;
      
      const eventDateTime = getEventDateTime(event);
      if (!eventDateTime || eventDateTime < now) return;

      event.reminders.forEach((reminder) => {
        const reminderMinutes = parseReminderMinutes(reminder);
        const notificationId = `${format(now, "yyyy-MM-dd")}-${event.id}-${reminderMinutes}`;

        // Skip if already notified
        if (notifiedRef.current.has(notificationId)) return;

        const minutesUntilEvent = differenceInMinutes(eventDateTime, now);

        // Check if it's time to notify (within 1 minute of reminder time)
        if (minutesUntilEvent <= reminderMinutes && minutesUntilEvent > reminderMinutes - 1) {
          const timeLabel = minutesUntilEvent <= 1 
            ? "Starting now" 
            : `In ${minutesUntilEvent} minutes`;

          const eventType = event.type === "meeting" ? "Meeting" : event.type === "task" ? "Task" : "Event";

          showNotification(`${eventType}: ${event.title}`, {
            body: `${timeLabel}${event.location ? ` • ${event.location}` : ""}`,
            tag: notificationId,
            requireInteraction: true,
          });

          notifiedRef.current.add(notificationId);
          saveNotified();
        }
      });
    });
  }, [events, permission, enabled, showNotification, saveNotified]);

  // Set up interval to check reminders
  useEffect(() => {
    if (!enabled || permission !== "granted") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkReminders();

    // Set up interval
    intervalRef.current = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, permission, checkReminders]);

  return {
    permission,
    requestPermission,
  };
};
