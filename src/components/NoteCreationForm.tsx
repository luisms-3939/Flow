import { useState } from "react";
import { Event } from "@/types/event";
import { Button } from "./ui/button";
import { SparkLoader } from "./SparkLoader";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Sparkles, CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { CategoryDropdown } from "./CategoryDropdown";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { useCategoriesTags } from "@/contexts/CategoriesTagsContext";
import { FileAttachments } from "./FileAttachments";

interface NoteCreationFormProps {
  onSave: (event: Event) => void;
  onCancel: () => void;
  initialEvent?: Event;
  onDelete?: () => void;
}

export const NoteCreationForm = ({ onSave, onCancel, initialEvent, onDelete }: NoteCreationFormProps) => {
  const { categories, setCategories, tags: availableTags, setTags: setAvailableTags } = useCategoriesTags();
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [richContent, setRichContent] = useState(initialEvent?.richContent || "");
  const [category, setCategory] = useState(initialEvent?.category || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialEvent?.tags || []);
  const [attachments, setAttachments] = useState<string[]>(initialEvent?.attachments || []);
  const [suggestion, setSuggestion] = useState("");
  const [date, setDate] = useState<Date>(initialEvent?.date ? new Date(initialEvent.date) : new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newEvent: Event = {
      id: initialEvent?.id || crypto.randomUUID(),
      title,
      richContent,
      type: "note",
      date: date,
      category,
      tags: selectedTags,
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
      "Add relevant tags for easier search later",
      "Consider adding #important tag for priority items",
      "Link related notes with common tags",
      "Use bullet points for better organization"
    ];
    setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    setIsSuggestionLoading(false);
  };

  return (
    <div className="space-y-6 py-4 relative">
      {(isLoading || isDeleting) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <SparkLoader size="lg" text={isDeleting ? "Deleting note..." : "Saving note..."} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Note Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          className="bg-muted border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={richContent}
          onChange={(e) => setRichContent(e.target.value)}
          placeholder="Write your note here... (supports rich text formatting)"
          className="bg-muted border-border min-h-[200px]"
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

      <CategoryDropdown
        value={category}
        onChange={setCategory}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      <TagsMultiSelect
        selectedTags={selectedTags}
        onChange={setSelectedTags}
        tags={availableTags}
        onTagsChange={setAvailableTags}
      />

      <div className="space-y-2">
        <Label>File Attachments</Label>
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
            Delete Note
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
          {initialEvent ? "Save Changes" : "Create Note"}
        </Button>
      </div>
    </div>
  );
};

