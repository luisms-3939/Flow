import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/types/event";

const EVENTS_STORAGE_KEY = "productivity-hub-events";
const MIGRATION_COMPLETE_KEY = "productivity-hub-migration-complete";

export const useLocalStorageMigration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const getLocalEvents = (): Event[] => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
    } catch {
      return [];
    }
  };

  const hasPendingMigration = (): boolean => {
    if (!user) return false;
    
    // Check if this user already migrated
    const migrationKey = `${MIGRATION_COMPLETE_KEY}-${user.id}`;
    if (localStorage.getItem(migrationKey)) return false;
    
    // Check if there are local events to migrate
    const localEvents = getLocalEvents();
    return localEvents.length > 0;
  };

  const migrateEvents = async () => {
    if (!user || isMigrating) return;
    
    const localEvents = getLocalEvents();
    if (localEvents.length === 0) return;

    setIsMigrating(true);
    
    try {
      // Convert events to database format with new UUIDs
      const dbEvents = localEvents.map((event) => ({
        id: crypto.randomUUID(), // Generate new UUIDs for cloud
        user_id: user.id,
        title: event.title,
        description: event.description || null,
        type: event.type,
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
        start_time: event.startTime || null,
        end_time: event.endTime || null,
        category: event.category || null,
        tags: event.tags || [],
        priority: event.priority || null,
        location: event.location || null,
        rich_content: event.richContent || null,
        recurrence_pattern: event.recurrencePattern ? JSON.parse(JSON.stringify(event.recurrencePattern)) : null,
        parent_event_id: null, // Reset parent references for clean import
        is_recurring_instance: event.isRecurringInstance || false,
        excluded_dates: event.excludedDates || [],
        reminders: event.reminders || [],
        subtasks: event.subtasks ? JSON.parse(JSON.stringify(event.subtasks)) : [],
        completed: event.completed || false,
      }));

      // Batch insert all events
      const { error } = await supabase
        .from("events")
        .insert(dbEvents);

      if (error) throw error;

      // Mark migration as complete for this user
      const migrationKey = `${MIGRATION_COMPLETE_KEY}-${user.id}`;
      localStorage.setItem(migrationKey, "true");
      
      // Clear local events after successful migration
      localStorage.removeItem(EVENTS_STORAGE_KEY);
      
      setMigrationComplete(true);
      
      toast({
        title: "Data imported successfully!",
        description: `${localEvents.length} event(s) from your device have been synced to your account.`,
      });
      
      return true;
    } catch (error) {
      console.error("Migration error:", error);
      toast({
        title: "Import failed",
        description: "Could not import your local events. You can try again later.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsMigrating(false);
    }
  };

  const skipMigration = () => {
    if (!user) return;
    const migrationKey = `${MIGRATION_COMPLETE_KEY}-${user.id}`;
    localStorage.setItem(migrationKey, "true");
    setMigrationComplete(true);
  };

  return {
    isMigrating,
    migrationComplete,
    hasPendingMigration: hasPendingMigration(),
    localEventsCount: getLocalEvents().length,
    migrateEvents,
    skipMigration,
  };
};
