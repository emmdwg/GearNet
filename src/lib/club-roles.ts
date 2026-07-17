/** Club roles: one Owner, optional Admins / Associates, everyone else Members. */
export type ClubRole = "owner" | "admin" | "associate" | "member";

export const ASSIGNABLE_CLUB_ROLES = ["admin", "associate", "member"] as const;
export type AssignableClubRole = (typeof ASSIGNABLE_CLUB_ROLES)[number];

/** @deprecated Use ASSIGNABLE_CLUB_ROLES */
export const CLUB_ASSIGNABLE_ROLES = ASSIGNABLE_CLUB_ROLES;
/** @deprecated Use AssignableClubRole */
export type ClubAssignableRole = AssignableClubRole;

export function normalizeClubRole(role: string | null | undefined): ClubRole {
  if (role === "owner" || role === "admin" || role === "associate") return role;
  // Legacy "mod" maps to Associate.
  if (role === "mod") return "associate";
  return "member";
}

export function isAssignableClubRole(role: unknown): role is AssignableClubRole {
  return role === "admin" || role === "associate" || role === "member";
}

export function clubRoleRank(role: string | null | undefined): number {
  switch (normalizeClubRole(role)) {
    case "owner":
      return 4;
    case "admin":
      return 3;
    case "associate":
      return 2;
    default:
      return 1;
  }
}

/** Owner, admin, and associate can review join requests. */
export function canManageClubJoinRequests(role: string | null | undefined, isOwner: boolean): boolean {
  if (isOwner) return true;
  const normalized = normalizeClubRole(role);
  return normalized === "admin" || normalized === "owner" || normalized === "associate";
}

/** Full club manage powers — owner and admin only (not associate). */
export function canManageClub(role: string | null | undefined, isOwner: boolean): boolean {
  if (isOwner) return true;
  const normalized = normalizeClubRole(role);
  return normalized === "admin" || normalized === "owner";
}

export function clubRoleLabel(role: string): string {
  switch (normalizeClubRole(role)) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "associate":
      return "Associate";
    default:
      return "Member";
  }
}
