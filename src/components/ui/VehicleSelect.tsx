"use client";

import type { Vehicle } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (vehicleId: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function VehicleSelect({ value, onChange, allowEmpty, emptyLabel = "None", className = "" }: Props) {
  const [vehicles, setVehicles] = useState<Pick<Vehicle, "id" | "year" | "make" | "model">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none";

  if (loading) {
    return <select disabled className={`${inputClass} ${className}`}><option>Loading garage...</option></select>;
  }

  if (vehicles.length === 0) {
    return <p className="text-sm text-zinc-500">Add a vehicle in your garage to tag it on posts.</p>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.year} {v.make} {v.model}
        </option>
      ))}
    </select>
  );
}
