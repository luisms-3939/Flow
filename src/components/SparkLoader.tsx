import { SparkMascot } from "./SparkMascot";
import { cn } from "@/lib/utils";

interface SparkLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export const SparkLoader = ({ size = "md", text, className }: SparkLoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Spinning ring around Spark */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        
        {/* Spark mascot with pulse animation */}
        <div className="animate-pulse">
          <SparkMascot mood="doing" size={size} />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
