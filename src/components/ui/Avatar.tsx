import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type AvatarProps = {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  ring?: boolean;
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

export function Avatar({ src, alt, size = "md", href, ring }: AvatarProps) {
  const img = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-zinc-800",
        sizes[size],
        ring && "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="64px" />
    </div>
  );

  if (href) {
    return <Link href={href}>{img}</Link>;
  }
  return img;
}
