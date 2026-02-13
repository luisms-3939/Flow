import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Trash2, Plus, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Holiday, usePersistedHolidays } from "@/hooks/usePersistedHolidays";

interface HolidayManagementDialogProps {
  trigger?: React.ReactNode;
}

export const HolidayManagementDialog = ({ trigger }: HolidayManagementDialogProps) => {
  const { holidays, addHoliday, removeHoliday, resetToDefaults } = usePersistedHolidays();
  const [isOpen, setIsOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date>();
  const [newName, setNewName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAddHoliday = () => {
    if (newDate) {
      addHoliday({
        date: newDate.toISOString().split("T")[0],
        name: newName.trim() || undefined,
      });
      setNewDate(undefined);
      setNewName("");
      setIsAddingNew(false);
    }
  };

  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Manage Holidays
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Holidays</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {sortedHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {format(new Date(holiday.date), "MMM d, yyyy")}
                    </div>
                    {holiday.name && (
                      <div className="text-xs text-muted-foreground">{holiday.name}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeHoliday(holiday.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {holidays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No holidays configured
              </div>
            )}
          </div>
        </ScrollArea>

        {isAddingNew ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Christmas Day"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewDate(undefined);
                  setNewName("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddHoliday}
                disabled={!newDate}
              >
                Add Holiday
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
            <Button
              variant="outline"
              onClick={resetToDefaults}
              title="Reset to default holidays"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
