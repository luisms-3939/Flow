import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Target, 
  X, 
  Minimize2, 
  Maximize2,
  CheckCircle2,
  Clock,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Event } from "@/types/event";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { Progress } from "./ui/progress";

interface FocusTimerProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
}

type TimerState = "idle" | "running" | "paused" | "completed";

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 25, label: "25 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

export const FocusTimer = ({ events, isOpen, onClose }: FocusTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const { 
    startSession, 
    endSession, 
    todayTotalMinutes, 
    todayCompletedSessions,
    isStarting,
    isEnding
  } = useFocusSessions();

  // Filter to only show tasks that aren't completed
  const availableTasks = events.filter(
    e => e.type === "task" && !e.completed
  );

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === "running") {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState]);

  // Reset timer when duration changes (only in idle state)
  useEffect(() => {
    if (timerState === "idle") {
      setSecondsRemaining(selectedDuration * 60);
    }
  }, [selectedDuration, timerState]);

  const handleStart = async () => {
    try {
      const session = await startSession({
        durationMinutes: selectedDuration,
        eventId: selectedEventId || undefined,
      });
      setCurrentSessionId(session.id);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setTimerState("running");
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handlePause = () => {
    pausedTimeRef.current = Date.now();
    setTimerState("paused");
  };

  const handleResume = () => {
    // Adjust start time to account for pause duration
    if (pausedTimeRef.current && startTimeRef.current) {
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
    }
    setTimerState("running");
  };

  const handleStop = async () => {
    if (currentSessionId && startTimeRef.current) {
      const actualSeconds = Math.round(
        (selectedDuration * 60) - secondsRemaining
      );
      await endSession({
        sessionId: currentSessionId,
        actualDurationSeconds: actualSeconds,
        completed: false,
      });
    }
    resetTimer();
  };

  const handleTimerComplete = useCallback(async () => {
    setTimerState("completed");
    
    // Play completion sound (browser notification)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Focus Session Complete! 🎯", {
        body: `Great job! You focused for ${selectedDuration} minutes.`,
        icon: "/favicon.png",
      });
    }

    if (currentSessionId) {
      await endSession({
        sessionId: currentSessionId,
        actualDurationSeconds: selectedDuration * 60,
        completed: true,
      });
    }
  }, [currentSessionId, selectedDuration, endSession]);

  const resetTimer = () => {
    setTimerState("idle");
    setSecondsRemaining(selectedDuration * 60);
    setCurrentSessionId(null);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((selectedDuration * 60 - secondsRemaining) / (selectedDuration * 60)) * 100;

  if (!isOpen) return null;

  const selectedTask = events.find(e => e.id === selectedEventId);

  // Minimized view
  if (isMinimized) {
    return (
      <Card 
        className={cn(
          "fixed bottom-20 right-4 z-50 p-3 shadow-xl border-2",
          "bg-card/95 backdrop-blur-sm",
          timerState === "running" && "border-primary animate-pulse"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "text-2xl font-mono font-bold",
            timerState === "running" && "text-primary"
          )}>
            {formatTime(secondsRemaining)}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "fixed bottom-20 right-4 z-50 w-80 shadow-2xl border-2",
        "bg-card/95 backdrop-blur-sm",
        timerState === "running" && "border-primary"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <span className="font-semibold">Focus Timer</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="p-4 space-y-4">
        {/* Circular Timer */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "relative flex items-center justify-center w-40 h-40 rounded-full",
            "bg-muted/50 border-4",
            timerState === "running" ? "border-primary" : "border-border"
          )}>
            <div className="text-center">
              <div className={cn(
                "text-4xl font-mono font-bold tracking-wider",
                timerState === "running" && "text-primary"
              )}>
                {formatTime(secondsRemaining)}
              </div>
              {timerState !== "idle" && (
                <div className="text-xs text-muted-foreground mt-1">
                  {timerState === "running" ? "Focusing..." : 
                   timerState === "paused" ? "Paused" : "Complete!"}
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          {timerState !== "idle" && (
            <Progress value={progress} className="w-full mt-3 h-2" />
          )}
        </div>

        {/* Task Selection (only when idle) */}
        {timerState === "idle" && (
          <div className="space-y-3">
            {/* Duration selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duration
              </label>
              <Select
                value={selectedDuration.toString()}
                onValueChange={(v) => setSelectedDuration(parseInt(v))}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Link to task (optional)
              </label>
              <Select
                value={selectedEventId || "none"}
                onValueChange={(v) => setSelectedEventId(v === "none" ? null : v)}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {availableTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Selected task display when running */}
        {timerState !== "idle" && selectedTask && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate">{selectedTask.title}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {timerState === "idle" && (
            <Button 
              onClick={handleStart} 
              className="gap-2 w-full"
              disabled={isStarting}
            >
              <Play className="h-4 w-4" />
              Start Focus
            </Button>
          )}

          {timerState === "running" && (
            <>
              <Button 
                onClick={handlePause} 
                variant="outline" 
                className="gap-2 flex-1"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button 
                onClick={handleStop} 
                variant="destructive" 
                className="gap-2 flex-1"
                disabled={isEnding}
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {timerState === "paused" && (
            <>
              <Button 
                onClick={handleResume} 
                className="gap-2 flex-1"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button 
                onClick={handleStop} 
                variant="destructive" 
                className="gap-2 flex-1"
                disabled={isEnding}
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {timerState === "completed" && (
            <Button 
              onClick={resetTimer} 
              className="gap-2 w-full"
            >
              <CheckCircle2 className="h-4 w-4" />
              Done - Start Another
            </Button>
          )}
        </div>
      </div>

      {/* Today's Stats Footer */}
      <div className="border-t border-border p-3 bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {todayTotalMinutes}m
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {todayCompletedSessions} sessions
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
