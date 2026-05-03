import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dnd-items.favorites";

const readFromStorage = (): Set<number> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === "number"));
  } catch {
    return new Set();
  }
};

const writeToStorage = (favorites: Set<number>) => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(favorites).sort((a, b) => a - b)),
    );
  } catch {
    // ignore quota / privacy-mode errors
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<number>>(readFromStorage);

  useEffect(() => {
    writeToStorage(favorites);
  }, [favorites]);

  const toggle = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.has(id),
    [favorites],
  );

  return { favorites, toggle, isFavorite };
};
