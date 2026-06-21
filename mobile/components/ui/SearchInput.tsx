import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, radii } from "../../lib/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChangeText, placeholder = "Search..." }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={16} color={colors.textDim} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    marginBottom: 16,
  },
  icon: {
    position: "absolute",
    left: 12,
    top: 13,
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 11,
    paddingLeft: 38,
    paddingRight: 14,
    color: colors.text,
    fontSize: 14,
  },
});
