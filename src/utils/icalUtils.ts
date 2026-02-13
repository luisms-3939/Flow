import { Event, RecurrencePattern } from "@/types/event";
import { format, parse } from "date-fns";

// Convert Event to iCal format
export const eventToICalString = (event: Event): string => {
  const formatICalDate = (date: Date, time?: string): string => {
    if (time) {
      const [hours, minutes] = time.split(":");
      const dateWithTime = new Date(date);
      dateWithTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return format(dateWithTime, "yyyyMMdd'T'HHmmss");
    }
    return format(date, "yyyyMMdd");
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.id}@synapflow`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
  ];

  // Handle date/time
  if (event.startTime) {
    lines.push(`DTSTART:${formatICalDate(new Date(event.date), event.startTime)}`);
    if (event.endTime) {
      lines.push(`DTEND:${formatICalDate(new Date(event.date), event.endTime)}`);
    }
  } else {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(new Date(event.date))}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  // Map event type to iCal categories
  const categories: string[] = [event.type.toUpperCase()];
  if (event.category) {
    categories.push(event.category);
  }
  lines.push(`CATEGORIES:${categories.join(",")}`);

  // Handle priority for tasks
  if (event.priority) {
    const priorityMap = { high: 1, medium: 5, low: 9 };
    lines.push(`PRIORITY:${priorityMap[event.priority]}`);
  }

  // Handle recurrence
  if (event.recurrencePattern && event.recurrencePattern.type !== "none") {
    const rrule = recurrenceToRRule(event.recurrencePattern);
    if (rrule) {
      lines.push(rrule);
    }
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
};

// Convert RecurrencePattern to RRULE
const recurrenceToRRule = (pattern: RecurrencePattern): string | null => {
  const freqMap: Record<string, string> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    yearly: "YEARLY",
  };

  const freq = freqMap[pattern.type];
  if (!freq) return null;

  let rrule = `RRULE:FREQ=${freq}`;

  if (pattern.interval > 1) {
    rrule += `;INTERVAL=${pattern.interval}`;
  }

  if (pattern.endDate) {
    rrule += `;UNTIL=${format(new Date(pattern.endDate), "yyyyMMdd")}`;
  }

  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const days = pattern.daysOfWeek.map((d) => dayMap[d]).join(",");
    rrule += `;BYDAY=${days}`;
  }

  return rrule;
};

// Parse RRULE to RecurrencePattern
const parseRRule = (rrule: string): RecurrencePattern | undefined => {
  const parts = rrule.replace("RRULE:", "").split(";");
  const props: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    props[key] = value;
  });

  const freqMap: Record<string, RecurrencePattern["type"]> = {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };

  const type = freqMap[props.FREQ];
  if (!type) return undefined;

  const pattern: RecurrencePattern = {
    type,
    interval: props.INTERVAL ? parseInt(props.INTERVAL) : 1,
  };

  if (props.UNTIL) {
    pattern.endDate = parse(props.UNTIL, "yyyyMMdd", new Date()).toISOString();
  }

  if (props.BYDAY) {
    const dayMap: Record<string, number> = {
      SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
    };
    pattern.daysOfWeek = props.BYDAY.split(",").map((d) => dayMap[d.trim()]);
  }

  return pattern;
};

// Export events to iCal file content
export const exportEventsToICal = (events: Event[]): string => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Synapflow//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((event) => {
    lines.push(eventToICalString(event));
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
};

// Parse iCal content to events
export const parseICalToEvents = (icalContent: string): Partial<Event>[] => {
  const events: Partial<Event>[] = [];
  const lines = icalContent.replace(/\r\n /g, "").split(/\r?\n/);

  let currentEvent: Partial<Event> | null = null;

  const unescapeText = (text: string): string => {
    return text
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");
  };

  const parseICalDate = (dateStr: string): { date: Date; time?: string } => {
    // Handle DATE-TIME format: 20260125T143000
    if (dateStr.includes("T")) {
      const cleanDate = dateStr.replace("Z", "");
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      const hours = parseInt(cleanDate.substring(9, 11));
      const minutes = parseInt(cleanDate.substring(11, 13));

      return {
        date: new Date(year, month, day),
        time: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
      };
    }

    // Handle DATE only format: 20260125
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));

    return { date: new Date(year, month, day) };
  };

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {
        id: crypto.randomUUID(),
        type: "meeting", // Default type
        tags: [],
      };
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentEvent.title && currentEvent.date) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const fullKey = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      const key = fullKey.split(";")[0];

      switch (key) {
        case "SUMMARY":
          currentEvent.title = unescapeText(value);
          break;
        case "DESCRIPTION":
          currentEvent.description = unescapeText(value);
          break;
        case "LOCATION":
          currentEvent.location = unescapeText(value);
          break;
        case "DTSTART":
          const start = parseICalDate(value);
          currentEvent.date = start.date;
          if (start.time) {
            currentEvent.startTime = start.time;
          }
          break;
        case "DTEND":
          const end = parseICalDate(value);
          if (end.time) {
            currentEvent.endTime = end.time;
          }
          break;
        case "CATEGORIES":
          const categories = value.split(",");
          // Check if first category is a type
          const typeMatch = categories[0]?.toLowerCase();
          if (typeMatch === "task" || typeMatch === "note" || typeMatch === "meeting") {
            currentEvent.type = typeMatch;
            if (categories[1]) {
              currentEvent.category = categories[1];
            }
          } else {
            currentEvent.category = categories[0];
          }
          break;
        case "PRIORITY":
          const priority = parseInt(value);
          if (priority >= 1 && priority <= 4) {
            currentEvent.priority = "high";
          } else if (priority >= 5 && priority <= 6) {
            currentEvent.priority = "medium";
          } else {
            currentEvent.priority = "low";
          }
          break;
        case "RRULE":
          currentEvent.recurrencePattern = parseRRule(line);
          break;
      }
    }
  }

  return events;
};

// Download iCal file
export const downloadICalFile = (events: Event[], filename = "synapflow-export.ics") => {
  const content = exportEventsToICal(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
