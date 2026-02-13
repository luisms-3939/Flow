import { Event } from "@/types/event";
import { format, isSameDay } from "date-fns";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { usePersistedHolidays } from "@/hooks/usePersistedHolidays";
import { Repeat } from "lucide-react";

interface DailyCalendarViewProps {
  selectedDate: Date;
  events: Event[];
  onEventReschedule?: (eventId: string, newDate: Date, newTime?: string) => void;
}

export const DailyCalendarView = ({ selectedDate, events, onEventReschedule }: DailyCalendarViewProps) => {
  const { draggedEvent, handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();
  const { isHoliday } = usePersistedHolidays();
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 12 AM (midnight)
  const holiday = isHoliday(selectedDate);

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      if (!isSameDay(new Date(event.date), selectedDate)) return false;
      if (!event.startTime) return false;
      const eventHour = parseInt(event.startTime.split(":")[0]);
      return eventHour === hour;
    });
  };

  const getEventColor = (type: Event["type"]) => {
    switch (type) {
      case "task":
        return "bg-event-task border-event-task text-foreground";
      case "note":
        return "bg-event-note border-event-note text-foreground";
      case "meeting":
        return "bg-event-meeting border-event-meeting text-foreground";
      case "birthday":
        return "bg-event-birthday border-event-birthday text-foreground";
      default:
        return "bg-primary border-primary text-primary-foreground";
    }
  };

  const handleDrop = (hour: number, e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && onEventReschedule) {
      const newTime = `${hour.toString().padStart(2, "0")}:00`;
      onEventReschedule(eventId, selectedDate, newTime);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
      <div className="flex items-center gap-3 mb-4">
        <h2 className={cn("text-xl font-semibold", holiday && "text-red-500")}>
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        {holiday && (
          <Badge variant="outline" className="text-red-500 border-red-500/50">
            🎉 {holiday.name || "Holiday"}
          </Badge>
        )}
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            const isDropTarget = draggedEvent !== null;
            
            return (
              <div 
                key={hour} 
                className="grid grid-cols-[120px_1fr] gap-4 border-t border-border/50 pt-2"
              >
                <div className="text-sm text-muted-foreground font-medium">
                  {format(new Date().setHours(hour, 0), "h:mm a")}
                </div>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(hour, e)}
                  className={cn(
                    "min-h-[80px] space-y-2 rounded-lg p-1 transition-smooth",
                    isDropTarget && "ring-1 ring-primary/30 bg-muted/20"
                  )}
                >
                  {hourEvents.length > 0 ? (
                    hourEvents.map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "p-3 rounded-lg border-l-4 transition-smooth hover:shadow-glow cursor-grab active:cursor-grabbing",
                          getEventColor(event.type)
                        )}
                      >
                        <div className="font-semibold flex items-center gap-2">
                          {(event.recurrencePattern || event.isRecurringInstance) && (
                            <Repeat className="h-4 w-4 flex-shrink-0" />
                          )}
                          {event.title}
                        </div>
                        {event.startTime && event.endTime && (
                          <div className="text-sm opacity-80 mt-1">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-sm mt-2 opacity-90">
                            {event.description}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm mt-1 opacity-80">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-[80px] border border-dashed border-border/30 rounded-lg hover:bg-muted/30 transition-smooth" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
