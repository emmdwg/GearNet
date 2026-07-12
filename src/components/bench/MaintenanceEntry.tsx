import { Badge } from "@/components/ui/Badge";
import { BookOpen, ExternalLink, Gauge, Wrench } from "lucide-react";

type MaintenanceLogData = {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  mileage: number;
  cost?: number;
  performedAt: string;
  category: string;
  difficulty?: number;
  vehicle?: { year: number; make: string; model: string };
};

type ServiceManualData = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  title: string;
  sections: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  manualType?: string;
};

export function MaintenanceEntry({ log }: { log: MaintenanceLogData }) {
  const vehicle = log.vehicle;

  return (
    <div className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-medium text-white">{log.title}</h4>
          {vehicle ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          ) : null}
        </div>
        <Badge variant="outline">{log.category}</Badge>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{log.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          {log.mileage.toLocaleString()} mi
        </span>
        {log.difficulty ? (
          <span className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: log.difficulty }).map((_, i) => (
              <Wrench key={i} className="h-3 w-3" />
            ))}
          </span>
        ) : null}
        {log.cost !== undefined && log.cost > 0 ? <span>${log.cost}</span> : null}
        <span>
          {new Date(log.performedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export function ManualCard({ manual }: { manual: ServiceManualData }) {
  if (!manual.sourceUrl) return null;

  return (
    <a
      href={manual.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-opacity hover:opacity-90"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <BookOpen className="h-5 w-5 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-white">{manual.title}</h4>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {manual.vehicleMake} {manual.vehicleModel} ({manual.yearRange})
        </p>
        {manual.sourceLabel ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-500">
            <ExternalLink className="h-3 w-3" />
            Open manual · {manual.sourceLabel}
          </p>
        ) : null}
      </div>
    </a>
  );
}
