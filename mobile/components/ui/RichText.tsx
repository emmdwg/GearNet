import type { StyleProp, TextStyle } from "react-native";
import { Text } from "react-native";
import { colors } from "../../lib/theme";

const TOKEN = /([#@][A-Za-z0-9_]+)/g;

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  onPressTag?: (tag: string) => void;
  onPressMention?: (username: string) => void;
};

export function RichText({ text, style, onPressTag, onPressMention }: Props) {
  const parts = text.split(TOKEN);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
          return (
            <Text key={i} style={{ color: colors.accent }} onPress={() => onPressTag?.(part.slice(1))}>
              {part}
            </Text>
          );
        }
        if (part.startsWith("@") && part.length > 1) {
          return (
            <Text key={i} style={{ color: colors.accent }} onPress={() => onPressMention?.(part.slice(1))}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}
