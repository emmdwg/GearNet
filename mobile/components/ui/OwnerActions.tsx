import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

type Props = {
  ownerId: string;
  entityLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  color?: string;
  size?: number;
};

export function OwnerActions({ ownerId, entityLabel = "item", onEdit, onDelete, color, size = 20 }: Props) {
  const { user } = useAuth();
  if (!user || user.id !== ownerId) return null;

  function openMenu() {
    Alert.alert("Options", undefined, [
      { text: "Edit", onPress: onEdit },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert(`Delete ${entityLabel}?`, "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Pressable onPress={openMenu} hitSlop={8} style={styles.btn} accessibilityLabel="Options">
      <Ionicons name="ellipsis-horizontal" size={size} color={color ?? colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
