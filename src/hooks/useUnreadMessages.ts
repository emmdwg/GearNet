"use client";

import { useEffect, useState } from "react";

export function useUnreadMessages(pollMs = 30000) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const load = () =>
      fetch("/api/conversations")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active || !data) return;
          const list = Array.isArray(data) ? data : [];
          setUnread(list.reduce((sum: number, c: { unread?: number }) => sum + (c.unread ?? 0), 0));
        })
        .catch(() => {});

    load();
    const interval = setInterval(load, pollMs);
    function onFocus() {
      load();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [pollMs]);

  return unread;
}
