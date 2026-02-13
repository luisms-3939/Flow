import { useState } from "react";
import { Event, TaskStatus } from "@/types/event";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle, Clock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface KanbanViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onStatusChange: (eventId: string, newStatus: TaskStatus) => void;
}

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Event[];
  icon: React.ReactNode;
  onEventClick?: (event: Event) => void;
  onDrop: (eventId: string, newStatus: TaskStatus) => void;
  colorClass: string;
}

const KanbanColumn = ({
  title,
  status,
  tasks,
  icon,
  onEventClick,
  onDrop,
  colorClass,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId) {
      onDrop(eventId, status);
    }
  };

  return (
    <div
      className={cn(
        "flex-1 min-w-[280px] max-w-[400px] flex flex-col rounded-lg border transition-all duration-200",
        isDragOver
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border bg-card/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn("p-4 border-b border-border", colorClass)}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onEventClick?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface KanbanCardProps {
  task: Event;
  onClick: () => void;
}

const KanbanCard = ({ task, onClick }: KanbanCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const priorityColors = {
    high: "bg-destructive/20 text-destructive border-destructive/30",
    medium: "bg-warning/20 text-warning border-warning/30",
    low: "bg-success/20 text-success border-success/30",
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5",
        "bg-card border-border"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.priority && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
              )}
              {task.date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(task.date), "MMM d")}
                </span>
              )}
              {task.category && (
                <Badge variant="secondary" className="text-xs">
                  {task.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const KanbanView = ({
  events,
  onEventClick,
  onStatusChange,
}: KanbanViewProps) => {
  // Filter only tasks and group by status
  const tasks = events.filter((e) => e.type === "task");

  const getTaskStatus = (task: Event): TaskStatus => {
    // Use explicit status if available
    if (task.status) return task.status;
    // Fall back to completed flag
    if (task.completed) return "done";
    return "todo";
  };

  const todoTasks = tasks.filter((t) => getTaskStatus(t) === "todo");
  const inProgressTasks = tasks.filter(
    (t) => getTaskStatus(t) === "in_progress"
  );
  const doneTasks = tasks.filter((t) => getTaskStatus(t) === "done");

  const handleDrop = (eventId: string, newStatus: TaskStatus) => {
    onStatusChange(eventId, newStatus);
  };

  return (
    <div className="h-full">
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        <KanbanColumn
          title="To Do"
          status="todo"
          tasks={todoTasks}
          icon={<Circle className="h-5 w-5 text-muted-foreground" />}
          onEventClick={onEventClick}
          onDrop={handleDrop}
          colorClass="bg-muted/50"
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          tasks={inProgressTasks}
          icon={<Clock className="h-5 w-5 text-warning" />}
          onEventClick={onEventClick}
          onDrop={handleDrop}
          colorClass="bg-warning/10"
        />
        <KanbanColumn
          title="Done"
          status="done"
          tasks={doneTasks}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          onEventClick={onEventClick}
          onDrop={handleDrop}
          colorClass="bg-success/10"
        />
      </div>
    </div>
  );
};
