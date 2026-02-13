import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Clock, 
  Target, 
  Flame, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  Timer,
  BarChart3,
} from "lucide-react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useProductivityAnalytics } from "@/hooks/useProductivityAnalytics";
import { Event } from "@/types/event";
import { cn } from "@/lib/utils";

interface ProductivityAnalyticsProps {
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  className 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  subValue?: string;
  className?: string;
}) => (
  <Card className={cn("p-3 bg-muted/50", className)}>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: {entry.value} min
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProductivityAnalytics = ({ 
  events, 
  isOpen, 
  onClose 
}: ProductivityAnalyticsProps) => {
  const { sessions, isLoading } = useFocusSessions();
  const { 
    currentWeekData, 
    currentMonthData, 
    categoryBreakdown, 
    summary 
  } = useProductivityAnalytics(sessions, events);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Productivity Analytics
          </DialogTitle>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Clock}
            label="Total Focus Time"
            value={formatMinutes(summary.totalMinutes)}
          />
          <StatCard
            icon={Target}
            label="Sessions"
            value={summary.totalSessions}
            subValue={`${summary.completedSessions} completed`}
          />
          <StatCard
            icon={Timer}
            label="Avg Session"
            value={`${summary.averageSessionLength}m`}
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${summary.currentStreak} days`}
          />
        </div>

        <Tabs defaultValue="weekly" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="weekly" className="flex-1 gap-1">
              <Calendar className="h-4 w-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 gap-1">
              <TrendingUp className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 gap-1">
              <Target className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Weekly View */}
          <TabsContent value="weekly" className="mt-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Focus Time by Day
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentWeekData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      className="stroke-border" 
                    />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="totalMinutes" 
                      name="Focus Time"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Daily breakdown */}
              <div className="mt-4 grid grid-cols-7 gap-1">
                {currentWeekData.map((day) => (
                  <div 
                    key={day.date}
                    className={cn(
                      "text-center p-2 rounded-md text-xs",
                      day.completed > 0 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <div className="font-medium">{day.day}</div>
                    <div>{day.sessions} sess</div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Monthly View */}
          <TabsContent value="monthly" className="mt-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Weekly Trends (Last 4 Weeks)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentMonthData}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      className="stroke-border"
                    />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="totalMinutes"
                      name="Focus Time"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorMinutes)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly stats */}
              <div className="mt-4 space-y-2">
                {currentMonthData.map((week, i) => (
                  <div 
                    key={week.weekLabel}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Week of {week.weekLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {formatMinutes(week.totalMinutes)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {week.sessions} sessions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Categories View */}
          <TabsContent value="categories" className="mt-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Time by Category (Last 30 Days)
              </h4>
              
              {categoryBreakdown.length > 0 ? (
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Pie Chart */}
                  <div className="h-48 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="totalMinutes"
                          nameKey="category"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={entry.category} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value} min`, 'Focus Time']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / List */}
                  <div className="flex-1 space-y-2">
                    {categoryBreakdown.map((cat) => (
                      <div 
                        key={cat.category}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm">{cat.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatMinutes(cat.totalMinutes)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cat.sessions} sessions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No focus sessions in the last 30 days</p>
                  <p className="text-xs">Start focusing to see your category breakdown!</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights */}
        {summary.totalSessions > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20 mt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Productivity Insight</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.currentStreak > 0 
                    ? `You're on a ${summary.currentStreak}-day focus streak! Keep it up!`
                    : summary.longestSession > 0 
                      ? `Your longest session was ${summary.longestSession} minutes. Try to beat it!`
                      : "Start a focus session to build your productivity streak!"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
