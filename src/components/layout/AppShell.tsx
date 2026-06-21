import { Sidebar, MobileNav } from "./Navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
