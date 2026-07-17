"use client";

import { EventCard } from "@/components/events/EventCard";
import { EventMeetExtras } from "@/components/events/EventMeetExtras";
import { MeetDayMode } from "@/components/events/MeetDayMode";
import { ClubSettingsModal } from "@/components/forms/ClubSettingsModal";
import { CreateEventModal } from "@/components/forms/CreateEventModal";
import { CreatePostModal } from "@/components/forms/CreatePostModal";
import { ClubFeed } from "@/components/clubs/ClubFeed";
import { ClubRoleBadge } from "@/components/clubs/ClubRoleBadge";
import { JoinRequestsPanel } from "@/components/clubs/JoinRequestsPanel";
import { ClubChallengesPanel } from "@/components/clubs/ClubChallengesPanel";
import { ClubProjectsPanel } from "@/components/clubs/ClubProjectsPanel";
import { ClubDuesPanel } from "@/components/clubs/ClubDuesPanel";
import { ClubChaptersSection } from "@/components/clubs/ClubChaptersSection";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Club, ClubMember, Event, Post } from "@/lib/types";
import {
  ASSIGNABLE_CLUB_ROLES,
  canManageClub,
  canManageClubJoinRequests,
  clubRoleLabel,
  normalizeClubRole,
  type AssignableClubRole,
} from "@/lib/club-roles";
import { cn } from "@/lib/utils";
import { CalendarPlus, ChevronDown, Download, ExternalLink, Link2, Settings, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ClubDetail = Club & {
  members: ClubMember[];
  events: Event[];
  posts: Post[];
};

function isMeetToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export function ClubDetailClient({ club: initial }: { club: ClubDetail }) {
  const { user } = useAuth();
  const router = useRouter();
  const [club, setClub] = useState(initial);
  const [meetOpen, setMeetOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "meets" | "members" | "challenges" | "project">("posts");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState<
    { id: string; username: string; displayName: string; avatar: string }[]
  >([]);
  const [memberBusy, setMemberBusy] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const authRecoverKey = useRef<string | null>(null);

  const isPreview = club.access === "preview";
  const isOwner = club.role === "owner" || club.ownerId === user?.id;
  const canManage = !isPreview && canManageClub(club.role, isOwner);
  const canManageRequests = !isPreview && canManageClubJoinRequests(club.role, isOwner);
  const canCreateMeet = !isPreview && (club.joined || isOwner);
  const canPost = !isPreview && (club.joined || isOwner);
  const canEnterChallenges = !isPreview && (club.joined || isOwner);

  async function refreshClub() {
    const res = await fetch(`/api/clubs/${club.slug}`);
    if (res.ok) setClub(await res.json());
    router.refresh();
  }

  // If SSR missed the session (expired cookies / narrow proxy matcher), owners of
  // private/approval clubs land in preview without manage UI. Re-fetch once client auth is ready.
  useEffect(() => {
    if (!user?.id) return;
    const stuckAsOwnerPreview = club.access === "preview" && club.ownerId === user.id;
    const ownerWithoutMembership = club.ownerId === user.id && !club.joined;
    if (!stuckAsOwnerPreview && !ownerWithoutMembership) return;
    const key = `${user.id}:${club.slug}`;
    if (authRecoverKey.current === key) return;
    authRecoverKey.current = key;
    void refreshClub();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recover once per user/slug after client auth
  }, [user?.id, club.slug, club.access, club.ownerId, club.joined]);

  useEffect(() => {
    const q = memberQuery.trim().replace(/^@+/, "");
    if (!canManage || q.length < 2) {
      setMemberSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      const memberIds = new Set(club.members.map((m) => m.userId));
      setMemberSuggestions(
        (Array.isArray(data) ? data : [])
          .filter((u: { id: string }) => !memberIds.has(u.id))
          .slice(0, 6),
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [memberQuery, club.members, canManage]);

  async function toggleMembership() {
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/clubs/${club.slug}`;
      return;
    }

    setActionError("");
    if (club.joined) {
      setLoading(true);
      try {
        const res = await fetch(`/api/clubs/${club.slug}/join`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not leave");
        await refreshClub();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not leave club");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (club.joinRequestPending) {
      setLoading(true);
      try {
        const res = await fetch(`/api/clubs/${club.slug}/join`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Could not cancel request");
        }
        await refreshClub();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not cancel request");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (club.requiresApproval || !club.isPublic) {
      setRequestOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.slug}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      await refreshClub();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not join club");
    } finally {
      setLoading(false);
    }
  }

  async function submitJoinRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/clubs/${club.slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send request");
      setRequestOpen(false);
      setRequestMessage("");
      await refreshClub();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setLoading(false);
    }
  }

  async function setMemberRole(userId: string, role: AssignableClubRole) {
    setActionError("");
    try {
      const res = await fetch(`/api/clubs/${club.slug}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update role");
      await refreshClub();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update role");
    }
  }

  async function addMember(username: string) {
    const normalized = username.replace(/^@+/, "").trim();
    if (!normalized) return;
    setMemberBusy(true);
    setActionError("");
    try {
      const res = await fetch(`/api/clubs/${club.slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add member");
      setMemberQuery("");
      setMemberSuggestions([]);
      await refreshClub();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not add member");
    } finally {
      setMemberBusy(false);
    }
  }

  async function removeMember(userId: string, displayName: string) {
    if (!window.confirm(`Remove ${displayName} from the club?`)) return;
    setActionError("");
    try {
      const res = await fetch(`/api/clubs/${club.slug}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove member");
      await refreshClub();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not remove member");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clubs/${club.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Couldn’t copy link — try sharing from your browser menu");
    }
  }

  function joinButtonLabel() {
    if (isOwner) return "Your club";
    if (club.joined) return "Leave";
    if (club.joinRequestPending) return "Cancel Request";
    if (club.requiresApproval || !club.isPublic) return "Request to Join";
    return "Join Club";
  }

  function openSharePost() {
    if (!user) {
      window.location.href = `/auth/signin?callbackUrl=/clubs/${club.slug}`;
      return;
    }
    setPostOpen(true);
  }

  const toolBtnClass =
    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-800/80 transition hover:text-white hover:ring-zinc-700/80";

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="relative h-48 overflow-hidden bg-zinc-900 sm:h-56">
        {club.coverImage || club.image ? (
          <Image src={club.coverImage ?? club.image ?? ""} alt="" fill className="object-cover opacity-60" sizes="900px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/25 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {club.requiresApproval || !club.isPublic ? (
              <Badge variant="outline">
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                Approval required
              </Badge>
            ) : null}
            {!club.isPublic ? <Badge variant="outline">Private</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{club.name}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
            <Users className="h-3.5 w-3.5 text-amber-500" />
            {club.memberCount} members{club.city ? ` · ${club.city}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        {club.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {club.tags.slice(0, 6).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {club.tags.length > 6 ? (
              <span className="self-center text-[11px] text-zinc-600">+{club.tags.length - 6}</span>
            ) : null}
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-zinc-400">{club.description}</p>

        {isPreview ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            This is a private club. Request to join to see posts, meets, and challenges.
            Share this link to invite builders.
          </div>
        ) : null}

        {actionError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{actionError}</p>
        ) : null}

        {club.owner ? (
          <Link href={`/profile/${club.owner.username}`} className="inline-block text-sm text-zinc-500 transition hover:text-amber-400">
            Hosted by @{club.owner.username}
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleMembership}
            disabled={loading || isOwner}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
              club.joined || club.joinRequestPending
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/40"
                : "bg-amber-500 text-zinc-950 hover:bg-amber-400",
            )}
          >
            {joinButtonLabel()}
          </button>
          {canPost ? (
            <button
              type="button"
              onClick={openSharePost}
              className="rounded-full bg-zinc-900/60 px-3.5 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-800/80 transition hover:text-white"
            >
              Share
            </button>
          ) : null}
          {canCreateMeet ? (
            <button type="button" onClick={() => setMeetOpen(true)} className={toolBtnClass}>
              <CalendarPlus className="h-4 w-4" />
              Club meet
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/30">
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-white">More tools</p>
              <p className="text-xs text-zinc-500">Link, chat, calendar, settings</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
                toolsOpen && "rotate-180",
              )}
            />
          </button>
          {toolsOpen ? (
            <div className="flex flex-wrap gap-2 border-t border-zinc-800/70 px-4 pb-4 pt-3">
              <button type="button" onClick={copyLink} className={toolBtnClass}>
                <Link2 className="h-4 w-4" />
                {copied ? "Copied!" : "Copy link"}
              </button>
              {club.joined || isOwner ? (
                <button
                  type="button"
                  onClick={async () => {
                    setActionError("");
                    try {
                      const res = await fetch(`/api/clubs/${club.slug}/crew-chat`, { method: "POST" });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setActionError(data.error || "Couldn’t open crew chat");
                        return;
                      }
                      window.location.href = `/chat?conversation=${data.conversationId}`;
                    } catch {
                      setActionError("Couldn’t open crew chat");
                    }
                  }}
                  className={toolBtnClass}
                >
                  Crew chat
                </button>
              ) : null}
              {!isPreview ? (
                <a href={`/api/clubs/${club.slug}/calendar`} className={toolBtnClass}>
                  <Download className="h-4 w-4" />
                  Export .ics
                </a>
              ) : null}
              {club.merchUrl ? (
                <a
                  href={club.merchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-2 text-sm font-medium text-amber-300 ring-1 ring-amber-500/35 transition hover:bg-amber-500/15"
                >
                  <ExternalLink className="h-4 w-4" />
                  Shop merch
                </a>
              ) : null}
              {canManage ? (
                <button type="button" onClick={() => setSettingsOpen(true)} className={toolBtnClass}>
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {club.joinRequestPending && !club.joined ? (
          <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Your join request is pending review.
          </p>
        ) : null}

        {canManageRequests ? (
          <JoinRequestsPanel slug={club.slug} pendingCount={club.pendingRequestCount ?? 0} onChanged={refreshClub} />
        ) : null}

        {!isPreview ? (
          <>
        <ClubChaptersSection
          slug={club.slug}
          chapters={club.chapters ?? []}
          parentClub={club.parentClub}
          canManage={canManage && !club.parentClubId}
          onChapterCreated={refreshClub}
        />

        <div className="flex gap-1 overflow-x-auto rounded-full bg-zinc-900/70 p-1 ring-1 ring-zinc-800/70 scrollbar-hide">
          {(["posts", "meets", "challenges", "project", "members"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "shrink-0 flex-1 rounded-full px-3 py-2 text-xs font-semibold capitalize transition sm:text-sm",
                activeTab === tab
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {tab === "posts"
                ? "Posts"
                : tab === "meets"
                  ? "Meets"
                  : tab === "challenges"
                    ? "Challenges"
                    : tab === "project"
                      ? "Project"
                      : "Members"}
            </button>
          ))}
        </div>

        {activeTab === "posts" ? (
          <ClubFeed
            posts={club.posts}
            canPost={canPost}
            onShare={openSharePost}
          />
        ) : null}

        {activeTab === "meets" ? (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">Club meets</h2>
                <p className="text-xs text-zinc-500">Events hosted by this crew</p>
              </div>
              {club.events.length > 0 ? (
                <span className="text-[11px] tabular-nums text-zinc-600">{club.events.length}</span>
              ) : null}
            </div>
            {club.events.length > 0 ? (
              <div className="space-y-4">
                {club.events.map((event) => (
                  <div key={event.id} className="space-y-0">
                    <EventCard
                      event={event}
                      onMeetDay={
                        isMeetToday(event.date)
                          ? () => setExpandedEventId(expandedEventId === event.id ? null : event.id)
                          : undefined
                      }
                      meetDayExpanded={expandedEventId === event.id && isMeetToday(event.date)}
                      onSelect={() =>
                        setExpandedEventId(expandedEventId === event.id ? null : event.id)
                      }
                    />
                    {expandedEventId === event.id ? (
                      isMeetToday(event.date) ? (
                        <MeetDayMode event={event} />
                      ) : (
                        <EventMeetExtras event={event} />
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-10 text-center">
                <p className="text-sm text-zinc-500">
                  No club meets yet.{canCreateMeet ? " Schedule the first one." : ""}
                </p>
                {canCreateMeet ? (
                  <button
                    type="button"
                    onClick={() => setMeetOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                  >
                    Schedule a meet
                  </button>
                ) : (
                  <Link
                    href="/events"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-amber-400 ring-1 ring-amber-500/35 transition hover:bg-amber-500/10"
                  >
                    Browse all meets
                  </Link>
                )}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "challenges" ? (
          <ClubChallengesPanel
            slug={club.slug}
            canManage={canManage}
            canEnter={canEnterChallenges}
            clubPosts={club.posts}
            userId={user?.id}
          />
        ) : null}

        {activeTab === "project" ? <ClubProjectsPanel slug={club.slug} canManage={canManage} /> : null}

        {activeTab === "members" ? (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">Members</h2>
                <p className="text-xs text-zinc-500">{club.members.length} in this club</p>
              </div>
            </div>
            {canManage ? (
              <div className="relative mb-4">
                <p className="mb-2 text-xs text-zinc-500">
                  Search by username to add someone directly — they don’t need to request to join.
                </p>
                <div className="flex gap-2">
                  <input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onFocus={(e) => {
                      // Keep the field above the mobile keyboard / soft UI.
                      window.setTimeout(() => {
                        e.target.scrollIntoView({ block: "center", behavior: "smooth" });
                      }, 250);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addMember(memberQuery);
                      }
                    }}
                    placeholder="Type a username to add…"
                    className="min-w-0 flex-1 rounded-full border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-amber-500/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={memberBusy || memberQuery.trim().replace(/^@+/, "").length < 2}
                    onClick={() => void addMember(memberQuery)}
                    className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {memberBusy ? "Adding…" : "Add"}
                  </button>
                </div>
                {memberSuggestions.length > 0 ? (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900 shadow-lg">
                    {memberSuggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        disabled={memberBusy}
                        onClick={() => void addMember(u.username)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-800/80 disabled:opacity-50"
                      >
                        <Avatar src={u.avatar} alt={u.displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{u.displayName}</p>
                          <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                        </div>
                        <span className="ml-auto text-xs text-amber-400">Add</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {canManage || canManageRequests ? (
              <p className="mb-3 text-xs leading-relaxed text-zinc-500">
                Roles: one Owner · Admins manage the club · Associates can review join requests (no full admin) · Members are regular users.
              </p>
            ) : null}
            <ClubDuesPanel slug={club.slug} canManage={canManage} members={club.members} userId={user?.id} />
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {club.members.map((member) => {
                const isClubOwner = member.userId === club.ownerId || member.role === "owner";
                const memberRole = isClubOwner ? "owner" : normalizeClubRole(member.role);
                const canKick =
                  canManage &&
                  !isClubOwner &&
                  member.userId !== user?.id &&
                  (isOwner || memberRole !== "admin");
                const canEditRole = canManage && !isClubOwner && (isOwner || memberRole !== "admin");
                const roleOptions = isOwner
                  ? ASSIGNABLE_CLUB_ROLES
                  : (["associate", "member"] as const);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3"
                  >
                    <Link href={`/profile/${member.user.username}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90">
                      <Avatar src={member.user.avatar} alt={member.user.displayName} size="md" />
                      <div className="min-w-0">
                        <p className="flex items-center font-medium text-white">
                          {member.user.displayName}
                          <ClubRoleBadge role={memberRole} />
                        </p>
                        <p className="text-xs text-zinc-500">@{member.user.username}</p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {canEditRole ? (
                        <select
                          value={memberRole === "owner" ? "member" : memberRole}
                          onChange={(e) =>
                            void setMemberRole(member.userId, e.target.value as AssignableClubRole)
                          }
                          className="rounded-full border border-zinc-800/80 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300 focus:border-amber-500/60 focus:outline-none"
                          aria-label={`Role for ${member.user.displayName}`}
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>
                              {clubRoleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {canKick ? (
                        <button
                          type="button"
                          onClick={() => void removeMember(member.userId, member.user.displayName)}
                          className="rounded-full px-2.5 py-1 text-[11px] text-zinc-500 ring-1 ring-zinc-800/80 transition hover:text-red-400 hover:ring-red-500/40"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
          </>
        ) : null}
      </div>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request to join">
        <form onSubmit={submitJoinRequest} className="space-y-4">
          <p className="text-sm text-zinc-400">Introduce yourself to the club owner.</p>
          <textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            rows={4}
            placeholder="Daily driver, local to LA..."
            className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-2.5 text-sm text-white focus:border-amber-500/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-amber-500 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send request"}
          </button>
        </form>
      </Modal>

      <CreateEventModal open={meetOpen} onClose={() => setMeetOpen(false)} clubId={club.id} />
      <CreatePostModal open={postOpen} onClose={() => setPostOpen(false)} clubId={club.id} onSuccess={refreshClub} />
      <ClubSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        club={club}
        members={club.members}
        isOwner={isOwner}
        onUpdated={refreshClub}
      />
    </div>
  );
}
