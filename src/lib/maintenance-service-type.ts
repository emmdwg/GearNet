export type ServiceType = "diy" | "shop";

const DIY_NAMES = new Set(["diy", "self", "home", "garage"]);

export function inferServiceType(shopName?: string | null, explicit?: string | null): ServiceType {
  if (explicit === "diy" || explicit === "shop") return explicit;
  const trimmed = shopName?.trim();
  if (!trimmed) return "diy";
  if (DIY_NAMES.has(trimmed.toLowerCase())) return "diy";
  return "shop";
}

export function isDiyLog(shopName?: string | null, serviceType?: string | null): boolean {
  return inferServiceType(shopName, serviceType) === "diy";
}
