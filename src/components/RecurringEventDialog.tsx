import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Calendar, Repeat } from "lucide-react";
import { format } from "date-fns";

interface RecurringEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "edit" | "delete";
  eventDate: Date;
  onThisOccurrence: () => void;
  onAllOccurrences: () => void;
}

export const RecurringEventDialog = ({
  isOpen,
  onClose,
  action,
  eventDate,
  onThisOccurrence,
  onAllOccurrences,
}: RecurringEventDialogProps) => {
  const isEdit = action === "edit";
  const title = isEdit ? "Edit Recurring Event" : "Delete Recurring Event";
  const description = "This is a recurring event. What would you like to do?";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Repeat className="h-5 w-5 text-primary" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <button
            onClick={onThisOccurrence}
            className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-medium text-foreground">This occurrence only</p>
                <p className="text-sm text-muted-foreground">
                  Only {isEdit ? "edit" : "delete"} the event on {format(eventDate, "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onAllOccurrences}
            className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <Repeat className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-medium text-foreground">All occurrences</p>
                <p className="text-sm text-muted-foreground">
                  {isEdit ? "Edit all events in the series" : "Delete all events in the series"}
                </p>
              </div>
            </div>
          </button>
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
