export const MAX_VIDEO_DURATION_SEC = 60;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export type PostMediaType = "image" | "video";

export type PostMediaFields = {
  mediaType: PostMediaType;
  videoUrl?: string;
  videoDuration?: number;
  videoPoster?: string;
};

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
