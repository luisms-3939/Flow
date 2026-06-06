import { Settings, Timer, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { HolidayManagementDialog } from "./HolidayManagementDialog";
import { ViewMode } from "@/types/event";
import { CalendarImportExport } from "./CalendarImportExport";

interface SettingsPopoverProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  defaultView: ViewMode;
  onDefaultViewChange: (view: ViewMode) => void;
  fontSize: "small" | "medium" | "large";
  onFontSizeChange: (size: "small" | "medium" | "large") => void;
  displayDensity: "compact" | "spacious";
  onDisplayDensityChange: (density: "compact" | "spacious") => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: (enabled: boolean) => void;
  eventReminders: boolean;
  onEventRemindersToggle: (enabled: boolean) => void;
  dailySummary: boolean;
  onDailySummaryToggle: (enabled: boolean) => void;
  taskDeadlines: boolean;
  onTaskDeadlinesToggle: (enabled: boolean) => void;
  userEmail?: string;
  onLogout?: () => void;
  onImportExport?: () => void;
  onFocusTimerClick?: () => void;
  onAnalyticsClick?: () => void;
  events?: any[];
  onImport?: (events: any[]) => void;
}

export const SettingsPopover = ({
  theme,
  onThemeChange,
  defaultView,
  onDefaultViewChange,
  fontSize,
  onFontSizeChange,
  displayDensity,
  onDisplayDensityChange,
  notificationsEnabled,
  onNotificationsToggle,
  eventReminders,
  onEventRemindersToggle,
  dailySummary,
  onDailySummaryToggle,
  taskDeadlines,
  onTaskDeadlinesToggle,
  userEmail,
  onLogout,
  onImportExport,
  onFocusTimerClick,
  onAnalyticsClick,
  events,
  onImport
}: SettingsPopoverProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFullSettings = () => {
    navigate("/settings");
  };

  const handleFeedback = () => {
    toast({
      title: "Send Feedback",
      description: "Thank you for your interest! Feedback form coming soon.",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-card border-border shadow-elegant p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Quick Settings</h3>
          <p className="text-xs text-muted-foreground">Commonly used preferences</p>
        </div>

        <Separator className="bg-border" />

        <ScrollArea className="h-[500px] px-6">
        <div className="space-y-6 py-6">{/* scrollable content wrapper */}

        {/* Display & Appearance */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Display & Appearance</h4>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="text-sm text-foreground cursor-pointer">
              Dark Mode
            </Label>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
            />
          </div>

          {/* Default View */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Default View</Label>
            <RadioGroup value={defaultView} onValueChange={(value) => onDefaultViewChange(value as ViewMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="view-monthly" />
                <Label htmlFor="view-monthly" className="text-sm cursor-pointer">Month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="view-weekly" />
                <Label htmlFor="view-weekly" className="text-sm cursor-pointer">Week</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="view-daily" />
                <Label htmlFor="view-daily" className="text-sm cursor-pointer">Day</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kanban" id="view-kanban" />
                <Label htmlFor="view-kanban" className="text-sm cursor-pointer">Kanban</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Font Size</Label>
            <RadioGroup value={fontSize} onValueChange={(value) => onFontSizeChange(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="font-small" />
                <Label htmlFor="font-small" className="text-sm cursor-pointer">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="font-medium" />
                <Label htmlFor="font-medium" className="text-sm cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="font-large" />
                <Label htmlFor="font-large" className="text-sm cursor-pointer">Large</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Display Density */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Display Density</Label>
            <RadioGroup value={displayDensity} onValueChange={(value) => onDisplayDensityChange(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="density-compact" />
                <Label htmlFor="density-compact" className="text-sm cursor-pointer">Compact</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spacious" id="density-spacious" />
                <Label htmlFor="density-spacious" className="text-sm cursor-pointer">Spacious</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Holidays */}
          <div className="pt-2">
            <HolidayManagementDialog />
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Notifications</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="all-notifications" className="text-sm text-foreground cursor-pointer">
              Enable All Notifications
            </Label>
            <Switch
              id="all-notifications"
              checked={notificationsEnabled}
              onCheckedChange={onNotificationsToggle}
            />
          </div>

          <div className="space-y-3 pl-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="event-reminders" 
                className={`text-sm cursor-pointer ${!notificationsEnabled ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                Event Reminders
              </Label>
              <Switch
                id="event-reminders"
                checked={eventReminders}
                onCheckedChange={onEventRemindersToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label 
                htmlFor="daily-summary" 
                className={`text-sm cursor-pointer ${!notificationsEnabled ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                Daily Summary
              </Label>
              <Switch
                id="daily-summary"
                checked={dailySummary}
                onCheckedChange={onDailySummaryToggle}
                disabled={!notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label 
                htmlFor="task-deadlines" 
                className={`text-sm cursor-pointer ${!notificationsEnabled ? 'text-muted-foreground' : 'text-foreground'}`}
              >
                Task Deadlines
              </Label>
              <Switch
                id="task-deadlines"
                checked={taskDeadlines}
                onCheckedChange={onTaskDeadlinesToggle}
                disabled={!notificationsEnabled}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Quick Links */}
        <div className="space-y-2">
          {events && onImport && (
            <CalendarImportExport events={events} onImport={onImport} />
          )}
          <Button
            variant="outline"
            className="w-full justify-start text-sm gap-2"
            onClick={onFocusTimerClick}
            >
              <Timer className="h-4 w-4" />
              Focus Timer
              </Button>
              <Button
              variant="outline"
              className="w-full justify-start text-sm gap-2"
              onClick={onAnalyticsClick}
              >
              <BarChart3 className="h-4 w-4" />
              Product Analytics
            </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={handleFullSettings}
          >
            Go to Full Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={() => window.open("https://docs.lovable.dev", "_blank")}
          >
            Help & Support
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={handleFeedback}
          >
            Send Feedback
          </Button>
        </div>

        <Separator className="bg-border" />

        {/* Account */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="text-foreground font-medium truncate max-w-[150px]">
              {userEmail || "Not logged in"}
            </span>
          </div>
          <Button
            variant="destructive"
            className="w-full text-sm"
            onClick={onLogout}
          >
            Log Out
          </Button>
        </div>
        </div>{/* end spacing wrapper */}
        </ScrollArea>{/* end scrollable content */}
      </PopoverContent>
    </Popover>
  );
};
