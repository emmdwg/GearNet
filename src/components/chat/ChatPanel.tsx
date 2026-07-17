"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLatestOutgoingDeliveryStatus } from "@/lib/chat-delivery";
import { parseMessageContent, messagePreview } from "@/lib/chat-content";
import { uploadAudioBlob, uploadImageFromDataUrl } from "@/lib/upload-client";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { isRealtimeAvailableOnClient } from "@/lib/realtime";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeDate } from "@/lib/utils";
import { ArrowLeft, ImagePlus, Mic, Plus, Search, Send, Users } from "lucide-react";
import Link from "next/link";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { NewChatModal } from "./NewChatModal";

type Conversation = {
  id: string;
  type?: string;
  participantIds?: string[];
  participantCount?: number;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  otherUser: { id: string; username: string; displayName: string; avatar: string } | null;
  groupName?: string;
  groupImage?: string | null;
  clubId?: string;
  clubSlug?: string;
  eventId?: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  sender?: { displayName: string };
};

type InboxFilter = "all" | "unread" | "groups";

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
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const [chatSearch, setChatSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    return conversations.filter((conv) => {
      const isGroup = conv.type === "club" || conv.type === "event";
      if (inboxFilter === "unread" && conv.unread <= 0) return false;
      if (inboxFilter === "groups" && !isGroup) return false;

      if (!q) return true;
      const other = conv.otherUser;
      const groupName = conv.groupName?.toLowerCase() ?? "";
      if (!other && !groupName) return false;
      return (
        groupName.includes(q) ||
        other?.displayName.toLowerCase().includes(q) ||
        other?.username.toLowerCase().includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversations, chatSearch, inboxFilter]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const isGroup = activeConv?.type === "club" || activeConv?.type === "event";
  const otherUser = activeConv?.otherUser;
  const threadTitle = isGroup
    ? (activeConv?.groupName ?? "Crew chat")
    : (otherUser?.displayName ?? (activeId ? "Chat" : undefined));

  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread > 0 ? 1 : 0), 0),
    [conversations],
  );
  const groupCount = useMemo(
    () => conversations.filter((c) => c.type === "club" || c.type === "event").length,
    [conversations],
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadError("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (!res.ok) {
        setMessages([]);
        setOtherLastReadAt(null);
        setLoadError(data.error ?? "Could not load messages");
        return;
      }
      setMessages(Array.isArray(data) ? data : (data.messages ?? []));
      setOtherLastReadAt(Array.isArray(data) ? null : (data.otherLastReadAt ?? null));
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      );
    } catch {
      setMessages([]);
      setOtherLastReadAt(null);
      setLoadError("Could not load messages");
    }
  }, []);

  useEffect(() => {
    if (!initialConversationId) return;
    setActiveId(initialConversationId);
    setShowThread(true);
    let cancelled = false;
    fetch(`/api/conversations/${initialConversationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((conv) => {
        if (cancelled || !conv) return;
        setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleRealtimeMessage = useCallback(
    (nudge: { id: string; conversationId: string; senderId: string; sentAt: string; content?: string }) => {
      if (nudge.content) {
        setMessages((prev) =>
          prev.some((m) => m.id === nudge.id)
            ? prev
            : [
                ...prev,
                {
                  id: nudge.id,
                  conversationId: nudge.conversationId,
                  senderId: nudge.senderId,
                  content: nudge.content!,
                  sentAt: nudge.sentAt,
                },
              ],
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: messagePreview(nudge.content!), lastMessageAt: nudge.sentAt, unread: 0 }
              : c,
          ),
        );
      } else if (activeId) {
        void loadMessages(activeId).then(() => {
          setConversations((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, unread: 0, lastMessageAt: nudge.sentAt } : c)),
          );
        });
      }
      if (userId && nudge.senderId !== userId && activeId) {
        fetch(`/api/conversations/${activeId}/read`, { method: "POST" })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.otherLastReadAt !== undefined) setOtherLastReadAt(data.otherLastReadAt);
          })
          .catch(() => {});
      }
    },
    [activeId, userId, loadMessages],
  );

  const handleReadReceipt = useCallback(
    (receipt: { userId: string; readAt: string }) => {
      if (!userId || receipt.userId === userId) return;
      setOtherLastReadAt((prev) => {
        if (!prev || new Date(receipt.readAt) > new Date(prev)) return receipt.readAt;
        return prev;
      });
    },
    [userId],
  );

  useConversationRealtime(
    isRealtimeAvailableOnClient() ? activeId : undefined,
    handleRealtimeMessage,
    handleReadReceipt,
  );

  async function sendMessage(imageUrl?: string, audioUrl?: string) {
    if ((!input.trim() && !imageUrl && !audioUrl) || !activeId || sending) return;
    setSending(true);
    setSendError("");

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim(), imageUrl, audioUrl }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        if (message.otherLastReadAt !== undefined) {
          setOtherLastReadAt(message.otherLastReadAt);
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  lastMessage: messagePreview(message.content),
                  lastMessageAt: message.sentAt,
                  unread: 0,
                }
              : c,
          ),
        );
        setInput("");
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(typeof data.error === "string" ? data.error : "Failed to send message");
      }
    } catch {
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    setUploadingImage(true);
    setSendError("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadImageFromDataUrl(dataUrl, "chat");
      await sendMessage(url);
    } catch {
      setSendError("Couldn’t upload photo. Try again.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!activeId || sending || uploadingAudio) return;
    setSendError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const duration = (Date.now() - recordStartRef.current) / 1000;
        if (duration < 0.5 || blob.size === 0) {
          setSendError("Hold a bit longer to record a voice note.");
          return;
        }
        setUploadingAudio(true);
        try {
          const url = await uploadAudioBlob(blob, duration, "chat");
          await sendMessage(undefined, url);
        } catch {
          setSendError("Couldn’t send voice note. Try again.");
        } finally {
          setUploadingAudio(false);
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      setSendError("Microphone permission is required for voice notes.");
    }
  }

  const deliveryStatus = useMemo(() => {
    if (!userId) return null;
    const last = messages[messages.length - 1];
    const lastIsMine = !last || last.senderId === userId;
    if (sending && lastIsMine) return "Sending…" as const;
    return getLatestOutgoingDeliveryStatus(messages, userId, otherLastReadAt);
  }, [messages, userId, otherLastReadAt, sending]);

  function selectConversation(id: string) {
    setActiveId(id);
    setShowThread(true);
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Delete this chat from your inbox?")) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setSendError("Couldn’t delete chat. Try again.");
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId("");
        setShowThread(false);
        setMessages([]);
        setOtherLastReadAt(null);
      }
    } catch {
      setSendError("Couldn’t delete chat. Try again.");
    }
  }

  const emptyInboxCopy = chatSearch.trim()
    ? "No chats match your search."
    : inboxFilter === "unread"
      ? "No unread chats."
      : inboxFilter === "groups"
        ? "No crew chats yet."
        : "No conversations yet.";

  return (
    <div className="flex h-[calc(100dvh-var(--mobile-nav-total)-1rem)] overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/30 lg:h-[calc(100dvh-2rem)]">
      <div className={cn("flex w-full flex-col border-r border-zinc-800/70 md:w-80", showThread && "hidden md:flex")}>
        <div className="space-y-3 border-b border-zinc-800/70 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-full border border-zinc-800/80 bg-zinc-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline md:hidden lg:inline">New</span>
            </button>
          </div>

          <div className="flex gap-1 rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-800/70">
            {(
              [
                { id: "all" as const, label: "All" },
                { id: "unread" as const, label: unreadCount > 0 ? `Unread (${unreadCount})` : "Unread" },
                { id: "groups" as const, label: groupCount > 0 ? `Crews (${groupCount})` : "Crews" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInboxFilter(tab.id)}
                className={cn(
                  "flex-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                  inboxFilter === tab.id
                    ? "bg-amber-500 text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isRealtimeAvailableOnClient() ? (
            <p className="px-0.5 text-[11px] text-zinc-600">Refresh to see new messages</p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="mx-3 my-6 rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center sm:mx-4">
              <p className="text-sm font-medium text-zinc-300">
                {chatSearch.trim() || inboxFilter !== "all" ? "Nothing here" : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{emptyInboxCopy}</p>
              {!chatSearch && inboxFilter === "all" ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                  >
                    Start a chat
                  </button>
                  <Link
                    href="/clubs"
                    className="inline-flex rounded-full px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-800/80 transition hover:text-white"
                  >
                    Find a club
                  </Link>
                </div>
              ) : null}
              {!chatSearch && inboxFilter === "groups" ? (
                <Link
                  href="/clubs"
                  className="mt-4 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                >
                  Find a club
                </Link>
              ) : null}
              {!chatSearch && inboxFilter === "unread" ? (
                <button
                  type="button"
                  onClick={() => setInboxFilter("all")}
                  className="mt-4 rounded-full px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-800/80 transition hover:text-white"
                >
                  Show all chats
                </button>
              ) : null}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const convIsGroup = conv.type === "club" || conv.type === "event";
              const displayName = convIsGroup ? (conv.groupName ?? "Crew chat") : other?.displayName;
              if (!displayName) return null;
              return (
                <SwipeableRow key={conv.id} onDelete={() => void deleteConversation(conv.id)}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectConversation(conv.id)}
                    onKeyDown={(e) => e.key === "Enter" && selectConversation(conv.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 border-b border-zinc-800/40 px-4 py-3 text-left transition-colors hover:bg-zinc-800/40",
                      activeId === conv.id && "bg-zinc-800/60",
                    )}
                  >
                    {convIsGroup ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800/70 bg-zinc-900/80">
                        <Users className="h-4 w-4 text-amber-500" />
                      </div>
                    ) : (
                      <Avatar src={other?.avatar ?? ""} alt={displayName} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">{displayName}</span>
                        <span className="shrink-0 text-[10px] text-zinc-600">
                          {formatRelativeDate(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-zinc-500">
                        {convIsGroup && conv.participantCount
                          ? `${conv.participantCount} members · ${conv.lastMessage}`
                          : conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-zinc-950">
                        {conv.unread}
                      </span>
                    ) : null}
                  </div>
                </SwipeableRow>
              );
            })
          )}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col", showThread ? "flex" : "hidden md:flex")}>
        {threadTitle && userId ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-800/70 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowThread(false)}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-800/60 hover:text-white md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {isGroup ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800/70 bg-zinc-900/80">
                  <Users className="h-4 w-4 text-amber-500" />
                </div>
              ) : (
                <Avatar src={otherUser?.avatar ?? ""} alt={threadTitle} />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{threadTitle}</p>
                <p className="text-xs text-zinc-500">
                  {isGroup ? `${activeConv?.participantCount ?? 0} members` : `@${otherUser?.username}`}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadError ? (
                <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{loadError}</p>
              ) : null}
              {messages.length === 0 && !loadError ? (
                <div className="flex h-full min-h-[12rem] items-center justify-center">
                  <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-8 text-center">
                    <p className="text-sm font-medium text-zinc-300">Say hello</p>
                    <p className="mt-1 text-xs text-zinc-500">Send the first message to start the conversation.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    const parsed = parseMessageContent(msg.content);
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                            isMe ? "bg-amber-500 text-zinc-950" : "bg-zinc-800/80 text-zinc-200",
                          )}
                        >
                          {isGroup && !isMe ? (
                            <p className="mb-1 text-[10px] font-semibold text-amber-400">
                              {msg.sender?.displayName ?? "Member"}
                            </p>
                          ) : null}
                          {parsed.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={parsed.imageUrl} alt="" className="mb-1 max-h-48 rounded-xl object-cover" />
                          ) : null}
                          {parsed.audioUrl ? <VoiceNotePlayer audioUrl={parsed.audioUrl} isMe={isMe} /> : null}
                          {parsed.text ? <p className="leading-relaxed">{parsed.text}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {deliveryStatus && !isGroup ? (
                <p className="mt-2 text-right text-[11px] text-zinc-500">{deliveryStatus}</p>
              ) : null}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-zinc-800/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:pb-4">
              {sendError ? (
                <p className="mb-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{sendError}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleImagePick(e)}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 ring-1 ring-zinc-800/70 transition hover:text-white disabled:opacity-50"
                  aria-label="Send image"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void toggleRecording()}
                  disabled={uploadingAudio || sending || uploadingImage}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 ring-1 ring-zinc-800/70 transition hover:text-white disabled:opacity-50",
                    recording && "bg-red-500/10 text-red-400 ring-red-500/40",
                  )}
                  aria-label={recording ? "Stop recording" : "Record voice note"}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
                  placeholder={recording ? "Recording…" : "Type a message…"}
                  disabled={recording}
                  className="flex-1 rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || recording || uploadingImage || uploadingAudio || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-300">Select a conversation</p>
              <p className="mt-1 text-xs text-zinc-500">Pick a chat from the inbox, or start a new one.</p>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="mt-4 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                New chat
              </button>
            </div>
          </div>
        )}
      </div>
      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}
