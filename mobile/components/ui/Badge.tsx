import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radii } from "../../lib/theme";

type Props = {
  children: string;
  variant?: "default" | "accent" | "outline";
  style?: ViewStyle;
};

export function Badge({ children, variant = "default", style }: Props) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  default: {
    backgroundColor: colors.border,
  },
  accent: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
  },
  defaultText: {
    color: colors.textMuted,
  },
  accentText: {
    color: colors.accent,
  },
  outlineText: {
    color: colors.textDim,
  },
});
