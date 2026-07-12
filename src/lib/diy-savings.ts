import { inferServiceType } from "@/lib/maintenance-service-type";

type LogLike = {
  category: string;
  cost?: number | null;
  shopName?: string | null;
  serviceType?: string | null;
};

export function computeDiySavings(logs: LogLike[]): { saved: number; diyCount: number; shopCount: number } {
  const byCategory = new Map<string, { diy: number[]; shop: number[] }>();

  for (const log of logs) {
    if (log.cost == null || log.cost <= 0) continue;
    const type = inferServiceType(log.shopName, log.serviceType);
    const bucket = byCategory.get(log.category) ?? { diy: [], shop: [] };
    if (type === "diy") bucket.diy.push(log.cost);
    else bucket.shop.push(log.cost);
    byCategory.set(log.category, bucket);
  }

  let saved = 0;
  let diyCount = 0;
  let shopCount = 0;

  for (const { diy, shop } of byCategory.values()) {
    diyCount += diy.length;
    shopCount += shop.length;
    if (diy.length === 0 || shop.length === 0) continue;
    const avgShop = shop.reduce((a, b) => a + b, 0) / shop.length;
    for (const diyCost of diy) {
      saved += Math.max(0, Math.round(avgShop - diyCost));
    }
  }

  return { saved, diyCount, shopCount };
}
