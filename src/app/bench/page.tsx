import { ServiceBenchClient } from "@/components/bench/ServiceBenchClient";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ServiceBenchPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  return <ServiceBenchClient />;
}
