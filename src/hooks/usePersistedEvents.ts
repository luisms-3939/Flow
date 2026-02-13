import { useState, useEffect } from "react";
import { Event } from "@/types/event";

const STORAGE_KEY = "productivity-hub-events";

export const usePersistedEvents = (defaultEvents: Event[]): [Event[], React.Dispatch<React.SetStateAction<Event[]>>] => {
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const storedEvents = localStorage.getItem(STORAGE_KEY);
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        // Convert date strings back to Date objects
        return parsed.map((event: any) => ({
          ...event,
          date: new Date(event.date),
        }));
      }
    } catch (error) {
      console.error("Failed to load events from localStorage:", error);
    }
    return defaultEvents;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error("Failed to save events to localStorage:", error);
    }
  }, [events]);

  return [events, setEvents];
};
