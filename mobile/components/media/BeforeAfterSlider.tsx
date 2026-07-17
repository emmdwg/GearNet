import { useCallback, useRef, useState } from "react";
import { Image, PanResponder, StyleSheet, Text, View } from "react-native";

type Props = {
  before: string;
  after: string;
  width: number;
  height?: number;
};

export function BeforeAfterSlider({ before, after, width, height }: Props) {
  const mediaHeight = height ?? width * (5 / 4);
  const [position, setPosition] = useState(50);
  const widthRef = useRef(width);
  widthRef.current = width;

  const updatePosition = useCallback((x: number) => {
    const pct = Math.min(100, Math.max(0, (x / widthRef.current) * 100));
    setPosition(pct);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updatePosition(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updatePosition(e.nativeEvent.locationX),
    })
  ).current;

  return (
    <View {...pan.panHandlers} style={{ width, height: mediaHeight, backgroundColor: "#18181b" }}>
      <Image source={{ uri: after }} style={{ width, height: mediaHeight }} resizeMode="cover" />
      <View style={[styles.beforeClip, { width: `${position}%` }]}>
        <Image source={{ uri: before }} style={{ width, height: mediaHeight }} resizeMode="cover" />
      </View>
      <View style={[styles.handle, { left: `${position}%` }]}>
        <View style={styles.handleKnob}>
          <Text style={styles.handleText}>↔</Text>
        </View>
      </View>
      <Text style={[styles.label, styles.labelLeft]}>Before</Text>
      <Text style={[styles.label, styles.labelRight]}>After</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  beforeClip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#fff",
    marginLeft: -1,
    zIndex: 2,
    justifyContent: "center",
  },
  handleKnob: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -15,
  },
  handleText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  label: {
    position: "absolute",
    top: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 3,
  },
  labelLeft: { left: 8 },
  labelRight: { right: 8 },
});
