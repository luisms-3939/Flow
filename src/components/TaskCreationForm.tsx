import { useState } from "react";
import { Event, Priority, Subtask, RecurrencePattern } from "@/types/event";
import { Button } from "./ui/button";
import { SparkLoader } from "./SparkLoader";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { CategoryDropdown } from "./CategoryDropdown";
import { useCategoriesTags } from "@/contexts/CategoriesTagsContext";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { ReminderSelector } from "./ReminderSelector";
import { FileAttachments } from "./FileAttachments";

interface TaskCreationFormProps {
  onSave: (event: Event) => void;
  onCancel: () => void;
  initialEvent?: Event;
  onDelete?: () => void;
}

export const TaskCreationForm = ({ onSave, onCancel, initialEvent, onDelete }: TaskCreationFormProps) => {
  const { categories, setCategories } = useCategoriesTags();
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [date, setDate] = useState<Date>(initialEvent?.date ? new Date(initialEvent.date) : new Date());
  const [priority, setPriority] = useState<Priority>(initialEvent?.priority || "medium");
  const [category, setCategory] = useState(initialEvent?.category || "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialEvent?.subtasks || []);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | undefined>(initialEvent?.recurrencePattern);
  const [reminders, setReminders] = useState<string[]>(initialEvent?.reminders || []);
  const [attachments, setAttachments] = useState<string[]>(initialEvent?.attachments || []);
  const [startTime, setStartTime] = useState(initialEvent?.startTime || "");
  const [endTime, setEndTime] = useState(initialEvent?.endTime || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSubtask, completed: false }]);
      setNewSubtask("");
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newEvent: Event = {
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      description,
      type: "task",
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      priority,
      category,
      subtasks,
      recurrencePattern,
      reminders,
      attachments,
    };
    onSave(newEvent);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onDelete();
  };

  const generateSmartSuggestion = async () => {
    setIsSuggestionLoading(true);
    setSuggestion("");
    await new Promise(resolve => setTimeout(resolve, 1000));
    const suggestions = [
      "Consider setting priority to high for urgent items",
      "Add a morning time slot for better productivity",
      "Break down into smaller subtasks for easier tracking",
      "Set a reminder 1 day before the due date"
    ];
    setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    setIsSuggestionLoading(false);
  };

  return (
    <div className="space-y-6 py-4 relative">
      {(isLoading || isDeleting) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <SparkLoader size="lg" text={isDeleting ? "Deleting task..." : "Saving task..."} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          className="bg-muted border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add task details..."
          className="bg-muted border-border min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
            <SelectTrigger className="bg-muted border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Low
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
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

      <RecurrenceSelector value={recurrencePattern} onChange={setRecurrencePattern} />

      <ReminderSelector reminders={reminders} onChange={setReminders} />

      <CategoryDropdown
        value={category}
        onChange={setCategory}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      <div className="space-y-2">
        <Label>Subtasks</Label>
        <div className="flex gap-2">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
            placeholder="Add a subtask..."
            className="bg-muted border-border"
          />
          <Button onClick={handleAddSubtask} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 mt-3">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Checkbox checked={subtask.completed} />
              <span className="flex-1">{subtask.title}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSubtask(subtask.id)}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <FileAttachments attachments={attachments} onChange={setAttachments} />
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={generateSmartSuggestion}
          disabled={isSuggestionLoading}
          className="w-full gap-2 bg-muted border-border"
        >
          {isSuggestionLoading ? (
            <SparkLoader size="sm" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Get Smart Suggestion
            </>
          )}
        </Button>
        {suggestion && (
          <Badge variant="secondary" className="w-full justify-start p-3 text-sm">
            {suggestion}
          </Badge>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {initialEvent && onDelete && (
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="mr-auto">
            Delete Task
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
          {initialEvent ? "Save Changes" : "Create Task"}
        </Button>
      </div>
    </div>
  );
};

