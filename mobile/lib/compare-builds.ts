import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { API_URL } from "./api";
import type { Vehicle } from "./types";

export function buildCompareShareUrl(vehicleAId: string, vehicleBId: string) {
  const base = API_URL;
  return `${base}/garage/compare?a=${encodeURIComponent(vehicleAId)}&b=${encodeURIComponent(vehicleBId)}`;
}

function columnHtml(vehicle: Vehicle) {
  const installed = vehicle.mods.filter((m) => m.status !== "planned");
  const dyno = vehicle.buildLogs.find((l) => l.dynoHp);
  return `
    <div style="flex:1;min-width:0">
      <h2 style="color:#f59e0b;margin:0 0 12px;font-size:18px">${vehicle.year} ${vehicle.make} ${vehicle.model}</h2>
      <p style="color:#a1a1aa;font-size:11px;text-transform:uppercase;margin:0 0 8px">Installed (${installed.length})</p>
      <ul style="margin:0;padding-left:18px;color:#d4d4d8;font-size:13px">
        ${installed.slice(0, 8).map((m) => `<li>${m.name}</li>`).join("")}
      </ul>
      ${dyno ? `<p style="color:#fbbf24;font-size:12px;margin-top:12px">Dyno: ${dyno.dynoHp ?? "?"} hp</p>` : ""}
    </div>`;
}

export async function exportCompareCard(vehicleA: Vehicle, vehicleB: Vehicle) {
  const html = `<html><body style="font-family:sans-serif;background:#09090b;color:#fff;padding:32px">
    <h1 style="margin:0 0 24px">Build Compare</h1>
    <div style="display:flex;gap:24px">${columnHtml(vehicleA)}${columnHtml(vehicleB)}</div>
    <p style="color:#71717a;margin-top:32px;font-size:12px">gearnetapp.com</p>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Compare Builds" });
  }
}
