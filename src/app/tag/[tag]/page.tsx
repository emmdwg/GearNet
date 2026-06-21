import { TagPageClient } from "@/app/tag/[tag]/TagPageClient";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)} · GearNet` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  return <TagPageClient tag={decodeURIComponent(tag)} />;
}
