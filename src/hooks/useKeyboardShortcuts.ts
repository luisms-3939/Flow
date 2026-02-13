import { useEffect, useCallback } from "react";
import { ViewMode } from "@/types/event";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";

interface KeyboardShortcutsConfig {
  onNewEvent?: () => void;
  onGoToToday?: () => void;
  onViewChange?: (view: ViewMode) => void;
  onDateChange?: (date: Date) => void;
  onCloseModal?: () => void;
  onFocusSearch?: () => void;
  onToggleSidebar?: () => void;
  currentDate: Date;
  currentView: ViewMode;
  isModalOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  onNewEvent,
  onGoToToday,
  onViewChange,
  onDateChange,
  onCloseModal,
  onFocusSearch,
  onToggleSidebar,
  currentDate,
  currentView,
  isModalOpen = false,
}: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (e.key === "Escape" && onCloseModal) {
          onCloseModal();
        }
        return;
      }

      // Handle Escape to close modals
      if (e.key === "Escape" && onCloseModal) {
        onCloseModal();
        return;
      }

      // If modal is open, don't process other shortcuts
      if (isModalOpen) return;

      switch (e.key.toLowerCase()) {
        // Toggle sidebar: Ctrl/Cmd + B
        case "b":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onToggleSidebar?.();
          }
          break;

        // New event: N
        case "n":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onNewEvent?.();
          }
          break;

        // Go to today: T
        case "t":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onGoToToday?.();
          }
          break;

        // Daily view: D
        case "d":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onViewChange?.("daily");
          }
          break;

        // Weekly view: W
        case "w":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onViewChange?.("weekly");
          }
          break;

        // Monthly view: M
        case "m":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onViewChange?.("monthly");
          }
          break;

        // Focus search: /
        case "/":
          e.preventDefault();
          onFocusSearch?.();
          break;

        // Navigate: Arrow keys
        case "arrowleft":
          e.preventDefault();
          if (onDateChange) {
            const newDate =
              currentView === "daily"
                ? subDays(currentDate, 1)
                : currentView === "weekly"
                ? subWeeks(currentDate, 1)
                : subMonths(currentDate, 1);
            onDateChange(newDate);
          }
          break;

        case "arrowright":
          e.preventDefault();
          if (onDateChange) {
            const newDate =
              currentView === "daily"
                ? addDays(currentDate, 1)
                : currentView === "weekly"
                ? addWeeks(currentDate, 1)
                : addMonths(currentDate, 1);
            onDateChange(newDate);
          }
          break;
      }
    },
    [
      onNewEvent,
      onGoToToday,
      onViewChange,
      onDateChange,
      onCloseModal,
      onFocusSearch,
      onToggleSidebar,
      currentDate,
      currentView,
      isModalOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: "N", description: "New event" },
  { key: "T", description: "Go to today" },
  { key: "D", description: "Daily view" },
  { key: "W", description: "Weekly view" },
  { key: "M", description: "Monthly view" },
  { key: "/", description: "Search" },
  { key: "←/→", description: "Navigate dates" },
  { key: "Esc", description: "Close modal" },
  { key: "⌘B", description: "Toggle sidebar" },
];
