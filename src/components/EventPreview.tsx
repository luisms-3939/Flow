import { Event, ViewMode, EventType } from "@/types/event";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { format, isSameDay } from "date-fns";
import { CheckCircle2, FileText, Users, Filter, Cake, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SparkMascot } from "./SparkMascot";

interface EventPreviewProps {
  events: Event[];
  selectedDate: Date;
  viewMode: ViewMode;
  filterType: EventType | "all";
  onFilterChange: (type: EventType | "all") => void;
  onEventClick: (event: Event) => void;
}

export const EventPreview = ({
  events,
  selectedDate,
  filterType,
  onFilterChange,
  onEventClick,
}: EventPreviewProps) => {
  const todayEvents = events.filter((event) =>
    isSameDay(new Date(event.date), selectedDate)
  );

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "task":
        return <CheckCircle2 className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "birthday":
        return <Cake className="h-4 w-4" />;
      case "work":
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getEventColorClass = (type: EventType) => {
    switch (type) {
      case "task":
        return "border-l-event-task bg-event-task/10";
      case "note":
        return "border-l-event-note bg-event-note/10";
      case "meeting":
        return "border-l-event-meeting bg-event-meeting/10";
      case "birthday":
        return "border-l-event-birthday bg-event-birthday/10";
      case "work":
        return "border-l-event-work bg-event-work/10";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-border/50 shadow-elegant h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {filterType === "all" ? "All" : filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onFilterChange("all")}>
              All Events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("task")}>
              Tasks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("note")}>
              Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("meeting")}>
              Meetings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("birthday")}>
              Birthdays
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("work")}>
              Work
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 flex-1 overflow-auto">
        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
            <SparkMascot mood="tired" size="xl" />
            <p className="text-sm">No events scheduled for this day</p>
            <p className="text-xs">Add some tasks to keep Spark busy!</p>
          </div>
        ) : (
          todayEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn(
                "p-4 rounded-lg border-l-4 transition-smooth hover:shadow-glow cursor-pointer hover:scale-[1.02]",
                getEventColorClass(event.type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getEventIcon(event.type)}</div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {event.startTime && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </span>
                    )}
                    {event.category && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {event.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
