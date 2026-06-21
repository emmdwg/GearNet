"use client";

import { CoverPicker } from "@/components/ui/CoverPicker";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  coverImage: string;
};

export function ProfileCoverEdit({ coverImage }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(coverImage);

  async function handleChange(url: string) {
    setValue(url);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { coverImage: url } }),
    });
    router.refresh();
  }

  return (
    <CoverPicker value={value} onChange={handleChange} className="h-40 sm:h-52" />
  );
}
