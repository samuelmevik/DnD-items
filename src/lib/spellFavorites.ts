import { useCallback, useState } from "react";

const STORAGE_KEY = "spell-favorites";

function readFavorites(): Set<number> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeFavorites(favorites: Set<number>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  } catch {
    // ignore — favorites just won't persist this session
  }
}

export function useSpellFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(() => readFavorites());

  const toggle = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
