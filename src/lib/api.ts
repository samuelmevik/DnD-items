import { getItemImageUrl } from "./itemImages";

// Try the 2024 ruleset first, falling back to 2014 for any item the 2024
// data doesn't have (slugs in items.ts originate from the 2014 data).
const API_BASES = [
  "https://www.dnd5eapi.co/api/2024/magic-items",
  "https://www.dnd5eapi.co/api/2014/magic-items",
];

const normalizeDesc = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (Array.isArray(value)) {
    return value
      .map((entry): string => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const o = entry as Record<string, unknown>;
          const c = o.text ?? o.desc ?? o.description ?? o.value;
          if (typeof c === "string") return c;
        }
        return "";
      })
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
};

const toImageUrl = (rawImage: unknown): string | null =>
  typeof rawImage === "string" && rawImage.length > 0
    ? rawImage.startsWith("http")
      ? rawImage
      : `https://www.dnd5eapi.co${rawImage}`
    : null;

type RawItem = { desc?: unknown; image?: unknown };

// Fetches one item, trying each API base in order. Returns null if no base has it.
const fetchItemRaw = async (
  slug: string,
  signal?: AbortSignal,
): Promise<RawItem | null> => {
  let sawServerError = false;
  for (const base of API_BASES) {
    const res = await fetch(`${base}/${slug}`, { signal });
    if (res.status === 404) continue;
    if (!res.ok) {
      sawServerError = true;
      continue;
    }
    const data: unknown = await res.json();
    if (data && typeof data === "object") return data as RawItem;
  }
  if (sawServerError) throw new Error("HTTP error fetching item");
  return null;
};

export const API_ATTRIBUTION = "D&D 5e SRD";

const descCache = new Map<string, string[] | null>();
const imageCache = new Map<string, string | null>();

export const fetchItemDescription = async (
  slug: string,
  signal?: AbortSignal,
): Promise<string[] | null> => {
  if (!slug) return null;

  const cached = descCache.get(slug);
  if (cached !== undefined) return cached;

  const data = await fetchItemRaw(slug, signal);
  if (!data) {
    descCache.set(slug, null);
    imageCache.set(slug, null);
    return null;
  }

  const desc = normalizeDesc(data.desc);
  const value = desc.length > 0 ? desc : null;
  descCache.set(slug, value);
  imageCache.set(slug, toImageUrl(data.image));

  return value;
};

export const fetchItemImage = async (
  slug: string,
  signal?: AbortSignal,
): Promise<string | null> => {
  if (!slug) return null;

  // 1. Check known static map and family fallbacks
  const known = getItemImageUrl({ name: slug, slug });
  if (known) return known;

  // 2. Check dynamic cache
  const cached = imageCache.get(slug);
  if (cached !== undefined) return cached;

  // 3. Query API if not yet in cache
  try {
    const data = await fetchItemRaw(slug, signal);
    const url = data ? toImageUrl(data.image) : null;
    imageCache.set(slug, url);
    return url;
  } catch {
    return null;
  }
};
