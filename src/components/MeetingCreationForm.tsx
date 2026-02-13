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
import { CalendarIcon, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { CategoryDropdown } from "./CategoryDropdown";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { useCategoriesTags } from "@/contexts/CategoriesTagsContext";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { ReminderSelector } from "./ReminderSelector";
import { FileAttachments } from "./FileAttachments";

interface MeetingCreationFormProps {
  onSave: (event: Event) => void;
  onCancel: () => void;
  initialEvent?: Event;
  onDelete?: () => void;
}

export const MeetingCreationForm = ({ onSave, onCancel, initialEvent, onDelete }: MeetingCreationFormProps) => {
  const { categories, setCategories, tags: availableTags, setTags: setAvailableTags } = useCategoriesTags();
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [date, setDate] = useState<Date>(initialEvent?.date ? new Date(initialEvent.date) : new Date());
  const [startTime, setStartTime] = useState(initialEvent?.startTime || "");
  const [endTime, setEndTime] = useState(initialEvent?.endTime || "");
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [category, setCategory] = useState(initialEvent?.category || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialEvent?.tags || []);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | undefined>(initialEvent?.recurrencePattern);
  const [reminders, setReminders] = useState<string[]>(initialEvent?.reminders || ["15 minutes before"]);
  const [attachments, setAttachments] = useState<string[]>(initialEvent?.attachments || []);
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newEvent: Event = {
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      description,
      type: "meeting",
      date,
      startTime,
      endTime,
      location,
      category,
      tags: selectedTags,
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
      "Schedule 30 min before your next meeting for preparation",
      "Consider booking a conference room for in-person meetings",
      "Send calendar invites at least 24 hours in advance",
      "Add video call link if meeting remotely"
    ];
    setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    setIsSuggestionLoading(false);
  };

  return (
    <div className="space-y-6 py-4 relative">
      {(isLoading || isDeleting) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <SparkLoader size="lg" text={isDeleting ? "Deleting meeting..." : "Saving meeting..."} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Meeting Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter meeting title..."
          className="bg-muted border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add meeting description..."
          className="bg-muted border-border min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <CategoryDropdown
            value={category}
            onChange={setCategory}
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-muted border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-muted border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Conference Room A, Video Call..."
            className="bg-muted border-border pl-10"
          />
        </div>
      </div>

      <TagsMultiSelect
        selectedTags={selectedTags}
        onChange={setSelectedTags}
        tags={availableTags}
        onTagsChange={setAvailableTags}
      />

      <RecurrenceSelector value={recurrencePattern} onChange={setRecurrencePattern} />

      <ReminderSelector reminders={reminders} onChange={setReminders} />

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
            Delete Meeting
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
          {initialEvent ? "Save Changes" : "Create Meeting"}
        </Button>
      </div>
    </div>
  );
};
