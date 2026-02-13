import { useState, useEffect } from "react";
import { ViewMode } from "@/types/event";

export interface AppSettings {
  theme: "dark" | "light";
  defaultView: ViewMode;
  fontSize: "small" | "medium" | "large";
  displayDensity: "compact" | "spacious";
  notificationsEnabled: boolean;
  eventReminders: boolean;
  dailySummary: boolean;
  taskDeadlines: boolean;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  defaultView: "monthly",
  fontSize: "medium",
  displayDensity: "spacious",
  notificationsEnabled: true,
  eventReminders: true,
  dailySummary: true,
  taskDeadlines: true,
};

const STORAGE_KEY = "synapflow-settings";

export const usePersistedSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return defaultSettings;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [settings]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(settings.theme);
  }, [settings.theme]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-sm", "text-base", "text-lg");
    const fontClass = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    }[settings.fontSize];
    root.classList.add(fontClass);
  }, [settings.fontSize]);

  // Apply display density
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("density-compact", "density-spacious");
    root.classList.add(`density-${settings.displayDensity}`);
  }, [settings.displayDensity]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
};
