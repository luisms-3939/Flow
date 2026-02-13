import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FocusSession {
  id: string;
  user_id: string;
  event_id: string | null;
  duration_minutes: number;
  actual_duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export const useFocusSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all focus sessions for the current user
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ["focus_sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as FocusSession[];
    },
    enabled: !!user,
  });

  // Start a new focus session
  const startSessionMutation = useMutation({
    mutationFn: async ({ 
      durationMinutes, 
      eventId 
    }: { 
      durationMinutes: number; 
      eventId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          event_id: eventId || null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focus_sessions", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start focus session.",
        variant: "destructive",
      });
      console.error("Start session error:", error);
    },
  });

  // End/complete a focus session
  const endSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      actualDurationSeconds, 
      completed,
      notes,
    }: { 
      sessionId: string;
      actualDurationSeconds: number;
      completed: boolean;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("focus_sessions")
        .update({
          ended_at: new Date().toISOString(),
          actual_duration_seconds: actualDurationSeconds,
          completed,
          notes: notes || null,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as FocusSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["focus_sessions", user?.id] });
      if (data.completed) {
        toast({
          title: "Focus Session Complete! 🎯",
          description: `You focused for ${Math.round((data.actual_duration_seconds || 0) / 60)} minutes.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save focus session.",
        variant: "destructive",
      });
      console.error("End session error:", error);
    },
  });

  // Get stats for today
  const todayStats = sessions.filter(s => {
    const today = new Date();
    const sessionDate = new Date(s.started_at);
    return sessionDate.toDateString() === today.toDateString();
  });

  const todayTotalMinutes = todayStats.reduce((acc, s) => {
    return acc + Math.round((s.actual_duration_seconds || 0) / 60);
  }, 0);

  const todayCompletedSessions = todayStats.filter(s => s.completed).length;

  return {
    sessions,
    isLoading,
    refetch,
    startSession: startSessionMutation.mutateAsync,
    endSession: endSessionMutation.mutateAsync,
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    todayTotalMinutes,
    todayCompletedSessions,
  };
};
