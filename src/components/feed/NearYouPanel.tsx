"use client";

import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/lib/auth-context";
import { getStoredNearYouRadius, setStoredNearYouRadius } from "@/lib/near-you-radius";
import type { Post } from "@/lib/types";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  onOpenPost?: (postId: string) => void;
};

type NearYouResult = {
  posts: Post[];
  source: "gps" | "home";
};

async function fetchNearYou(params: URLSearchParams): Promise<NearYouResult> {
  const res = await fetch(`/api/discover/near-you?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data?.error || "Couldn’t load nearby posts"), {
      code: data?.code as string | undefined,
    });
  }
  const sourceHeader = res.headers.get("X-Near-You-Source");
  return {
    posts: Array.isArray(data) ? data : [],
    source: sourceHeader === "home" ? "home" : "gps",
  };
}

export function NearYouPanel({ onOpenPost }: Props) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [source, setSource] = useState<"gps" | "home">("gps");
  const [radius, setRadius] = useState(50);

  useEffect(() => {
    setRadius(getStoredNearYouRadius());
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const saved = data?.settings?.nearYouRadius;
        if (typeof saved === "number" && saved > 0) {
          setRadius(saved);
          setStoredNearYouRadius(saved);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setErrorCode(null);

      const apply = (result: NearYouResult) => {
        if (cancelled) return;
        setPosts(result.posts);
        setSource(result.source);
      };

      const loadHomeFallback = async () => {
        const params = new URLSearchParams({ home: "1", radius: String(radius), limit: "20" });
        apply(await fetchNearYou(params));
      };

      if (!navigator.geolocation) {
        try {
          await loadHomeFallback();
        } catch (err) {
          if (!cancelled) {
            setPosts([]);
            setError(err instanceof Error ? err.message : "Couldn’t load nearby posts");
            setErrorCode((err as { code?: string })?.code ?? "HOME_AREA_REQUIRED");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void (async () => {
            try {
              const params = new URLSearchParams({
                lat: String(pos.coords.latitude),
                lng: String(pos.coords.longitude),
                radius: String(radius),
                limit: "20",
              });
              apply(await fetchNearYou(params));
            } catch (err) {
              if (!cancelled) {
                setPosts([]);
                setError(err instanceof Error ? err.message : "Couldn’t load nearby posts");
                setErrorCode((err as { code?: string })?.code ?? null);
              }
            } finally {
              if (!cancelled) setLoading(false);
            }
          })();
        },
        () => {
          void (async () => {
            try {
              await loadHomeFallback();
            } catch (err) {
              if (!cancelled) {
                setPosts([]);
                const home = user?.location?.trim();
                setError(
                  home
                    ? err instanceof Error
                      ? err.message
                      : "Couldn’t load posts near your home area"
                    : "Enable location, or set a home area in Settings to see posts near you",
                );
                setErrorCode((err as { code?: string })?.code ?? (home ? null : "HOME_AREA_REQUIRED"));
              }
            } finally {
              if (!cancelled) setLoading(false);
            }
          })();
        },
        { timeout: 8000 },
      );
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [radius, user?.location]);

  function updateRadius(next: number) {
    const value = Math.min(500, Math.max(5, next));
    setRadius(value);
    setStoredNearYouRadius(value);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { nearYouRadius: value } }),
    }).catch(() => null);
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-zinc-500">Finding posts near you...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-5 py-8 text-center">
        <MapPin className="mx-auto mb-2 h-5 w-5 text-zinc-600" />
        <p className="text-sm text-zinc-500">{error}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {errorCode === "HOME_AREA_REQUIRED" || errorCode === "HOME_GEOCODE_FAILED" ? (
            <Link
              href="/settings#home-area"
              className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              Set home area
            </Link>
          ) : (
            <Link
              href="/events"
              className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              Browse meets
            </Link>
          )}
          <Link
            href="/settings#home-area"
            className="inline-flex rounded-full px-4 py-2 text-sm font-medium text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-zinc-200"
          >
            Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <label className="text-xs text-zinc-500">Radius: {radius} mi</label>
          {source === "home" && user?.location ? (
            <p className="text-[11px] text-zinc-600">
              GPS off — showing near your home area ({user.location})
            </p>
          ) : null}
        </div>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={radius}
          onChange={(e) => updateRadius(Number(e.target.value))}
          className="max-w-[180px] flex-1 accent-amber-500"
          aria-label="Near you radius in miles"
        />
      </div>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-5 py-8 text-center">
          <p className="text-sm leading-relaxed text-zinc-500">
            {source === "home" && user?.location
              ? `No geo-tagged posts near ${user.location} yet. Tag location when you post from a meet.`
              : "No geo-tagged posts nearby yet. Tag location when you post from a meet."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/events"
              className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              Find a meet
            </Link>
            <Link
              href="/explore?createPost=1"
              className="inline-flex rounded-full px-4 py-2 text-sm font-medium text-zinc-400 ring-1 ring-zinc-800/80 transition hover:text-zinc-200"
            >
              Share a build
            </Link>
          </div>
        </div>
      ) : (
        <div className="-mx-4 border-t border-zinc-800">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={onOpenPost} />
          ))}
        </div>
      )}
    </div>
  );
}
