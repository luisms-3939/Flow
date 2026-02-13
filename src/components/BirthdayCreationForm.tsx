import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Cake, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, RecurrencePattern } from "@/types/event";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { ReminderSelector } from "./ReminderSelector";

interface BirthdayCreationFormProps {
  onSave: (event: Event) => void;
  onCancel: () => void;
  initialEvent?: Event;
  onDelete?: () => void;
}

export const BirthdayCreationForm = ({
  onSave,
  onCancel,
  initialEvent,
  onDelete,
}: BirthdayCreationFormProps) => {
  const [name, setName] = useState(initialEvent?.title || "");
  const [date, setDate] = useState<Date>(
    initialEvent?.date ? new Date(initialEvent.date) : new Date()
  );
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | undefined>(
    initialEvent?.recurrencePattern || { type: "yearly", interval: 1 }
  );
  const [reminders, setReminders] = useState<string[]>(
    initialEvent?.reminders || ["1 day before"]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event: Event = {
      id: initialEvent?.id || crypto.randomUUID(),
      title: name,
      type: "birthday",
      date: date,
      recurrencePattern,
      reminders,
      tags: initialEvent?.tags || [],
      completed: initialEvent?.completed || false,
      status: initialEvent?.status || "todo",
    };

    onSave(event);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-event-birthday" />
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter birthday name (e.g., John's Birthday)"
          className="bg-muted border-border"
          required
        />
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-muted border-border",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Recurrence Selector */}
      <RecurrenceSelector
        value={recurrencePattern}
        onChange={setRecurrencePattern}
      />

      {/* Reminder Selector */}
      <ReminderSelector
        reminders={reminders}
        onChange={setReminders}
      />

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-event-birthday hover:bg-event-birthday/90"
            disabled={!name.trim()}
          >
            {initialEvent ? "Update Birthday" : "Create Birthday"}
          </Button>
        </div>
      </div>
    </form>
  );
};
