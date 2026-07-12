"use client";

import { BenchActions } from "@/components/bench/BenchActions";
import { BenchHeaderCards } from "@/components/bench/BenchHeaderCards";
import { FluidSpecPanel } from "@/components/bench/FluidSpecPanel";
import { MaintenanceRemindersPanel } from "@/components/bench/MaintenanceRemindersPanel";
import { MaintenanceEntry } from "@/components/bench/MaintenanceEntry";
import { ManualLibrary } from "@/components/bench/ManualLibrary";
import { OdometerChart } from "@/components/bench/OdometerChart";
import { RecallsPanel } from "@/components/bench/RecallsPanel";
import { ShopsPanel } from "@/components/bench/ShopsPanel";
import { normalizeServiceManualsResponse } from "@/lib/manual-catalog/normalize-client";
import type { BenchSummary, MaintenanceLog, ServiceManual, Vehicle } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json() as Promise<T>;
}

/** Web Service Bench — same load flow as mobile/screens/BenchScreen.tsx */
export function ServiceBenchClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [manuals, setManuals] = useState<ServiceManual[]>([]);
  const [manualTotal, setManualTotal] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [summary, setSummary] = useState<BenchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shopFilter, setShopFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [vehicleResult, logResult, manualResult, summaryResult] = await Promise.allSettled([
      fetchJson<Vehicle[]>("/api/vehicles"),
      fetchJson<MaintenanceLog[]>("/api/maintenance"),
      fetchJson<unknown>("/api/maintenance?type=manuals"),
      fetchJson<BenchSummary>("/api/maintenance?type=summary"),
    ]);

    if (vehicleResult.status === "fulfilled") setVehicles(vehicleResult.value);
    else setVehicles([]);

    if (logResult.status === "fulfilled") setLogs(logResult.value);
    else setLogs([]);

    if (manualResult.status === "fulfilled") {
      const data = normalizeServiceManualsResponse(manualResult.value);
      setManuals(data.results);
      setManualTotal(data.total || data.vehicleTotal);
      setVehicleCount(data.vehicleCount);
    }

    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
    else setSummary(null);

    const allFailed =
      vehicleResult.status === "rejected" &&
      logResult.status === "rejected" &&
      manualResult.status === "rejected";
    setError(allFailed ? "Could not load service bench" : "");
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const filteredLogs = useMemo(
    () => (shopFilter ? logs.filter((l) => l.shopName === shopFilter) : logs),
    [logs, shopFilter]
  );

  const primaryVehicle = vehicles[0];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load().finally(() => setLoading(false));
          }}
          className="mt-4 text-sm font-medium text-amber-500 hover:text-amber-400"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Service Bench</h1>
          <p className="mt-1 text-sm text-zinc-500">Maintenance logs and repair references for your fleet</p>
        </div>
        <BenchActions vehicles={vehicles} />
      </header>

      <BenchHeaderCards summary={summary} />

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <p className="text-sm font-semibold text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {logs.filter((l) => l.vehicleId === vehicle.id).length} service records
            </p>
          </div>
        ))}
      </div>

      <ShopsPanel logs={logs} activeShop={shopFilter} onFilterShop={setShopFilter} />

      <MaintenanceRemindersPanel logs={logs} vehicleId={primaryVehicle?.id} />
      <OdometerChart logs={logs} vehicleId={primaryVehicle?.id} />
      <FluidSpecPanel vehicles={vehicles} onSaved={load} />
      {primaryVehicle ? <RecallsPanel vehicleId={primaryVehicle.id} vehicle={primaryVehicle} /> : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Maintenance Log</h2>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => <MaintenanceEntry key={log.id} log={log} />)
        ) : (
          <p className="mb-4 text-sm text-zinc-500">
            {shopFilter ? `No records for ${shopFilter}.` : "No service records yet."}
          </p>
        )}
      </section>

      <ManualLibrary
        initialManuals={manuals}
        totalCount={manualTotal}
        vehicleCount={vehicleCount}
        fleetVehicles={vehicles}
      />
    </div>
  );
}
