import { parseJsonArray } from "@/lib/api-helpers";
import type { UserSettings as PrismaUserSettings } from "@prisma/client";

export function serializeUserSettings(settings: PrismaUserSettings) {
  return {
    ...settings,
    sceneTags: parseJsonArray(settings.sceneTags ?? "[]"),
  };
}
