import { Item, items } from "@/data/items";
import { Spell, spells } from "@/data/spells";

// Quick lookup maps
export const itemsById = new Map<number, Item>(items.map((i) => [i.id, i]));
export const spellsById = new Map<number, Spell>(spells.map((s) => [s.id, s]));

export const itemsBySlug = new Map<string, Item>(
  items.map((i) => [
    (i.slug || i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).toLowerCase(),
    i,
  ]),
);

export const spellsByIndex = new Map<string, Spell>(
  spells.map((s) => [
    (s.index || s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).toLowerCase(),
    s,
  ]),
);

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "to", "for", "with", "on", "at",
  "by", "is", "are", "was", "were", "be", "been", "can", "could", "would",
  "should", "what", "which", "who", "whom", "this", "that", "these", "those",
  "i", "you", "he", "she", "it", "we", "they", "me", "my", "your", "his", "her",
  "do", "does", "did", "have", "has", "had", "how", "why", "when", "where",
  "tell", "give", "show", "make", "create", "list", "find", "some", "best", "good",
  "recommend", "suggest", "about", "all", "any", "please", "help",
]);

function extractTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function searchContextItems(query: string, maxResults = 7): Item[] {
  const normQuery = query.toLowerCase().trim();
  const tokens = extractTokens(query);
  if (tokens.length === 0 && !normQuery) return items.slice(0, maxResults);

  const scored: { item: Item; score: number }[] = [];

  for (const item of items) {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const synopsisLower = (item.synopsis || "").toLowerCase();
    const tagsLower = item.tags.map((t) => t.toLowerCase());

    if (nameLower === normQuery) {
      score += 150;
    } else if (nameLower.includes(normQuery)) {
      score += 60;
    }

    for (const token of tokens) {
      if (nameLower.includes(token)) {
        score += 25;
      }
      if (tagsLower.some((t) => t.includes(token))) {
        score += 15;
      }
      if (synopsisLower.includes(token)) {
        score += 8;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.item);
}

export function searchContextSpells(query: string, maxResults = 7): Spell[] {
  const normQuery = query.toLowerCase().trim();
  const tokens = extractTokens(query);
  if (tokens.length === 0 && !normQuery) return spells.slice(0, maxResults);

  const scored: { spell: Spell; score: number }[] = [];

  for (const spell of spells) {
    let score = 0;
    const nameLower = spell.name.toLowerCase();
    const schoolLower = spell.school.toLowerCase();
    const classesLower = spell.classes.map((c) => c.toLowerCase());
    const descLower = (spell.description[0] || "").toLowerCase();

    if (nameLower === normQuery) {
      score += 150;
    } else if (nameLower.includes(normQuery)) {
      score += 60;
    }

    for (const token of tokens) {
      if (nameLower.includes(token)) {
        score += 25;
      }
      if (schoolLower.includes(token)) {
        score += 18;
      }
      if (classesLower.some((c) => c.includes(token))) {
        score += 15;
      }
      if (token === "cantrip" && spell.level === 0) {
        score += 20;
      }
      if (descLower.includes(token)) {
        score += 6;
      }
    }

    if (score > 0) {
      scored.push({ spell, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.spell);
}

export function buildSystemPrompt(userQuery: string): string {
  const candidateItems = searchContextItems(userQuery, 6);
  const candidateSpells = searchContextSpells(userQuery, 6);

  let groundingText = "";

  if (candidateItems.length > 0) {
    groundingText += "Database Items:\n";
    for (const item of candidateItems) {
      const slug =
        item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const shortDesc =
        item.synopsis ||
        item.description[0]?.substring(0, 140) ||
        "";
      groundingText += `* ${item.name} (Slug: ${slug}, ID: ${item.id}) - ${item.tags.join(", ")} (${item.price.toLocaleString()} gp): ${shortDesc}\n`;
    }
    groundingText += "\n";
  }

  if (candidateSpells.length > 0) {
    groundingText += "Database Spells:\n";
    for (const spell of candidateSpells) {
      const index =
        spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const levelStr = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
      const shortDesc =
        spell.description[0]?.substring(0, 140) || "";
      groundingText += `* ${spell.name} (Index: ${index}, ID: ${spell.id}) - ${levelStr} ${spell.school} (${spell.classes.join(", ")}, ${spell.castingTime}, ${spell.range}): ${shortDesc}\n`;
    }
    groundingText += "\n";
  }

  const isListRequest =
    /(create|save|make|add|generate|turn|favorites).*(list|favorite|favorites|pack|loadout|gear|spellbook)/i.test(
      userQuery,
    );

  const listDirective = isListRequest
    ? `\nHIGH PRIORITY: The user wants to save a list/favorites. You MUST end your response with:\n[CREATE_LIST: {"name": "Recommended List Title", "itemIds": [ids...], "spellIds": [ids...]}]`
    : `\nIf recommending a specific list or pack, end your response with:\n[CREATE_LIST: {"name": "List Title", "itemIds": [ids...], "spellIds": [ids...]}]`;

  return `You are JustDnD, a helpful and knowledgeable assistant for D&D 5e items and spells.

DATABASE CONTEXT:
${groundingText || "No direct database matches."}
RULES:
1. When mentioning an item, format it as: [Item Name](item:slug) (e.g. [Flame Tongue](item:flame-tongue)).
2. When mentioning a spell, format it as: [Spell Name](spell:index) (e.g. [Fireball](spell:fireball)).
3. Rely on the database context above.
${listDirective}`;
}

export function findItemByRef(ref: string | number): Item | null {
  if (typeof ref === "number") return itemsById.get(ref) ?? null;
  const num = Number(ref);
  if (!Number.isNaN(num) && itemsById.has(num)) return itemsById.get(num) ?? null;
  const clean = String(ref).trim().toLowerCase();
  if (itemsBySlug.has(clean)) return itemsBySlug.get(clean) ?? null;

  const hyphenated = clean.replace(/\s+/g, "-");
  if (itemsBySlug.has(hyphenated)) return itemsBySlug.get(hyphenated) ?? null;

  const alpha = clean.replace(/[^a-z0-9]/g, "");
  if (!alpha) return null;

  return (
    items.find((i) => {
      const iName = i.name.toLowerCase();
      if (iName === clean) return true;
      if (iName.replace(/\s+(weapon|armor|shield)$/i, "") === clean) return true;
      if (iName.replace(/[^a-z0-9]/g, "") === alpha) return true;
      if (i.slug && i.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === alpha) return true;
      return false;
    }) ?? null
  );
}

export function findSpellByRef(ref: string | number): Spell | null {
  if (typeof ref === "number") return spellsById.get(ref) ?? null;
  const num = Number(ref);
  if (!Number.isNaN(num) && spellsById.has(num)) return spellsById.get(num) ?? null;
  const clean = String(ref).trim().toLowerCase();
  if (spellsByIndex.has(clean)) return spellsByIndex.get(clean) ?? null;

  const hyphenated = clean.replace(/\s+/g, "-");
  if (spellsByIndex.has(hyphenated)) return spellsByIndex.get(hyphenated) ?? null;

  const alpha = clean.replace(/[^a-z0-9]/g, "");
  if (!alpha) return null;

  return (
    spells.find((s) => {
      const sName = s.name.toLowerCase();
      if (sName === clean) return true;
      if (sName.replace(/[^a-z0-9]/g, "") === alpha) return true;
      if (s.index && s.index.toLowerCase().replace(/[^a-z0-9]/g, "") === alpha) return true;
      return false;
    }) ?? null
  );
}

export const AMBIGUOUS_SPELL_WORDS = new Set([
  "light", "command", "wish", "shield", "aid", "jump", "sleep", "fly", "slow", "fear",
  "heal", "harm", "gate", "maze", "web", "find", "send", "bless", "cure", "hold",
  "blink", "alarm", "sanctuary", "silence", "creation", "dream", "hallow", "mislead",
  "clone", "weird", "message", "resistance", "bane", "knock", "darkness", "daylight",
  "haste", "sending", "tongues", "awaken", "symbol", "teleport", "earthquake", "friends",
  "divination",
]);

export function isAmbiguousSpellInProse(spellName: string, rawText: string): boolean {
  const lowerName = spellName.toLowerCase();
  if (!AMBIGUOUS_SPELL_WORDS.has(lowerName)) return false;

  // If "divination school" is in the text, it refers to the school of magic
  if (lowerName === "divination" && /\bdivination\s+school\b/i.test(rawText)) {
    return true;
  }

  // Check if it's explicitly styled as a list item or heading or bold title
  const bulletOrHeadingRegex = new RegExp(
    `(?:^|\\n)\\s*(?:[-*•]|\\d+\\.|#{1,6})\\s*\\*{0,2}${spellName}\\b`,
    "i",
  );
  if (bulletOrHeadingRegex.test(rawText)) return false;

  // Check if adjacent to spell keywords or school/level annotation
  const contextRegex = new RegExp(
    `\\b(?:spell|cantrip|cast|casts|casting)\\s+(?:of\\s+|called\\s+)?${spellName}\\b|` +
    `\\b${spellName}\\s+(?:spell|cantrip)\\b|` +
    `\\b${spellName}\\s*\\([^)]*(?:school|level|cantrip|action|reaction|evocation|abjuration|divination|enchantment|conjuration|illusion|necromancy|transmutation)`,
    "i",
  );
  if (contextRegex.test(rawText)) return false;

  return true;
}

export function extractEntitiesFromText(text: string): {
  itemIds: number[];
  spellIds: number[];
} {
  const normText = " " + text.toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ";
  const foundItemIds = new Set<number>();
  const foundSpellIds = new Set<number>();

  // 1. Check explicit markdown links: [Name](item:slug) and [Name](spell:index)
  const itemLinkRegex = /item:([a-z0-9-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = itemLinkRegex.exec(text)) !== null) {
    const item = findItemByRef(match[1]);
    if (item) foundItemIds.add(item.id);
  }

  const spellLinkRegex = /spell:([a-z0-9-]+)/gi;
  while ((match = spellLinkRegex.exec(text)) !== null) {
    const spell = findSpellByRef(match[1]);
    if (spell) foundSpellIds.add(spell.id);
  }

  // 2. Check explicit slug/index patterns: (Slug: sun-blade) or (Index: fireball)
  const explicitSlugRegex = /\bslug\s*[:=]\s*([a-z0-9-]+)\b/gi;
  while ((match = explicitSlugRegex.exec(text)) !== null) {
    const item = findItemByRef(match[1]);
    if (item) foundItemIds.add(item.id);
  }

  const explicitIndexRegex = /\bindex\s*[:=]\s*([a-z0-9-]+)\b/gi;
  while ((match = explicitIndexRegex.exec(text)) !== null) {
    const spell = findSpellByRef(match[1]);
    if (spell) foundSpellIds.add(spell.id);
  }

  // 3. Match items by name, slug words, and common aliases
  for (const item of items) {
    if (foundItemIds.has(item.id)) continue;
    const candidates = new Set<string>();

    const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (cleanName.length >= 4) candidates.add(cleanName);

    const trimmedSuffix = cleanName.replace(/\s+(weapon|armor|shield)$/i, "").trim();
    if (trimmedSuffix.length >= 4 && trimmedSuffix !== cleanName) {
      candidates.add(trimmedSuffix);
    }

    if (item.slug) {
      const slugWords = item.slug.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (slugWords.length >= 4) candidates.add(slugWords);
    }

    for (const cand of candidates) {
      if (normText.includes(" " + cand + " ")) {
        foundItemIds.add(item.id);
        break;
      }
    }
  }

  // 4. Match spells by name (with ambiguous word protection)
  for (const spell of spells) {
    if (foundSpellIds.has(spell.id)) continue;
    const cleanName = spell.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (cleanName.length < 4) continue;

    if (isAmbiguousSpellInProse(spell.name, text)) {
      continue;
    }

    if (normText.includes(" " + cleanName + " ")) {
      foundSpellIds.add(spell.id);
    }
  }

  return {
    itemIds: Array.from(foundItemIds),
    spellIds: Array.from(foundSpellIds),
  };
}
