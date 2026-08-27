import { ClubsContent } from "@/components/clubs/ClubsContent";
import { getClubs } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function ClubsPage() {
  const session = await getSession();
  const clubs = await getClubs(session?.user?.id);
  return <ClubsContent clubs={clubs} />;
}
