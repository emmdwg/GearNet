import { MarketplaceContent } from "@/components/marketplace/MarketplaceContent";
import { getListings } from "@/lib/db";

export default async function MarketplacePage() {
  const listings = await getListings();
  return <MarketplaceContent listings={listings} />;
}
