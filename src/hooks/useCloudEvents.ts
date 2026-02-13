import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/event";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";


// Convert database row to Event type
const dbToEvent = (row: any): Event => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  type: row.type as Event["type"],
  date: new Date(row.date),
  startTime: row.start_time || undefined,
  endTime: row.end_time || undefined,
  category: row.category || undefined,
  tags: row.tags || [],
  priority: row.priority || undefined,
  location: row.location || undefined,
  richContent: row.rich_content || undefined,
  recurrencePattern: row.recurrence_pattern || undefined,
  parentEventId: row.parent_event_id || undefined,
  isRecurringInstance: row.is_recurring_instance || false,
  excludedDates: row.excluded_dates || [],
  reminders: row.reminders || [],
  subtasks: row.subtasks || [],
  completed: row.completed || false,
  status: row.status || "todo",
  attachments: row.attachments || [],
});

// Convert Event to database format
const eventToDb = (event: Event, userId: string) => ({
  id: event.id,
  user_id: userId,
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
  parent_event_id: event.parentEventId || null,
  is_recurring_instance: event.isRecurringInstance || false,
  excluded_dates: event.excludedDates || [],
  reminders: event.reminders || [],
  subtasks: event.subtasks ? JSON.parse(JSON.stringify(event.subtasks)) : [],
  completed: event.completed || false,
  status: event.status || "todo",
  attachments: event.attachments || [],
});

export const useCloudEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all events for the current user
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      return data.map(dbToEvent);
    },
    enabled: !!user,
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user) throw new Error("Not authenticated");
      
      const dbEvent = eventToDb(event, user.id);
      const { data, error } = await supabase
        .from("events")
        .insert(dbEvent)
        .select()
        .single();

      if (error) throw error;
      return dbToEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
      console.error("Add event error:", error);
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user) throw new Error("Not authenticated");
      
      const dbEvent = eventToDb(event, user.id);
      const { data, error } = await supabase
        .from("events")
        .update(dbEvent)
        .eq("id", event.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return dbToEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      console.error("Update event error:", error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      console.error("Delete event error:", error);
    },
  });

  // Upsert event (add or update)
  const saveEvent = async (event: Event) => {
    const existingEvent = events.find((e) => e.id === event.id);
    if (existingEvent) {
      await updateEventMutation.mutateAsync(event);
    } else {
      await addEventMutation.mutateAsync(event);
    }
  };

  // Set events (for compatibility with existing code)
  const setEvents = async (
    eventsOrUpdater: Event[] | ((prev: Event[]) => Event[])
  ) => {
    let newEvents: Event[];
    
    if (typeof eventsOrUpdater === "function") {
      newEvents = eventsOrUpdater(events);
    } else {
      newEvents = eventsOrUpdater;
    }

    // Find events to add, update, or delete
    const currentIds = new Set(events.map((e) => e.id));
    const newIds = new Set(newEvents.map((e) => e.id));

    // Delete removed events
    for (const event of events) {
      if (!newIds.has(event.id)) {
        await deleteEventMutation.mutateAsync(event.id);
      }
    }

    // Add or update events
    for (const event of newEvents) {
      if (currentIds.has(event.id)) {
        await updateEventMutation.mutateAsync(event);
      } else {
        await addEventMutation.mutateAsync(event);
      }
    }
  };

  return {
    events,
    isLoading,
    error,
    refetch,
    setEvents,
    saveEvent,
    addEvent: addEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
  };
};
