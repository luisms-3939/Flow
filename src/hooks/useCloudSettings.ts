import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ViewMode } from "@/types/event";

export type SidebarSectionId = "today" | "overdue" | "meetings" | "focus";

export interface SidebarSectionsVisible {
  today: boolean;
  overdue: boolean;
  meetings: boolean;
  focus: boolean;
}

export interface AppSettings {
  theme: "dark" | "light";
  defaultView: ViewMode;
  fontSize: "small" | "medium" | "large";
  displayDensity: "compact" | "spacious";
  notificationsEnabled: boolean;
  eventReminders: boolean;
  dailySummary: boolean;
  taskDeadlines: boolean;
  sidebarCollapsed: boolean;
  sidebarSectionsOrder: SidebarSectionId[];
  sidebarSectionsVisible: SidebarSectionsVisible;
  sidebarWidth: number;
  previewPaneVisible: boolean;
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
  sidebarCollapsed: false,
  sidebarSectionsOrder: ["today", "overdue", "meetings", "focus"],
  sidebarSectionsVisible: { today: true, overdue: true, meetings: true, focus: true },
  sidebarWidth: 320,
  previewPaneVisible: true,
};

export const useCloudSettings = () => {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            console.error("Error loading settings:", error);
          }
          setIsLoading(false);
          return;
        }

        if (data) {
          setSettingsState({
            theme: (data.theme as AppSettings["theme"]) || defaultSettings.theme,
            defaultView: (data.default_view as ViewMode) || defaultSettings.defaultView,
            fontSize: (data.font_size as AppSettings["fontSize"]) || defaultSettings.fontSize,
            displayDensity: (data.display_density as AppSettings["displayDensity"]) || defaultSettings.displayDensity,
            notificationsEnabled: data.notifications_enabled ?? defaultSettings.notificationsEnabled,
            eventReminders: data.event_reminders ?? defaultSettings.eventReminders,
            dailySummary: data.daily_summary ?? defaultSettings.dailySummary,
            taskDeadlines: data.task_deadlines ?? defaultSettings.taskDeadlines,
            sidebarCollapsed: data.sidebar_collapsed ?? defaultSettings.sidebarCollapsed,
            sidebarSectionsOrder: (data.sidebar_sections_order as SidebarSectionId[]) || defaultSettings.sidebarSectionsOrder,
            sidebarSectionsVisible: (data.sidebar_sections_visible as unknown as SidebarSectionsVisible) || defaultSettings.sidebarSectionsVisible,
            sidebarWidth: data.sidebar_width ?? defaultSettings.sidebarWidth,
            previewPaneVisible: data.preview_pane_visible ?? defaultSettings.previewPaneVisible,
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

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

  // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      // Update local state immediately
      setSettingsState((prev) => ({ ...prev, [key]: value }));

      if (!user) return;

      // Map key to database column name
      const columnMap: Record<keyof AppSettings, string> = {
        theme: "theme",
        defaultView: "default_view",
        fontSize: "font_size",
        displayDensity: "display_density",
        notificationsEnabled: "notifications_enabled",
        eventReminders: "event_reminders",
        dailySummary: "daily_summary",
        taskDeadlines: "task_deadlines",
        sidebarCollapsed: "sidebar_collapsed",
        sidebarSectionsOrder: "sidebar_sections_order",
        sidebarSectionsVisible: "sidebar_sections_visible",
        sidebarWidth: "sidebar_width",
        previewPaneVisible: "preview_pane_visible",
      };

      const columnName = columnMap[key];

      try {
        const { error } = await supabase
          .from("user_settings")
          .update({ [columnName]: value })
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to save setting:", error);
        }
      } catch (err) {
        console.error("Failed to update setting:", err);
      }
    },
    [user]
  );

  return { settings, updateSetting, isLoading };
};
