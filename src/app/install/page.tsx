import { InstallAppPanel } from "@/components/pwa/InstallAppPrompt";
import Link from "next/link";

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Download GearNet</h1>
      <p className="mt-1 text-sm text-zinc-500">Install free to your home screen</p>
      <div className="mt-6">
        <InstallAppPanel />
      </div>
      <p className="mt-6 text-sm leading-relaxed text-zinc-500">
        GearNet runs as a progressive web app (PWA). That means you get an app icon and full-screen
        experience without paying for the App Store or TestFlight.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/explore" className="text-amber-400 hover:text-amber-300">
          Open Explore
        </Link>
        {" · "}
        <Link href="/settings" className="text-amber-400 hover:text-amber-300">
          Settings
        </Link>
      </p>
    </div>
  );
}
