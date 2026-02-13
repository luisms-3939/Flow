import { ViewMode } from "@/types/event";
import { Button } from "./ui/button";
import { Calendar, CalendarDays, CalendarRange, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle = ({ viewMode, onChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("monthly")}
        className={cn(
          "gap-2 transition-smooth",
          viewMode === "monthly" && "bg-primary text-primary-foreground shadow-glow"
        )}
      >
        <Calendar className="h-4 w-4" />
        Month
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("weekly")}
        className={cn(
          "gap-2 transition-smooth",
          viewMode === "weekly" && "bg-primary text-primary-foreground shadow-glow"
        )}
      >
        <CalendarRange className="h-4 w-4" />
        Week
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("daily")}
        className={cn(
          "gap-2 transition-smooth",
          viewMode === "daily" && "bg-primary text-primary-foreground shadow-glow"
        )}
      >
        <CalendarDays className="h-4 w-4" />
        Day
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("kanban")}
        className={cn(
          "gap-2 transition-smooth",
          viewMode === "kanban" && "bg-primary text-primary-foreground shadow-glow"
        )}
      >
        <Columns3 className="h-4 w-4" />
        Kanban
      </Button>
    </div>
  );
};
