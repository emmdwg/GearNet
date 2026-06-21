"use client";

import { VehicleCard } from "@/components/garage/VehicleCard";
import type { Vehicle } from "@/lib/types";
import { Copy, Grid2x2, Heart, MessageCircle, Warehouse } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type GridPost = {
  id: string;
  image: string;
  images?: string[];
  caption: string;
  likes: number;
  comments: number;
};

type Props = {
  posts: GridPost[];
  vehicles: Vehicle[];
  username: string;
  showGarage?: boolean;
};

export function ProfileTabs({ posts, vehicles, username, showGarage = true }: Props) {
  const [tab, setTab] = useState<"posts" | "garage">("posts");

  return (
    <div>
      <div className="sticky top-0 z-10 flex border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid2x2 className="h-4 w-4" />}>
          Posts
        </TabButton>
        {showGarage ? (
          <TabButton active={tab === "garage"} onClick={() => setTab("garage")} icon={<Warehouse className="h-4 w-4" />}>
            Garage
          </TabButton>
        ) : null}
      </div>

      {tab === "posts" ? (
        posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 pt-1 sm:gap-1.5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/explore?post=${post.id}`}
                className="group relative aspect-square overflow-hidden bg-zinc-900"
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  sizes="(max-width: 640px) 33vw, 220px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {post.images && post.images.length > 1 ? (
                  <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white">
                    <Copy className="h-3.5 w-3.5" />
                  </div>
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Heart className="h-4 w-4 fill-white" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4 fill-white" />
                    {post.comments}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No posts yet.</EmptyState>
        )
      ) : vehicles.length > 0 ? (
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} username={username} />
          ))}
        </div>
      ) : (
        <EmptyState>No vehicles in the garage yet.</EmptyState>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-amber-500 text-white"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-sm text-zinc-500">{children}</p>;
}
