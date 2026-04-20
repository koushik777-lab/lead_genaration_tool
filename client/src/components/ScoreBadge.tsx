import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  category: string;
  score?: number;
  className?: string;
}

export default function ScoreBadge({ category, score, className }: ScoreBadgeProps) {
  const styles = {
    Hot: "bg-red-500/15 text-red-400 border-red-500/20",
    Warm: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Cold: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };

  const dots = {
    Hot: "bg-red-400",
    Warm: "bg-amber-400",
    Cold: "bg-blue-400",
  };

  const style = styles[category as keyof typeof styles] ?? styles.Cold;
  const dot = dots[category as keyof typeof dots] ?? dots.Cold;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", style, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {category}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
