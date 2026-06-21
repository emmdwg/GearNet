import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../lib/theme";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  text: {
    color: colors.textDim,
    fontSize: 14,
  },
});
