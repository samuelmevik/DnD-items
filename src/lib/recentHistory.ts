import { useCallback, useEffect, useState } from "react";

export type RecentView = {
  id: number;
  type: "item" | "spell";
  viewedAt: number;
};

const RECENT_KEY = "dnd-items.recent-views.v1";
const MAX_RECENT = 20;

export function getRecentViews(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (v) =>
          typeof v === "object" &&
          v !== null &&
          typeof v.id === "number" &&
          (v.type === "item" || v.type === "spell"),
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveRecentViews(views: RecentView[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(views.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

export function useRecentHistory() {
  const [recentViews, setRecentViews] = useState<RecentView[]>(getRecentViews);

  const addRecent = useCallback((type: "item" | "spell", id: number) => {
    setRecentViews((prev) => {
      // Remove existing entry for same item/spell and prepend new one
      const filtered = prev.filter((v) => !(v.type === type && v.id === id));
      const next = [{ id, type, viewedAt: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT,
      );
      saveRecentViews(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentViews([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    setRecentViews(getRecentViews());
  }, []);

  return {
    recentViews,
    addRecent,
    clearRecent,
  };
}
