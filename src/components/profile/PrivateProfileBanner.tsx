import { Lock } from "lucide-react";

type Props = {
  isFollowing: boolean;
  isPrivate: boolean;
};

export function PrivateProfileBanner({ isFollowing, isPrivate }: Props) {
  return (
    <div className="mx-4 mb-6 flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        <Lock className="h-4 w-4 text-zinc-400" />
      </div>
      <div>
        <p className="font-medium text-white">
          {isPrivate ? "This account is private" : "Follow to see their builds"}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {isFollowing
            ? "Refresh the page if you just followed them."
            : "Follow this builder to see their posts, garage, and activity."}
        </p>
      </div>
    </div>
  );
}
