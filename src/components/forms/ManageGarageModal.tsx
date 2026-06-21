"use client";

import { Modal } from "@/components/ui/Modal";
import type { Vehicle } from "@/lib/types";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  username: string;
};

export function ManageGarageModal({ open, onClose, vehicles, username }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Manage Garage">
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} ·{" "}
          {vehicles.reduce((a, v) => a + v.mods.length, 0)} mods ·{" "}
          {vehicles.reduce((a, v) => a + v.buildLogs.length, 0)} build logs
        </p>
        <div className="space-y-2">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="font-medium text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-xs text-zinc-500">
                {vehicle.mods.length} mods · {vehicle.buildLogs.length} build logs · {vehicle.color}
              </p>
            </div>
          ))}
        </div>
        <Link
          href={`/profile/${username}`}
          onClick={onClose}
          className="block rounded-lg border border-zinc-700 px-4 py-2 text-center text-sm text-zinc-300 hover:border-zinc-600 hover:text-white"
        >
          View public profile
        </Link>
        <Link
          href={`/garage/${username}`}
          onClick={onClose}
          className="block rounded-lg bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          View public garage
        </Link>
      </div>
    </Modal>
  );
}
