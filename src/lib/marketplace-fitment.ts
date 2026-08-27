export type FitmentMatch = {
  vehicleId: string;
  year: number;
  make: string;
  model: string;
  label?: string;
  matched?: boolean;
  match: "exact" | "partial" | "none";
  reason?: string;
};

export function tagMatchesVehicle(tag: string, year: number, make: string, model: string) {
  const t = tag.toLowerCase();
  const hay = `${year} ${make} ${model}`.toLowerCase();
  if (hay.includes(t) || t.includes(make.toLowerCase())) return true;
  const tokens = t.split(/[\s,/]+/).filter(Boolean);
  return tokens.some((tok) => hay.includes(tok) && tok.length > 2);
}
