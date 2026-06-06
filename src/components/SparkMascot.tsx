import { cn } from "@/lib/utils";
import sparkIdle from "@/assets/spark_idle.svg";
import sparkDoing from "@/assets/spark_doing.svg";
import sparkWellDone from "@/assets/spark_well_done.svg";
import spark from "@/assets/spark.svg";

type SparkMood = "idle" | "tired" | "doing" | "wellDone";

interface SparkMascotProps {
  mood?: SparkMood;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const moodImages: Record<SparkMood, string> = {
  idle: spark,
  tired: sparkIdle,
  doing: sparkDoing,
  wellDone: sparkWellDone,
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export const SparkMascot = ({ mood = "idle", className, size = "md" }: SparkMascotProps) => {
  return (
    <img
      src={moodImages[mood]}
      alt={`Spark mascot - ${mood}`}
      className={cn(
        sizeClasses[size],
        "object-contain transition-transform duration-300 hover:scale-110",
        className
      )}
    />
  );
};
