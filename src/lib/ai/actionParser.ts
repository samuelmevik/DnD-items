import { ParsedListAction, ParsedFilterAction } from "./types";
import { findItemByRef, findSpellByRef } from "./retriever";
import { RARITIES, CATEGORIES, Rarity, AttunementFilter } from "../filters";
import {
  SCHOOLS,
  CLASSES,
  CASTING_TIMES,
  CastingTimeCategory,
} from "../spellFilters";

export interface ParseResult {
  cleanedText: string;
  action: ParsedListAction | null;
  filterAction: ParsedFilterAction | null;
}

/**
 * Robust JSON parser with tolerance for trailing commas, single quotes,
 * and unquoted property names.
 */
export function safeJsonParse(snippet: string): Record<string, unknown> | null {
  const trimmed = snippet.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // Attempt lenient sanitization
  }

  try {
    let sanitized = trimmed
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([}\]])/g, "$1")
      // Replace single-quoted strings: 'val' -> "val"
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
      // Quote unquoted object keys: { key: "val" } -> { "key": "val" }
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    // Clean any trailing commas that might have emerged
    sanitized = sanitized.replace(/,\s*([}\]])/g, "$1");

    return JSON.parse(sanitized);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Normalization Helpers
// -------------------------------------------------------------

const RARITY_MAP = new Map<string, Rarity>(
  RARITIES.map((r) => [r.toLowerCase(), r]),
);

const CATEGORY_MAP = new Map<string, string>(
  CATEGORIES.map((c) => [c.toLowerCase(), c]),
);

// Map common plurals and aliases to canonical categories
const CATEGORY_ALIASES: Record<string, string> = {
  weapons: "Weapon",
  armors: "Armor",
  potions: "Potion",
  rings: "Ring",
  rods: "Rod",
  scrolls: "Scroll",
  staffs: "Staff",
  staves: "Staff",
  wands: "Wand",
  shields: "Shield",
  tools: "Tool",
  cloaks: "Cloak",
  "wondrous items": "Wondrous Item",
  "wondrous item": "Wondrous Item",
  wondrous: "Wondrous Item",
};

const SCHOOL_MAP = new Map<string, string>(
  SCHOOLS.map((s) => [s.toLowerCase(), s]),
);

const CLASS_MAP = new Map<string, string>(
  CLASSES.map((c) => [c.toLowerCase(), c]),
);

const CASTING_TIME_MAP = new Map<string, CastingTimeCategory>(
  CASTING_TIMES.map((ct) => [ct.toLowerCase(), ct]),
);

function normalizeRarities(input: unknown): Rarity[] {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const result: Rarity[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase().replace(/-/g, " ");
    const match = RARITY_MAP.get(clean);
    if (match && !result.includes(match)) {
      result.push(match);
    }
  }
  return result;
}

function normalizeCategories(input: unknown): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const result: string[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase();
    const alias = CATEGORY_ALIASES[clean];
    if (alias) {
      if (!result.includes(alias)) result.push(alias);
      continue;
    }
    const match = CATEGORY_MAP.get(clean);
    if (match && !result.includes(match)) {
      result.push(match);
    }
  }
  return result;
}

function normalizeAttunement(input: unknown): AttunementFilter | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input === "boolean") {
    return input ? "requires" : "none";
  }
  if (typeof input === "string") {
    const s = input.trim().toLowerCase();
    if (["requires", "required", "yes", "true", "attuned"].includes(s)) {
      return "requires";
    }
    if (["none", "no", "false", "unattuned", "not required"].includes(s)) {
      return "none";
    }
    if (["all", "any", "either"].includes(s)) {
      return "all";
    }
  }
  return undefined;
}

const LEVEL_WORDS: Record<string, number> = {
  cantrip: 0,
  cantrips: 0,
  zero: 0,
  zeroth: 0,
  "0": 0,
  "1": 1,
  "1st": 1,
  first: 1,
  one: 1,
  "2": 2,
  "2nd": 2,
  second: 2,
  two: 2,
  "3": 3,
  "3rd": 3,
  third: 3,
  three: 3,
  "4": 4,
  "4th": 4,
  fourth: 4,
  four: 4,
  "5": 5,
  "5th": 5,
  fifth: 5,
  five: 5,
  "6": 6,
  "6th": 6,
  sixth: 6,
  six: 6,
  "7": 7,
  "7th": 7,
  seventh: 7,
  seven: 7,
  "8": 8,
  "8th": 8,
  eighth: 8,
  eight: 8,
  "9": 9,
  "9th": 9,
  ninth: 9,
  nine: 9,
};

function normalizeLevels(input: unknown): number[] {
  if (input === undefined || input === null) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string" || typeof input === "number"
    ? [input]
    : [];

  const set = new Set<number>();
  for (const item of rawList) {
    if (typeof item === "number" && Number.isInteger(item) && item >= 0 && item <= 9) {
      set.add(item);
    } else if (typeof item === "string") {
      const clean = item.trim().toLowerCase().replace(/^level\s*/, "");
      if (clean in LEVEL_WORDS) {
        set.add(LEVEL_WORDS[clean]);
      } else {
        const parsed = parseInt(clean, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 9) {
          set.add(parsed);
        }
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

function normalizeSchools(input: unknown): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const result: string[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase();
    const match = SCHOOL_MAP.get(clean);
    if (match && !result.includes(match)) {
      result.push(match);
    }
  }
  return result;
}

function normalizeClasses(input: unknown): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const result: string[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase().replace(/s$/, ""); // singularize
    const match = CLASS_MAP.get(clean) || CLASS_MAP.get(clean + "s");
    if (match && !result.includes(match)) {
      result.push(match);
    }
  }
  return result;
}

function normalizeCastingTimes(input: unknown): CastingTimeCategory[] {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const result: CastingTimeCategory[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") continue;
    const clean = item.trim().toLowerCase();
    if (clean.includes("bonus")) {
      if (!result.includes("Bonus Action")) result.push("Bonus Action");
    } else if (clean.includes("reaction")) {
      if (!result.includes("Reaction")) result.push("Reaction");
    } else if (clean.includes("action") && !clean.includes("bonus")) {
      if (!result.includes("Action")) result.push("Action");
    } else if (clean.includes("minute") || clean.includes("hour")) {
      if (!result.includes("1 Minute+")) result.push("1 Minute+");
    } else {
      const match = CASTING_TIME_MAP.get(clean);
      if (match && !result.includes(match)) {
        result.push(match);
      }
    }
  }
  return result;
}

function parseNumber(input: unknown): number | undefined {
  if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
    return Math.round(input);
  }
  if (typeof input === "string") {
    const num = parseInt(input.replace(/[^0-9]/g, ""), 10);
    if (!Number.isNaN(num) && num >= 0) return num;
  }
  return undefined;
}

// -------------------------------------------------------------
// Filter Action Parser
// -------------------------------------------------------------

function buildFilterAction(parsed: Record<string, unknown>): ParsedFilterAction | null {
  const rawTab = (
    (typeof parsed.targetTab === "string" ? parsed.targetTab : "") ||
    (typeof parsed.tab === "string" ? parsed.tab : "") ||
    (typeof parsed.type === "string" && ["items", "spells"].includes(parsed.type.toLowerCase())
      ? parsed.type
      : "")
  ).toLowerCase();

  // Determine target tab
  const hasSpellKeys =
    Boolean(parsed.levels || parsed.level || parsed.spellLevels) ||
    Boolean(parsed.schools || parsed.school) ||
    Boolean(parsed.classes || parsed.class) ||
    Boolean(parsed.castingTimes || parsed.castingTime) ||
    Boolean(parsed.ritualOnly !== undefined || parsed.ritual !== undefined) ||
    Boolean(parsed.concentrationOnly !== undefined || parsed.concentration !== undefined);

  let targetTab: "items" | "spells" = "items";
  if (rawTab === "spells" || (rawTab !== "items" && hasSpellKeys)) {
    targetTab = "spells";
  }

  const rawSearch =
    typeof parsed.search === "string"
      ? parsed.search.trim()
      : typeof parsed.query === "string"
      ? parsed.query.trim()
      : typeof parsed.q === "string"
      ? parsed.q.trim()
      : "";

  if (targetTab === "items") {
    const rarities = normalizeRarities(
      parsed.rarities ?? parsed.rarity ?? parsed.rarityList,
    );
    const categories = normalizeCategories(
      parsed.categories ?? parsed.category ?? parsed.itemTypes ?? parsed.types ?? parsed.itemType,
    );
    const attunement = normalizeAttunement(parsed.attunement);
    const minPrice = parseNumber(parsed.minPrice ?? parsed.min_price ?? parsed.priceMin);
    const maxPrice = parseNumber(parsed.maxPrice ?? parsed.max_price ?? parsed.priceMax);

    // If completely empty, not a valid filter action
    if (
      rarities.length === 0 &&
      categories.length === 0 &&
      !attunement &&
      minPrice === undefined &&
      maxPrice === undefined &&
      !rawSearch
    ) {
      return null;
    }

    const itemPatch: Record<string, unknown> = {};
    if (rarities.length > 0) itemPatch.rarities = rarities;
    if (categories.length > 0) itemPatch.categories = categories;
    if (attunement && attunement !== "all") itemPatch.attunement = attunement;
    if (minPrice !== undefined) itemPatch.minPrice = minPrice;
    if (maxPrice !== undefined) itemPatch.maxPrice = maxPrice;
    if (rawSearch) itemPatch.search = rawSearch;

    const defaultTitle = [
      rarities.join(", "),
      categories.join(", "),
      attunement === "requires" ? "Attuned" : attunement === "none" ? "No Attunement" : "",
    ]
      .filter(Boolean)
      .join(" • ") || (rawSearch ? `Items: "${rawSearch}"` : "Proposed Item Filters");

    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : defaultTitle;

    return {
      targetTab: "items",
      title,
      rarities: rarities.length > 0 ? rarities : undefined,
      categories: categories.length > 0 ? categories : undefined,
      attunement,
      minPrice,
      maxPrice,
      search: rawSearch || undefined,
      itemPatch,
    };
  } else {
    // Spells tab
    const levels = normalizeLevels(
      parsed.levels ?? parsed.level ?? parsed.spellLevels,
    );
    const schools = normalizeSchools(parsed.schools ?? parsed.school);
    const classes = normalizeClasses(parsed.classes ?? parsed.class);
    const castingTimes = normalizeCastingTimes(
      parsed.castingTimes ?? parsed.castingTime,
    );
    const ritualOnly = Boolean(parsed.ritualOnly ?? parsed.ritual ?? false);
    const concentrationOnly = Boolean(
      parsed.concentrationOnly ?? parsed.concentration ?? false,
    );

    if (
      levels.length === 0 &&
      schools.length === 0 &&
      classes.length === 0 &&
      castingTimes.length === 0 &&
      !ritualOnly &&
      !concentrationOnly &&
      !rawSearch
    ) {
      return null;
    }

    const spellPatch: Record<string, unknown> = {};
    if (levels.length > 0) spellPatch.levels = levels;
    if (schools.length > 0) spellPatch.schools = schools;
    if (classes.length > 0) spellPatch.classes = classes;
    if (castingTimes.length > 0) spellPatch.castingTimes = castingTimes;
    if (ritualOnly) spellPatch.ritualOnly = true;
    if (concentrationOnly) spellPatch.concentrationOnly = true;
    if (rawSearch) spellPatch.search = rawSearch;

    const defaultTitle = [
      classes.join(", "),
      schools.join(", "),
      levels.length > 0 ? `Lvl ${levels.join(",")}` : "",
      ritualOnly ? "Ritual" : "",
    ]
      .filter(Boolean)
      .join(" • ") || (rawSearch ? `Spells: "${rawSearch}"` : "Proposed Spell Filters");

    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : defaultTitle;

    return {
      targetTab: "spells",
      title,
      levels: levels.length > 0 ? levels : undefined,
      schools: schools.length > 0 ? schools : undefined,
      classes: classes.length > 0 ? classes : undefined,
      castingTimes: castingTimes.length > 0 ? castingTimes : undefined,
      ritualOnly: ritualOnly ? true : undefined,
      concentrationOnly: concentrationOnly ? true : undefined,
      search: rawSearch || undefined,
      spellPatch,
    };
  }
}

// -------------------------------------------------------------
// List Action Parser
// -------------------------------------------------------------

function buildListAction(parsed: Record<string, unknown>): ParsedListAction | null {
  const name =
    typeof parsed.name === "string" && parsed.name.trim()
      ? parsed.name.trim()
      : typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : "Custom AI Collection";

  const itemIds = new Set<number>();
  const spellIds = new Set<number>();

  const rawItems = Array.isArray(parsed.itemIds)
    ? parsed.itemIds
    : Array.isArray(parsed.items)
    ? parsed.items
    : Array.isArray(parsed.itemNames)
    ? parsed.itemNames
    : [];

  for (const itemRef of rawItems) {
    const item = findItemByRef(itemRef);
    if (item) {
      itemIds.add(item.id);
    }
  }

  const rawSpells = Array.isArray(parsed.spellIds)
    ? parsed.spellIds
    : Array.isArray(parsed.spells)
    ? parsed.spells
    : Array.isArray(parsed.spellNames)
    ? parsed.spellNames
    : [];

  for (const spellRef of rawSpells) {
    const spell = findSpellByRef(spellRef);
    if (spell) {
      spellIds.add(spell.id);
    }
  }

  if (itemIds.size === 0 && spellIds.size === 0) {
    return null;
  }

  return {
    name,
    itemIds: Array.from(itemIds),
    spellIds: Array.from(spellIds),
  };
}

// -------------------------------------------------------------
// Main Parser Function
// -------------------------------------------------------------

export function parseAssistantMessage(rawText: string): ParseResult {
  if (!rawText) {
    return { cleanedText: "", action: null, filterAction: null };
  }

  let cleanedText = rawText;
  let parsedListAction: ParsedListAction | null = null;
  let parsedFilterAction: ParsedFilterAction | null = null;

  // 1. Detect filter action block:
  // [APPLY_FILTERS: {...}] or [FILTER_ACTION: {...}] or ```action:apply_filters ... ```
  const filterBlockRegex =
    /(?:\[(?:APPLY_FILTERS|FILTER_ACTION|SET_FILTERS):\s*({[\s\S]*?})\]|```(?:action:apply_filters|action:filter)\s*([\s\S]*?)```)/i;
  const filterMatch = rawText.match(filterBlockRegex);

  if (filterMatch) {
    const jsonSnippet = (filterMatch[1] || filterMatch[2] || "").trim();
    cleanedText = cleanedText.replace(filterMatch[0], "").trim();
    const parsed = safeJsonParse(jsonSnippet);
    if (parsed) {
      parsedFilterAction = buildFilterAction(parsed);
    }
  }

  // 2. Detect list action block:
  // [CREATE_LIST: {...}] or [LIST_ACTION: {...}] or ```action:create_list ... ```
  const listBlockRegex =
    /(?:\[(?:CREATE_LIST|LIST_ACTION):\s*({[\s\S]*?})\]|```(?:action:create_list)\s*([\s\S]*?)```)/i;
  const listMatch = rawText.match(listBlockRegex);

  if (listMatch) {
    const jsonSnippet = (listMatch[1] || listMatch[2] || "").trim();
    cleanedText = cleanedText.replace(listMatch[0], "").trim();
    const parsed = safeJsonParse(jsonSnippet);
    if (parsed) {
      parsedListAction = buildListAction(parsed);
    }
  }

  // 3. Fallback: Check generic ```json ... ``` blocks if neither was matched above
  if (!parsedFilterAction && !parsedListAction) {
    const genericJsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/i;
    const genericMatch = rawText.match(genericJsonRegex);
    if (genericMatch) {
      const parsed = safeJsonParse(genericMatch[1] || "");
      if (parsed) {
        const actionType = String(parsed.action || "").toLowerCase();
        if (
          actionType === "apply_filters" ||
          actionType === "filter" ||
          parsed.targetTab ||
          parsed.rarities ||
          parsed.schools ||
          parsed.classes
        ) {
          const filterCandidate = buildFilterAction(parsed);
          if (filterCandidate) {
            parsedFilterAction = filterCandidate;
            cleanedText = cleanedText.replace(genericMatch[0], "").trim();
          }
        } else if (
          actionType === "create_list" ||
          actionType === "list" ||
          parsed.itemIds ||
          parsed.spellIds
        ) {
          const listCandidate = buildListAction(parsed);
          if (listCandidate) {
            parsedListAction = listCandidate;
            cleanedText = cleanedText.replace(genericMatch[0], "").trim();
          }
        }
      }
    }
  }

  // 4. Clean up any trailing incomplete action blocks during streaming
  cleanedText = cleanedText
    .replace(/\[(?:APPLY_FILTERS|FILTER_ACTION|SET_FILTERS|CREATE_LIST|LIST_ACTION)[\s\S]*$/i, "")
    .trim();

  return {
    cleanedText,
    action: parsedListAction,
    filterAction: parsedFilterAction,
  };
}
