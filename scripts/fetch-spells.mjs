#!/usr/bin/env node
// Fetches the full SRD spell list from the public D&D 5e API (2024 ruleset,
// falling back to 2014 for the list itself and for any individual spell
// whose 2024 entry has no readable description) and writes a static
// src/data/spells.ts file.
//
// Run this once whenever you want to (re)generate the bundled spell data:
//
//   npm run fetch:spells
//
// Requires Node 18+ (for global fetch) and an internet connection. After
// running it, the site reads spells.ts directly — no runtime API calls.
//
// Hand edits to individual entries in spells.ts (deleting a spell, adding
// an `image`, fixing a typo) are fine — just know that re-running this
// script will overwrite the whole file, so re-apply any manual edits after.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_BASES = [
  "https://www.dnd5eapi.co/api/2024",
  "https://www.dnd5eapi.co/api/2014",
];
const FALLBACK_BASE = "https://www.dnd5eapi.co/api/2014";
const CONCURRENCY = 8;
const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/spells.ts",
);

function normalizeTextLines(value) {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const c = entry.text ?? entry.desc ?? entry.description ?? entry.value;
          if (typeof c === "string") return c;
        }
        return "";
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function pickTextLines(raw, keys) {
  for (const key of keys) {
    const lines = normalizeTextLines(raw[key]);
    if (lines.length > 0) return lines;
  }
  return [];
}

function toSpell(raw) {
  return {
    index: raw.index,
    name: raw.name,
    level: typeof raw.level === "number" ? raw.level : 0,
    school: raw.school?.name ?? "Unknown",
    classes: (raw.classes ?? [])
      .map((c) => c.name)
      .filter((n) => typeof n === "string" && n.length > 0),
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

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchSpellList() {
  for (const base of API_BASES) {
    try {
      const data = await fetchJson(`${base}/spells`);
      const list = data.results ?? [];
      if (list.length > 0) return { base, list };
    } catch (err) {
      console.warn(`Could not load spell list from ${base}: ${err.message}`);
    }
  }
  throw new Error("Could not load the spell list from any API base.");
}

async function fetchWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  console.log("Fetching spell list...");
  const { base, list } = await fetchSpellList();
  console.log(`Found ${list.length} spells from ${base}. Fetching details...`);

  let loaded = 0;

  const details = await fetchWithConcurrency(list, CONCURRENCY, async (entry) => {
    try {
      const raw = await fetchJson(`${base}/spells/${entry.index}`);
      let spell = toSpell(raw);

      if (spell.description.length === 0 && base !== FALLBACK_BASE) {
        try {
          const olderRaw = await fetchJson(`${FALLBACK_BASE}/spells/${entry.index}`);
          const older = toSpell(olderRaw);
          spell = {
            ...spell,
            description: older.description,
            higherLevel:
              spell.higherLevel.length > 0 ? spell.higherLevel : older.higherLevel,
          };
        } catch {
          // No 2014 fallback available either; leave description empty.
        }
      }
      return spell;
    } catch (err) {
      console.warn(`Skipping ${entry.index}: ${err.message}`);
      return null;
    } finally {
      loaded++;
      if (loaded % 25 === 0 || loaded === list.length) {
        console.log(`  ${loaded}/${list.length}`);
      }
    }
  });

  const spells = details
    .filter((s) => s !== null)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .map((s, i) => ({ id: i + 1, ...s }));

  const header = `// AUTO-GENERATED by scripts/fetch-spells.mjs — run \`npm run fetch:spells\`
// to regenerate. Hand edits to individual entries (deleting a spell, adding
// an \`image\`, fixing a typo) are fine, but running the script again will
// overwrite the whole file.

export type Spell = {
  id: number;
  index: string;
  name: string;
  level: number;
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
  /** Optional custom artwork. Import an image from src/assets and pass its
   *  resolved path here, or reference a path under public/. Falls back to
   *  the school icon when omitted. */
  image?: string;
};

export const spells: Spell[] = `;

  const body = JSON.stringify(spells, null, 2);
  await writeFile(OUTPUT_PATH, `${header}${body};\n`, "utf-8");
  console.log(
    `Wrote ${spells.length} spells to ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
