import { DefaultTheme } from "@react-navigation/native";

/** Sharper dark + amber — shared with web (globals.css). */
export const colors = {
  background: "#0c0c0f",
  card: "#141418",
  cardMuted: "rgba(20, 20, 24, 0.72)",
  border: "#2a2a30",
  borderLight: "#3f3f46",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  textDim: "#a1a1aa",
  textFaint: "#71717a",
  accent: "#f59e0b",
  accentDark: "#d97706",
  accentText: "#0c0c0f",
  danger: "#f87171",
  success: "#4ade80",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export const sharedStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  /** Extra scroll clearance so last CTAs clear home indicator / gesture bar. */
  listContentPadding: {
    paddingBottom: spacing.xl + spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden" as const,
  },
  amberButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  amberButtonText: {
    color: colors.accentText,
    fontWeight: "600" as const,
    fontSize: 14,
  },
  outlineButton: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  outlineButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
};
