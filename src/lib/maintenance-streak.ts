const STREAK_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export function nextMaintenanceStreak(
  currentStreak: number,
  lastMaintenanceAt: Date | null | undefined,
  performedAt: Date,
): { maintenanceStreak: number; lastMaintenanceAt: Date } {
  if (!lastMaintenanceAt) {
    return { maintenanceStreak: 1, lastMaintenanceAt: performedAt };
  }

  const gap = performedAt.getTime() - lastMaintenanceAt.getTime();
  const maintenanceStreak = gap <= STREAK_WINDOW_MS ? currentStreak + 1 : 1;
  return { maintenanceStreak, lastMaintenanceAt: performedAt };
}

export function streakEncouragement(streak: number): string {
  if (streak >= 12) return "You're a maintenance machine — keep the fleet running strong.";
  if (streak >= 6) return "Half a year of consistent care. Your cars thank you.";
  if (streak >= 3) return "Nice rhythm — staying ahead of wear saves money later.";
  if (streak >= 1) return "Log the next service within 90 days to grow your streak.";
  return "Log your first service to start a streak.";
}
