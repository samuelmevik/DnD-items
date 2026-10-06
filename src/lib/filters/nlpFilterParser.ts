import {
  AttunementFilter,
  FilterState,
  Rarity,
} from "../filters";
import {
  SCHOOLS,
  CLASSES,
  CastingTimeCategory,
  SpellFilterState,
} from "../spellFilters";

export type SmartFacetType =
  | "rarity"
  | "category"
  | "attunement"
  | "priceMin"
  | "priceMax"
  | "level"
  | "school"
  | "class"
  | "castingTime"
  | "ritual"
  | "concentration";

export interface SmartFilterChipData {
  id: string;
  facet: SmartFacetType;
  label: string;
  displayValue: string;
  value: unknown;
  targetTab: "items" | "spells";
}

export interface ParsedCompendiumQuery {
  rawQuery: string;
  residualQuery: string;
  targetTab: "items" | "spells" | null;
  hasIntents: boolean;
  chips: SmartFilterChipData[];
  itemPatch: Partial<FilterState>;
  spellPatch: Partial<SpellFilterState>;
}

const LEVEL_WORDS: Record<string, number> = {
  cantrip: 0,
  cantrips: 0,
  "0": 0,
  zero: 0,
  zeroth: 0,
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

const parseLevelNumber = (str: string): number | null => {
  const norm = str.toLowerCase().trim();
  if (norm in LEVEL_WORDS) return LEVEL_WORDS[norm];
  const num = parseInt(norm, 10);
  if (!Number.isNaN(num) && num >= 0 && num <= 9) return num;
  return null;
};

const formatLevelLabel = (levels: number[]): string => {
  if (levels.length === 0) return "";
  if (levels.length === 1) {
    return levels[0] === 0 ? "Cantrip" : `Level ${levels[0]}`;
  }
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  if (min === 0 && max < 9) {
    return `Levels 0–${max}`;
  }
  if (min > 0 && max === 9) {
    return `Level ${min}+`;
  }
  return `Levels ${min}–${max}`;
};

/**
 * Replaces a matched substring in a string with spaces of equal length.
 * Preserves string indices and prevents word merging.
 */
const maskMatch = (str: string, match: RegExpExecArray): string => {
  const index = match.index;
  const length = match[0].length;
  return (
    str.slice(0, index) + " ".repeat(length) + str.slice(index + length)
  );
};

/**
 * Clean up residual search query by stripping filler words and punctuation.
 */
export const cleanResidualQuery = (rawMasked: string): string => {
  let cleaned = rawMasked;

  // Remove common compendium introductory filler phrases
  cleaned = cleaned.replace(
    /\b(?:show\s+me|give\s+me|find\s+me|search\s+for|look\s+for|list\s+of|list|find|get)\b/gi,
    " ",
  );

  // Remove compendium container words when they don't form part of a proper name
  cleaned = cleaned.replace(/\b(?:magic\s+items?|items?|spells?)\b/gi, " ");

  // Remove connecting stop words
  cleaned = cleaned.replace(
    /\b(?:that\s+requires?|that\s+needs?|that\s+has|that\s+are|which\s+are|that|which|for|with|and|or|of|in|a|an|the)\b/gi,
    " ",
  );

  // Strip standalone level/lvl words left behind
  cleaned = cleaned.replace(/\b(?:levels?|lvls?)\b/gi, " ");

  // Strip standalone punctuation and normalize whitespace
  cleaned = cleaned
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Strip trailing or leading lone hyphens
  cleaned = cleaned.replace(/^-+|-+$/g, "").trim();

  return cleaned;
};

/**
 * Detect the target tab ('items' or 'spells') based on keywords.
 */
export const detectTargetTab = (
  query: string,
  fallbackTab: "items" | "spells" = "items",
): "items" | "spells" | null => {
  const spellScore =
    (query.match(/\b(?:spells?|cantrips?|spell\s+slots?)\b/gi)?.length ?? 0) * 3 +
    (query.match(
      /\b(?:abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)\b/gi,
    )?.length ?? 0) * 2 +
    (query.match(
      /\b(?:bonus\s+action|reaction|concentration|ritual)\b/gi,
    )?.length ?? 0) * 2 +
    (query.match(
      /\b(?:bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard)s?\b/gi,
    )?.length ?? 0);

  const itemScore =
    (query.match(/\b(?:items?|magic\s+items?|gear|equipment|loot)\b/gi)?.length ?? 0) * 3 +
    (query.match(/\b(?:very\s+rare|rare|uncommon|common|legendary|artifact)\b/gi)?.length ?? 0) * 2 +
    (query.match(/\battune(?:ment|d)?\b/gi)?.length ?? 0) * 2 +
    (query.match(/\b(?:gp|gold|pieces)\b/gi)?.length ?? 0) * 2 +
    (query.match(
      /\b(?:weapons?|armors?|potions?|rings?|staves|wands?|rods?|cloaks?|shields?)\b/gi,
    )?.length ?? 0);

  if (spellScore > itemScore && spellScore > 0) return "spells";
  if (itemScore > spellScore && itemScore > 0) return "items";
  return fallbackTab;
};

/**
 * Builds FilterState patch from active chips.
 */
export const buildItemFilterPatch = (
  chips: SmartFilterChipData[],
): Partial<FilterState> => {
  const patch: Partial<FilterState> = {};
  const rarities: string[] = [];
  const categories: string[] = [];

  for (const chip of chips) {
    if (chip.targetTab !== "items") continue;
    switch (chip.facet) {
      case "rarity":
        rarities.push(chip.value as string);
        break;
      case "category":
        categories.push(chip.value as string);
        break;
      case "attunement":
        patch.attunement = chip.value as AttunementFilter;
        break;
      case "priceMin":
        patch.minPrice = chip.value as number;
        break;
      case "priceMax":
        patch.maxPrice = chip.value as number;
        break;
    }
  }

  if (rarities.length > 0) patch.rarities = Array.from(new Set(rarities));
  if (categories.length > 0) patch.categories = Array.from(new Set(categories));
  return patch;
};

/**
 * Builds SpellFilterState patch from active chips.
 */
export const buildSpellFilterPatch = (
  chips: SmartFilterChipData[],
): Partial<SpellFilterState> => {
  const patch: Partial<SpellFilterState> = {};
  const levelsSet = new Set<number>();
  const schools: string[] = [];
  const classes: string[] = [];
  const castingTimes: CastingTimeCategory[] = [];

  for (const chip of chips) {
    if (chip.targetTab !== "spells") continue;
    switch (chip.facet) {
      case "level":
        if (Array.isArray(chip.value)) {
          (chip.value as number[]).forEach((l) => levelsSet.add(l));
        } else if (typeof chip.value === "number") {
          levelsSet.add(chip.value);
        }
        break;
      case "school":
        schools.push(chip.value as string);
        break;
      case "class":
        classes.push(chip.value as string);
        break;
      case "castingTime":
        castingTimes.push(chip.value as CastingTimeCategory);
        break;
      case "ritual":
        patch.ritualOnly = Boolean(chip.value);
        break;
      case "concentration":
        patch.concentrationOnly = Boolean(chip.value);
        break;
    }
  }

  if (levelsSet.size > 0) patch.levels = Array.from(levelsSet).sort((a, b) => a - b);
  if (schools.length > 0) patch.schools = Array.from(new Set(schools));
  if (classes.length > 0) patch.classes = Array.from(new Set(classes));
  if (castingTimes.length > 0) patch.castingTimes = Array.from(new Set(castingTimes));
  return patch;
};

/**
 * Main Compendium Intent Parser.
 * Accurately extracts facets for items and spells, creates preview chips,
 * and extracts the clean residual search term.
 */
export const parseCompendiumQuery = (
  query: string,
  currentTab: "items" | "spells" = "items",
): ParsedCompendiumQuery => {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return {
      rawQuery: query,
      residualQuery: "",
      targetTab: null,
      hasIntents: false,
      chips: [],
      itemPatch: {},
      spellPatch: {},
    };
  }

  let masked = trimmed;
  const chips: SmartFilterChipData[] = [];
  const detectedTargetTab = detectTargetTab(trimmed, currentTab);
  const targetTab = detectedTargetTab;

  // ==========================================
  // 1. ATTUNEMENT (Negative before Positive)
  // ==========================================
  const negAttuneRegex =
    /\b(?:no|without|zero|not\s+requiring|doesn't\s+require|does\s+not\s+require|non[-\s]?)\s*attunement\b|\bunattuned\b|\bnon[-\s]?attuned\b/gi;
  let attuneMatch: RegExpExecArray | null = null;
  if ((attuneMatch = negAttuneRegex.exec(masked)) !== null) {
    chips.push({
      id: "attunement-none",
      facet: "attunement",
      label: "No Attunement",
      displayValue: "Unattuned",
      value: "none",
      targetTab: "items",
    });
    masked = maskMatch(masked, attuneMatch);
  } else {
    const posAttuneRegex =
      /\b(?:that\s+requires?|requires?|requiring|needs?|needing)\s+attunement\b|\b(?:with|has)\s+attunement\b|\battunement\s+(?:required|needed)\b|\battuned\b|\battunement\b/gi;
    if ((attuneMatch = posAttuneRegex.exec(masked)) !== null) {
      chips.push({
        id: "attunement-requires",
        facet: "attunement",
        label: "Requires Attunement",
        displayValue: "Attuned",
        value: "requires",
        targetTab: "items",
      });
      masked = maskMatch(masked, attuneMatch);
    }
  }

  // ==========================================
  // 2. RARITIES (Items)
  // ==========================================
  // Very Rare before Rare
  const rarityPatterns: { name: Rarity; regex: RegExp }[] = [
    { name: "Very Rare", regex: /\bvery\s+rare\b/gi },
    { name: "Uncommon", regex: /\buncommon\b/gi },
    { name: "Legendary", regex: /\blegendary\b/gi },
    { name: "Artifact", regex: /\bartifacts?\b/gi },
    { name: "Rare", regex: /\brare\b/gi },
    { name: "Common", regex: /\bcommon\b/gi },
  ];

  for (const { name, regex } of rarityPatterns) {
    let rMatch: RegExpExecArray | null;
    while ((rMatch = regex.exec(masked)) !== null) {
      if (!chips.some((c) => c.facet === "rarity" && c.value === name)) {
        chips.push({
          id: `rarity-${name.toLowerCase().replace(/\s+/g, "-")}`,
          facet: "rarity",
          label: `Rarity: ${name}`,
          displayValue: name,
          value: name,
          targetTab: "items",
        });
      }
      masked = maskMatch(masked, rMatch);
    }
  }

  // ==========================================
  // 3. ITEM CATEGORIES
  // ==========================================
  // Only parse item categories if not explicitly in a spell query
  const categoryPatterns: { category: string; regex: RegExp }[] = [
    { category: "Wondrous Item", regex: /\bwondrous(?:\s+items?)?\b/gi },
    { category: "Armor", regex: /\b(?:(?:light|medium|heavy)\s+)?armors?\b/gi },
    { category: "Weapon", regex: /\bweapons?\b/gi },
    { category: "Cloak", regex: /\b(?:cloaks?|capes?)\b/gi },
    { category: "Potion", regex: /\b(?:potions?|elixirs?)\b/gi },
    { category: "Ring", regex: /\brings?\b/gi },
    { category: "Rod", regex: /\brods?\b/gi },
    { category: "Scroll", regex: /\bscrolls?\b/gi },
    { category: "Staff", regex: /\b(?:staffs?|staves)\b/gi },
    { category: "Wand", regex: /\bwands?\b/gi },
    { category: "Tool", regex: /\btools?\b/gi },
  ];

  // Shield is both an item category and a famous spell; only match as item category if not in spell mode
  if (targetTab !== "spells") {
    categoryPatterns.push({ category: "Shield", regex: /\bshields?\b/gi });
  }

  for (const { category, regex } of categoryPatterns) {
    let cMatch: RegExpExecArray | null;
    while ((cMatch = regex.exec(masked)) !== null) {
      if (!chips.some((c) => c.facet === "category" && c.value === category)) {
        chips.push({
          id: `category-${category.toLowerCase().replace(/\s+/g, "-")}`,
          facet: "category",
          label: `Type: ${category}`,
          displayValue: category,
          value: category,
          targetTab: "items",
        });
      }
      masked = maskMatch(masked, cMatch);
    }
  }

  // ==========================================
  // 4. PRICE BOUNDS (Items)
  // ==========================================
  // Between price: "between 100 and 500 gp", "100-500 gp"
  const priceRangeRegex =
    /\b(?:between\s+)?([0-9]+)\s*(?:and|to|-)\s*([0-9]+)\s*(?:gp|gold|g)\b/gi;
  let prMatch: RegExpExecArray | null;
  if ((prMatch = priceRangeRegex.exec(masked)) !== null) {
    const min = parseInt(prMatch[1], 10);
    const max = parseInt(prMatch[2], 10);
    chips.push({
      id: "price-range",
      facet: "priceMin",
      label: `Price: ${min.toLocaleString()}–${max.toLocaleString()} gp`,
      displayValue: `${min}–${max} gp`,
      value: min,
      targetTab: "items",
    });
    chips.push({
      id: "price-max",
      facet: "priceMax",
      label: `Max Price: ${max.toLocaleString()} gp`,
      displayValue: `≤ ${max} gp`,
      value: max,
      targetTab: "items",
    });
    masked = maskMatch(masked, prMatch);
  } else {
    // Max price: "under 500 gp", "less than 1000 gold", "below 200 gp"
    const maxPriceRegex =
      /\b(?:under|less\s+than|below|up\s+to)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:gp|gold|g)\b/gi;
    let maxMatch: RegExpExecArray | null;
    if ((maxMatch = maxPriceRegex.exec(masked)) !== null) {
      const max = Math.round(parseFloat(maxMatch[1]));
      chips.push({
        id: `price-max-${max}`,
        facet: "priceMax",
        label: `Max Price: ${max.toLocaleString()} gp`,
        displayValue: `≤ ${max} gp`,
        value: max,
        targetTab: "items",
      });
      masked = maskMatch(masked, maxMatch);
    }

    // Min price: "over 1000 gp", "more than 500 gold", "at least 500 gp"
    const minPriceRegex =
      /\b(?:over|more\s+than|above|at\s+least)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:gp|gold|g)\b/gi;
    let minMatch: RegExpExecArray | null;
    if ((minMatch = minPriceRegex.exec(masked)) !== null) {
      const min = Math.round(parseFloat(minMatch[1]));
      chips.push({
        id: `price-min-${min}`,
        facet: "priceMin",
        label: `Min Price: ${min.toLocaleString()} gp`,
        displayValue: `≥ ${min} gp`,
        value: min,
        targetTab: "items",
      });
      masked = maskMatch(masked, minMatch);
    }
  }

  // ==========================================
  // 5. SPELL PROPERTIES (Concentration & Ritual)
  // ==========================================
  const concRegex = /\b(?:requires?\s+)?concentration\b/gi;
  let concMatch: RegExpExecArray | null;
  if ((concMatch = concRegex.exec(masked)) !== null) {
    chips.push({
      id: "spell-concentration",
      facet: "concentration",
      label: "Concentration",
      displayValue: "Concentration",
      value: true,
      targetTab: "spells",
    });
    masked = maskMatch(masked, concMatch);
  }

  const ritualRegex =
    /\b(?:ritual\s+only|rituals?|can\s+be\s+cast\s+as\s+(?:a\s+)?ritual)\b/gi;
  let ritMatch: RegExpExecArray | null;
  if ((ritMatch = ritualRegex.exec(masked)) !== null) {
    chips.push({
      id: "spell-ritual",
      facet: "ritual",
      label: "Ritual Only",
      displayValue: "Ritual",
      value: true,
      targetTab: "spells",
    });
    masked = maskMatch(masked, ritMatch);
  }

  // ==========================================
  // 6. SPELL SCHOOLS
  // ==========================================
  for (const school of SCHOOLS) {
    const sRegex = new RegExp(`\\b${school}\\b`, "gi");
    let sMatch: RegExpExecArray | null;
    while ((sMatch = sRegex.exec(masked)) !== null) {
      if (!chips.some((c) => c.facet === "school" && c.value === school)) {
        chips.push({
          id: `school-${school.toLowerCase()}`,
          facet: "school",
          label: `School: ${school}`,
          displayValue: school,
          value: school,
          targetTab: "spells",
        });
      }
      masked = maskMatch(masked, sMatch);
    }
  }

  // ==========================================
  // 7. SPELL CLASSES
  // ==========================================
  for (const cls of CLASSES) {
    const cRegex = new RegExp(`\\b${cls}s?\\b`, "gi");
    let cMatch: RegExpExecArray | null;
    while ((cMatch = cRegex.exec(masked)) !== null) {
      if (!chips.some((c) => c.facet === "class" && c.value === cls)) {
        chips.push({
          id: `class-${cls.toLowerCase()}`,
          facet: "class",
          label: `Class: ${cls}`,
          displayValue: cls,
          value: cls,
          targetTab: "spells",
        });
      }
      masked = maskMatch(masked, cMatch);
    }
  }

  // ==========================================
  // 8. SPELL CASTING TIMES
  // ==========================================
  const baRegex = /\bbonus\s+actions?\b/gi;
  let baMatch: RegExpExecArray | null;
  if ((baMatch = baRegex.exec(masked)) !== null) {
    chips.push({
      id: "ct-bonus-action",
      facet: "castingTime",
      label: "Bonus Action",
      displayValue: "Bonus Action",
      value: "Bonus Action",
      targetTab: "spells",
    });
    masked = maskMatch(masked, baMatch);
  }

  const reactRegex = /\breactions?\b/gi;
  let reactMatch: RegExpExecArray | null;
  if ((reactMatch = reactRegex.exec(masked)) !== null) {
    chips.push({
      id: "ct-reaction",
      facet: "castingTime",
      label: "Reaction",
      displayValue: "Reaction",
      value: "Reaction",
      targetTab: "spells",
    });
    masked = maskMatch(masked, reactMatch);
  }

  const actionRegex =
    /\b(?:1\s+action|action\s+(?:spells?|casting(?:\s+time)?))\b/gi;
  let actMatch: RegExpExecArray | null;
  if ((actMatch = actionRegex.exec(masked)) !== null) {
    chips.push({
      id: "ct-action",
      facet: "castingTime",
      label: "Action",
      displayValue: "Action",
      value: "Action",
      targetTab: "spells",
    });
    masked = maskMatch(masked, actMatch);
  }

  const minPlusRegex =
    /\b(?:(?:1|10)\s+minutes?(?:\+)?|1\s+hour|minute\s+plus)\b/gi;
  let minPlusMatch: RegExpExecArray | null;
  if ((minPlusMatch = minPlusRegex.exec(masked)) !== null) {
    chips.push({
      id: "ct-1-minute-plus",
      facet: "castingTime",
      label: "1 Minute+",
      displayValue: "1 Minute+",
      value: "1 Minute+",
      targetTab: "spells",
    });
    masked = maskMatch(masked, minPlusMatch);
  }

  // ==========================================
  // 9. SPELL LEVELS
  // ==========================================
  let levelAssigned = false;

  // Range 1: "under 4th level", "below level 3", "less than level 5"
  const underLevelRegex =
    /\b(?:under|below|less\s+than)\s+(?:level\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\b/gi;
  let underMatch: RegExpExecArray | null;
  if ((underMatch = underLevelRegex.exec(masked)) !== null) {
    const maxVal = parseLevelNumber(underMatch[1]);
    if (maxVal !== null && maxVal > 0) {
      const lvls = Array.from({ length: maxVal }, (_, i) => i);
      chips.push({
        id: `level-under-${maxVal}`,
        facet: "level",
        label: `Under Level ${maxVal}`,
        displayValue: formatLevelLabel(lvls),
        value: lvls,
        targetTab: "spells",
      });
      levelAssigned = true;
      masked = maskMatch(masked, underMatch);
    }
  }

  // Range 2: "level 3 or below", "level 4 and under", "up to level 3"
  if (!levelAssigned) {
    const upToLevelRegex =
      /\b(?:up\s+to|at\s+most)\s+(?:(?:level|lvl)\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\b|\b(?:(?:level|lvl)\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\s+(?:or\s+(?:below|lower|less)|and\s+under)\b/gi;
    let upToMatch: RegExpExecArray | null;
    if ((upToMatch = upToLevelRegex.exec(masked)) !== null) {
      const captured = upToMatch[1] || upToMatch[2];
      const maxVal = parseLevelNumber(captured);
      if (maxVal !== null) {
        const lvls = Array.from({ length: maxVal + 1 }, (_, i) => i);
        chips.push({
          id: `level-up-to-${maxVal}`,
          facet: "level",
          label: `Level ≤ ${maxVal}`,
          displayValue: formatLevelLabel(lvls),
          value: lvls,
          targetTab: "spells",
        });
        levelAssigned = true;
        masked = maskMatch(masked, upToMatch);
      }
    }
  }

  // Range 3: "level 5 or higher", "5th level and up", "level 5+", "above level 4"
  if (!levelAssigned) {
    const aboveLevelRegex =
      /\b(?:above|over|more\s+than)\s+(?:(?:level|lvl)\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\b/gi;
    let aboveMatch: RegExpExecArray | null;
    if ((aboveMatch = aboveLevelRegex.exec(masked)) !== null) {
      const bound = parseLevelNumber(aboveMatch[1]);
      if (bound !== null && bound < 9) {
        const lvls = Array.from({ length: 9 - bound }, (_, i) => bound + 1 + i);
        chips.push({
          id: `level-above-${bound}`,
          facet: "level",
          label: `Above Level ${bound}`,
          displayValue: formatLevelLabel(lvls),
          value: lvls,
          targetTab: "spells",
        });
        levelAssigned = true;
        masked = maskMatch(masked, aboveMatch);
      }
    }
  }

  if (!levelAssigned) {
    const higherLevelRegex =
      /\b(?:at\s+least)\s+(?:(?:level|lvl)\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\b|\b(?:(?:level|lvl)\s+)?([0-9]|1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)(?:\s+level)?\s+(?:or\s+(?:higher|above|more)|and\s+(?:up|above)|\+)\b/gi;
    let higherMatch: RegExpExecArray | null;
    if ((higherMatch = higherLevelRegex.exec(masked)) !== null) {
      const captured = higherMatch[1] || higherMatch[2];
      const bound = parseLevelNumber(captured);
      if (bound !== null) {
        const lvls = Array.from({ length: 10 - bound }, (_, i) => bound + i);
        chips.push({
          id: `level-${bound}-and-up`,
          facet: "level",
          label: `Level ${bound}+`,
          displayValue: formatLevelLabel(lvls),
          value: lvls,
          targetTab: "spells",
        });
        levelAssigned = true;
        masked = maskMatch(masked, higherMatch);
      }
    }
  }

  // Exact Level: "cantrips", "cantrip", "level 3", "3rd level", "lvl 2"
  if (!levelAssigned) {
    const cantripRegex = /\bcantrips?\b/gi;
    let cMatch: RegExpExecArray | null;
    if ((cMatch = cantripRegex.exec(masked)) !== null) {
      chips.push({
        id: "level-0",
        facet: "level",
        label: "Cantrip",
        displayValue: "Cantrip",
        value: [0],
        targetTab: "spells",
      });
      levelAssigned = true;
      masked = maskMatch(masked, cMatch);
    }
  }

  if (!levelAssigned) {
    const exactLevelRegex =
      /\b(?:level|lvl)\s+([0-9]|one|two|three|four|five|six|seven|eight|nine)\b|\b(1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\s+level\b/gi;
    let exMatch: RegExpExecArray | null;
    while ((exMatch = exactLevelRegex.exec(masked)) !== null) {
      const captured = exMatch[1] || exMatch[2];
      const lvl = parseLevelNumber(captured);
      if (lvl !== null) {
        const existing = chips.find((c) => c.facet === "level");
        if (existing) {
          if (Array.isArray(existing.value) && !existing.value.includes(lvl)) {
            existing.value.push(lvl);
            existing.value.sort((a: number, b: number) => a - b);
            existing.label = formatLevelLabel(existing.value);
            existing.displayValue = formatLevelLabel(existing.value);
          }
        } else {
          chips.push({
            id: `level-${lvl}`,
            facet: "level",
            label: lvl === 0 ? "Cantrip" : `Level ${lvl}`,
            displayValue: lvl === 0 ? "Cantrip" : `Level ${lvl}`,
            value: [lvl],
            targetTab: "spells",
          });
        }
        masked = maskMatch(masked, exMatch);
      }
    }
  }

  // ==========================================
  // 10. RESIDUAL SEARCH QUERY CLEANING
  // ==========================================
  const residualQuery = cleanResidualQuery(masked);

  const itemPatch = buildItemFilterPatch(chips);
  const spellPatch = buildSpellFilterPatch(chips);

  return {
    rawQuery: query,
    residualQuery,
    targetTab,
    hasIntents: chips.length > 0,
    chips,
    itemPatch,
    spellPatch,
  };
};

/**
 * Convenience wrapper for items query parsing.
 */
export const parseItemQuery = (query: string): ParsedCompendiumQuery =>
  parseCompendiumQuery(query, "items");

/**
 * Convenience wrapper for spells query parsing.
 */
export const parseSpellQuery = (query: string): ParsedCompendiumQuery =>
  parseCompendiumQuery(query, "spells");
