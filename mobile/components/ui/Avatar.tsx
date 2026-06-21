import { Image, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii } from "../../lib/theme";

const sizes = { sm: 32, md: 40, lg: 64 };

type Props = {
  src: string;
  alt: string;
  size?: keyof typeof sizes;
  onPress?: () => void;
  ring?: boolean;
  style?: ViewStyle;
};

export function Avatar({ src, alt, size = "md", onPress, ring, style }: Props) {
  const dimension = sizes[size];
  const content = (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        ring && styles.ring,
        style,
      ]}
    >
      <Image source={{ uri: src }} style={styles.image} accessibilityLabel={alt} />
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  ring: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
