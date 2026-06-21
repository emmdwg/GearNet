"use client";

import { useEffect, useState } from "react";

export function useUnreadNotifications(pollMs = 30000) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const load = () =>
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data) setUnread(data.unreadCount ?? 0);
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
