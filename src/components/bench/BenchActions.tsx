"use client";

import { CreateMaintenanceModal } from "@/components/forms/CreateMaintenanceModal";
import type { Vehicle } from "@/lib/types";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

type Props = { vehicles: Pick<Vehicle, "id" | "year" | "make" | "model">[] };

export function BenchActions({ vehicles }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!user) {
      window.location.href = "/auth/signin?callbackUrl=/bench";
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
      >
        <Plus className="h-4 w-4" />
        Log Service
      </button>
      <CreateMaintenanceModal open={open} onClose={() => setOpen(false)} vehicles={vehicles} />
    </>
  );
}
