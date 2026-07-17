import { Ionicons } from "@expo/vector-icons";
import { Audio, Video, ResizeMode } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { VideoChapter } from "../../lib/types";
import { isVideoPost } from "../../lib/post-media";
import { colors } from "../../lib/theme";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

type PostMediaData = {
  image: string;
  images?: string[];
  caption: string;
  mediaType?: string;
  videoUrl?: string;
  videoDuration?: number;
  videoPoster?: string;
  videoChapters?: VideoChapter[];
  postType?: string;
  beforeImage?: string | null;
  afterImage?: string | null;
  audioUrl?: string | null;
};

type Props = {
  post: PostMediaData;
  variant?: "card" | "viewer";
  width?: number;
  onPress?: () => void;
};

const WAVE_HEIGHTS = [0.35, 0.65, 0.45, 0.85, 0.55, 0.75, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9];

function Waveform({ playing }: { playing: boolean }) {
  return (
    <View style={styles.waveform}>
      {WAVE_HEIGHTS.map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveBar,
            { height: 4 + h * 14, opacity: playing && i % 2 === 0 ? 1 : playing ? 0.7 : 0.45 },
          ]}
        />
      ))}
    </View>
  );
}

function AudioBar({
  audioPlaying,
  onPress,
}: {
  audioPlaying: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.audioBar} onPress={onPress}>
      <Ionicons name={audioPlaying ? "pause" : "volume-high"} size={16} color={colors.accent} />
      <Waveform playing={audioPlaying} />
      <Text style={styles.audioText}>Rev clip / sound check</Text>
    </Pressable>
  );
}

function ChapterBar({
  chapters,
  duration,
  onSeek,
}: {
  chapters: VideoChapter[];
  duration?: number;
  onSeek: (timeSec: number) => void;
}) {
  if (!chapters.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterRow}>
      {chapters.map((ch) => (
        <Pressable key={`${ch.timeSec}-${ch.label}`} style={styles.chapterChip} onPress={() => onSeek(ch.timeSec)}>
          <Text style={styles.chapterTime}>{ch.timeSec}s</Text>
          <Text style={styles.chapterLabel}>{ch.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function MixedVideoPhotoCarousel({
  post,
  videoUrl,
  videoPoster,
  images,
  variant,
  mediaWidth,
  mediaHeight,
  onPress,
}: {
  post: PostMediaData;
  videoUrl: string;
  videoPoster?: string;
  images: string[];
  variant: "card" | "viewer";
  mediaWidth: number;
  mediaHeight: number;
  onPress?: () => void;
}) {
  const videoRef = useRef<Video>(null);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const slideCount = 1 + images.length;
  const chapters = post.videoChapters ?? [];

  async function seekVideo(timeSec: number) {
    await videoRef.current?.setPositionAsync(timeSec * 1000);
    await videoRef.current?.playAsync();
    setPlaying(true);
  }

  return (
    <View>
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const nextPage = Math.round(x / mediaWidth);
            if (nextPage !== page) {
              setPlaying(false);
            }
            setPage(nextPage);
          }}
          scrollEventThrottle={16}
        >
          <Pressable
            onPress={async () => {
              if (variant === "viewer") {
                if (playing) {
                  await videoRef.current?.pauseAsync();
                } else {
                  await videoRef.current?.playAsync();
                }
              } else {
                onPress?.();
              }
            }}
            style={{ width: mediaWidth, height: mediaHeight, backgroundColor: "#000" }}
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              posterSource={videoPoster ? { uri: videoPoster } : undefined}
              usePoster={Boolean(videoPoster)}
              style={{ width: mediaWidth, height: mediaHeight }}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={playing}
              isMuted={variant === "card"}
              useNativeControls={variant === "viewer"}
              onPlaybackStatusUpdate={(status) => {
                if (!status.isLoaded) return;
                setPlaying(status.isPlaying);
              }}
            />
            {variant === "card" && !playing ? (
              <View style={styles.playOverlay} pointerEvents="none">
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
                </View>
              </View>
            ) : null}
          </Pressable>
          {images.map((uri, i) => (
            <Pressable key={`${uri}-${i}`} onPress={onPress}>
              <Image
                source={{ uri }}
                style={{ width: mediaWidth, height: mediaHeight, backgroundColor: colors.border }}
                accessibilityLabel={post.caption}
              />
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {page + 1}/{slideCount}
          </Text>
        </View>
        <View style={styles.dots}>
          {Array.from({ length: slideCount }, (_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      </View>
      {page === 0 && chapters.length > 0 ? (
        <ChapterBar chapters={chapters} duration={post.videoDuration} onSeek={seekVideo} />
      ) : null}
    </View>
  );
}

function VideoOnlyMedia({
  videoUrl,
  videoPoster,
  variant,
  mediaWidth,
  mediaHeight,
  onPress,
  chapters,
  videoDuration,
}: {
  videoUrl: string;
  videoPoster?: string;
  variant: "card" | "viewer";
  mediaWidth: number;
  mediaHeight: number;
  onPress?: () => void;
  chapters?: VideoChapter[];
  videoDuration?: number;
}) {
  const videoRef = useRef<Video>(null);
  const [playing, setPlaying] = useState(false);

  async function seekVideo(timeSec: number) {
    await videoRef.current?.setPositionAsync(timeSec * 1000);
    await videoRef.current?.playAsync();
    setPlaying(true);
  }

  return (
    <View>
      <Pressable onPress={onPress} style={{ width: mediaWidth, height: mediaHeight, backgroundColor: "#000" }}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        posterSource={videoPoster ? { uri: videoPoster } : undefined}
        usePoster={Boolean(videoPoster)}
        style={{ width: mediaWidth, height: mediaHeight }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={playing}
        isMuted={variant === "card"}
        useNativeControls={variant === "viewer"}
        onPlaybackStatusUpdate={(status) => {
          if (!status.isLoaded) return;
          setPlaying(status.isPlaying);
        }}
      />
      {variant === "card" && !playing ? (
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playBtn}>
            <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
          </View>
        </View>
      ) : null}
      </Pressable>
      {chapters && chapters.length > 0 ? (
        <ChapterBar chapters={chapters} duration={videoDuration} onSeek={seekVideo} />
      ) : null}
    </View>
  );
}

export function PostMedia({ post, variant = "card", width, onPress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const mediaWidth = width ?? screenWidth;
  const mediaHeight = mediaWidth * (5 / 4);
  const [page, setPage] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  async function toggleAudio() {
    if (!post.audioUrl) return;
    if (audioPlaying && soundRef.current) {
      await soundRef.current.pauseAsync();
      setAudioPlaying(false);
      return;
    }
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: post.audioUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) setAudioPlaying(status.isPlaying);
      });
    }
    await soundRef.current.playAsync();
    setAudioPlaying(true);
  }

  if (post.beforeImage && post.afterImage && (post.postType === "before-after" || !post.postType)) {
    return (
      <View>
        <BeforeAfterSlider before={post.beforeImage} after={post.afterImage} width={mediaWidth} height={mediaHeight} />
        {post.audioUrl ? <AudioBar audioPlaying={audioPlaying} onPress={toggleAudio} /> : null}
      </View>
    );
  }

  if (isVideoPost(post) && post.videoUrl) {
    const images = post.images && post.images.length > 0 ? post.images : [];

    return (
      <View>
        {images.length > 0 ? (
          <MixedVideoPhotoCarousel
            post={post}
            videoUrl={post.videoUrl}
            videoPoster={post.videoPoster}
            images={images}
            variant={variant}
            mediaWidth={mediaWidth}
            mediaHeight={mediaHeight}
            onPress={onPress}
          />
        ) : (
          <VideoOnlyMedia
            videoUrl={post.videoUrl}
            videoPoster={post.videoPoster}
            variant={variant}
            mediaWidth={mediaWidth}
            mediaHeight={mediaHeight}
            onPress={onPress}
            chapters={post.videoChapters}
            videoDuration={post.videoDuration}
          />
        )}
        {post.audioUrl ? <AudioBar audioPlaying={audioPlaying} onPress={toggleAudio} /> : null}
      </View>
    );
  }

  const images = post.images && post.images.length > 0 ? post.images : [post.image];

  const gallery =
    images.length > 1 ? (
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            setPage(Math.round(x / mediaWidth));
          }}
          scrollEventThrottle={16}
        >
          {images.map((uri, i) => (
            <Pressable key={`${uri}-${i}`} onPress={onPress}>
              <Image source={{ uri }} style={{ width: mediaWidth, height: mediaHeight, backgroundColor: colors.border }} />
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {page + 1}/{images.length}
          </Text>
        </View>
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      </View>
    ) : (
      <Pressable onPress={onPress}>
        <Image
          source={{ uri: images[0] }}
          style={{ width: mediaWidth, height: mediaHeight, backgroundColor: colors.border }}
          accessibilityLabel={post.caption}
        />
      </Pressable>
    );

  return (
    <View>
      {gallery}
      {post.audioUrl ? <AudioBar audioPlaying={audioPlaying} onPress={toggleAudio} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(9,9,11,0.6)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  dots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#ffffff",
  },
  audioBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.cardMuted,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  waveform: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 20 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: colors.accent },
  audioText: { fontSize: 13, color: colors.textDim },
  chapterRow: { gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.cardMuted },
  chapterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.card,
  },
  chapterTime: { color: colors.accent, fontSize: 11, fontFamily: "monospace" },
  chapterLabel: { color: colors.textDim, fontSize: 12 },
});
