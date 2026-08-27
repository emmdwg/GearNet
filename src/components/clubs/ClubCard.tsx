import { Badge } from "@/components/ui/Badge";
import type { Club } from "@/lib/types";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="flex gap-3 overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3 transition hover:border-zinc-700"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        {club.image ? (
          <Image src={club.image} alt="" fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-amber-500">
            <Users className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{club.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{club.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {club.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
          <span className="text-[11px] text-zinc-500">
            {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
          </span>
          {club.city ? <span className="text-[11px] text-zinc-600">{club.city}</span> : null}
          {club.requiresApproval ? <span className="text-[11px] text-amber-500/80">Approval</span> : null}
        </div>
      </div>
    </Link>
  );
}
