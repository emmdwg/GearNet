import { clubRoleLabel, normalizeClubRole } from "@/lib/club-roles";
import { cn } from "@/lib/utils";

export function ClubRoleBadge({ role }: { role: string }) {
  const normalized = normalizeClubRole(role);
  return (
    <span
      className={cn(
        "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        normalized === "owner"
          ? "bg-amber-500/20 text-amber-400"
          : normalized === "admin"
            ? "bg-zinc-700 text-zinc-200"
            : normalized === "associate"
              ? "bg-zinc-800 text-zinc-400"
              : "bg-zinc-900 text-zinc-500",
      )}
    >
      {clubRoleLabel(normalized)}
    </span>
  );
}
