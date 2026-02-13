import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Bell, Plus, X } from "lucide-react";
import { useState } from "react";

interface ReminderSelectorProps {
  reminders: string[];
  onChange: (reminders: string[]) => void;
}

const REMINDER_OPTIONS = [
  { value: "5 minutes before", label: "5 minutes before" },
  { value: "15 minutes before", label: "15 minutes before" },
  { value: "30 minutes before", label: "30 minutes before" },
  { value: "1 hour before", label: "1 hour before" },
  { value: "2 hours before", label: "2 hours before" },
  { value: "1 day before", label: "1 day before" },
];

export const ReminderSelector = ({ reminders, onChange }: ReminderSelectorProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (value: string) => {
    if (!reminders.includes(value)) {
      onChange([...reminders, value]);
    }
    setIsAdding(false);
  };

  const handleRemove = (reminder: string) => {
    onChange(reminders.filter((r) => r !== reminder));
  };

  const availableOptions = REMINDER_OPTIONS.filter(
    (opt) => !reminders.includes(opt.value)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Bell className="h-4 w-4" />
        Reminders
      </div>

      <div className="flex flex-wrap gap-2">
        {reminders.map((reminder) => (
          <Badge
            key={reminder}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {reminder}
            <button
              type="button"
              onClick={() => handleRemove(reminder)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {isAdding ? (
          <Select onValueChange={handleAdd}>
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="Select reminder..." />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          availableOptions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-3 w-3" />
              Add reminder
            </Button>
          )
        )}
      </div>

      {reminders.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground">
          No reminders set. Add one to get notified before the event.
        </p>
      )}
    </div>
  );
};
