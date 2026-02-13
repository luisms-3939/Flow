import { useState } from "react";
import { Event } from "@/types/event";

export const useDragAndDrop = () => {
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);

  const handleDragStart = (event: Event, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEvent(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return {
    draggedEvent,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  };
};
