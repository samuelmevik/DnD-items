import { useEffect, useState } from "react";

export type Spell = {
  id: number;
  index: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  description: string[];
  higherLevel: string[];
};

const API_BASES = [
  "https://www.dnd5eapi.co/api/2024",
  "https://www.dnd5eapi.co/api/2014",
];
export const SPELL_API_ATTRIBUTION = "D&D 5e SRD";

// SRD content is static, so once we've fetched everything we cache it
// indefinitely (bump this key if the shape of Spell or the ruleset ever changes).
const CACHE_KEY = "spell-data-cache-v4-2024";
const CONCURRENCY = 8;
const FALLBACK_BASE = "https://www.dnd5eapi.co/api/2014";

type RawSpellListItem = { index: string; name: string; url: string };

type RawSpellDetail = {
  index: string;
  name: string;
  level?: number;
  school?: { name?: string };
  classes?: { name?: string }[];
  ritual?: boolean;
  concentration?: boolean;
  casting_time?: string;
  range?: string;
  duration?: string;
  components?: string[];
  // Shape of these two fields has varied between API versions/rulesets —
  // sometimes an array of strings, sometimes a single string, sometimes an
  // array of richer objects — so we normalize defensively below rather than
  // assuming one exact shape.
  desc?: unknown;
  higher_level?: unknown;
};

/**
 * Turns whatever shape a description-like field comes back as (a plain
 * string, an array of strings, or an array of objects with a text-bearing
 * field) into a clean array of paragraph strings.
 */
function normalizeTextLines(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n{1,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry): string => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const obj = entry as Record<string, unknown>;
          const candidate = obj.text ?? obj.desc ?? obj.description ?? obj.value;
          if (typeof candidate === "string") return candidate;
        }
        return "";
      })
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [];
}

// Returns the first non-empty text found under any of the given keys.
function pickTextLines(raw: object, keys: string[]): string[] {
  const record = raw as Record<string, unknown>;
  for (const key of keys) {
    const lines = normalizeTextLines(record[key]);
    if (lines.length > 0) return lines;
  }
  return [];
}

function toSpell(raw: RawSpellDetail): Omit<Spell, "id"> {
  return {
    index: raw.index,
    name: raw.name,
    level: typeof raw.level === "number" ? raw.level : 0,
    school: raw.school?.name ?? "Unknown",
    classes: (raw.classes ?? [])
      .map((c) => c.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0),
    ritual: raw.ritual === true,
    concentration: raw.concentration === true,
    castingTime: raw.casting_time ?? "",
    range: raw.range ?? "",
    duration: raw.duration ?? "",
    components: raw.components ?? [],
    description: pickTextLines(raw, ["desc", "description", "text", "entries"]),
    higherLevel: pickTextLines(raw, [
      "higher_level",
      "higher_levels",
      "at_higher_levels",
      "higher_level_desc",
    ]),
  };
}

async function fetchWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runOne = async () => {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await worker(items[current]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, runOne),
  );
  return results;
}

function readCache(): Spell[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Spell[]) : null;
  } catch {
    return null;
  }
}

function writeCache(spells: Spell[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(spells));
  } catch {
    // Storage full/unavailable — not fatal, we'll just re-fetch next time.
  }
}

export type SpellLoadProgress = { loaded: number; total: number };

async function fetchSpellList(
  signal?: AbortSignal,
): Promise<{ base: string; list: RawSpellListItem[] }> {
  let lastError: unknown = null;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}/spells`, { signal });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${base}`);
        continue;
      }
      const data: { results?: RawSpellListItem[] } = await res.json();
      const list = data.results ?? [];
      if (list.length > 0) return { base, list };
      lastError = new Error(`Empty spell list from ${base}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load spell list");
}

export async function loadAllSpells(
  onProgress?: (progress: SpellLoadProgress) => void,
  signal?: AbortSignal,
): Promise<Spell[]> {
  const cached = readCache();
  if (cached) return cached;

  const { base, list } = await fetchSpellList(signal);

  let loaded = 0;
  onProgress?.({ loaded, total: list.length });

  const details = await fetchWithConcurrency(list, CONCURRENCY, async (entry) => {
    try {
      const res = await fetch(`${base}/spells/${entry.index}`, { signal });
      if (!res.ok) return null;
      const raw: RawSpellDetail = await res.json();
      let spell = toSpell(raw);

      // If this ruleset's response has no readable description, borrow the
      // description text from the 2014 entry so the dialog is never blank.
      if (spell.description.length === 0 && base !== FALLBACK_BASE) {
        try {
          const res2 = await fetch(`${FALLBACK_BASE}/spells/${entry.index}`, {
            signal,
          });
          if (res2.ok) {
            const older = toSpell((await res2.json()) as RawSpellDetail);
            spell = {
              ...spell,
              description: older.description,
              higherLevel:
                spell.higherLevel.length > 0
                  ? spell.higherLevel
                  : older.higherLevel,
            };
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
        }
      }
      return spell;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      return null;
    } finally {
      loaded++;
      onProgress?.({ loaded, total: list.length });
    }
  });

  const spells = details
    .filter((s): s is Omit<Spell, "id"> => s !== null)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .map((s, i) => ({ ...s, id: i + 1 }));

  if (spells.length > 0) writeCache(spells);
  return spells;
}

export type SpellsStatus = "loading" | "ready" | "error";

export function useSpells() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [status, setStatus] = useState<SpellsStatus>("loading");
  const [progress, setProgress] = useState<SpellLoadProgress>({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    loadAllSpells((p) => setProgress(p), controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSpells(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load spells");
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  return { spells, status, progress, error };
}
