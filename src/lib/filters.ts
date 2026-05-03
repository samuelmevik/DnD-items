import { Item, allTags } from "@/data/items";

export const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
  "Artifact",
] as const;

export type Rarity = (typeof RARITIES)[number];

const RARITY_SET = new Set<string>(RARITIES);

export const isRarity = (tag: string): tag is Rarity => RARITY_SET.has(tag);

export const CATEGORIES: string[] = allTags
  .filter((t) => !RARITY_SET.has(t))
  .sort((a, b) => a.localeCompare(b));

export const RARITY_INDEX: Record<string, number> = Object.fromEntries(
  RARITIES.map((r, i) => [r, i]),
);

export type SortKey =
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "rarity-asc"
  | "rarity-desc";

export const SORT_LABELS: Record<SortKey, string> = {
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
  "rarity-asc": "Rarity: common first",
  "rarity-desc": "Rarity: rare first",
};

export type FilterState = {
  search: string;
  rarities: string[];
  categories: string[];
  minPrice: number;
  maxPrice: number;
  favoritesOnly: boolean;
  sort: SortKey;
};

const itemRarity = (item: Item): string | undefined =>
  item.tags.find(isRarity);

const itemCategories = (item: Item): string[] =>
  item.tags.filter((t) => !isRarity(t));

const matchesSearch = (item: Item, term: string): boolean => {
  if (!term) return true;
  const t = term.toLowerCase();
  if (item.name.toLowerCase().includes(t)) return true;
  return item.description.some((d) => d.toLowerCase().includes(t));
};

export type FilterPredicate = {
  search?: boolean;
  rarities?: boolean;
  categories?: boolean;
  price?: boolean;
  favorites?: boolean;
};

const passes = (
  item: Item,
  state: FilterState,
  favorites: Set<number>,
  skip: FilterPredicate = {},
): boolean => {
  if (!skip.search && !matchesSearch(item, state.search)) return false;

  if (!skip.rarities && state.rarities.length > 0) {
    const r = itemRarity(item);
    if (!r || !state.rarities.includes(r)) return false;
  }

  if (!skip.categories && state.categories.length > 0) {
    const cats = itemCategories(item);
    if (!cats.some((c) => state.categories.includes(c))) return false;
  }

  if (!skip.price) {
    if (item.price < state.minPrice || item.price > state.maxPrice) return false;
  }

  if (!skip.favorites && state.favoritesOnly && !favorites.has(item.id)) {
    return false;
  }

  return true;
};

const compare = (a: Item, b: Item, sort: SortKey): number => {
  switch (sort) {
    case "price-asc":
      return a.price - b.price;
    case "price-desc":
      return b.price - a.price;
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "rarity-asc":
    case "rarity-desc": {
      const ar = itemRarity(a);
      const br = itemRarity(b);
      const ai = ar ? RARITY_INDEX[ar] : RARITIES.length;
      const bi = br ? RARITY_INDEX[br] : RARITIES.length;
      const diff = ai - bi;
      if (diff !== 0) return sort === "rarity-asc" ? diff : -diff;
      return a.price - b.price;
    }
  }
};

export const filterItems = (
  items: Item[],
  state: FilterState,
  favorites: Set<number>,
): Item[] => {
  const out = items.filter((item) => passes(item, state, favorites));
  out.sort((a, b) => compare(a, b, state.sort));
  return out;
};

export const tagCount = (
  items: Item[],
  state: FilterState,
  favorites: Set<number>,
  group: "rarities" | "categories",
  tag: string,
): number => {
  const skip: FilterPredicate = { [group]: true };
  let count = 0;
  for (const item of items) {
    if (!passes(item, state, favorites, skip)) continue;
    if (group === "rarities") {
      if (itemRarity(item) === tag) count++;
    } else {
      if (item.tags.includes(tag)) count++;
    }
  }
  return count;
};

export const activeFilterCount = (state: FilterState): number => {
  let n = 0;
  if (state.search) n++;
  n += state.rarities.length;
  n += state.categories.length;
  if (state.favoritesOnly) n++;
  return n;
};
