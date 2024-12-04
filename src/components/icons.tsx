import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

export function IconRankovo({ className }: { className?: string }) {
  return <Crown className={cn("text-primary", className)} />;
}
