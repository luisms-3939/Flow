import { Event, RecurrencePattern } from "@/types/event";
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay, startOfDay, format } from "date-fns";

export const generateRecurringInstances = (
  event: Event,
  rangeStart: Date,
  rangeEnd: Date
): Event[] => {
  if (!event.recurrencePattern || event.recurrencePattern.type === "none") {
    return [];
  }

  const instances: Event[] = [];
  const { type, interval, endDate, daysOfWeek } = event.recurrencePattern;
  const eventDate = startOfDay(new Date(event.date));
  const rangeStartDate = startOfDay(rangeStart);
  const rangeEndDate = startOfDay(rangeEnd);
  const recurrenceEndDate = endDate ? startOfDay(new Date(endDate)) : null;

  let currentDate = eventDate;

  // Generate instances until we pass the range end or recurrence end
  while (isBefore(currentDate, rangeEndDate) || isSameDay(currentDate, rangeEndDate)) {
    // Stop if we've passed the recurrence end date
    if (recurrenceEndDate && isAfter(currentDate, recurrenceEndDate)) {
      break;
    }

    // Check if this date is excluded (modified individually)
    const currentDateStr = format(currentDate, "yyyy-MM-dd");
    const isExcluded = event.excludedDates?.includes(currentDateStr);

    // Check if this date is within the viewing range and not the original event date
    const isInRange = (isAfter(currentDate, rangeStartDate) || isSameDay(currentDate, rangeStartDate)) &&
                      (isBefore(currentDate, rangeEndDate) || isSameDay(currentDate, rangeEndDate));
    const isNotOriginal = !isSameDay(currentDate, eventDate);

    if (isInRange && isNotOriginal && !isExcluded) {
      // For weekly recurrence with specific days, check if current day matches
      if (type === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
        const dayOfWeek = currentDate.getDay();
        if (daysOfWeek.includes(dayOfWeek)) {
          instances.push(createInstance(event, currentDate));
        }
      } else {
        instances.push(createInstance(event, currentDate));
      }
    }

    // Move to next occurrence
    currentDate = getNextDate(currentDate, type, interval);

    // Safety: limit to 365 instances to prevent infinite loops
    if (instances.length >= 365) break;
  }

  return instances;
};

const createInstance = (event: Event, date: Date): Event => {
  return {
    ...event,
    id: `${event.id}_${date.getTime()}`,
    date: date,
    parentEventId: event.id,
    isRecurringInstance: true,
  };
};

const getNextDate = (date: Date, type: RecurrencePattern["type"], interval: number): Date => {
  switch (type) {
    case "daily":
      return addDays(date, interval);
    case "weekly":
      return addWeeks(date, interval);
    case "monthly":
      return addMonths(date, interval);
    case "yearly":
      return addYears(date, interval);
    default:
      return addDays(date, 1);
  }
};

export const getRecurrenceLabel = (pattern: RecurrencePattern): string => {
  const { type, interval, daysOfWeek, endDate } = pattern;
  
  if (type === "none") return "Does not repeat";
  
  let label = "";
  const intervalText = interval === 1 ? "" : `${interval} `;
  
  switch (type) {
    case "daily":
      label = interval === 1 ? "Daily" : `Every ${interval} days`;
      break;
    case "weekly":
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const days = daysOfWeek.map(d => dayNames[d]).join(", ");
        label = interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
      } else {
        label = interval === 1 ? "Weekly" : `Every ${interval} weeks`;
      }
      break;
    case "monthly":
      label = interval === 1 ? "Monthly" : `Every ${interval} months`;
      break;
    case "yearly":
      label = interval === 1 ? "Yearly" : `Every ${interval} years`;
      break;
  }
  
  if (endDate) {
    label += ` until ${new Date(endDate).toLocaleDateString()}`;
  }
  
  return label;
};
