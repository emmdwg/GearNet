"use client";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  avatar: string;
};

export function ProfileAvatarEdit({ avatar }: Props) {
  const { refresh } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState(avatar);
  const [saving, setSaving] = useState(false);

  async function handleChange(url: string) {
    setValue(url);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { avatar: url } }),
      });
      if (res.ok) {
        await refresh();
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AvatarPicker
      value={value}
      onChange={handleChange}
      label={saving ? "Saving..." : "Tap to change photo"}
      uploadOnPick
    />
  );
}
