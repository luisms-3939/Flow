import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Plus, CheckCircle2, FileText, Users, Cake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EventModal } from "./EventModal";
import { Event, EventType } from "@/types/event";

interface AddEventButtonProps {
  onAddEvent: (event: Event) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddEventButton = ({ onAddEvent, isOpen: externalIsOpen, onOpenChange }: AddEventButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType>("task");

  // Handle external open trigger
  useEffect(() => {
    if (externalIsOpen) {
      setIsDropdownOpen(true);
      onOpenChange?.(false);
    }
  }, [externalIsOpen, onOpenChange]);

  const handleSelect = (type: EventType) => {
    setSelectedType(type);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary-glow shadow-glow hover:shadow-glow hover:scale-105 transition-smooth">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border">
          <DropdownMenuItem onClick={() => handleSelect("task")} className="gap-2">
            <CheckCircle2 className="h-4 w-4 text-event-task" />
            New Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("note")} className="gap-2">
            <FileText className="h-4 w-4 text-event-note" />
            New Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("meeting")} className="gap-2">
            <Users className="h-4 w-4 text-event-meeting" />
            New Meeting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("birthday")} className="gap-2">
            <Cake className="h-4 w-4 text-event-birthday" />
            New Birthday
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddEvent}
        eventType={selectedType}
      />
    </>
  );
};
