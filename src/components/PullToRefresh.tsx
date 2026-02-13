import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) => {
  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
    isReady,
  } = usePullToRefresh({ onRefresh });

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center",
          "transition-opacity duration-200",
          pullDistance > 10 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 40, 8),
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            "bg-card border border-border shadow-lg",
            isReady || isRefreshing ? "bg-primary/10" : "bg-card"
          )}
        >
          <RefreshCw
            className={cn(
              "h-5 w-5 transition-all duration-200",
              isRefreshing && "animate-spin",
              isReady ? "text-primary" : "text-muted-foreground"
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${progress * 180}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform:
            isPulling || isRefreshing
              ? `translateY(${pullDistance}px)`
              : "translateY(0)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
