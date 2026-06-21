import { BuildLogCard, VehicleCard } from "@/components/garage/VehicleCard";
import { getUserByUsername, getUserVehicles } from "@/lib/db";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function UserGaragePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

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
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Digital Garage</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{user.displayName}&apos;s Garage</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-zinc-300">
            <MapPin className="h-3.5 w-3.5" />
            {user.location}
          </p>
        </div>
      </div>

      <div className="px-4">
        <div className="-mt-6 mb-8 grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-center backdrop-blur sm:gap-3">
          <div className="py-1">
            <p className="text-xl font-bold text-white">{userVehicles.length}</p>
            <p className="text-xs text-zinc-500">Vehicles</p>
          </div>
          <div className="py-1">
            <p className="text-xl font-bold text-white">{totalMods}</p>
            <p className="text-xs text-zinc-500">Mods</p>
          </div>
          <Link href={`/profile/${user.username}`} className="rounded-xl py-1 transition-colors hover:bg-zinc-800/60">
            <p className="text-xl font-bold text-white">{allBuildLogs.length}</p>
            <p className="text-xs text-zinc-500">Build Logs</p>
          </Link>
        </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {userVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {allBuildLogs.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Build Logs</h2>
          <div className="space-y-3">
            {allBuildLogs.map((log) => (
              <BuildLogCard key={log.id} log={log} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
