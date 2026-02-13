import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Download, Upload, Calendar, FileDown, FileUp, Check, AlertCircle, Loader2 } from "lucide-react";
import { Event } from "@/types/event";
import { downloadICalFile, parseICalToEvents } from "@/utils/icalUtils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";

interface CalendarImportExportProps {
  events: Event[];
  onImport: (events: Partial<Event>[]) => Promise<void>;
}

export const CalendarImportExport = ({
  events,
  onImport,
}: CalendarImportExportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedEvents, setImportedEvents] = useState<Partial<Event>[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const handleExportAll = () => {
    if (events.length === 0) {
      toast({
        title: "No events to export",
        description: "Create some events first before exporting.",
        variant: "destructive",
      });
      return;
    }

    downloadICalFile(events);
    toast({
      title: "Export successful",
      description: `Exported ${events.length} events to iCal file.`,
    });
  };

  const handleExportSelected = (filter: "all" | "tasks" | "meetings" | "notes") => {
    let filteredEvents = events;

    if (filter !== "all") {
      const typeMap: Record<string, Event["type"]> = {
        tasks: "task",
        meetings: "meeting",
        notes: "note",
      };
      filteredEvents = events.filter((e) => e.type === typeMap[filter]);
    }

    if (filteredEvents.length === 0) {
      toast({
        title: "No events to export",
        description: `No ${filter} found to export.`,
        variant: "destructive",
      });
      return;
    }

    downloadICalFile(filteredEvents, `synapflow-${filter}.ics`);
    toast({
      title: "Export successful",
      description: `Exported ${filteredEvents.length} ${filter} to iCal file.`,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseICalToEvents(content);

      if (parsed.length === 0) {
        toast({
          title: "No events found",
          description: "The file doesn't contain any valid calendar events.",
          variant: "destructive",
        });
        return;
      }

      setImportedEvents(parsed);
      setSelectedEvents(new Set(parsed.map((e) => e.id!)));
      setIsImportDialogOpen(true);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Could not parse the calendar file. Please check the format.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    const eventsToImport = importedEvents.filter((e) =>
      selectedEvents.has(e.id!)
    );

    if (eventsToImport.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      await onImport(eventsToImport);
      toast({
        title: "Import successful",
        description: `Imported ${eventsToImport.length} events.`,
      });
      setIsImportDialogOpen(false);
      setImportedEvents([]);
      setSelectedEvents(new Set());
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === importedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(importedEvents.map((e) => e.id!)));
    }
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case "task":
        return "bg-blue-500/20 text-blue-400";
      case "meeting":
        return "bg-purple-500/20 text-purple-400";
      case "note":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics,.ical,.ifb,.icalendar"
        onChange={handleFileSelect}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Import/Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-2" />
            Import from iCal (.ics)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportAll}>
            <FileDown className="h-4 w-4 mr-2" />
            Export All Events
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportSelected("tasks")}>
            <Download className="h-4 w-4 mr-2" />
            Export Tasks Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportSelected("meetings")}>
            <Download className="h-4 w-4 mr-2" />
            Export Meetings Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportSelected("notes")}>
            <Download className="h-4 w-4 mr-2" />
            Export Notes Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Calendar Events
            </DialogTitle>
            <DialogDescription>
              Select the events you want to import. Found {importedEvents.length}{" "}
              events in the file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="gap-2"
              >
                <Checkbox
                  checked={selectedEvents.size === importedEvents.length}
                />
                Select All
              </Button>
              <Badge variant="secondary">
                {selectedEvents.size} of {importedEvents.length} selected
              </Badge>
            </div>

            <ScrollArea className="h-[400px] rounded-md border border-border p-4">
              <div className="space-y-2">
                {importedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEvents.has(event.id!)
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/50 border border-transparent hover:bg-muted"
                    }`}
                    onClick={() => toggleEventSelection(event.id!)}
                  >
                    <Checkbox
                      checked={selectedEvents.has(event.id!)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {event.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={getEventTypeColor(event.type)}
                        >
                          {event.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.date instanceof Date
                          ? event.date.toLocaleDateString()
                          : new Date(event.date!).toLocaleDateString()}
                        {event.startTime && ` at ${event.startTime}`}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsImportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={selectedEvents.size === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Import {selectedEvents.size} Events
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
