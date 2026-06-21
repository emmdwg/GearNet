import { SearchClient } from "@/app/search/SearchClient";
import { Suspense } from "react";

export const metadata = { title: "Search · GearNet" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading search...</div>}>
      <SearchClient />
    </Suspense>
  );
}
