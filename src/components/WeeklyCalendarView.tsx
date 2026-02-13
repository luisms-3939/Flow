import { Event } from "@/types/event";
import { format, startOfWeek, addDays, isSameDay, setHours, setMinutes } from "date-fns";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { usePersistedHolidays } from "@/hooks/usePersistedHolidays";
import { Repeat } from "lucide-react";

interface WeeklyCalendarViewProps {
  selectedDate: Date;
  events: Event[];
  onEventReschedule?: (eventId: string, newDate: Date, newTime?: string) => void;
}

export const WeeklyCalendarView = ({ selectedDate, events, onEventReschedule }: WeeklyCalendarViewProps) => {
  const { draggedEvent, handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();
  const { isHoliday } = usePersistedHolidays();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      if (!isSameDay(new Date(event.date), day)) return false;
      if (!event.startTime) return false;
      const eventHour = parseInt(event.startTime.split(":")[0]);
      return eventHour === hour;
    });
  };

  const getEventColor = (type: Event["type"]) => {
    switch (type) {
      case "task":
        return "bg-event-task border-event-task";
      case "note":
        return "bg-event-note border-event-note";
      case "meeting":
        return "bg-event-meeting border-event-meeting";
      case "birthday":
        return "bg-event-birthday border-event-birthday";
      default:
        return "bg-primary border-primary";
    }
  };

  const handleDrop = (day: Date, hour: number, e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && onEventReschedule) {
      const newTime = `${hour.toString().padStart(2, "0")}:00`;
      onEventReschedule(eventId, day, newTime);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
      <h2 className="text-xl font-semibold mb-4">
        Week of {format(weekStart, "MMM d, yyyy")}
      </h2>
      
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-8 gap-2">
          {/* Time column header */}
          <div className="sticky top-0 bg-card z-10 pb-2">
            <div className="text-sm font-medium text-muted-foreground">Time</div>
          </div>
          
          {/* Day headers */}
          {days.map((day) => {
            const holiday = isHoliday(day);
            return (
              <div key={day.toISOString()} className="sticky top-0 bg-card z-10 pb-2" title={holiday?.name}>
                <div className="text-center">
                  <div className="text-sm font-medium">{format(day, "EEE")}</div>
                  <div className={cn(
                    "text-xs text-muted-foreground mt-1",
                    isSameDay(day, new Date()) && "text-primary font-bold",
                    holiday && "text-red-500 font-semibold"
                  )}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Time slots */}
          {hours.map((hour) => (
            <>
              <div key={`time-${hour}`} className="text-sm text-muted-foreground py-2 pr-2 text-right border-t border-border">
                {format(new Date().setHours(hour, 0), "h:mm a")}
              </div>
              
              {days.map((day) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                const isDropTarget = draggedEvent !== null;
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(day, hour, e)}
                    className={cn(
                      "min-h-[60px] border border-border/50 rounded-md p-1 hover:bg-muted/50 transition-smooth",
                      isDropTarget && "ring-1 ring-primary/30"
                    )}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "text-xs p-2 rounded border-l-2 mb-1 cursor-grab active:cursor-grabbing",
                          getEventColor(event.type)
                        )}
                      >
                        <div className="font-medium truncate flex items-center gap-1">
                          {(event.recurrencePattern || event.isRecurringInstance) && (
                            <Repeat className="h-3 w-3 flex-shrink-0" />
                          )}
                          {event.title}
                        </div>
                        {event.startTime && event.endTime && (
                          <div className="text-xs opacity-80">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
