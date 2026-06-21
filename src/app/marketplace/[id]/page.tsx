import { ListingDetailClient } from "@/app/marketplace/[id]/ListingDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  return <ListingDetailClient id={id} />;
}
