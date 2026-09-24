import { getItemImageUrl } from "./itemImages";

const API_BASE = "https://www.dnd5eapi.co/api/2014/magic-items";
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

  const res = await fetch(`${API_BASE}/${slug}`, { signal });
  if (res.status === 404) {
    descCache.set(slug, null);
    imageCache.set(slug, null);
    return null;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: unknown = await res.json();
  const desc =
    data &&
    typeof data === "object" &&
    Array.isArray((data as { desc?: unknown }).desc)
      ? ((data as { desc: unknown[] }).desc.filter(
          (d): d is string => typeof d === "string",
        ) as string[])
      : [];

  const value = desc.length > 0 ? desc : null;
  descCache.set(slug, value);

  if (data && typeof data === "object") {
    const rawImage = (data as { image?: unknown }).image;
    if (typeof rawImage === "string" && rawImage.length > 0) {
      const fullUrl = rawImage.startsWith("http")
        ? rawImage
        : `https://www.dnd5eapi.co${rawImage}`;
      imageCache.set(slug, fullUrl);
    } else {
      imageCache.set(slug, null);
    }
  }

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
    const res = await fetch(`${API_BASE}/${slug}`, { signal });
    if (res.status === 404) {
      imageCache.set(slug, null);
      return null;
    }
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (data && typeof data === "object") {
      const rawImage = (data as { image?: unknown }).image;
      if (typeof rawImage === "string" && rawImage.length > 0) {
        const fullUrl = rawImage.startsWith("http")
          ? rawImage
          : `https://www.dnd5eapi.co${rawImage}`;
        imageCache.set(slug, fullUrl);
        return fullUrl;
      }
    }
    imageCache.set(slug, null);
    return null;
  } catch {
    return null;
  }
};
