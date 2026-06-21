import { ChatPageClient } from "@/components/chat/ChatPageClient";
import { getSession } from "@/lib/session";
import { getConversations } from "@/lib/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ChatPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const conversations = await getConversations(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Cruise Chat</h1>
        <p className="text-sm text-zinc-500">Connect with enthusiasts, coordinate cruises, and talk tech</p>
      </header>
      <Suspense fallback={<div className="py-12 text-center text-zinc-500">Loading chat...</div>}>
        <ChatPageClient initialConversations={conversations} />
      </Suspense>
    </div>
  );
}
