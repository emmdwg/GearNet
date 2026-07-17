export const MAX_VIDEO_DURATION_SEC = 60;

export type PostMediaType = "image" | "video";

export function isVideoPost(input: { mediaType?: string; videoUrl?: string | null }) {
  return input.mediaType === "video" && Boolean(input.videoUrl);
}

export function feedThumbnail(post: {
  image: string;
  mediaType?: string;
  videoPoster?: string | null;
}) {
  if (isVideoPost(post)) return post.videoPoster || post.image;
  return post.image;
}
