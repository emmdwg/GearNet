import { ClubDetailClient } from "./ClubDetailClient";
import { getClubBySlug } from "@/lib/db";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const club = await getClubBySlug(slug, session?.user?.id);
  if (!club) notFound();
  return <ClubDetailClient club={club} />;
}
