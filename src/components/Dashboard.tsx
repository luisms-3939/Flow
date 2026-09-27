/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar } from "./Calendar";
import { EventPreview } from "./EventPreview";
import { Sidebar } from "./Sidebar";
import { AddEventButton } from "./AddEventButton";
import { ViewToggle } from "./ViewToggle";
import { AIAssistant } from "./AIAssistant";
import { WeeklyCalendarView } from "./WeeklyCalendarView";
import { DailyCalendarView } from "./DailyCalendarView";
import { KanbanView } from "./KanbanView";
import { WindowControls } from "./WindowControls";
import { SettingsPopover } from "./SettingsPopover";
import { EventModal } from "./EventModal";
import { SearchBar } from "./SearchBar";
import { RecurringEventDialog } from "./RecurringEventDialog";
import { CalendarImportExport } from "./CalendarImportExport";
import { Event, ViewMode, EventType, TaskStatus } from "@/types/event";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { useCloudEvents } from "@/hooks/useCloudEvents";
import { useCloudSettings, SidebarSectionId } from "@/hooks/useCloudSettings";
import { useLocalStorageMigration } from "@/hooks/useLocalStorageMigration";
import { useAuth } from "@/contexts/AuthContext";
import { useCategoriesTags } from "@/contexts/CategoriesTagsContext";
import nameLogo from "/name_logo.png";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SparkMascot } from "./SparkMascot";
import { generateRecurringInstances } from "@/utils/recurrenceUtils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEventReminders } from "@/hooks/useEventReminders";
import { FullPageLoader } from "./FullPageLoader";
import { MobileNavigation } from "./MobileNavigation";
import { PullToRefresh } from "./PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Upload, X, PanelRightClose, PanelRight, Timer, BarChart3 } from "lucide-react";
import { FocusTimer } from "./FocusTimer";
import { ProductivityAnalytics } from "./ProductivityAnalytics";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useProductivityAnalytics } from "@/hooks/useProductivityAnalytics";

export const Dashboard = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { categories, tags } = useCategoriesTags();
  const isMobile = useIsMobile();
  const { settings, updateSetting, isLoading: settingsLoading } = useCloudSettings();
  const { events, setEvents, isLoading: eventsLoading, refetch: refetchEvents } = useCloudEvents();
  const { sessions, todayTotalMinutes } = useFocusSessions();
  const { summary: productivitySummary } = useProductivityAnalytics(sessions, events);
  const { hasPendingMigration, localEventsCount, isMigrating, migrateEvents, skipMigration } = useLocalStorageMigration();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>(settings.defaultView);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [dayEvents, setDayEvents] = useState<Event[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const searchBarRef = useRef<{ focus: () => void }>(null);
  
  // Recurring event dialog state
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recurringDialogAction, setRecurringDialogAction] = useState<"edit" | "delete">("edit");
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);

  // Event reminders - uses browser notifications
  const { permission: notificationPermission, requestPermission } = useEventReminders(
    events,
    settings.eventReminders
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewEvent: () => setIsAddEventOpen(true),
    onGoToToday: () => setSelectedDate(new Date()),
    onViewChange: setViewMode,
    onDateChange: setSelectedDate,
    onCloseModal: () => {
      if (isEventModalOpen) setIsEventModalOpen(false);
      else if (isDayEventsModalOpen) setIsDayEventsModalOpen(false);
    },
    onFocusSearch: () => searchBarRef.current?.focus(),
    onToggleSidebar: () => updateSetting("sidebarCollapsed", !settings.sidebarCollapsed),
    currentDate: selectedDate,
    currentView: viewMode,
    isModalOpen: isEventModalOpen || isDayEventsModalOpen,
  });

  // Sync viewMode with defaultView setting on initial load
  useEffect(() => {
    if (!settingsLoading) {
      setViewMode(settings.defaultView);
    }
  }, [settingsLoading]);

  // Show migration dialog if there are local events to import
  useEffect(() => {
    if (!eventsLoading && !settingsLoading && hasPendingMigration) {
      setShowMigrationDialog(true);
    }
  }, [eventsLoading, settingsLoading, hasPendingMigration]);

  // Request notification permission when reminders are enabled
  useEffect(() => {
    if (settings.eventReminders && notificationPermission === "default") {
      requestPermission().then((granted) => {
        if (granted) {
          toast({
            title: "Notifications Enabled",
            description: "You'll now receive reminders before your events.",
          });
        }
      });
    }
  }, [settings.eventReminders, notificationPermission, requestPermission, toast]);

  // Generate recurring event instances for the visible date range
  const eventsWithRecurring = useMemo(() => {
    // Calculate visible range based on viewMode (include some buffer)
    const rangeStart = subMonths(startOfMonth(selectedDate), 1);
    const rangeEnd = addMonths(endOfMonth(selectedDate), 1);
    
    const allEvents: Event[] = [...events];
    
    // Generate recurring instances for each recurring event
    events.forEach(event => {
      if (event.recurrencePattern && event.recurrencePattern.type !== "none" && !event.isRecurringInstance) {
        const instances = generateRecurringInstances(event, rangeStart, rangeEnd);
        allEvents.push(...instances);
      }
    });
    
    return allEvents;
  }, [events, selectedDate]);

  const filteredEvents = eventsWithRecurring.filter(
    (event) => filterType === "all" || event.type === filterType
  );

  const handleEventClick = (event: Event) => {
    // Check if this is a recurring instance
    if (event.isRecurringInstance && event.parentEventId) {
      setPendingEvent(event);
      setRecurringDialogAction("edit");
      setRecurringDialogOpen(true);
    } else {
      setSelectedEvent(event);
      setIsEventModalOpen(true);
    }
  };

  const handleEditThisOccurrence = () => {
    if (!pendingEvent || !pendingEvent.parentEventId) return;
    
    const parentEvent = events.find(e => e.id === pendingEvent.parentEventId);
    if (!parentEvent) return;

    // Add the date to excluded dates on the parent
    const excludedDate = format(new Date(pendingEvent.date), "yyyy-MM-dd");
    const updatedParent = {
      ...parentEvent,
      excludedDates: [...(parentEvent.excludedDates || []), excludedDate],
    };
    
    // Create a new standalone event for this occurrence
    const newEvent: Event = {
      ...pendingEvent,
      id: crypto.randomUUID(),
      parentEventId: undefined,
      isRecurringInstance: false,
      recurrencePattern: undefined,
      excludedDates: undefined,
    };

    setEvents(prevEvents =>
      prevEvents.map(e => e.id === parentEvent.id ? updatedParent : e).concat(newEvent)
    );

    setRecurringDialogOpen(false);
    setSelectedEvent(newEvent);
    setIsEventModalOpen(true);
    setPendingEvent(null);
  };

  const handleEditAllOccurrences = () => {
    if (!pendingEvent || !pendingEvent.parentEventId) return;
    
    const parentEvent = events.find(e => e.id === pendingEvent.parentEventId);
    if (!parentEvent) return;

    setRecurringDialogOpen(false);
    setSelectedEvent(parentEvent);
    setIsEventModalOpen(true);
    setPendingEvent(null);
  };

  const handleDeleteThisOccurrence = () => {
    if (!pendingEvent || !pendingEvent.parentEventId) return;
    
    const parentEvent = events.find(e => e.id === pendingEvent.parentEventId);
    if (!parentEvent) return;

    // Add the date to excluded dates on the parent
    const excludedDate = format(new Date(pendingEvent.date), "yyyy-MM-dd");
    const updatedParent = {
      ...parentEvent,
      excludedDates: [...(parentEvent.excludedDates || []), excludedDate],
    };

    setEvents(prevEvents =>
      prevEvents.map(e => e.id === parentEvent.id ? updatedParent : e)
    );

    setRecurringDialogOpen(false);
    setPendingEvent(null);

    toast({
      title: "Occurrence Deleted",
      description: `The event on ${format(new Date(pendingEvent.date), "MMM d, yyyy")} has been removed.`,
    });
  };

  const handleDeleteAllOccurrences = () => {
    if (!pendingEvent || !pendingEvent.parentEventId) return;

    setEvents(prevEvents => prevEvents.filter(e => e.id !== pendingEvent.parentEventId));

    setRecurringDialogOpen(false);
    setPendingEvent(null);

    toast({
      title: "Series Deleted",
      description: "All occurrences of this recurring event have been removed.",
    });
  };

  const handleRecurringDelete = (event: Event) => {
    // Check if this is a recurring instance
    if (event.isRecurringInstance && event.parentEventId) {
      setPendingEvent(event);
      setRecurringDialogAction("delete");
      setRecurringDialogOpen(true);
    } else if (event.recurrencePattern && event.recurrencePattern.type !== "none") {
      // This is the parent recurring event
      setPendingEvent({ ...event, parentEventId: event.id, isRecurringInstance: true });
      setRecurringDialogAction("delete");
      setRecurringDialogOpen(true);
    } else {
      // Non-recurring event, delete directly
      handleDeleteEvent(event.id);
    }
  };

  const handleDayClick = (date: Date, eventsForDay: Event[]) => {
    setSelectedDate(date);
    if (eventsForDay.length === 1) {
      handleEventClick(eventsForDay[0]);
    } else {
      setDayEvents(eventsForDay);
      setIsDayEventsModalOpen(true);
    }
  };

  const handleTodayEventsClick = () => {
    const todayEvents = eventsWithRecurring.filter(event => isSameDay(new Date(event.date), new Date()));
    if (todayEvents.length === 1) {
      handleEventClick(todayEvents[0]);
    } else {
      setDayEvents(todayEvents);
      setIsDayEventsModalOpen(true);
    }
  };

  const handleNextMeetingClick = () => {
    const upcomingMeetings = eventsWithRecurring
      .filter(event => event.type === "meeting" && new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (upcomingMeetings.length > 0) {
      handleEventClick(upcomingMeetings[0]);
    }
  };

  const handleSaveEvent = (updatedEvent: Event) => {
    const isNewEvent = !events.some(e => e.id === updatedEvent.id);
    
    setEvents(prevEvents =>
      prevEvents.some(e => e.id === updatedEvent.id)
        ? prevEvents.map(e => (e.id === updatedEvent.id ? updatedEvent : e))
        : [...prevEvents, updatedEvent]
    );
    
    toast({
      title: isNewEvent ? "Event Created! 🎉" : "Event Updated! ✨",
      description: `${updatedEvent.title} has been ${isNewEvent ? "added to" : "updated in"} your schedule.`,
    });
    
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
    
    toast({
      title: "Event Deleted",
      description: "The event has been removed from your schedule.",
    });
    
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventReschedule = (eventId: string, newDate: Date, newTime?: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Store original event state for undo
    const originalEvent = { ...event };

    setEvents(prevEvents =>
      prevEvents.map(e => {
        if (e.id !== eventId) return e;
        const updated = { ...e, date: newDate };
        if (newTime && e.startTime) {
          // Calculate time difference and adjust end time
          const oldStartHour = parseInt(e.startTime.split(":")[0]);
          const newStartHour = parseInt(newTime.split(":")[0]);
          const diff = newStartHour - oldStartHour;
          
          updated.startTime = newTime;
          if (e.endTime) {
            const endHour = parseInt(e.endTime.split(":")[0]);
            const endMinutes = e.endTime.split(":")[1];
            updated.endTime = `${(endHour + diff).toString().padStart(2, "0")}:${endMinutes}`;
          }
        }
        return updated;
      })
    );

    const handleUndo = () => {
      setEvents(prevEvents =>
        prevEvents.map(e => e.id === eventId ? originalEvent : e)
      );
      toast({
        title: "Undo Successful",
        description: `"${event.title}" restored to ${format(new Date(originalEvent.date), "MMM d")}${originalEvent.startTime ? ` at ${originalEvent.startTime}` : ""}.`,
      });
    };

    toast({
      title: "Event Rescheduled",
      description: `"${event.title}" moved to ${format(newDate, "MMM d")}${newTime ? ` at ${newTime}` : ""}.`,
      action: (
        <Button variant="outline" size="sm" onClick={handleUndo}>
          Undo
        </Button>
      ),
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You've been successfully logged out.",
    });
  };

  const handleImportEvents = async (importedEvents: Partial<Event>[]) => {
    const newEvents: Event[] = importedEvents.map((e) => ({
      id: e.id || crypto.randomUUID(),
      title: e.title || "Untitled Event",
      type: e.type || "meeting",
      date: e.date || new Date(),
      description: e.description,
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
      tags: e.tags || [],
      priority: e.priority,
      location: e.location,
      recurrencePattern: e.recurrencePattern,
      reminders: e.reminders || [],
      subtasks: e.subtasks || [],
      completed: e.completed || false,
      attachments: e.attachments || [],
    }));

    setEvents((prev) => [...prev, ...newEvents]);
  };

  const handlePullToRefresh = async () => {
    await refetchEvents();
    toast({
      title: "Synced!",
      description: "Your events have been refreshed.",
    });
  };

  const handleTaskStatusChange = (eventId: string, newStatus: TaskStatus) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const completed = newStatus === "done";
    setEvents(prevEvents =>
      prevEvents.map(e =>
        e.id === eventId ? { ...e, status: newStatus, completed } : e
      )
    );

    const statusLabels: Record<TaskStatus, string> = {
      todo: "To Do",
      in_progress: "In Progress", 
      done: "Done",
    };

    toast({
      title: "Task Updated",
      description: `"${event.title}" moved to ${statusLabels[newStatus]}.`,
    });
  };

  if (eventsLoading || settingsLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex h-screen bg-background pb-16 md:pb-0">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Wrap with PullToRefresh on mobile */}
        {isMobile ? (
          <PullToRefresh onRefresh={handlePullToRefresh} className="flex-1 flex flex-col">
            <header className="border-b border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <img src={nameLogo} alt="Synapflow" className="h-12 mb-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "EEE, MMM d")}
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <SearchBar 
                    ref={searchBarRef} 
                    events={events} 
                    onEventClick={handleEventClick}
                    categories={categories}
                    tags={tags}
                  />
                  <AIAssistant 
                    events={events} 
                    onCreateEvent={(eventData) => {
                      const newEvent: Event = {
                        id: crypto.randomUUID(),
                        ...eventData,
                      };
                      setEvents([...events, newEvent]);
                      toast({
                        title: "Event Created! 🎉",
                        description: `${newEvent.title} has been added to your schedule.`,
                      });
                    }}
                  />
                </div>
              </div>
            </header>

            <div className="flex-1 p-4 overflow-auto">
              {viewMode === "monthly" && (
                <Calendar
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  events={filteredEvents}
                  onDayClick={handleDayClick}
                  onEventReschedule={handleEventReschedule}
                />
              )}
              {viewMode === "weekly" && (
                <WeeklyCalendarView
                  selectedDate={selectedDate}
                  events={filteredEvents}
                  onEventReschedule={handleEventReschedule}
                />
              )}
              {viewMode === "daily" && (
                <DailyCalendarView
                  selectedDate={selectedDate}
                  events={filteredEvents}
                  onEventReschedule={handleEventReschedule}
                />
              )}
              {viewMode === "kanban" && (
                <KanbanView
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onStatusChange={handleTaskStatusChange}
                />
              )}
            </div>
          </PullToRefresh>
        ) : (
          <>
            <header className="border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 shrink-0">
                  <img src={nameLogo} alt="Synapflow" className="h-12 mb-0.5" />
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-center">
                  <SearchBar 
                    ref={searchBarRef} 
                    events={events} 
                    onEventClick={handleEventClick}
                    categories={categories}
                    tags={tags}
                  />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                  <AddEventButton 
                    onAddEvent={(event) => setEvents([...events, event])} 
                    isOpen={isAddEventOpen}
                    onOpenChange={setIsAddEventOpen}
                  />
                  <AIAssistant 
                    events={events} 
                    onCreateEvent={(eventData) => {
                      const newEvent: Event = {
                        id: crypto.randomUUID(),
                        ...eventData,
                      };
                      setEvents([...events, newEvent]);
                      toast({
                        title: "Event Created! 🎉",
                        description: `${newEvent.title} has been added to your schedule.`,
                      });
                    }}
                  />
                  <SettingsPopover
                    theme={settings.theme}
                    onThemeChange={(theme) => updateSetting("theme", theme)}
                    defaultView={settings.defaultView}
                    onDefaultViewChange={(view) => updateSetting("defaultView", view)}
                    fontSize={settings.fontSize}
                    onFontSizeChange={(size) => updateSetting("fontSize", size)}
                    displayDensity={settings.displayDensity}
                    onDisplayDensityChange={(density) => updateSetting("displayDensity", density)}
                    notificationsEnabled={settings.notificationsEnabled}
                    onNotificationsToggle={(enabled) => updateSetting("notificationsEnabled", enabled)}
                    eventReminders={settings.eventReminders}
                    onEventRemindersToggle={(enabled) => updateSetting("eventReminders", enabled)}
                    dailySummary={settings.dailySummary}
                    onDailySummaryToggle={(enabled) => updateSetting("dailySummary", enabled)}
                    taskDeadlines={settings.taskDeadlines}
                    onTaskDeadlinesToggle={(enabled) => updateSetting("taskDeadlines", enabled)}
                    userEmail={user?.email}
                    onLogout={handleLogout}
                    onFocusTimerClick={() => setIsFocusTimerOpen(true)}
                    onAnalyticsClick={() => setIsAnalyticsOpen(true)}
                    events={events}
                    onImport={handleImportEvents}
                  />
                </div>
              </div>
            </header>

            <div className="flex-1 flex gap-8 p-6 overflow-hidden">
              <div className={cn(settings.previewPaneVisible ? "flex-1" : "w-full", "flex flex-col")}>
                {viewMode === "monthly" && (
                  <Calendar
                    viewMode={viewMode}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    events={filteredEvents}
                    onDayClick={handleDayClick}
                    onEventReschedule={handleEventReschedule}
                  />
                )}
                {viewMode === "weekly" && (
                  <WeeklyCalendarView
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onEventReschedule={handleEventReschedule}
                  />
                )}
                {viewMode === "daily" && (
                  <DailyCalendarView
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onEventReschedule={handleEventReschedule}
                  />
                )}
                {viewMode === "kanban" && (
                  <KanbanView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onStatusChange={handleTaskStatusChange}
                  />
                )}
              </div>

              {settings.previewPaneVisible && (
                <div className="w-80 lg:w-96 shrink-0">
                  <EventPreview
                    events={filteredEvents}
                    selectedDate={selectedDate}
                    viewMode={viewMode}
                    filterType={filterType}
                    onFilterChange={setFilterType}
                    onEventClick={handleEventClick}
                  />
                </div>
              )}

              {/* Toggle preview pane button */}
              <Button
                variant="ghost"
                size="icon"
                className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                onClick={() => updateSetting("previewPaneVisible", !settings.previewPaneVisible)}
              >
                {settings.previewPaneVisible ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRight className="h-5 w-5" />
                )}
              </Button>
            </div>
          </>
        )}
      </main>

      {selectedEvent && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleSaveEvent}
          onDelete={() => handleRecurringDelete(selectedEvent)}
          eventType={selectedEvent.type}
          initialEvent={selectedEvent}
        />
      )}

      {pendingEvent && (
        <RecurringEventDialog
          isOpen={recurringDialogOpen}
          onClose={() => {
            setRecurringDialogOpen(false);
            setPendingEvent(null);
          }}
          action={recurringDialogAction}
          eventDate={new Date(pendingEvent.date)}
          onThisOccurrence={recurringDialogAction === "edit" ? handleEditThisOccurrence : handleDeleteThisOccurrence}
          onAllOccurrences={recurringDialogAction === "edit" ? handleEditAllOccurrences : handleDeleteAllOccurrences}
        />
      )}

      <Dialog open={isDayEventsModalOpen} onOpenChange={setIsDayEventsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparkMascot size="sm" mood="idle" />
              Events for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {dayEvents.map((event) => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  setIsDayEventsModalOpen(false);
                  handleEventClick(event);
                }}
              >
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.type} {event.startTime && `• ${event.startTime}`}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* LocalStorage Migration Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Local Events
            </DialogTitle>
            <DialogDescription>
              We found {localEventsCount} event{localEventsCount !== 1 ? "s" : ""} saved on this device. 
              Would you like to import them to your cloud account?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <SparkMascot size="sm" mood="idle" />
              <p className="text-sm text-muted-foreground">
                Your events will be synced across all your devices after import.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                skipMigration();
                setShowMigrationDialog(false);
              }}
              disabled={isMigrating}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Skip
            </Button>
            <Button
              onClick={async () => {
                const success = await migrateEvents();
                if (success) {
                  setShowMigrationDialog(false);
                  // Refresh events after migration
                  window.location.reload();
                }
              }}
              disabled={isMigrating}
              className="bg-gradient-to-r from-primary to-primary-glow shadow-glow gap-2"
            >
              {isMigrating ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Events
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focus Timer */}
      <FocusTimer
        events={events}
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
      />

      {/* Productivity Analytics */}
      <ProductivityAnalytics
        events={events}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        currentView={viewMode}
        onViewChange={setViewMode}
        onAddEvent={() => setIsAddEventOpen(true)}
        onSettingsClick={() => window.location.href = "/settings"}
      />
    </div>
  );
};

