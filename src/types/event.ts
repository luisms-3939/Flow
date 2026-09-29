export type EventType = "task" | "note" | "meeting" | "birthday" | "work";
export type Priority = "low" | "medium" | "high";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TaskStatus =  "todo" | "in_progress" | "done";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months/years
  endDate?: string; // ISO format end date
  daysOfWeek?: number[]; // For weekly: 0=Sun, 1=Mon, etc.
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  date: Date;
  startTime?: string;
  endTime?: string;
  category?: string;
  tags?: string[];
  recurrencePattern?: RecurrencePattern;
  parentEventId?: string; // For generated instances
  isRecurringInstance?: boolean;
  excludedDates?: string[]; // ISO dates excluded from recurrence (modified individually)
  reminders?: string[];
  attachments?: string[];
  // Task-specific fields
  priority?: Priority;
  subtasks?: Subtask[];
  completed?: boolean;
  status?: TaskStatus;
  // Meeting-specific fields
  location?: string;
  // Note-specific fields
  richContent?: string;
}

export type ViewMode = "monthly" | "weekly" | "daily" | "kanban";
