import { MaintenanceEntry, ManualCard } from "@/components/bench/MaintenanceEntry";
import { BenchActions } from "@/components/bench/BenchActions";
import { getSession } from "@/lib/session";
import { getMaintenanceLogs, getServiceManuals, getUserVehicles } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ServiceBenchPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const [userVehicles, userLogs, manuals] = await Promise.all([
    getUserVehicles(session.user.id),
    getMaintenanceLogs(session.user.id),
    getServiceManuals(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Bench</h1>
          <p className="text-sm text-zinc-500">Maintenance logs and repair references for your fleet</p>
        </div>
        <BenchActions vehicles={userVehicles} />
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {userVehicles.map((vehicle) => (
          <div key={vehicle.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="font-semibold text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {userLogs.filter((l) => l.vehicleId === vehicle.id).length} service records
            </p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Maintenance Log</h2>
        <div className="space-y-3">
          {userLogs.length > 0 ? (
            userLogs.map((log) => <MaintenanceEntry key={log.id} log={log} />)
          ) : (
            <p className="text-sm text-zinc-500">No service records yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Reference Manuals</h2>
        <p className="mb-4 text-sm text-zinc-500">Community-sourced repair guides tailored to popular platforms</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {manuals.map((manual) => (
            <ManualCard key={manual.id} manual={manual} />
          ))}
        </div>
      </section>
    </div>
  );
}
