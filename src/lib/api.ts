const API_BASE = "https://www.dnd5eapi.co/api/2014/magic-items";
export const API_ATTRIBUTION = "D&D 5e SRD";

const cache = new Map<string, string[] | null>();

export const fetchItemDescription = async (
  slug: string,
  signal?: AbortSignal,
): Promise<string[] | null> => {
  if (!slug) return null;

  const cached = cache.get(slug);
  if (cached !== undefined) return cached;

  const res = await fetch(`${API_BASE}/${slug}`, { signal });
  if (res.status === 404) {
    cache.set(slug, null);
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
  cache.set(slug, value);
  return value;
};
