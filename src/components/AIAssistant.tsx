import { Button } from "./ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { SparkMascot } from "./SparkMascot";
import { SparkLoader } from "./SparkLoader";
import { useAIChat, AIAction } from "@/hooks/useAIChat";
import { Event, EventType, Priority } from "@/types/event";
import { Send, Trash2, Calendar, Clock, ListTodo, Sparkles, Plus, Check, X, Lightbulb, AlertTriangle, Eye, Cake } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface AIAssistantProps {
  events?: Event[];
  onCreateEvent?: (event: Omit<Event, "id">) => void;
}

const quickActions = [
  { label: "Suggest meeting times", icon: Clock, prompt: "What are the best times for a 1-hour meeting this week based on my schedule?" },
  { label: "Analyze my schedule", icon: Calendar, prompt: "Analyze my schedule and tell me if I have any potential conflicts or if I'm overbooked." },
  { label: "Prioritize tasks", icon: ListTodo, prompt: "Help me prioritize my tasks based on deadlines and importance." },
  { label: "Weekly summary", icon: Sparkles, prompt: "Give me a summary of what's coming up this week." },
];

const priorityColors: Record<Priority, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const eventTypeIcons: Record<EventType, typeof Calendar> = {
  task: ListTodo,
  meeting: Calendar,
  note: Lightbulb,
  birthday: Cake,
};

export const AIAssistant = ({ events = [], onCreateEvent }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, error, pendingAction, sendMessage, clearChat, clearPendingAction } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingAction]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), events);
    setInput("");
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt, events);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmEvent = useCallback(() => {
    if (pendingAction?.type === "create_event" && onCreateEvent) {
      const data = pendingAction.data as {
        title: string;
        type: EventType;
        date: string;
        startTime?: string;
        endTime?: string;
        description?: string;
        priority?: Priority;
        location?: string;
        category?: string;
      };
      
      onCreateEvent({
        title: data.title,
        type: data.type,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        priority: data.priority || "medium",
        location: data.location,
        category: data.category,
      });
      
      clearPendingAction();
    }
  }, [pendingAction, onCreateEvent, clearPendingAction]);

  const getMood = () => {
    if (isLoading) return "doing";
    if (messages.length > 0) return "wellDone";
    return "idle";
  };

  const renderActionCard = () => {
    if (!pendingAction) return null;

    if (pendingAction.type === "create_event") {
      const data = pendingAction.data as {
        title: string;
        type: EventType;
        date: string;
        startTime?: string;
        endTime?: string;
        description?: string;
        priority?: Priority;
        location?: string;
        category?: string;
      };
      const TypeIcon = eventTypeIcons[data.type];

      return (
        <Card className="p-4 bg-primary/5 border-primary/20 mt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase text-muted-foreground font-medium">
                  New {data.type}
                </span>
                {data.priority && (
                  <Badge variant="outline" className={cn("text-xs", priorityColors[data.priority])}>
                    {data.priority}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{data.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(data.date).toLocaleDateString()}</span>
                {data.startTime && (
                  <>
                    <Clock className="h-3.5 w-3.5 ml-2" />
                    <span>{data.startTime}{data.endTime ? ` - ${data.endTime}` : ""}</span>
                  </>
                )}
              </div>
              {data.description && (
                <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
              )}
              {data.location && (
                <p className="text-sm text-muted-foreground mt-1">📍 {data.location}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={clearPendingAction}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1 bg-primary hover:bg-primary/90"
                onClick={handleConfirmEvent}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (pendingAction.type === "suggest_times") {
      const data = pendingAction.data as { suggestions: { date: string; startTime: string; endTime: string; reason: string }[] };
      return (
        <Card className="p-4 bg-primary/5 border-primary/20 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Suggested Times</span>
          </div>
          <div className="space-y-2">
            {data.suggestions?.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border">
                <div>
                  <div className="font-medium text-sm">
                    {new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.startTime} - {s.endTime}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground max-w-[150px] text-right">
                  {s.reason}
                </div>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={clearPendingAction}
          >
            Dismiss
          </Button>
        </Card>
      );
    }

    if (pendingAction.type === "analyze_productivity") {
      const data = pendingAction.data as { 
        insights: { type: "tip" | "warning" | "observation"; message: string }[]; 
        busyScore?: number; 
        focusTimeAvailable?: string 
      };
      
      const insightIcons = {
        tip: <Lightbulb className="h-4 w-4 text-green-400" />,
        warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
        observation: <Eye className="h-4 w-4 text-blue-400" />,
      };

      return (
        <Card className="p-4 bg-primary/5 border-primary/20 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Productivity Insights</span>
            {data.busyScore !== undefined && (
              <Badge variant="outline" className="ml-auto">
                {data.busyScore}% busy
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {data.insights?.slice(0, 4).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border">
                {insightIcons[insight.type]}
                <span className="text-sm text-foreground">{insight.message}</span>
              </div>
            ))}
          </div>
          {data.focusTimeAvailable && (
            <div className="mt-3 text-sm text-muted-foreground">
              ⏰ Focus time available: {data.focusTimeAvailable}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={clearPendingAction}
          >
            Dismiss
          </Button>
        </Card>
      );
    }

    return null;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2 border-primary/50 hover:bg-primary/10 hover:shadow-glow transition-smooth"
      >
        <SparkMascot mood="idle" size="sm" />
        AI Assistant
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-2xl h-[600px] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparkMascot mood={getMood()} size="sm" />
                Spark AI Assistant
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 px-6">
            {messages.length === 0 && !isLoading ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <SparkMascot mood="idle" size="lg" className="mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Hi! I'm Spark 👋
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    I can create events, find optimal meeting times, and help you stay productive. Just tell me what you need!
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 h-auto py-3 px-4 text-left"
                      onClick={() => handleQuickAction(action.prompt)}
                    >
                      <action.icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Try: "Schedule a team meeting tomorrow at 2pm" or "What's my busiest day this week?"
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-4 py-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <SparkMascot mood="wellDone" size="sm" className="shrink-0 mt-1" />
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 max-w-[85%] whitespace-pre-wrap",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex gap-3 justify-start">
                      <SparkMascot mood="doing" size="sm" className="shrink-0 mt-1" />
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <SparkLoader size="sm" text="" />
                      </div>
                    </div>
                  )}

                  {renderActionCard()}

                  {error && (
                    <div className="text-center text-destructive text-sm py-2">
                      {error}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="p-6 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Schedule a meeting, create a task, or ask anything..."
                className="bg-muted border-border"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-primary to-primary-glow shadow-glow shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
