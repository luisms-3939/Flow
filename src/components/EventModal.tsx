import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Event, EventType } from "@/types/event";
import { TaskCreationForm } from "./TaskCreationForm";
import { NoteCreationForm } from "./NoteCreationForm";
import { MeetingCreationForm } from "./MeetingCreationForm";
import { BirthdayCreationForm } from "./BirthdayCreationForm";
import { WorkCreationForm } from "./WorkCreationForm";
import { Button } from "./ui/button";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  eventType: EventType;
  initialEvent?: Event;
}

export const EventModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  eventType,
  initialEvent,
}: EventModalProps) => {
  const handleSave = (event: Event) => {
    onSave(event);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = () => {
    if (initialEvent && onDelete) {
      if (confirm("Are you sure you want to delete this event? This action cannot be undone and will remove the event for all participants.")) {
        onDelete(initialEvent.id);
        onClose();
      }
    }
  };

  const renderForm = () => {
    switch (eventType) {
      case "task":
        return (
          <TaskCreationForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialEvent={initialEvent}
            onDelete={initialEvent ? handleDelete : undefined}
          />
        );
      case "note":
        return (
          <NoteCreationForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialEvent={initialEvent}
            onDelete={initialEvent ? handleDelete : undefined}
          />
        );
      case "meeting":
        return (
          <MeetingCreationForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialEvent={initialEvent}
            onDelete={initialEvent ? handleDelete : undefined}
          />
        );
      case "birthday":
        return (
          <BirthdayCreationForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialEvent={initialEvent}
            onDelete={initialEvent ? handleDelete : undefined}
          />
        );
        case "work":
          return (
            <WorkCreationForm
            onSave={handleSave}
            onCancel={handleCancel}
            initialEvent={initialEvent}
            onDelete={initialEvent ? handleDelete : undefined}
            />
          );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {initialEvent
              ? `Edit ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`
              : `Create New ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`}
          </DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
};
