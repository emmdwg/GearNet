import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent" | "outline";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-zinc-800 text-zinc-300",
        variant === "accent" && "bg-amber-500/15 text-amber-400",
        variant === "outline" && "border border-zinc-700 text-zinc-400",
        className
      )}
    >
      {children}
    </span>
  );
}
