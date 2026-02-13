import { useState, useEffect } from "react";
import { format } from "date-fns";

export interface Holiday {
  id: string;
  date: string; // ISO format: "2026-01-01"
  name?: string;
}

const defaultHolidays: Holiday[] = [
  { id: "1", date: "2026-01-01", name: "New Year's Day" },
  { id: "2", date: "2026-01-06", name: "Epiphany" },
  { id: "3", date: "2026-04-03", name: "Good Friday" },
  { id: "4", date: "2026-04-06", name: "Easter Monday" },
  { id: "5", date: "2026-05-01", name: "Labour Day" },
  { id: "6", date: "2026-05-25", name: "Whit Monday" },
  { id: "7", date: "2026-06-24", name: "Sant Joan" },
  { id: "8", date: "2026-08-15", name: "Assumption of Mary" },
  { id: "9", date: "2026-09-11", name: "La Diada" },
  { id: "10", date: "2026-09-24", name: "La Mercè" },
  { id: "11", date: "2026-10-12", name: "Hispanic Day" },
  { id: "12", date: "2026-12-06", name: "Constitution Day" },
  { id: "13", date: "2026-12-08", name: "Immaculate Conception" },
  { id: "14", date: "2026-12-25", name: "Christmas Day" },
  { id: "15", date: "2026-12-26", name: "St. Stephen's Day" },
];

const STORAGE_KEY = "synapflow-holidays";

export const usePersistedHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error loading holidays from localStorage:", e);
    }
    return defaultHolidays;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
  }, [holidays]);

  const addHoliday = (holiday: Omit<Holiday, "id">) => {
    const newHoliday: Holiday = {
      ...holiday,
      id: crypto.randomUUID(),
    };
    setHolidays((prev) => [...prev, newHoliday]);
  };

  const updateHoliday = (id: string, updates: Partial<Omit<Holiday, "id">>) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const removeHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const resetToDefaults = () => {
    setHolidays(defaultHolidays);
  };

  const isHoliday = (date: Date): Holiday | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.find((h) => h.date === dateStr);
  };

  return {
    holidays,
    addHoliday,
    updateHoliday,
    removeHoliday,
    resetToDefaults,
    isHoliday,
  };
};
