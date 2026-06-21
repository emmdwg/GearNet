import { BuildLogCard, VehicleCard } from "@/components/garage/VehicleCard";
import { GarageActions } from "@/components/garage/GarageActions";
import { getSession } from "@/lib/session";
import { getUserVehicles } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function GaragePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/auth/signin");

  const userVehicles = await getUserVehicles(user.id);
  const allBuildLogs = userVehicles.flatMap((v) => v.buildLogs);
  const totalMods = userVehicles.reduce((a, v) => a + v.mods.length, 0);
  const coverImage = userVehicles[0]?.image ?? null;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="relative h-44 overflow-hidden bg-zinc-900 sm:h-56">
        {coverImage ? (
          <Image src={coverImage} alt="" fill sizes="900px" className="scale-105 object-cover opacity-45" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Digital Garage</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{user.displayName}&apos;s Garage</h1>
          </div>
          <GarageActions vehicles={userVehicles} username={user.username} />
        </div>
      </div>

      <div className="px-4">
        <div className="-mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-center backdrop-blur sm:gap-3">
          <div className="py-1">
            <p className="text-xl font-bold text-white">{userVehicles.length}</p>
            <p className="text-xs text-zinc-500">Vehicles</p>
          </div>
          <div className="py-1">
            <p className="text-xl font-bold text-white">{totalMods}</p>
            <p className="text-xs text-zinc-500">Mods</p>
          </div>
          <div className="py-1">
            <p className="text-xl font-bold text-white">{allBuildLogs.length}</p>
            <p className="text-xs text-zinc-500">Build Logs</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-8">
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">My Vehicles</h2>
        {userVehicles.length === 0 ? (
          <p className="text-sm text-zinc-500">No vehicles yet. Add your first ride to get started.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {userVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} username={user.username} />
            ))}
          </div>
        )}
      </section>

      {userVehicles.some((v) => v.mods.length > 0) && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Modifications</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-left text-zinc-500">
                  <th className="px-4 py-3 font-medium">Part</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Installed</th>
                </tr>
              </thead>
              <tbody>
                {userVehicles.flatMap((vehicle) =>
                  vehicle.mods.map((mod) => (
                    <tr key={mod.id} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="px-4 py-3 font-medium text-white">{mod.name}</td>
                      <td className="px-4 py-3">{mod.category}</td>
                      <td className="px-4 py-3">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(mod.installedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {allBuildLogs.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Build Logs</h2>
          <div className="space-y-3">
            {allBuildLogs.map((log) => (
              <BuildLogCard key={log.id} log={log} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 text-center">
        <Link href={`/profile/${user.username}`} className="text-sm text-amber-400 hover:underline">
          View public profile →
        </Link>
      </div>
      </div>
    </div>
  );
}
