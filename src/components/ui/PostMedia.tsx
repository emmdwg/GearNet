"use client";

import { VideoChapterMarkers } from "@/components/ui/VideoChapterMarkers";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import type { VideoChapter } from "@/lib/types";
import { DISPLAY_QUALITY, DISPLAY_QUALITY_FULL } from "@/lib/image-quality";
import { isVideoPost } from "@/lib/post-media";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { Play, Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  className?: string;
  onMediaClick?: () => void;
};

type CarouselProps = {
  post: PostMediaData;
  videoUrl: string;
  poster: string;
  images: string[];
  variant: "card" | "viewer";
  className?: string;
  onMediaClick?: () => void;
};

function AudioBar({ audioUrl, label }: { audioUrl: string; label: string }) {
  const bars = [0.3, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 0.55, 0.85, 0.45, 0.65, 0.5];
  return (
    <div className="border-t border-zinc-800 bg-zinc-900/80 px-3 py-2">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-400">
        <Volume2 className="h-3 w-3" /> {label}
      </p>
      <div className="mb-2 flex h-8 items-end gap-0.5">
        {bars.map((h, i) => (
          <span key={i} className="w-1 rounded-sm bg-amber-500/70" style={{ height: `${h * 100}%` }} />
        ))}
      </div>
      <audio controls src={audioUrl} className="h-8 w-full" preload="metadata" />
    </div>
  );
}

function MixedVideoPhotoCarousel({
  post,
  videoUrl,
  poster,
  images,
  variant,
  className,
  onMediaClick,
}: CarouselProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const widthRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const indexRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const didSwipeRef = useRef(false);
  const isViewer = variant === "viewer";
  const slideCount = 1 + images.length;
  const chapters = post.videoChapters ?? [];

  indexRef.current = index;

  function seekVideo(timeSec: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = timeSec;
    void el.play();
    setPlaying(true);
  }

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(slideCount - 1, next));
    setIndex(clamped);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setPlaying(false);
  }

  function prev() {
    goTo(indexRef.current - 1);
  }

  function next() {
    goTo(indexRef.current + 1);
  }

  function finishDrag() {
    const offset = dragOffsetRef.current;
    const velocity = velocityRef.current;
    let target = indexRef.current;
    if (offset > 48 || velocity > 0.35) target -= 1;
    else if (offset < -48 || velocity < -0.35) target += 1;
    if (Math.abs(offset) > 12 || Math.abs(velocity) > 0.2) didSwipeRef.current = true;
    setDragging(false);
    axisLockRef.current = null;
    pointerIdRef.current = null;
    goTo(target);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (slideCount < 2) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    widthRef.current = containerRef.current?.clientWidth ?? 1;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    axisLockRef.current = null;
    didSwipeRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointerIdRef.current !== e.pointerId || !dragging) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (!axisLockRef.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      if (axisLockRef.current === "y") return;
    }
    if (axisLockRef.current === "y") return;
    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(1, now - lastTRef.current);
    velocityRef.current = (e.clientX - lastXRef.current) / dt;
    lastXRef.current = e.clientX;
    lastTRef.current = now;
    const width = widthRef.current || 1;
    const atStart = indexRef.current === 0 && dx > 0;
    const atEnd = indexRef.current === slideCount - 1 && dx < 0;
    const nextOffset = Math.max(-width, Math.min(width, atStart || atEnd ? dx * 0.35 : dx));
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (pointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (axisLockRef.current === "y" || !dragging) {
      setDragging(false);
      dragOffsetRef.current = 0;
      setDragOffset(0);
      pointerIdRef.current = null;
      axisLockRef.current = null;
      return;
    }
    finishDrag();
  }

  const width = widthRef.current || 1;
  const translate = -index * 100 + (dragging ? (dragOffset / width) * 100 : 0);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full touch-pan-y overflow-hidden bg-black",
          isViewer ? "h-[50vh] min-h-[320px] lg:h-[80vh]" : "aspect-[4/5]",
          onMediaClick && !isViewer && "cursor-pointer",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (didSwipeRef.current) {
            didSwipeRef.current = false;
            return;
          }
          if (index === 0 && isViewer) togglePlay();
          else if (!isViewer) onMediaClick?.();
        }}
      >
        <div
          className="flex h-full w-full will-change-transform"
          style={{
            transform: `translate3d(${translate}%, 0, 0)`,
            transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="relative h-full w-full shrink-0 grow-0 basis-full">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={poster}
              className={cn("h-full w-full", isViewer ? "object-contain" : "object-cover")}
              playsInline
              controls={isViewer}
              loop
              muted={!isViewer}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              draggable={false}
            />
            {!isViewer && !playing ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
              </div>
            ) : null}
          </div>
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 grow-0 basis-full">
              <Image
                src={src}
                alt={post.caption}
                fill
                className={isViewer ? "object-contain" : "object-cover"}
                sizes={isViewer ? "100vw" : "(max-width: 768px) 100vw, 800px"}
                quality={isViewer ? DISPLAY_QUALITY_FULL : DISPLAY_QUALITY}
                unoptimized={isViewer}
                draggable={false}
              />
            </div>
          ))}
        </div>
        {slideCount > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {Array.from({ length: slideCount }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-4 bg-amber-400" : "w-1.5 bg-white/40",
                  )}
                />
              ))}
            </div>
            <div className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              {index + 1}/{slideCount}
            </div>
          </>
        ) : null}
      </div>
      {index === 0 && chapters.length > 0 ? (
        <VideoChapterMarkers
          chapters={chapters}
          duration={post.videoDuration}
          currentTime={currentTime}
          onSeek={seekVideo}
          variant={isViewer ? "scrubber" : "list"}
        />
      ) : null}
      {post.audioUrl ? <AudioBar audioUrl={post.audioUrl} label="Rev clip" /> : null}
    </div>
  );
}

function VideoOnlyMedia({
  post,
  videoUrl,
  poster,
  variant,
  className,
  onMediaClick,
}: Omit<CarouselProps, "images">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const isViewer = variant === "viewer";
  const chapters = post.videoChapters ?? [];

  function seekVideo(timeSec: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = timeSec;
    void el.play();
    setPlaying(true);
  }

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div
      className={cn(
        "relative w-full bg-black",
        isViewer ? "h-[50vh] min-h-[320px] lg:h-[80vh]" : "aspect-[4/5]",
        onMediaClick && !isViewer && "cursor-pointer",
        className,
      )}
      onClick={() => {
        if (isViewer) togglePlay();
        else onMediaClick?.();
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className={cn("h-full w-full", isViewer ? "object-contain" : "object-cover")}
        playsInline
        controls={isViewer}
        loop
        muted={!isViewer}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
      {!isViewer && !playing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white">
            <Play className="ml-1 h-8 w-8 fill-current" />
          </span>
        </div>
      ) : null}
      {post.audioUrl ? (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-400">
            <Volume2 className="h-3 w-3" /> Rev clip
          </p>
          <audio src={post.audioUrl} controls className="h-8 w-full" />
        </div>
      ) : null}
      {chapters.length > 0 ? (
        <VideoChapterMarkers
          chapters={chapters}
          duration={post.videoDuration}
          currentTime={currentTime}
          onSeek={seekVideo}
          variant={isViewer ? "scrubber" : "list"}
        />
      ) : null}
    </div>
  );
}

export function PostMedia({ post, variant = "card", className, onMediaClick }: Props) {
  const showBeforeAfter =
    Boolean(post.beforeImage && post.afterImage) &&
    (post.postType === "before-after" ||
      // Older rows may have slots filled without a reliable postType
      (!post.postType && post.beforeImage !== post.afterImage));

  if (showBeforeAfter && post.beforeImage && post.afterImage) {
    return (
      <div
        className={cn(variant === "viewer" && "h-full", className)}
        // Slider owns pointer events; don't open detail on drag.
        onClick={(e) => e.stopPropagation()}
      >
        <BeforeAfterSlider
          before={post.beforeImage}
          after={post.afterImage}
          alt={post.caption}
          className={variant === "viewer" ? "h-full min-h-[320px] aspect-auto lg:min-h-[480px]" : undefined}
        />
      </div>
    );
  }

  if (isVideoPost(post) && post.videoUrl) {
    const poster = post.videoPoster || post.image;
    const images = post.images && post.images.length > 0 ? post.images : [];

    if (images.length > 0) {
      return (
        <MixedVideoPhotoCarousel
          post={post}
          videoUrl={post.videoUrl}
          poster={poster}
          images={images}
          variant={variant}
          className={className}
          onMediaClick={onMediaClick}
        />
      );
    }

    return (
      <VideoOnlyMedia
        post={post}
        videoUrl={post.videoUrl}
        poster={poster}
        variant={variant}
        className={className}
        onMediaClick={onMediaClick}
      />
    );
  }

  const images = post.images && post.images.length > 0 ? post.images : [post.image];
  return (
    <div className={className}>
      <ImageCarousel
        images={images}
        alt={post.caption}
        variant={variant}
        onImageClick={onMediaClick}
      />
      {post.audioUrl ? <AudioBar audioUrl={post.audioUrl} label="Sound check" /> : null}
    </div>
  );
}
