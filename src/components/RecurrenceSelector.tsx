import { RecurrencePattern, RecurrenceType } from "@/types/event";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RecurrenceSelectorProps {
  value?: RecurrencePattern;
  onChange: (pattern: RecurrencePattern | undefined) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export const RecurrenceSelector = ({ value, onChange }: RecurrenceSelectorProps) => {
  const recurrenceType = value?.type || "none";
  const interval = value?.interval || 1;
  const daysOfWeek = value?.daysOfWeek || [];
  const endDate = value?.endDate ? new Date(value.endDate) : undefined;

  const handleTypeChange = (type: RecurrenceType) => {
    if (type === "none") {
      onChange(undefined);
    } else {
      onChange({
        type,
        interval: 1,
        daysOfWeek: type === "weekly" ? [new Date().getDay()] : undefined,
        endDate: value?.endDate,
      });
    }
  };

  const handleIntervalChange = (newInterval: number) => {
    if (!value) return;
    onChange({ ...value, interval: Math.max(1, newInterval) });
  };

  const handleDayToggle = (day: number) => {
    if (!value) return;
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    onChange({ ...value, daysOfWeek: newDays.length > 0 ? newDays : undefined });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (!value) return;
    onChange({ 
      ...value, 
      endDate: date ? format(date, "yyyy-MM-dd") : undefined 
    });
  };

  const getIntervalLabel = () => {
    switch (recurrenceType) {
      case "daily": return "day(s)";
      case "weekly": return "week(s)";
      case "monthly": return "month(s)";
      case "yearly": return "year(s)";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Repeat
        </Label>
        <Select value={recurrenceType} onValueChange={(v) => handleTypeChange(v as RecurrenceType)}>
          <SelectTrigger className="bg-muted border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {recurrenceType !== "none" && (
        <>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Every</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              className="w-20 bg-muted border-border"
            />
            <span className="text-muted-foreground">{getIntervalLabel()}</span>
          </div>

          {recurrenceType === "weekly" && (
            <div className="space-y-2">
              <Label>On days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer border transition-colors",
                      daysOfWeek.includes(day.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={daysOfWeek.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ends</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-muted border-border",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Never"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
                {endDate && (
                  <div className="p-2 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEndDateChange(undefined)}
                      className="w-full"
                    >
                      Clear end date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
};
