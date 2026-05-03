import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  FilterState,
  RARITIES,
  SortKey,
  SORT_LABELS,
} from "./filters";

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];
const RARITY_LOOKUP = new Map<string, string>(
  RARITIES.map((r) => [r.toLowerCase(), r]),
);
const CATEGORY_LOOKUP = new Map<string, string>(
  CATEGORIES.map((c) => [c.toLowerCase(), c]),
);

const encodeList = (values: string[]): string =>
  [...values].sort((a, b) => a.localeCompare(b)).join(",");

const decodeList = (
  raw: string | null,
  lookup: Map<string, string>,
): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => lookup.get(s.trim().toLowerCase()))
    .filter((s): s is string => Boolean(s));
};

const decodeInt = (raw: string | null, fallback: number): number => {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export const decodeFilters = (
  search: string,
  defaults: FilterState,
): FilterState => {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") as SortKey | null;
  return {
    search: params.get("q") ?? defaults.search,
    rarities: decodeList(params.get("r"), RARITY_LOOKUP),
    categories: decodeList(params.get("c"), CATEGORY_LOOKUP),
    minPrice: decodeInt(params.get("min"), defaults.minPrice),
    maxPrice: decodeInt(params.get("max"), defaults.maxPrice),
    favoritesOnly: params.get("fav") === "1",
    sort: sort && SORT_KEYS.includes(sort) ? sort : defaults.sort,
  };
};

export const encodeFilters = (
  state: FilterState,
  defaults: FilterState,
): string => {
  const params = new URLSearchParams();
  if (state.search) params.set("q", state.search);
  if (state.rarities.length) params.set("r", encodeList(state.rarities));
  if (state.categories.length) params.set("c", encodeList(state.categories));
  if (state.minPrice !== defaults.minPrice)
    params.set("min", String(state.minPrice));
  if (state.maxPrice !== defaults.maxPrice)
    params.set("max", String(state.maxPrice));
  if (state.favoritesOnly) params.set("fav", "1");
  if (state.sort !== defaults.sort) params.set("sort", state.sort);
  return params.toString();
};

const SEARCH_DEBOUNCE_MS = 200;

export const useFilterState = (
  defaults: FilterState,
): [FilterState, (patch: Partial<FilterState>) => void, () => void] => {
  const [state, setStateRaw] = useState<FilterState>(() => {
    if (typeof window === "undefined") return defaults;
    return decodeFilters(window.location.search, defaults);
  });

  const lastWrittenRef = useRef<string>("");

  useEffect(() => {
    const onPop = () => {
      setStateRaw(decodeFilters(window.location.search, defaults));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [defaults]);

  useEffect(() => {
    const write = () => {
      const qs = encodeFilters(state, defaults);
      const next = `${window.location.pathname}${qs ? "?" + qs : ""}`;
      const current = window.location.pathname + window.location.search;
      if (next === current) return;
      lastWrittenRef.current = qs;
      window.history.replaceState(null, "", next);
    };

    const handle = window.setTimeout(write, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [state, defaults]);

  const update = useCallback((patch: Partial<FilterState>) => {
    setStateRaw((s) => ({ ...s, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setStateRaw(defaults);
  }, [defaults]);

  return [state, update, reset];
};
