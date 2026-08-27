export type ImageAdjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export type ImageFilterId = "none" | "vivid" | "warm" | "cool" | "fade" | "mono";

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export const FILTER_PRESETS: { id: ImageFilterId; label: string; adjustments: ImageAdjustments }[] = [
  { id: "none", label: "Normal", adjustments: { brightness: 100, contrast: 100, saturation: 100 } },
  { id: "vivid", label: "Vivid", adjustments: { brightness: 102, contrast: 112, saturation: 128 } },
  { id: "warm", label: "Warm", adjustments: { brightness: 105, contrast: 104, saturation: 118 } },
  { id: "cool", label: "Cool", adjustments: { brightness: 98, contrast: 106, saturation: 92 } },
  { id: "fade", label: "Fade", adjustments: { brightness: 108, contrast: 88, saturation: 90 } },
  { id: "mono", label: "Mono", adjustments: { brightness: 100, contrast: 110, saturation: 0 } },
];

export function filterPreviewOverlay(id: ImageFilterId): { color: string; opacity: number } | null {
  if (id === "warm") return { color: "#ff9a3c", opacity: 0.12 };
  if (id === "cool") return { color: "#3b82f6", opacity: 0.1 };
  if (id === "fade") return { color: "#ffffff", opacity: 0.14 };
  if (id === "mono") return { color: "#808080", opacity: 0.35 };
  if (id === "vivid") return { color: "#f59e0b", opacity: 0.06 };
  return null;
}

export function isDefaultAdjustments(adj: ImageAdjustments) {
  return adj.brightness === 100 && adj.contrast === 100 && adj.saturation === 100;
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
