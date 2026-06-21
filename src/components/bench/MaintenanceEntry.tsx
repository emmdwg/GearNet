import { Badge } from "@/components/ui/Badge";
import { BookOpen, Gauge } from "lucide-react";

type MaintenanceLogData = {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  mileage: number;
  cost?: number;
  performedAt: string;
  category: string;
  vehicle?: { year: number; make: string; model: string };
};

type ServiceManualData = {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  yearRange: string;
  title: string;
  sections: string[];
};

export function MaintenanceEntry({ log }: { log: MaintenanceLogData }) {
  const vehicle = log.vehicle;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-white">{log.title}</h4>
          {vehicle && (
            <p className="text-xs text-zinc-500">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          )}
        </div>
        <Badge variant="outline">{log.category}</Badge>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{log.description}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          {log.mileage.toLocaleString()} mi
        </span>
        {log.cost !== undefined && log.cost > 0 && <span>${log.cost}</span>}
        <span>
          {new Date(log.performedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export function ManualCard({ manual }: { manual: ServiceManualData }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <BookOpen className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-white">{manual.title}</h4>
          <p className="text-sm text-zinc-500">
            {manual.vehicleMake} {manual.vehicleModel} ({manual.yearRange})
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {manual.sections.map((section) => (
              <Badge key={section} variant="outline">
                {section}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
