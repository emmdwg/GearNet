"use client";

import { CreateVehicleModal } from "@/components/forms/CreateVehicleModal";
import { OwnerMenu } from "@/components/ui/OwnerMenu";
import type { Vehicle } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VehicleOwnerActions({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this vehicle? Its mods, build logs, and service records will be removed too.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <OwnerMenu ownerId={vehicle.userId} onEdit={() => setEditOpen(true)} onDelete={handleDelete} label="Vehicle options" />
      <CreateVehicleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={{
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          color: vehicle.color,
          image: vehicle.image,
        }}
      />
    </>
  );
}
