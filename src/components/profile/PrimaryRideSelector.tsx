"use client";

import { VehicleSelect } from "@/components/ui/VehicleSelect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PrimaryRideSelector({ currentId }: { currentId?: string | null }) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(currentId ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setVehicleId(currentId ?? "");
  }, [currentId]);

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/users/me/primary-vehicle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehicleId || null }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setMessage("Primary ride updated");
      router.refresh();
    } catch {
      setMessage("Could not update primary ride");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-zinc-500">Featured on your profile header</p>
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <VehicleSelect value={vehicleId} onChange={setVehicleId} allowEmpty emptyLabel="None selected" />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
