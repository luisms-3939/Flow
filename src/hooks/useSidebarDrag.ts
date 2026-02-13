import { useState, useCallback } from "react";
import { SidebarSectionId } from "./useCloudSettings";

export const useSidebarDrag = (
  sectionsOrder: SidebarSectionId[],
  onOrderChange: (newOrder: SidebarSectionId[]) => void
) => {
  const [draggedSection, setDraggedSection] = useState<SidebarSectionId | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SidebarSectionId | null>(null);

  const handleDragStart = useCallback((sectionId: SidebarSectionId) => {
    setDraggedSection(sectionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sectionId: SidebarSectionId) => {
    e.preventDefault();
    if (draggedSection && draggedSection !== sectionId) {
      setDragOverSection(sectionId);
    }
  }, [draggedSection]);

  const handleDragEnd = useCallback(() => {
    if (draggedSection && dragOverSection && draggedSection !== dragOverSection) {
      const newOrder = [...sectionsOrder];
      const draggedIndex = newOrder.indexOf(draggedSection);
      const targetIndex = newOrder.indexOf(dragOverSection);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedSection);
      
      onOrderChange(newOrder);
    }
    
    setDraggedSection(null);
    setDragOverSection(null);
  }, [draggedSection, dragOverSection, sectionsOrder, onOrderChange]);

  const handleDragLeave = useCallback(() => {
    setDragOverSection(null);
  }, []);

  return {
    draggedSection,
    dragOverSection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragLeave,
  };
};
