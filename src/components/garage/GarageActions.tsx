"use client";

import { CreateVehicleModal } from "@/components/forms/CreateVehicleModal";
import { ManageGarageModal } from "@/components/forms/ManageGarageModal";
import type { Vehicle } from "@/lib/types";
import { Bookmark, Plus, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useState } from "react";

type Props = {
  vehicles: Vehicle[];
  username: string;
};

export function GarageActions({ vehicles, username }: Props) {
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  function requireAuth(action: () => void) {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/garage";
      return;
    }
    action();
  }

  return (
    <>
      <div className="flex gap-2">
        <Link
          href="/saved"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          <Bookmark className="h-4 w-4" />
          Saved
        </Link>
        <button
          type="button"
          onClick={() => requireAuth(() => setManageOpen(true))}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Manage
        </button>
        <button
          type="button"
          onClick={() => requireAuth(() => setAddOpen(true))}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>
      <CreateVehicleModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ManageGarageModal open={manageOpen} onClose={() => setManageOpen(false)} vehicles={vehicles} username={username} />
    </>
  );
}
