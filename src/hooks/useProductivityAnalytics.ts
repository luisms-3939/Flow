import { useMemo } from "react";
import { FocusSession } from "./useFocusSessions";
import { Event } from "@/types/event";
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  subWeeks, 
  subMonths,
  isWithinInterval,
  parseISO
} from "date-fns";

export interface DailyProductivity {
  date: string;
  day: string;
  totalMinutes: number;
  sessions: number;
  completed: number;
}

export interface CategoryBreakdown {
  category: string;
  totalMinutes: number;
  sessions: number;
  color: string;
}

export interface WeeklyStats {
  weekLabel: string;
  totalMinutes: number;
  sessions: number;
  avgPerDay: number;
}

export interface ProductivitySummary {
  totalMinutes: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionLength: number;
  longestSession: number;
  currentStreak: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Work": "hsl(217, 91%, 60%)",
  "Personal": "hsl(142, 76%, 36%)",
  "Urgent": "hsl(0, 84%, 60%)",
  "No Category": "hsl(215, 20%, 65%)",
};

export const useProductivityAnalytics = (
  sessions: FocusSession[],
  events: Event[]
) => {
  // Create a map of event IDs to their categories
  const eventCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach(event => {
      if (event.id) {
        map.set(event.id, event.category || "No Category");
      }
    });
    return map;
  }, [events]);

  // Get sessions for current week
  const currentWeekData = useMemo((): DailyProductivity[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.started_at);
        return isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
      });

      const totalMinutes = daySessions.reduce((acc, s) => {
        return acc + Math.round((s.actual_duration_seconds || 0) / 60);
      }, 0);

      return {
        date: format(day, "yyyy-MM-dd"),
        day: format(day, "EEE"),
        totalMinutes,
        sessions: daySessions.length,
        completed: daySessions.filter(s => s.completed).length,
      };
    });
  }, [sessions]);

  // Get sessions for current month (by week)
  const currentMonthData = useMemo((): WeeklyStats[] => {
    const weeks: WeeklyStats[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekDate = subWeeks(new Date(), i);
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.started_at);
        return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
      });

      const totalMinutes = weekSessions.reduce((acc, s) => {
        return acc + Math.round((s.actual_duration_seconds || 0) / 60);
      }, 0);

      weeks.push({
        weekLabel: format(weekStart, "MMM d"),
        totalMinutes,
        sessions: weekSessions.length,
        avgPerDay: Math.round(totalMinutes / 7),
      });
    }

    return weeks;
  }, [sessions]);

  // Category breakdown for last 30 days
  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const monthAgo = subMonths(new Date(), 1);
    const now = new Date();
    
    const recentSessions = sessions.filter(s => {
      const sessionDate = new Date(s.started_at);
      return isWithinInterval(sessionDate, { start: monthAgo, end: now });
    });

    const categoryMap = new Map<string, { minutes: number; sessions: number }>();

    recentSessions.forEach(session => {
      const category = session.event_id 
        ? eventCategoryMap.get(session.event_id) || "No Category"
        : "No Category";
      
      const existing = categoryMap.get(category) || { minutes: 0, sessions: 0 };
      categoryMap.set(category, {
        minutes: existing.minutes + Math.round((session.actual_duration_seconds || 0) / 60),
        sessions: existing.sessions + 1,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalMinutes: data.minutes,
        sessions: data.sessions,
        color: CATEGORY_COLORS[category] || "hsl(215, 20%, 65%)",
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [sessions, eventCategoryMap]);

  // Overall summary
  const summary = useMemo((): ProductivitySummary => {
    const completedSessions = sessions.filter(s => s.completed);
    const totalMinutes = sessions.reduce((acc, s) => {
      return acc + Math.round((s.actual_duration_seconds || 0) / 60);
    }, 0);

    const sessionLengths = sessions
      .filter(s => s.actual_duration_seconds)
      .map(s => s.actual_duration_seconds!);

    const longestSession = sessionLengths.length > 0 
      ? Math.round(Math.max(...sessionLengths) / 60)
      : 0;

    const averageSessionLength = sessionLengths.length > 0
      ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length / 60)
      : 0;

    // Calculate streak (consecutive days with completed sessions)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const hasSession = sessions.some(s => {
        const sessionDate = new Date(s.started_at);
        return s.completed && isWithinInterval(sessionDate, { start: dayStart, end: dayEnd });
      });

      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalMinutes,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageSessionLength,
      longestSession,
      currentStreak: streak,
    };
  }, [sessions]);

  return {
    currentWeekData,
    currentMonthData,
    categoryBreakdown,
    summary,
  };
};
