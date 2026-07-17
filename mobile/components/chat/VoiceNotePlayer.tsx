import { Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

type Props = {
  audioUrl: string;
  isMe?: boolean;
};

export function VoiceNotePlayer({ audioUrl, isMe }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      void sound?.unloadAsync();
    };
  }, [sound]);

  async function toggle() {
    setError("");
    try {
      if (playing && sound) {
        await sound.stopAsync();
        setPlaying(false);
        return;
      }
      const { sound: next } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(next);
      setPlaying(true);
      next.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setPlaying(false);
        }
      });
      await next.playAsync();
    } catch {
      setPlaying(false);
      setError("Couldn’t play voice note");
    }
  }

  return (
    <View>
      <Pressable
        onPress={() => void toggle()}
        style={[styles.wrap, isMe ? styles.wrapMe : styles.wrapOther]}
      >
        <Ionicons name={playing ? "pause" : "play"} size={16} color={isMe ? colors.accentText : colors.accent} />
        <Text style={[styles.label, isMe ? styles.labelMe : styles.labelOther]}>Voice message</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  wrapMe: { backgroundColor: "rgba(0,0,0,0.15)" },
  wrapOther: { backgroundColor: colors.cardMuted },
  label: { fontSize: 13, fontWeight: "500" },
  labelMe: { color: colors.accentText },
  labelOther: { color: colors.text },
  error: { fontSize: 11, color: "#f87171", marginBottom: 4 },
});
