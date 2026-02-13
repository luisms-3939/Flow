import { Event } from "@/types/event";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, AlertCircle, GripVertical, Eye, EyeOff } from "lucide-react";
import { format, isToday, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { SidebarSectionId } from "@/hooks/useCloudSettings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { FocusStatsSection } from "./sidebar/FocusStatsSection";

interface SidebarSectionProps {
  sectionId: SidebarSectionId;
  events: Event[];
  isCollapsed: boolean;
  isVisible: boolean;
  isDragging?: boolean;
  onToggleVisibility: () => void;
  onTodayEventsClick: () => void;
  onNextMeetingClick: () => void;
  onStartFocusSession: () => void;
  onDateSelect: (date: Date) => void;
  todayFocusMinutes: number;
  currentStreak: number;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const SidebarSection = ({
  sectionId,
  events,
  isCollapsed,
  isVisible,
  isDragging,
  onToggleVisibility,
  onTodayEventsClick,
  onNextMeetingClick,
  onStartFocusSession,
  onDateSelect,
  todayFocusMinutes,
  currentStreak,
  dragHandleProps,
}: SidebarSectionProps) => {
  const todayEvents = events.filter((event) => isToday(new Date(event.date)));
  const overdueEvents = events.filter((event) =>
    isBefore(new Date(event.date), startOfToday())
  );
  const upcomingMeetings = events
    .filter((event) => event.type === "meeting")
    .slice(0, 3);

  if (!isVisible) {
    if (isCollapsed) return null;
    
    // Show hidden section indicator when expanded
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-muted-foreground opacity-50">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 h-8"
          onClick={onToggleVisibility}
        >
          <EyeOff className="h-3 w-3" />
          <span className="text-xs capitalize">{sectionId} (hidden)</span>
        </Button>
      </div>
    );
  }

  const renderSection = () => {
    switch (sectionId) {
      case "today":
        return renderTodaySection();
      case "overdue":
        return renderOverdueSection();
      case "meetings":
        return renderMeetingsSection();
      case "focus":
        return (
          <FocusStatsSection
            isCollapsed={isCollapsed}
            isVisible={isVisible}
            isDragging={isDragging}
            onToggleVisibility={onToggleVisibility}
            onStartFocusSession={onStartFocusSession}
            todayMinutes={todayFocusMinutes}
            currentStreak={currentStreak}
            dragHandleProps={dragHandleProps}
          />
        );
    }
  };

  const renderTodaySection = () => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mx-auto bg-sidebar-accent"
              onClick={onTodayEventsClick}
            >
              <Calendar className="h-4 w-4 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Today's Events ({todayEvents.length})</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Card className={cn(
        "p-4 bg-sidebar-accent border-sidebar-border transition-all",
        isDragging && "opacity-50"
      )}>
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-3 hover:bg-sidebar-accent p-0"
            onClick={onTodayEventsClick}
          >
            <Calendar className="h-4 w-4 text-primary" />
            <div className="text-left">
              <div className="text-sm font-medium">Today's Events</div>
              <div className="text-xs text-muted-foreground">
                {todayEvents.length} scheduled
              </div>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onToggleVisibility}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderOverdueSection = () => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 mx-auto bg-sidebar-accent",
                overdueEvents.length > 0 && "text-destructive"
              )}
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              {overdueEvents.length === 0
                ? "All caught up!"
                : `${overdueEvents.length} overdue`}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Card className={cn(
        "p-4 bg-sidebar-accent border-sidebar-border group transition-all",
        isDragging && "opacity-50"
      )}>
        <div className="flex items-center gap-2 mb-3">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <AlertCircle className="h-4 w-4 text-destructive" />
          <h3 className="font-medium text-sm flex-1">Overdue Items</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onToggleVisibility}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
        {overdueEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">All caught up!</p>
        ) : (
          <div className="space-y-2">
            {overdueEvents.map((event) => (
              <div
                key={event.id}
                className="text-sm p-2 rounded bg-destructive/10 border-l-2 border-destructive"
              >
                {event.title}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const renderMeetingsSection = () => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mx-auto bg-sidebar-accent"
              onClick={onNextMeetingClick}
            >
              <Clock className="h-4 w-4 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              {upcomingMeetings.length === 0
                ? "No upcoming meetings"
                : `${upcomingMeetings.length} upcoming meetings`}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Card className={cn(
        "p-4 bg-sidebar-accent border-sidebar-border group transition-all",
        isDragging && "opacity-50"
      )}>
        <div className="flex items-center gap-2 mb-3">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm flex-1">Next Meetings</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onToggleVisibility}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
        {upcomingMeetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No upcoming meetings</p>
        ) : (
          <>
            <Button
              onClick={onNextMeetingClick}
              variant="outline"
              size="sm"
              className="w-full mb-3"
            >
              View Next Meeting
            </Button>
            <div className="space-y-2">
              {upcomingMeetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => onDateSelect(new Date(meeting.date))}
                  className={cn(
                    "w-full text-left p-2 rounded transition-smooth",
                    "hover:bg-sidebar-accent hover:shadow-glow"
                  )}
                >
                  <div className="text-sm font-medium">{meeting.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(meeting.date), "MMM d")}
                    {meeting.startTime && ` • ${meeting.startTime}`}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
    );
  };

  return renderSection();
};
