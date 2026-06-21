"use client";

import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EditingPost = { id: string; caption: string; tags: string[]; images: string[] };
type Props = { open: boolean; onClose: () => void; editing?: EditingPost };

export function CreatePostModal({ open, onClose, editing }: Props) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImages(editing?.images ?? []);
    setCaption(editing?.caption ?? "");
    setTags(editing?.tags?.join(", ") ?? "");
    setError("");
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0 || !caption.trim()) {
      setError("Add at least one photo and a caption");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/posts/${editing.id}` : "/api/posts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          caption: caption.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save post");
      onClose();
      setImages([]);
      setCaption("");
      setTags("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Post" : "New Post"}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <MultiImageUpload images={images} onChange={setImages} label="Add photos" maxImages={10} />
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Tags (comma separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="build, stance, photography"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-2.5 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : editing ? "Save Changes" : "Share Post"}
        </button>
      </form>
    </Modal>
  );
}
