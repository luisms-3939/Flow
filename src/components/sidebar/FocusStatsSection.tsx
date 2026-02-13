import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, GripVertical, Eye, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FocusStatsSectionProps {
  isCollapsed: boolean;
  isVisible: boolean;
  isDragging?: boolean;
  onToggleVisibility: () => void;
  onStartFocusSession: () => void;
  todayMinutes: number;
  currentStreak: number;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const FocusStatsSection = ({
  isCollapsed,
  isVisible,
  isDragging,
  onToggleVisibility,
  onStartFocusSession,
  todayMinutes,
  currentStreak,
  dragHandleProps,
}: FocusStatsSectionProps) => {
  if (!isVisible) {
    if (isCollapsed) return null;

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
          <Target className="h-3 w-3" />
          <span className="text-xs">Focus (hidden)</span>
        </Button>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 mx-auto bg-sidebar-accent"
            onClick={onStartFocusSession}
          >
            <Target className="h-4 w-4 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Today: {todayMinutes}m • Streak: {currentStreak} days</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card
      className={cn(
        "p-4 bg-sidebar-accent border-sidebar-border group transition-all",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <Target className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm flex-1">Focus Stats</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onToggleVisibility}
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Today</span>
          </div>
          <span className="font-medium">{todayMinutes}m focused</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>Streak</span>
          </div>
          <span className="font-medium">{currentStreak} day{currentStreak !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <Button
        onClick={onStartFocusSession}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Target className="h-4 w-4 mr-2" />
        Start Focus Session
      </Button>
    </Card>
  );
};
