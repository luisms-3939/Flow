import { useState } from "react";
import { Event, RecurrencePattern } from "@/types/event";
import { Button } from "./ui/button";
import { SparkLoader } from "./SparkLoader";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDropdown } from "./CategoryDropdown";
import { useCategoriesTags } from "@/contexts/CategoriesTagsContext";

interface WorkCreationFormProps {
  onSave: (event: Event) => void;
  onCancel: () => void;
  initialEvent?: Event;
  onDelete?: () => void;
}

export const WorkCreationForm = ({ onSave, onCancel, initialEvent, onDelete }: WorkCreationFormProps) => {
  const { categories, setCategories } = useCategoriesTags();
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [date, setDate] = useState<Date>(initialEvent?.date ? new Date(initialEvent.date) : new Date());
  const [startTime, setStartTime] = useState(initialEvent?.startTime || "");
  const [endTime, setEndTime] = useState(initialEvent?.endTime || "");
  const [category, setCategory] = useState(initialEvent?.category || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newEvent: Event = {
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      description,
      type: "work",
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      category,
      tags: [],
      reminders: [],
      subtasks: [],
      completed: false,
      attachments: [],
    };
    onSave(newEvent);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onDelete();
  };

  return (
    <div className="space-y-6 py-4 relative">
      {(isLoading || isDeleting) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <SparkLoader size="lg" text={isDeleting ? "Deleting..." : "Saving..."} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Work day, Morning shift..."
          className="bg-muted border-border"
        />
      </div>

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
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-muted border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-muted border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any notes about this work day..."
          className="bg-muted border-border min-h-[100px]"
        />
      </div>

      <CategoryDropdown
        value={category}
        onChange={setCategory}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {initialEvent && onDelete && (
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="mr-auto">
            Delete
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!title}
          className="bg-gradient-to-r from-primary to-primary-glow shadow-glow"
        >
          {initialEvent ? "Save Changes" : "Create Work Day"}
        </Button>
      </div>
    </div>
  );
};
