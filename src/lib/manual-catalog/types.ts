import type { ServiceManual } from "@/lib/types";

export type ManualCatalogEntry = ServiceManual & {
  searchText?: string;
};

export type ManualSuggestion = {
  id: string;
  label: string;
  subtitle: string;
  query: string;
};

export type ManualSearchResult = {
  suggestions: ManualSuggestion[];
  results: ManualCatalogEntry[];
  total: number;
  vehicleTotal: number;
  phase: number;
};

export type VehicleTuple = [make: string, model: string, year: number];

export type VehicleIndexFile = {
  phase: number;
  generatedAt: string;
  startYear: number;
  endYear: number;
  vehicleCount: number;
  makeCount: number;
  note?: string;
  vehicles: VehicleTuple[];
};
