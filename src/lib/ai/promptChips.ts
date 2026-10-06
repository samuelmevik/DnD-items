import { Item } from "@/data/items";
import { Spell } from "@/data/spells";
import { ChatMessage } from "./types";
import {
  extractEntitiesFromText,
  findItemByRef,
  findSpellByRef,
} from "./retriever";

export interface QuickPromptChip {
  id: string;
  label: string;
  prompt: string;
}

export const DEFAULT_PROMPT_CHIPS: QuickPromptChip[] = [
  {
    id: "rogue-pack",
    label: "Level 3 Rogue Pack",
    prompt: "Create a Level 3 Rogue gear and spell loadout pack",
  },
  {
    id: "anti-undead",
    label: "Anti-Undead Loadout",
    prompt: "What are the best items and spells for fighting undead encounters?",
  },
  {
    id: "stealth-heist",
    label: "Stealth Heist Prep",
    prompt: "Recommend items and spells for infiltrating a guarded castle",
  },
  {
    id: "boss-loot",
    label: "Boss Encounter Loot",
    prompt: "Generate high-impact boss encounter loot for a 5th-level party",
  },
];

export const QUICK_PROMPT_CHIPS = DEFAULT_PROMPT_CHIPS;

export function resolvePromptChipAction(
  prompt: string,
  isGenerating: boolean,
  sendFn: (text: string) => void,
  setInputFn: (text: string) => void,
): "sent" | "filled" {
  if (isGenerating) {
    setInputFn(prompt);
    return "filled";
  }
  sendFn(prompt);
  return "sent";
}

interface ClassProfile {
  name: string;
  keywords: string[];
  role: string;
}

const DND_CLASSES: ClassProfile[] = [
  {
    name: "Rogue",
    keywords: ["rogue", "thief", "assassin", "arcane trickster", "swashbuckler", "sneak attack", "expertise"],
    role: "stealth, lockpicking, and critical single-target burst",
  },
  {
    name: "Wizard",
    keywords: ["wizard", "evocation", "abjuration", "divination", "enchantment", "illusion", "necromancy", "transmutation", "bladesinger", "spellbook", "arcane recovery"],
    role: "versatile utility, area-of-effect damage, and ritual casting",
  },
  {
    name: "Cleric",
    keywords: ["cleric", "channel divinity", "turn undead", "life domain", "war domain", "light domain", "tempest domain", "twilight domain", "peace domain", "divine domain"],
    role: "frontline resilience, vital healing, and divine support",
  },
  {
    name: "Paladin",
    keywords: ["paladin", "divine smite", "lay on hands", "aura of protection", "oath of devotion", "oath of vengeance", "oath of conquest", "holy avenger", "smite"],
    role: "high armor class, devastating smite burst, and party defensive auras",
  },
  {
    name: "Fighter",
    keywords: ["fighter", "action surge", "second wind", "battle master", "champion", "eldritch knight", "echo knight", "maneuvers"],
    role: "consistent weapon damage, tactical maneuvers, and maximum feats",
  },
  {
    name: "Barbarian",
    keywords: ["barbarian", "rage", "reckless attack", "unarmored defense", "berserker", "totem warrior", "zealot"],
    role: "damage absorption, advantage on strength attacks, and fierce melee pressure",
  },
  {
    name: "Druid",
    keywords: ["druid", "wild shape", "wildshape", "circle of the moon", "circle of the land", "circle of stars", "circle of spores"],
    role: "battlefield control, wild shape adaptability, and nature summoning",
  },
  {
    name: "Bard",
    keywords: ["bard", "bardic inspiration", "jack of all trades", "song of rest", "college of lore", "college of swords", "college of eloquence", "magical secrets"],
    role: "party inspiration, skill mastery, and flexible magical secrets",
  },
  {
    name: "Monk",
    keywords: ["monk", "ki points", "flurry of blows", "stunning strike", "unarmored movement", "way of the open hand", "way of shadow", "kensei"],
    role: "high mobile skirmishing, stunning strike control, and rapid unarmed strikes",
  },
  {
    name: "Ranger",
    keywords: ["ranger", "hunter's mark", "favored enemy", "natural explorer", "gloom stalker", "hunter", "fey wanderer"],
    role: "ranged marksmanship, tracking, and ambush initiative",
  },
  {
    name: "Warlock",
    keywords: ["warlock", "eldritch blast", "pact magic", "pact of the blade", "pact of the tome", "hexblade", "fiend patron", "invocations"],
    role: "short-rest spell slots, ranged force damage, and patron pact boons",
  },
  {
    name: "Sorcerer",
    keywords: ["sorcerer", "metamagic", "font of magic", "sorcery points", "wild magic", "draconic bloodline", "clockwork soul", "aberrant mind"],
    role: "flexible spell manipulation, twinned casting, and potent spell sculpting",
  },
  {
    name: "Artificer",
    keywords: ["artificer", "infusions", "alchemist", "armorer", "artillerist", "battle smith", "replicate magic item"],
    role: "magical invention, gear customization, and infused tools",
  },
];

interface ThemeProfile {
  id: string;
  name: string;
  keywords: string[];
  chips: () => QuickPromptChip[];
}

const THEME_PROFILES: ThemeProfile[] = [
  {
    id: "undead",
    name: "Undead Encounters",
    keywords: ["undead", "zombie", "skeleton", "vampire", "ghoul", "lich", "wight", "mummy", "necromancy", "radiant damage", "holy water", "turn undead"],
    chips: () => [
      {
        id: "theme-undead-pack",
        label: "Anti-Undead Loadout",
        prompt: "What are the best items and spells for fighting undead encounters?",
      },
      {
        id: "theme-undead-radiant",
        label: "Radiant & Holy Spells",
        prompt: "What are the most effective radiant spells and holy items for destroying undead?",
      },
      {
        id: "theme-undead-defenses",
        label: "Necrotic & Drain Defense",
        prompt: "What items and spells protect against necrotic damage, life drain, and paralyzing ghouls?",
      },
      {
        id: "theme-undead-tactics",
        label: "Anti-Regeneration Tactics",
        prompt: "How can players stop undead regeneration and manage swarms of skeletons or zombies?",
      },
    ],
  },
  {
    id: "stealth",
    name: "Stealth & Infiltration",
    keywords: ["stealth", "infiltrat", "sneak", "heist", "burglar", "castle", "lockpick", "covert", "alarm spell", "invisibility"],
    chips: () => [
      {
        id: "theme-stealth-prep",
        label: "Stealth Heist Prep",
        prompt: "Recommend items and spells for infiltrating a guarded castle",
      },
      {
        id: "theme-stealth-bypassing",
        label: "Bypassing Wards & Alarms",
        prompt: "What spells and tools best bypass alarm spells, arcane locks, and physical guards?",
      },
      {
        id: "theme-stealth-budget",
        label: "Budget Infiltration Gear",
        prompt: "What are the best Common and Uncommon items for stealth and scouting?",
      },
      {
        id: "theme-stealth-escape",
        label: "Extraction & Escape",
        prompt: "What are the best extraction and mobility spells if a stealth heist goes wrong?",
      },
    ],
  },
  {
    id: "dragon",
    name: "Dragon & Elemental Battles",
    keywords: ["dragon", "wyrm", "breath weapon", "fire damage", "cold damage", "lightning", "elemental", "frightful presence"],
    chips: () => [
      {
        id: "theme-dragon-pack",
        label: "Dragon-Slayer Loadout",
        prompt: "Create a dragon-slayer loadout list with energy resistance gear and ranged weaponry",
      },
      {
        id: "theme-dragon-resist",
        label: "Elemental Resistances",
        prompt: "What items and spells give resistance against elemental breath weapons and frightful presence?",
      },
      {
        id: "theme-dragon-grounding",
        label: "Grounding Flying Foes",
        prompt: "What spells and items can force a flying dragon or aerial monster to the ground?",
      },
      {
        id: "theme-dragon-tactics",
        label: "Lair & Breath Tactics",
        prompt: "How should a party position against breath weapon cones and legendary lair actions?",
      },
    ],
  },
  {
    id: "boss",
    name: "Boss Encounter",
    keywords: ["boss", "legendary action", "legendary resistance", "deadly encounter", "cr ", "lair action", "boss fight"],
    chips: () => [
      {
        id: "theme-boss-loot",
        label: "Boss Encounter Loot",
        prompt: "Generate high-impact boss encounter loot for a 5th-level party",
      },
      {
        id: "theme-boss-consumables",
        label: "Pre-Boss Consumables",
        prompt: "What potions, oils, and spell scrolls give the biggest statistical edge before a boss fight?",
      },
      {
        id: "theme-boss-legendary",
        label: "Burning Legendary Saves",
        prompt: "What low-cost spells and abilities are best for burning through legendary resistances?",
      },
      {
        id: "theme-boss-tactics",
        label: "Action Economy Defense",
        prompt: "How can a party counter multiple legendary actions per round?",
      },
    ],
  },
  {
    id: "defense",
    name: "Defense & Survivability",
    keywords: ["tank", "armor class", "ac boost", "shield", "saving throw", "warding", "survivability", "resilience", "protect"],
    chips: () => [
      {
        id: "theme-defense-ac",
        label: "Maximum AC Gear",
        prompt: "What magic items and spells provide the highest Armor Class and warding buffs?",
      },
      {
        id: "theme-defense-saves",
        label: "Saving Throw Boosts",
        prompt: "What items boost saving throws against mind control, poison, and area-of-effect spells?",
      },
      {
        id: "theme-defense-pack",
        label: "Save Frontline Pack",
        prompt: "Create a tanky frontline defender gear and spell pack",
      },
      {
        id: "theme-defense-reactions",
        label: "Defensive Reactions",
        prompt: "What are the best reaction spells and abilities to prevent incoming lethal damage?",
      },
    ],
  },
  {
    id: "healing",
    name: "Healing & Restoration",
    keywords: ["heal", "healing", "cure wounds", "healing word", "revivify", "resurrection", "curse", "restoration", "support", "medic"],
    chips: () => [
      {
        id: "theme-heal-pack",
        label: "Save Healer Pack",
        prompt: "Create a dedicated healer and support loadout list",
      },
      {
        id: "theme-heal-action-economy",
        label: "Action-Efficient Healing",
        prompt: "What are the most action-efficient spells for in-combat healing and reviving unconscious allies?",
      },
      {
        id: "theme-heal-curse-cures",
        label: "Status & Curse Removal",
        prompt: "What spells and items cure petrification, blindness, poison, and curses?",
      },
      {
        id: "theme-heal-potions",
        label: "Healing Potions Guide",
        prompt: "How do healing potions scale in 5e and what rules allow drinking them as a bonus action?",
      },
    ],
  },
  {
    id: "dungeon",
    name: "Dungeon Crawl & Traps",
    keywords: ["dungeon", "trap", "darkvision", "hazard", "puzzle", "dungeon crawl", "torch", "pit trap", "ration"],
    chips: () => [
      {
        id: "theme-dungeon-pack",
        label: "Dungeon Crawl Pack",
        prompt: "Create a beginner dungeon-crawling gear and spell pack",
      },
      {
        id: "theme-dungeon-traps",
        label: "Trap Detection Gear",
        prompt: "What items and spells help detect hidden doors, disarm mechanical traps, and survive poison gas?",
      },
      {
        id: "theme-dungeon-lighting",
        label: "Darkvision & Lighting",
        prompt: "What are the best magical light sources and darkvision items for dungeon exploration?",
      },
      {
        id: "theme-dungeon-utility",
        label: "Utility Exploration Items",
        prompt: "What mundane and magical utility gear should every dungeon delver pack?",
      },
    ],
  },
  {
    id: "shopping",
    name: "Shopping & Economy",
    keywords: ["shop", "buy", "merchant", "gold", "gp", "cost", "price", "budget", "affordable", "purchase", "shopping"],
    chips: () => [
      {
        id: "theme-shopping-budget",
        label: "Budget Magic Items",
        prompt: "What are the best magic items and potions under 500 gp?",
      },
      {
        id: "theme-shopping-consumables",
        label: "Cost-Effective Consumables",
        prompt: "What are the most cost-effective potions, scrolls, and adventuring supplies to stock up on?",
      },
      {
        id: "theme-shopping-common",
        label: "Fun Common Items",
        prompt: "What fun and flavor-packed Common magic items cost under 100 gp?",
      },
      {
        id: "theme-shopping-merchant",
        label: "Generate Shop Inventory",
        prompt: "Generate a realistic magic shop inventory with prices for a 5th-level party",
      },
    ],
  },
  {
    id: "aquatic",
    name: "Underwater Adventure",
    keywords: ["underwater", "aquatic", "swim", "ocean", "sea", "drown", "water breathing", "naval"],
    chips: () => [
      {
        id: "theme-aquatic-pack",
        label: "Save Aquatic Gear Pack",
        prompt: "Create an underwater adventure gear and spell pack",
      },
      {
        id: "theme-aquatic-combat",
        label: "Underwater Combat Rules",
        prompt: "What weapons and spells function without penalty underwater?",
      },
      {
        id: "theme-aquatic-mobility",
        label: "Swim Speed & Breathing",
        prompt: "What items grant permanent swimming speed and water breathing?",
      },
    ],
  },
  {
    id: "flight",
    name: "Flight & Aerial Combat",
    keywords: ["fly", "flight", "wings", "levitate", "aerial", "feather fall"],
    chips: () => [
      {
        id: "theme-flight-items",
        label: "Flight Items & Mobility",
        prompt: "What are the best items for flying and high-mobility positioning in combat?",
      },
      {
        id: "theme-flight-counters",
        label: "Falling & Countermeasures",
        prompt: "What happens if a flying character gets knocked prone or loses concentration?",
      },
    ],
  },
];

function generateClassChips(cls: ClassProfile, level = 3): QuickPromptChip[] {
  return [
    {
      id: `class-pack-${cls.name.toLowerCase()}`,
      label: `Save ${cls.name} Pack`,
      prompt: `Create a Level ${level} ${cls.name} gear and spell loadout pack`,
    },
    {
      id: `class-spells-${cls.name.toLowerCase()}`,
      label: `${cls.name} Spells & Combos`,
      prompt: `What are the best spells and tactical synergies for a ${cls.name}?`,
    },
    {
      id: `class-items-${cls.name.toLowerCase()}`,
      label: `${cls.name} Magic Items`,
      prompt: `What are the top 3 magic items every ${cls.name} should prioritize?`,
    },
    {
      id: `class-budget-${cls.name.toLowerCase()}`,
      label: `Budget ${cls.name} Gear`,
      prompt: `What are the best Common and Uncommon items for a ${cls.name} on a budget?`,
    },
  ];
}

function generateItemComparisonChips(itemA: Item, itemB: Item): QuickPromptChip[] {
  return [
    {
      id: `compare-${itemA.id}-${itemB.id}`,
      label: "Pros & Cons Comparison",
      prompt: `Compare the mechanical advantages and trade-offs of ${itemA.name} and ${itemB.name}`,
    },
    {
      id: `resistances-${itemA.id}-${itemB.id}`,
      label: "Resistances & Monster Value",
      prompt: `How do monster resistances and vulnerabilities affect the value of ${itemA.name} vs ${itemB.name}?`,
    },
    {
      id: `save-weapons-${itemA.id}-${itemB.id}`,
      label: "Save Weapon List",
      prompt: `Create a saved list containing ${itemA.name}, ${itemB.name}, and complementary equipment`,
    },
    {
      id: `synergies-${itemA.id}`,
      label: `${itemA.name} Synergies`,
      prompt: `What spells, feats, and class abilities pair best with ${itemA.name}?`,
    },
  ];
}

function generateSingleItemChips(item: Item): QuickPromptChip[] {
  const isWeapon = item.tags.some((t) => /weapon|sword|blade|bow|axe|hammer/i.test(t));
  const isArmor = item.tags.some((t) => /armor|shield/i.test(t));
  return [
    {
      id: `item-synergies-${item.id}`,
      label: `${item.name} Synergies`,
      prompt: `What spells, class features, and feats pair best with ${item.name}?`,
    },
    {
      id: `item-rules-${item.id}`,
      label: "Attunement & Rules",
      prompt: `How do attunement, action costs, and rules interactions work for ${item.name}?`,
    },
    {
      id: `item-alternatives-${item.id}`,
      label: "Similar & Budget Options",
      prompt: `What are lower-rarity or thematic alternatives to ${item.name}?`,
    },
    {
      id: `item-save-${item.id}`,
      label: isWeapon ? "Save Weapon Build" : isArmor ? "Save Defense Build" : "Save Gear Loadout",
      prompt: `Create a saved loadout list built around ${item.name}`,
    },
  ];
}

function generateSingleSpellChips(spell: Spell): QuickPromptChip[] {
  return [
    {
      id: `spell-boost-${spell.id}`,
      label: `Boost ${spell.name}`,
      prompt: `What magic items or character features best boost the save DC or damage of ${spell.name}?`,
    },
    {
      id: `spell-combos-${spell.id}`,
      label: `${spell.name} Combos`,
      prompt: `What spells and party tactics combo best with ${spell.name}?`,
    },
    {
      id: `spell-counters-${spell.id}`,
      label: `Defenses & Counters`,
      prompt: `What are the best counters, defensive items, and saving throw strategies against ${spell.name}?`,
    },
    {
      id: `spell-save-pack-${spell.id}`,
      label: `Save ${spell.school} Pack`,
      prompt: `Create a saved spellbook list centered around ${spell.name} and ${spell.school} spells`,
    },
  ];
}

function generateAssistantFollowUpChips(): QuickPromptChip[] {
  return [
    {
      id: "followup-save-list",
      label: "Save to My Lists",
      prompt: "Create a saved list from these recommended items and spells",
    },
    {
      id: "followup-budget-alts",
      label: "Budget Alternatives",
      prompt: "What are lower-rarity or more affordable alternatives to these recommendations?",
    },
    {
      id: "followup-combat-tactics",
      label: "Combat Tactics Guide",
      prompt: "How should a player use these items tactically during combat?",
    },
    {
      id: "followup-synergy-spells",
      label: "Complementary Spells",
      prompt: "What complementary spells or secondary items pair well with this equipment?",
    },
  ];
}

export function getIntelligentPromptChips(
  messages: ChatMessage[],
  currentInput = "",
): QuickPromptChip[] {
  const cleanInput = currentInput.trim().toLowerCase();

  // 1. If chat is cleared/empty and user isn't currently typing, return empty array.
  // The empty state screen in AiAssistantDialog already displays SAMPLE_PROMPTS.
  if (messages.length === 0 && !cleanInput) {
    return [];
  }

  // 2. Collect previous user queries to avoid suggesting what the user already asked
  const userQueries = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim().toLowerCase());

  // 3. Extract recent messages
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const recentMessagesText = messages
    .slice(-4)
    .map((m) => m.content)
    .join(" \n ");

  // Prioritize active focus text
  const focusText = [cleanInput, lastUserMsg?.content || "", lastAssistantMsg?.content || "", recentMessagesText]
    .filter(Boolean)
    .join(" \n ")
    .toLowerCase();

  const candidates: QuickPromptChip[] = [];

  // 4. Extract entities (items and spells)
  const draftEntities = cleanInput ? extractEntitiesFromText(cleanInput) : { itemIds: [], spellIds: [] };
  const userEntities = lastUserMsg ? extractEntitiesFromText(lastUserMsg.content) : { itemIds: [], spellIds: [] };
  const assistantEntities = lastAssistantMsg ? extractEntitiesFromText(lastAssistantMsg.content) : { itemIds: [], spellIds: [] };

  const allItemIds = Array.from(new Set([...draftEntities.itemIds, ...userEntities.itemIds, ...assistantEntities.itemIds]));
  const allSpellIds = Array.from(new Set([...draftEntities.spellIds, ...userEntities.spellIds, ...assistantEntities.spellIds]));

  const detectedItems = allItemIds.map((id) => findItemByRef(id)).filter((i): i is Item => i !== null);
  const detectedSpells = allSpellIds.map((id) => findSpellByRef(id)).filter((s): s is Spell => s !== null);

  // If 2+ items detected and comparison is in context or multiple items discussed:
  const isComparison = /\b(vs|versus|compare|difference|better|or)\b/i.test(cleanInput || lastUserMsg?.content || "");
  if (detectedItems.length >= 2 && isComparison) {
    candidates.push(...generateItemComparisonChips(detectedItems[0], detectedItems[1]));
  } else if (detectedItems.length === 1) {
    candidates.push(...generateSingleItemChips(detectedItems[0]));
  }

  if (detectedSpells.length >= 1) {
    candidates.push(...generateSingleSpellChips(detectedSpells[0]));
  }

  // 5. Detect D&D Class
  let bestClass: ClassProfile | null = null;
  let highestClassScore = 0;

  for (const cls of DND_CLASSES) {
    let score = 0;
    if (cleanInput) {
      if (cleanInput.includes(cls.name.toLowerCase())) score += 10;
      for (const kw of cls.keywords) {
        if (cleanInput.includes(kw)) score += 5;
      }
    }
    if (lastUserMsg) {
      const uText = lastUserMsg.content.toLowerCase();
      if (uText.includes(cls.name.toLowerCase())) score += 6;
      for (const kw of cls.keywords) {
        if (uText.includes(kw)) score += 3;
      }
    }
    for (const kw of cls.keywords) {
      if (focusText.includes(kw)) score += 1;
    }

    if (score > highestClassScore) {
      highestClassScore = score;
      bestClass = cls;
    }
  }

  // Extract level if specified (e.g. "level 5" or "lvl 3")
  let level = 3;
  const levelMatch = (cleanInput || lastUserMsg?.content || "").match(/(?:level|lvl)\s*(\d+)/i);
  if (levelMatch) {
    const parsedLevel = parseInt(levelMatch[1], 10);
    if (parsedLevel >= 1 && parsedLevel <= 20) {
      level = parsedLevel;
    }
  }

  if (bestClass && highestClassScore >= 2) {
    candidates.push(...generateClassChips(bestClass, level));
  }

  // 6. Detect Themes / Encounters
  let bestTheme: ThemeProfile | null = null;
  let highestThemeScore = 0;

  for (const theme of THEME_PROFILES) {
    let score = 0;
    for (const kw of theme.keywords) {
      if (cleanInput.includes(kw)) score += 5;
      if (lastUserMsg && lastUserMsg.content.toLowerCase().includes(kw)) score += 3;
      if (focusText.includes(kw)) score += 1;
    }
    if (score > highestThemeScore) {
      highestThemeScore = score;
      bestTheme = theme;
    }
  }

  if (bestTheme && highestThemeScore >= 2) {
    candidates.push(...bestTheme.chips());
  }

  // 7. If assistant recommended items/spells or action list is present:
  if (lastAssistantMsg && (assistantEntities.itemIds.length >= 2 || lastAssistantMsg.actionList)) {
    candidates.push(...generateAssistantFollowUpChips());
  }

  // 8. Add general fallback chips if we still don't have enough candidates
  if (candidates.length < 4) {
    candidates.push(
      {
        id: "fallback-party-pack",
        label: "Level 5 Party Loadout",
        prompt: "Create a balanced magic item loadout for a 4-person Level 5 adventuring party",
      },
      {
        id: "fallback-attunement",
        label: "Top Attunement Items",
        prompt: "What are the most impactful attunement magic items across all rarities?",
      },
      {
        id: "fallback-tactical-spells",
        label: "Tactical Combat Spells",
        prompt: "What are the best battlefield control and tactical spells in 5e?",
      },
      {
        id: "fallback-boss-loot",
        label: "Boss Encounter Loot",
        prompt: "Generate high-impact boss encounter loot for a 5th-level party",
      },
    );
  }

  // 9. Filter out candidates that the user has already asked, and deduplicate by id/label
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  const filtered: QuickPromptChip[] = [];

  for (const c of candidates) {
    if (seenIds.has(c.id) || seenLabels.has(c.label.toLowerCase())) continue;

    const cPromptLower = c.prompt.trim().toLowerCase();
    const alreadyAsked = userQueries.some(
      (q) =>
        q === cPromptLower ||
        (q.length > 15 && cPromptLower.includes(q)) ||
        (cPromptLower.length > 15 && q.includes(cPromptLower)),
    );

    if (alreadyAsked) continue;

    seenIds.add(c.id);
    seenLabels.add(c.label.toLowerCase());
    filtered.push(c);

    if (filtered.length >= 4) break;
  }

  return filtered;
}
