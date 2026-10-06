import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  FilterState,
  RARITIES,
  SortKey,
  SORT_LABELS,
} from "./filters";
import {
  CLASSES,
  LEVELS,
  SCHOOLS,
  SPELL_SORT_LABELS,
  SpellFilterState,
  SpellSortKey,
} from "./spellFilters";

export type CatalogTab = "items" | "spells";

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];
const RARITY_LOOKUP = new Map<string, string>(
  RARITIES.map((r) => [r.toLowerCase(), r]),
);
const CATEGORY_LOOKUP = new Map<string, string>(
  CATEGORIES.map((c) => [c.toLowerCase(), c]),
);

const SPELL_SORT_KEYS = Object.keys(SPELL_SORT_LABELS) as SpellSortKey[];
const SCHOOL_LOOKUP = new Map<string, string>(
  SCHOOLS.map((s) => [s.toLowerCase(), s]),
);
const CLASS_LOOKUP = new Map<string, string>(
  CLASSES.map((c) => [c.toLowerCase(), c]),
);
const LEVEL_LOOKUP = new Set<number>(LEVELS);

const encodeList = (values: string[]): string =>
  [...values].sort((a, b) => a.localeCompare(b)).join(",");

const decodeList = (
  raw: string | null,
  lookup: Map<string, string>,
): string[] => {
  if (!raw) return [];
  const decoded = raw
    .split(",")
    .map((s) => lookup.get(s.trim().toLowerCase()))
    .filter((s): s is string => Boolean(s));
  return Array.from(new Set(decoded));
};

const encodeIntList = (values: number[]): string =>
  [...values].sort((a, b) => a - b).join(",");

const decodeIntList = (raw: string | null, valid: Set<number>): number[] => {
  if (!raw) return [];
  const nums = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && valid.has(n));
  return Array.from(new Set(nums)).sort((a, b) => a - b);
};

const decodeInt = (raw: string | null, fallback: number): number => {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export const decodeTab = (search: string): CatalogTab => {
  const params = new URLSearchParams(search);
  return params.get("tab") === "spells" ? "spells" : "items";
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

const preserveSharedParams = (params: URLSearchParams) => {
  if (typeof window === "undefined") return;
  const currentParams = new URLSearchParams(window.location.search);
  for (const key of [
    "sharedList",
    "listName",
    "list",
    "items",
    "itemIds",
    "spells",
    "spellIds",
  ]) {
    const val = currentParams.get(key);
    if (val && !params.has(key)) {
      params.set(key, val);
    }
  }
};

export const removeSharedParamsFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of [
    "sharedList",
    "listName",
    "list",
    "items",
    "itemIds",
    "spells",
    "spellIds",
  ]) {
    url.searchParams.delete(key);
  }
  const cleanSearch = url.searchParams.toString();
  const next = `${url.pathname}${cleanSearch ? "?" + cleanSearch : ""}`;
  window.history.replaceState(null, "", next);
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
  preserveSharedParams(params);
  return params.toString();
};

export const decodeItemFilters = decodeFilters;
export const encodeItemFilters = encodeFilters;

export const decodeSpellFilters = (
  search: string,
  defaults: SpellFilterState,
): SpellFilterState => {
  const params = new URLSearchParams(search);
  const sort = params.get("sort") as SpellSortKey | null;
  return {
    search: params.get("q") ?? defaults.search,
    levels: decodeIntList(params.get("lvl"), LEVEL_LOOKUP),
    schools: decodeList(params.get("school"), SCHOOL_LOOKUP),
    classes: decodeList(params.get("cls"), CLASS_LOOKUP),
    ritualOnly: params.get("rit") === "1",
    concentrationOnly: params.get("conc") === "1",
    favoritesOnly: params.get("fav") === "1",
    sort: sort && SPELL_SORT_KEYS.includes(sort) ? sort : defaults.sort,
  };
};

export const encodeSpellFilters = (
  state: SpellFilterState,
  defaults: SpellFilterState,
): string => {
  const params = new URLSearchParams();
  params.set("tab", "spells");
  if (state.search) params.set("q", state.search);
  if (state.levels.length) params.set("lvl", encodeIntList(state.levels));
  if (state.schools.length) params.set("school", encodeList(state.schools));
  if (state.classes.length) params.set("cls", encodeList(state.classes));
  if (state.ritualOnly) params.set("rit", "1");
  if (state.concentrationOnly) params.set("conc", "1");
  if (state.favoritesOnly) params.set("fav", "1");
  if (state.sort !== defaults.sort) params.set("sort", state.sort);
  preserveSharedParams(params);
  return params.toString();
};

const SEARCH_DEBOUNCE_MS = 200;

export interface UseCatalogUrlStateReturn {
  activeTab: CatalogTab;
  setActiveTab: (tab: CatalogTab) => void;
  itemState: FilterState;
  updateItemState: (patch: Partial<FilterState>) => void;
  resetItemState: () => void;
  spellState: SpellFilterState;
  updateSpellState: (patch: Partial<SpellFilterState>) => void;
  resetSpellState: () => void;
}

export const useCatalogUrlState = (
  defaultItemFilters: FilterState,
  defaultSpellFilters: SpellFilterState,
): UseCatalogUrlStateReturn => {
  const [activeTab, setActiveTabRaw] = useState<CatalogTab>(() => {
    if (typeof window === "undefined") return "items";
    return decodeTab(window.location.search);
  });

  const [itemFilters, setItemFiltersRaw] = useState<FilterState>(() => {
    if (typeof window === "undefined") return defaultItemFilters;
    return decodeItemFilters(window.location.search, defaultItemFilters);
  });

  const [spellFilters, setSpellFiltersRaw] = useState<SpellFilterState>(() => {
    if (typeof window === "undefined") return defaultSpellFilters;
    return decodeSpellFilters(window.location.search, defaultSpellFilters);
  });

  const lastTabRef = useRef<CatalogTab>(activeTab);
  const isInitialMount = useRef(true);

  // Sync state when browser Back/Forward (popstate) occurs
  useEffect(() => {
    const onPop = () => {
      const search = window.location.search;
      const nextTab = decodeTab(search);
      setActiveTabRaw(nextTab);
      lastTabRef.current = nextTab;
      setItemFiltersRaw(decodeItemFilters(search, defaultItemFilters));
      setSpellFiltersRaw(decodeSpellFilters(search, defaultSpellFilters));
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [defaultItemFilters, defaultSpellFilters]);

  // Sync state to URL with debounce for filters, immediate pushState for tab switches
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTabSwitch =
      !isInitialMount.current && lastTabRef.current !== activeTab;

    const write = () => {
      lastTabRef.current = activeTab;
      isInitialMount.current = false;

      const qs =
        activeTab === "spells"
          ? encodeSpellFilters(spellFilters, defaultSpellFilters)
          : encodeItemFilters(itemFilters, defaultItemFilters);

      const next = `${window.location.pathname}${qs ? "?" + qs : ""}`;
      const current = `${window.location.pathname}${window.location.search}`;

      if (next === current) return;

      if (isTabSwitch) {
        window.history.pushState(null, "", next);
      } else {
        window.history.replaceState(null, "", next);
      }
    };

    if (isTabSwitch) {
      write();
      return;
    }

    const handle = window.setTimeout(write, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [
    activeTab,
    itemFilters,
    spellFilters,
    defaultItemFilters,
    defaultSpellFilters,
  ]);

  const setActiveTab = useCallback((tab: CatalogTab) => {
    setActiveTabRaw(tab);
  }, []);

  const updateItemState = useCallback((patch: Partial<FilterState>) => {
    setItemFiltersRaw((s) => ({ ...s, ...patch }));
  }, []);

  const resetItemState = useCallback(() => {
    setItemFiltersRaw(defaultItemFilters);
  }, [defaultItemFilters]);

  const updateSpellState = useCallback((patch: Partial<SpellFilterState>) => {
    setSpellFiltersRaw((s) => ({ ...s, ...patch }));
  }, []);

  const resetSpellState = useCallback(() => {
    setSpellFiltersRaw(defaultSpellFilters);
  }, [defaultSpellFilters]);

  return {
    activeTab,
    setActiveTab,
    itemState: itemFilters,
    updateItemState,
    resetItemState,
    spellState: spellFilters,
    updateSpellState,
    resetSpellState,
  };
};

export const useFilterState = (
  defaults: FilterState,
): [FilterState, (patch: Partial<FilterState>) => void, () => void] => {
  const [state, setStateRaw] = useState<FilterState>(() => {
    if (typeof window === "undefined") return defaults;
    return decodeFilters(window.location.search, defaults);
  });

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
