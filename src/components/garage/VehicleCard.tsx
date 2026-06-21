import type { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { VehicleOwnerActions } from "@/components/garage/VehicleOwnerActions";
import { Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function VehicleCard({ vehicle, username }: { vehicle: Vehicle; username?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700">
      <div className="relative aspect-[16/10] bg-zinc-800">
        <Image
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.trim && <p className="text-sm text-zinc-500">{vehicle.trim} · {vehicle.color}</p>}
          </div>
          <VehicleOwnerActions vehicle={vehicle} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {vehicle.mods.slice(0, 3).map((mod) => (
            <Badge key={mod.id} variant="outline">
              {mod.name}
            </Badge>
          ))}
          {vehicle.mods.length > 3 && (
            <Badge variant="outline">+{vehicle.mods.length - 3} more</Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {vehicle.mods.length} mods · {vehicle.buildLogs.length} build logs
          </span>
          {username && (
            <Link href={`/garage/${username}`} className="text-amber-400 hover:underline">
              View garage
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function BuildLogCard({ log }: { log: Vehicle["buildLogs"][0] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white">{log.title}</h4>
          <p className="mt-1 text-sm text-zinc-400">{log.content}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {new Date(log.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {log.image && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            <Image src={log.image} alt={log.title} fill className="object-cover" sizes="96px" />
          </div>
        )}
      </div>
    </div>
  );
}
