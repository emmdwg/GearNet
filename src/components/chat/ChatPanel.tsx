"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { isRealtimeAvailableOnClient } from "@/lib/realtime";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeDate } from "@/lib/utils";
import { ArrowLeft, Plus, Search, Send } from "lucide-react";
import { NewChatModal } from "./NewChatModal";

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  otherUser: { id: string; username: string; displayName: string; avatar: string } | null;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
};

type Props = {
  initialConversations: Conversation[];
  initialConversationId?: string;
};

export function ChatPanel({ initialConversations, initialConversationId }: Props) {
  const { user } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversationId ?? initialConversations[0]?.id ?? "");
  const [showThread, setShowThread] = useState(Boolean(initialConversationId));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const other = conv.otherUser;
      if (!other) return false;
      return (
        other.displayName.toLowerCase().includes(q) ||
        other.username.toLowerCase().includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversations, chatSearch]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const otherUser = activeConv?.otherUser;

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      setShowThread(true);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/conversations/${activeId}/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRealtimeMessage = useCallback((message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, lastMessage: message.content, lastMessageAt: message.sentAt } : c
      )
    );
  }, [activeId]);

  useConversationRealtime(isRealtimeAvailableOnClient() ? activeId : undefined, handleRealtimeMessage);

  async function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);

    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });

    setSending(false);

    if (res.ok) {
      const message = await res.json();
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setInput("");
    }
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setShowThread(true);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className={cn("w-full border-r border-zinc-800 md:w-80", showThread && "hidden md:block")}>
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Cruise Chat</h2>
              <p className="text-xs text-zinc-500">
                Real-time messaging{isRealtimeAvailableOnClient() ? "" : " (refresh to see new messages)"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 transition-colors hover:bg-amber-400"
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              {chatSearch ? "No chats match your search." : "No conversations yet. Start a new chat."}
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              if (!other) return null;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-zinc-800/50 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50",
                    activeId === conv.id && "bg-zinc-800/80"
                  )}
                >
                  <Avatar src={other.avatar} alt={other.displayName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-white">{other.displayName}</span>
                      <span className="text-[10px] text-zinc-600">{formatRelativeDate(conv.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-xs text-zinc-500">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", showThread ? "flex" : "hidden md:flex")}>
        {otherUser && userId ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowThread(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar src={otherUser.avatar} alt={otherUser.displayName} />
              <div>
                <p className="font-medium text-white">{otherUser.displayName}</p>
                <p className="text-xs text-zinc-500">@{otherUser.username}</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === userId;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        isMe ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-zinc-800 p-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
            Select a conversation to start messaging.
          </div>
        )}
      </div>
      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}
