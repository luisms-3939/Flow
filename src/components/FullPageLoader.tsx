import { SparkLoader } from "./SparkLoader";
import { cn } from "@/lib/utils";

interface FullPageLoaderProps {
  text?: string;
  className?: string;
}

export const FullPageLoader = ({ 
  text = "Loading your schedule...", 
  className 
}: FullPageLoaderProps) => {
  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-background/95 backdrop-blur-sm",
        "animate-fade-in",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        <SparkLoader size="xl" />
        
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground animate-pulse">
            {text}
          </p>
          <p className="text-sm text-muted-foreground">
            Spark is preparing everything for you
          </p>
        </div>
      </div>
    </div>
  );
};
