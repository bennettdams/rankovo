import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

export function IconRankovo({ className }: { className?: string }) {
  return (
    <Crown
      className={cn(
        "rotate-[-10deg] text-primary drop-shadow-lg transition-transform hover:rotate-12",
        className,
      )}
    />
  );
}
