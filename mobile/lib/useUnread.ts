import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { api } from "./api";
import { useAuth } from "./auth";

const POLL_MS = 60_000;

export function useUnread() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    let active = true;
    const refresh = () => {
      api
        .getNotifications()
        .then((res) => {
          if (active) setUnread(res.unreadCount ?? 0);
        })
        .catch(() => {});
    };

    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      active = false;
      clearInterval(interval);
      sub.remove();
    };
  }, [user]);

  return unread;
}
