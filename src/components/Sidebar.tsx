import { useState, useRef, useEffect } from "react";
import { Event } from "@/types/event";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { TooltipProvider } from "./ui/tooltip";
import { SidebarSection } from "./SidebarSection";
import { SidebarSectionId, SidebarSectionsVisible } from "@/hooks/useCloudSettings";
import { useSidebarDrag } from "@/hooks/useSidebarDrag";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface SidebarProps {
  events: Event[];
  onDateSelect: (date: Date) => void;
  onTodayEventsClick: () => void;
  onNextMeetingClick: () => void;
  onStartFocusSession: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  sectionsOrder: SidebarSectionId[];
  sectionsVisible: SidebarSectionsVisible;
  sidebarWidth: number;
  onSectionsOrderChange: (order: SidebarSectionId[]) => void;
  onSectionVisibilityChange: (sectionId: SidebarSectionId, visible: boolean) => void;
  onWidthChange: (width: number) => void;
  todayFocusMinutes: number;
  currentStreak: number;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 64;

export const Sidebar = ({
  events,
  onDateSelect,
  onTodayEventsClick,
  onNextMeetingClick,
  onStartFocusSession,
  isCollapsed,
  onToggle,
  sectionsOrder,
  sectionsVisible,
  sidebarWidth,
  onSectionsOrderChange,
  onSectionVisibilityChange,
  onWidthChange,
  todayFocusMinutes,
  currentStreak,
}: SidebarProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  
  // Provide defaults in case settings haven't loaded yet
  const safeSectionsOrder = sectionsOrder ?? ["today", "overdue", "meetings", "focus"];
  const safeSectionsVisible = sectionsVisible ?? { today: true, overdue: true, meetings: true, focus: true };
  const safeSidebarWidth = sidebarWidth ?? 320;
  
  const {
    draggedSection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragLeave,
  } = useSidebarDrag(safeSectionsOrder, onSectionsOrderChange);

  // Handle resize
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const toggleSectionVisibility = (sectionId: SidebarSectionId) => {
    onSectionVisibilityChange(sectionId, !safeSectionsVisible[sectionId]);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        ref={sidebarRef}
        style={{ width: isCollapsed ? COLLAPSED_WIDTH : safeSidebarWidth }}
        className={cn(
          "bg-sidebar border-r border-sidebar-border p-4 space-y-4 overflow-auto transition-all duration-300 flex flex-col relative",
          isResizing && "select-none"
        )}
      >
        {/* Header with logo and toggle */}
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow shrink-0">
              <img src={logo} alt="Synapflow Logo" className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-lg">Synapflow</h2>
                <p className="text-xs text-muted-foreground">Quick access</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Widget Visibility</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="today-visible" className="text-sm">Today's Events</Label>
                        <Switch
                          id="today-visible"
                          checked={safeSectionsVisible.today}
                          onCheckedChange={() => toggleSectionVisibility("today")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="overdue-visible" className="text-sm">Overdue Items</Label>
                        <Switch
                          id="overdue-visible"
                          checked={safeSectionsVisible.overdue}
                          onCheckedChange={() => toggleSectionVisibility("overdue")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="meetings-visible" className="text-sm">Next Meetings</Label>
                        <Switch
                          id="meetings-visible"
                          checked={safeSectionsVisible.meetings}
                          onCheckedChange={() => toggleSectionVisibility("meetings")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="focus-visible" className="text-sm">Focus Stats</Label>
                        <Switch
                          id="focus-visible"
                          checked={safeSectionsVisible.focus}
                          onCheckedChange={() => toggleSectionVisibility("focus")}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Drag sections to reorder. Drag edge to resize.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapsed toggle button */}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 mx-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Sections */}
        <div className="space-y-3 flex-1">
          {safeSectionsOrder.map((sectionId) => (
            <div
              key={sectionId}
              draggable={!isCollapsed}
              onDragStart={() => handleDragStart(sectionId)}
              onDragOver={(e) => handleDragOver(e, sectionId)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className="group"
            >
              <SidebarSection
                sectionId={sectionId}
                events={events}
                isCollapsed={isCollapsed}
                isVisible={safeSectionsVisible[sectionId]}
                isDragging={draggedSection === sectionId}
                onToggleVisibility={() => toggleSectionVisibility(sectionId)}
                onTodayEventsClick={onTodayEventsClick}
                onNextMeetingClick={onNextMeetingClick}
                onStartFocusSession={onStartFocusSession}
                onDateSelect={onDateSelect}
                todayFocusMinutes={todayFocusMinutes}
                currentStreak={currentStreak}
                dragHandleProps={
                  !isCollapsed
                    ? {
                        onMouseDown: (e) => e.stopPropagation(),
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {/* Resize handle */}
        {!isCollapsed && (
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors",
              isResizing && "bg-primary"
            )}
            onMouseDown={startResizing}
          />
        )}
      </aside>
    </TooltipProvider>
  );
};
