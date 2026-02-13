import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, X, CheckSquare, FileText, Users, Filter, Calendar as CalendarIcon, Tag, FolderOpen } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Event, EventType } from "@/types/event";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { SparkMascot } from "./SparkMascot";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  categories?: { id: string; name: string; color: string }[];
  tags?: { id: string; name: string; color: string }[];
}

export interface SearchBarRef {
  focus: () => void;
}

interface SearchFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  categories: string[];
  tags: string[];
  eventTypes: EventType[];
}

const defaultFilters: SearchFilters = {
  dateRange: { from: undefined, to: undefined },
  categories: [],
  tags: [],
  eventTypes: [],
};

const getEventIcon = (type: EventType) => {
  switch (type) {
    case "task":
      return <CheckSquare className="h-4 w-4 text-primary" />;
    case "note":
      return <FileText className="h-4 w-4 text-accent" />;
    case "meeting":
      return <Users className="h-4 w-4 text-secondary" />;
  }
};

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => 
    regex.test(part) ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark> : part
  );
};

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ 
  events, 
  onEventClick,
  categories = [],
  tags = [],
}, ref) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      setIsOpen(true);
    },
  }));

  // Count active filters
  const activeFilterCount = 
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    filters.categories.length +
    filters.tags.length +
    filters.eventTypes.length;

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  // Filter events based on query and filters
  const searchResults = (() => {
    let results = events;

    // Apply text search
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      results = results.filter((event) => (
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.category?.toLowerCase().includes(searchLower) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        event.location?.toLowerCase().includes(searchLower)
      ));
    }

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      results = results.filter((event) => {
        const eventDate = new Date(event.date);
        if (filters.dateRange.from && filters.dateRange.to) {
          return isWithinInterval(eventDate, {
            start: startOfDay(filters.dateRange.from),
            end: endOfDay(filters.dateRange.to),
          });
        } else if (filters.dateRange.from) {
          return eventDate >= startOfDay(filters.dateRange.from);
        } else if (filters.dateRange.to) {
          return eventDate <= endOfDay(filters.dateRange.to);
        }
        return true;
      });
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      results = results.filter((event) => 
        event.category && filters.categories.includes(event.category)
      );
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      results = results.filter((event) =>
        event.tags?.some((tag) => filters.tags.includes(tag))
      );
    }

    // Apply event type filter
    if (filters.eventTypes.length > 0) {
      results = results.filter((event) =>
        filters.eventTypes.includes(event.type)
      );
    }

    return results.slice(0, 10);
  })();

  // Get unique categories and tags from events
  const uniqueCategories = categories.length > 0 
    ? categories 
    : [...new Set(events.map(e => e.category).filter(Boolean))].map(c => ({ id: c!, name: c!, color: '#888' }));
  
  const uniqueTags = tags.length > 0
    ? tags
    : [...new Set(events.flatMap(e => e.tags || []))].map(t => ({ id: t, name: t, color: '#888' }));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleSelect = (event: Event) => {
    onEventClick(event);
    setQuery("");
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleCategory = (categoryName: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName],
    }));
  };

  const toggleTag = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const toggleEventType = (type: EventType) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type],
    }));
  };

  const shouldShowResults = isOpen && (query.length > 0 || hasActiveFilters);

  return (
    <div className="flex items-center gap-2">
      <Popover open={shouldShowResults} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value || hasActiveFilters) setIsOpen(true);
              }}
              onFocus={() => (query || hasActiveFilters) && setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search events... (⌘K)"
              className="pl-9 pr-8 w-64 bg-muted/50 border-border focus:bg-card"
            />
            {(query || hasActiveFilters) && (
              <button
                onClick={() => {
                  setQuery("");
                  clearFilters();
                  setIsOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 bg-card border-border shadow-xl" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="p-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Filters</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.dateRange.from && (
                  <Badge variant="secondary" className="text-xs">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    From: {format(filters.dateRange.from, "MMM d")}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: undefined } }))}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateRange.to && (
                  <Badge variant="secondary" className="text-xs">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    To: {format(filters.dateRange.to, "MMM d")}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: undefined } }))}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.categories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {cat}
                    <button onClick={() => toggleCategory(cat)} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.eventTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs capitalize">
                    {getEventIcon(type)}
                    <span className="ml-1">{type}</span>
                    <button onClick={() => toggleEventType(type)} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {searchResults.length > 0 ? (
            <div className="max-h-80 overflow-auto">
              {searchResults.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => handleSelect(event)}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-border last:border-0 ${
                    index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="mt-0.5">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {highlightMatch(event.title, query)}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {highlightMatch(event.description, query)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                      {event.startTime && <span>• {event.startTime}</span>}
                      {event.category && (
                        <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                          {event.category}
                        </span>
                      )}
                      {event.tags && event.tags.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{event.tags.length} tags
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <SparkMascot mood="tired" size="sm" />
              <p className="text-sm text-muted-foreground mt-2">
                {hasActiveFilters ? "No events match your filters" : "No events found"}
              </p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Filter Button */}
      <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "h-9 w-9 relative",
              hasActiveFilters && "border-primary"
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Date Range */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            Date Range
          </DropdownMenuLabel>
          <div className="px-2 py-1.5 space-y-2">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "MMM d")} - {format(filters.dateRange.to, "MMM d")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                  onSelect={(range) => {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { from: range?.from, to: range?.to },
                    }));
                  }}
                  numberOfMonths={2}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <DropdownMenuSeparator />

          {/* Event Types */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
            <CheckSquare className="h-3 w-3" />
            Event Type
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.eventTypes.includes("task")}
            onCheckedChange={() => toggleEventType("task")}
          >
            <CheckSquare className="h-4 w-4 mr-2 text-primary" />
            Tasks
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.eventTypes.includes("note")}
            onCheckedChange={() => toggleEventType("note")}
          >
            <FileText className="h-4 w-4 mr-2 text-accent" />
            Notes
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.eventTypes.includes("meeting")}
            onCheckedChange={() => toggleEventType("meeting")}
          >
            <Users className="h-4 w-4 mr-2 text-secondary" />
            Meetings
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {/* Categories */}
          {uniqueCategories.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-3 w-3" />
                Categories
              </DropdownMenuLabel>
              {uniqueCategories.slice(0, 5).map(cat => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={filters.categories.includes(cat.name)}
                  onCheckedChange={() => toggleCategory(cat.name)}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Tags */}
          {uniqueTags.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                <Tag className="h-3 w-3" />
                Tags
              </DropdownMenuLabel>
              {uniqueTags.slice(0, 5).map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={filters.tags.includes(tag.name)}
                  onCheckedChange={() => toggleTag(tag.name)}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

SearchBar.displayName = "SearchBar";
