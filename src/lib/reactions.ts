export type ReactionType = "like" | "fire" | "wrench" | "want" | "clean";

export const REACTION_TYPES: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "🔥", label: "Flame" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "wrench", emoji: "🔧", label: "Wrench" },
  { type: "want", emoji: "👀", label: "Want" },
  { type: "clean", emoji: "✨", label: "Clean" },
];

export function isReactionType(value: string): value is ReactionType {
  return REACTION_TYPES.some((r) => r.type === value);
}

export function reactionEmoji(type: ReactionType): string {
  return REACTION_TYPES.find((r) => r.type === type)?.emoji ?? "🔥";
}

export type ReactionCounts = Partial<Record<ReactionType, number>>;

export function emptyReactionCounts(): ReactionCounts {
  return {};
}

export function sumReactionCounts(counts: ReactionCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
}
