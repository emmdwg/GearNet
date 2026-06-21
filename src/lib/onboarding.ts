import { DEFAULT_AVATAR } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type OnboardingStatus = {
  hasAvatar: boolean;
  hasVehicle: boolean;
  followCount: number;
  completed: boolean;
  dismissed: boolean;
};

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [user, vehicleCount, followCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true, onboardingDismissedAt: true },
    }),
    prisma.vehicle.count({ where: { userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  const hasAvatar = Boolean(user?.avatar && user.avatar !== DEFAULT_AVATAR);
  const hasVehicle = vehicleCount > 0;
  const followGoal = followCount >= 3;
  const completed = hasAvatar && hasVehicle && followGoal;

  return {
    hasAvatar,
    hasVehicle,
    followCount,
    completed,
    dismissed: Boolean(user?.onboardingDismissedAt),
  };
}
