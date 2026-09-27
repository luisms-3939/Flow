import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Event, ViewMode } from "@/types/event";
import { cn } from "@/lib/utils";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { usePersistedHolidays } from "@/hooks/usePersistedHolidays";

interface CalendarProps {
  viewMode: ViewMode;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: Event[];
  onDayClick: (date: Date, dayEvents: Event[]) => void;
  onEventReschedule?: (eventId: string, newDate: Date) => void;
}

export const Calendar = ({ viewMode, selectedDate, onDateSelect, events, onDayClick, onEventReschedule }: CalendarProps) => {
  const { draggedEvent, handleDragStart, handleDragEnd, handleDragOver } = useDragAndDrop();
  const { isHoliday } = usePersistedHolidays();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => onDateSelect(subMonths(selectedDate, 1));
  const handleNextMonth = () => onDateSelect(addMonths(selectedDate, 1));

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const getEventColor = (type: Event["type"]) => {
    switch (type) {
      case "task":
        return "bg-event-task";
      case "note":
        return "bg-event-note";
      case "meeting":
        return "bg-event-meeting";
      case "birthday":
        return "bg-event-birthday";
      default:
        return "bg-primary";
    }
  };

  const handleDrop = (day: Date, e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && onEventReschedule) {
      onEventReschedule(eventId, day);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50 shadow-elegant">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{format(selectedDate, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="hover:bg-muted transition-smooth"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="hover:bg-muted transition-smooth"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isDropTarget = draggedEvent && !isSameDay(new Date(draggedEvent.date), day);
          const holiday = isHoliday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => {
                const dayEvents = getEventsForDay(day);
                if (dayEvents.length > 0) {
                  onDayClick(day, dayEvents);
                } else {
                  onDateSelect(day);
                }
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(day, e)}
              className={cn(
                "min-h-[120px] p-2 rounded-lg border transition-smooth relative cursor-pointer",
                "hover:bg-muted hover:border-primary/50 hover:shadow-glow",
                isSelected && "bg-muted border-primary shadow-glow",
                !isSameMonth(day, selectedDate) && "opacity-40",
                isToday && "border-primary/50",
                isDropTarget && "ring-2 ring-primary/50 ring-dashed"
              )}
              title={holiday?.name}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday && "text-primary font-bold",
                holiday && "text-red-500 font-semibold"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "w-full px-1.5 py-0.5 rounded text-xs cursor-grab active:cursor-grabbing flex items-center gap-0.5 truncate text-white",
                      getEventColor(event.type)
                    )}
                    title={event.title}
                  >
                    {(event.recurrencePattern || event.isRecurringInstance) && (
                      <Repeat className="h-2 w-2 text-white/80 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
