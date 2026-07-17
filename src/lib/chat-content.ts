const IMAGE_PREFIX = "__gnimg__:";
const AUDIO_PREFIX = "__gnaudio__:";

export type ParsedMessageContent = {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
};

export function serializeMessageContent(
  text: string,
  imageUrl?: string | null,
  audioUrl?: string | null,
): string {
  const trimmed = text.trim();
  if (audioUrl?.trim()) {
    return trimmed
      ? `${AUDIO_PREFIX}${audioUrl.trim()}\n${trimmed}`
      : `${AUDIO_PREFIX}${audioUrl.trim()}`;
  }
  if (imageUrl?.trim()) {
    return trimmed ? `${IMAGE_PREFIX}${imageUrl.trim()}\n${trimmed}` : `${IMAGE_PREFIX}${imageUrl.trim()}`;
  }
  return trimmed;
}

export function parseMessageContent(content: string): ParsedMessageContent {
  if (content.startsWith(AUDIO_PREFIX)) {
    const rest = content.slice(AUDIO_PREFIX.length);
    const newline = rest.indexOf("\n");
    if (newline === -1) {
      return { text: "", audioUrl: rest };
    }
    return { audioUrl: rest.slice(0, newline), text: rest.slice(newline + 1) };
  }
  if (content.startsWith(IMAGE_PREFIX)) {
    const rest = content.slice(IMAGE_PREFIX.length);
    const newline = rest.indexOf("\n");
    if (newline === -1) {
      return { text: "", imageUrl: rest };
    }
    return { imageUrl: rest.slice(0, newline), text: rest.slice(newline + 1) };
  }
  return { text: content };
}

export function messagePreview(content: string): string {
  const parsed = parseMessageContent(content);
  if (parsed.audioUrl && !parsed.text) return "Voice message";
  if (parsed.audioUrl && parsed.text) return parsed.text;
  if (parsed.imageUrl && !parsed.text) return "Photo";
  if (parsed.imageUrl && parsed.text) return parsed.text;
  return parsed.text;
}
