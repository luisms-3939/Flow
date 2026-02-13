import React, { useState } from "react";
import { Event, EventType } from "@/types/event";
import { isSameDay } from "date-fns";
import { EventModal } from "./EventModal"; // your updated modal with edit support

interface EventPreviewProps {
  initialEvents: Event[];
  selectedDate: Date;
}

export const EventPreviewIntegrated = ({ initialEvents, selectedDate }: EventPreviewProps) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter events by selected date and filter type
  const filteredEvents = events.filter(
    (event) =>
      isSameDay(new Date(event.date), selectedDate) &&
      (filterType === "all" || event.type === filterType)
  );

  // Opens modal to edit event details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  // Saves changes to event list and closes modal
  const handleSaveEvent = (updatedEvent: Event) => {
    setEvents((prevEvents) =>
      prevEvents.some((e) => e.id === updatedEvent.id)
        ? prevEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
        : [...prevEvents, updatedEvent]
    );
    setModalOpen(false);
    setSelectedEvent(null);
  };

  // Changes event type filter
  const onFilterChange = (type: EventType | "all") => {
    setFilterType(type);
  };

  return (
    <div className="p-6 bg-card rounded shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
        <label>
          Filter by type
         <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value as EventType | "all")}
          className="border p-1 rounded"
        >
          <option value="all">All Events</option>
          <option value="task">Tasks</option>
          <option value="note">Notes</option>
          <option value="meeting">Meetings</option>
        </select>
        </label>
      </div>

      <div className="space-y-3 max-h-96 overflow-auto">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No events scheduled for this day
          </p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded border-l-4 cursor-pointer hover:shadow-lg"
              onClick={() => handleEventClick(event)}
            >
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted">{event.description}</p>
              <p className="text-xs text-muted">
                {event.startTime}
                {event.endTime ? ` - ${event.endTime}` : ""}
              </p>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveEvent}
          eventType={selectedEvent.type}
          initialEvent={selectedEvent}
        />
      )}
    </div>
  );
};
