import { Home, Calendar, Plus, Columns3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ViewMode } from "@/types/event";

interface MobileNavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddEvent: () => void;
  onSettingsClick: () => void;
}

export const MobileNavigation = ({
  currentView,
  onViewChange,
  onAddEvent,
  onSettingsClick,
}: MobileNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <NavButton
          icon={<Home className="h-5 w-5" />}
          label="Today"
          isActive={currentView === "daily"}
          onClick={() => onViewChange("daily")}
        />
        <NavButton
          icon={<Calendar className="h-5 w-5" />}
          label="Month"
          isActive={currentView === "monthly"}
          onClick={() => onViewChange("monthly")}
        />
        
        {/* Floating Add Button */}
        <div className="relative -mt-6">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={onAddEvent}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        
        <NavButton
          icon={<Columns3 className="h-5 w-5" />}
          label="Kanban"
          isActive={currentView === "kanban"}
          onClick={() => onViewChange("kanban")}
        />
        <NavButton
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          isActive={false}
          onClick={onSettingsClick}
        />
      </div>
    </nav>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton = ({ icon, label, isActive, onClick }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors",
      isActive
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
