export const SCENE_TAGS = [
  { id: "jdm", label: "JDM" },
  { id: "euro", label: "Euro" },
  { id: "muscle", label: "Muscle" },
  { id: "stance", label: "Stance" },
  { id: "track", label: "Track / HPDE" },
  { id: "offroad", label: "Off-Road" },
  { id: "classic", label: "Classic" },
  { id: "truck", label: "Trucks" },
  { id: "motorcycle", label: "Motorcycle" },
  { id: "ev", label: "EV" },
] as const;

export type SceneTagId = (typeof SCENE_TAGS)[number]["id"];
