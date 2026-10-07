import { parseAssistantMessage, safeJsonParse } from "./actionParser";

export function runActionParserTests() {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  };

  console.log("  Testing actionParser...");

  // 1. Plain text with no action blocks
  {
    const text = "A Flame Tongue is a rare magical sword that deals fire damage.";
    const result = parseAssistantMessage(text);
    assert(result.cleanedText === text, "cleanedText equals original text");
    assert(result.action === null, "action should be null");
    assert(result.filterAction === null, "filterAction should be null");
  }

  // 2. Standard [APPLY_FILTERS: {...}] for items
  {
    const raw = `Here are some great weapons that don't need attunement:
[APPLY_FILTERS: {"targetTab": "items", "title": "Rare Weapons (No Attunement)", "rarities": ["Rare"], "categories": ["Weapon"], "attunement": "none", "search": "sword"}]
Let me know if you want more details!`;

    const result = parseAssistantMessage(raw);
    assert(!result.cleanedText.includes("[APPLY_FILTERS:"), "action tag should be stripped from cleaned text");
    assert(result.cleanedText.includes("Here are some great weapons"), "prose preserved");
    assert(result.cleanedText.includes("Let me know if you want more details!"), "trailing prose preserved");

    const fa = result.filterAction;
    assert(fa !== null, "filterAction should not be null");
    assert(fa?.targetTab === "items", "targetTab should be items");
    assert(fa?.title === "Rare Weapons (No Attunement)", "title parsed");
    assert(Array.isArray(fa?.rarities) && fa?.rarities[0] === "Rare", "rarities parsed");
    assert(Array.isArray(fa?.categories) && fa?.categories[0] === "Weapon", "categories parsed");
    assert(fa?.attunement === "none", "attunement is 'none'");
    assert(fa?.search === "sword", "search term parsed");
    assert(fa?.itemPatch?.attunement === "none", "itemPatch attunement set");
    assert((fa?.itemPatch?.rarities as string[])[0] === "Rare", "itemPatch rarities set");
  }

  // 3. Standard [APPLY_FILTERS: {...}] for spells
  {
    const raw = `These utility divination spells will suit your Bard well:
[APPLY_FILTERS: {"targetTab": "spells", "title": "Bard Divination Spells", "classes": ["Bard"], "schools": ["Divination"], "levels": [1, 2, 3], "ritualOnly": true}]`;

    const result = parseAssistantMessage(raw);
    const fa = result.filterAction;
    assert(fa !== null, "filterAction should not be null");
    assert(fa?.targetTab === "spells", "targetTab should be spells");
    assert(fa?.title === "Bard Divination Spells", "title parsed");
    assert(Array.isArray(fa?.classes) && fa?.classes.includes("Bard"), "classes parsed");
    assert(Array.isArray(fa?.schools) && fa?.schools.includes("Divination"), "schools parsed");
    assert(Array.isArray(fa?.levels) && fa?.levels.length === 3, "levels parsed");
    assert(fa?.ritualOnly === true, "ritualOnly is true");
    assert(fa?.spellPatch?.ritualOnly === true, "spellPatch ritualOnly set");
  }

  // 4. Markdown code block action formats
  {
    const block1 = `Recommended filter:
\`\`\`action:apply_filters
{"targetTab": "items", "rarities": ["Legendary"], "categories": ["Armor"]}
\`\`\``;
    const res1 = parseAssistantMessage(block1);
    assert(res1.filterAction !== null, "action:apply_filters code block parsed");
    assert(res1.filterAction?.rarities?.[0] === "Legendary", "legendary rarity parsed");
    assert(res1.filterAction?.categories?.[0] === "Armor", "armor category parsed");

    const block2 = `Filtering compendium:
\`\`\`json
{"action": "apply_filters", "schools": ["Evocation"], "levels": [3], "classes": ["Wizard"]}
\`\`\``;
    const res2 = parseAssistantMessage(block2);
    assert(res2.filterAction !== null, "json code block with action: apply_filters parsed");
    assert(res2.filterAction?.targetTab === "spells", "auto-inferred spells tab");
    assert(res2.filterAction?.schools?.[0] === "Evocation", "evocation parsed");
    assert(res2.filterAction?.levels?.[0] === 3, "level 3 parsed");
  }

  // 5. Normalization and aliases
  {
    const raw = `[APPLY_FILTERS: {"rarities": ["very-rare", "rare", "uncommon"], "categories": ["weapons", "potions"], "attunement": false, "minPrice": "500", "maxPrice": 5000}]`;
    const res = parseAssistantMessage(raw);
    const fa = res.filterAction;
    assert(fa !== null, "filter action parsed");
    assert(fa?.targetTab === "items", "inferred items tab");
    assert(fa?.rarities?.includes("Very Rare") ?? false, "very-rare normalized to 'Very Rare'");
    assert(fa?.rarities?.includes("Rare") ?? false, "rare normalized to 'Rare'");
    assert(fa?.rarities?.includes("Uncommon") ?? false, "uncommon normalized to 'Uncommon'");
    assert(fa?.categories?.includes("Weapon") ?? false, "weapons plural normalized to 'Weapon'");
    assert(fa?.categories?.includes("Potion") ?? false, "potions plural normalized to 'Potion'");
    assert(fa?.attunement === "none", "boolean false attunement normalized to 'none'");
    assert(fa?.minPrice === 500, "minPrice parsed as number");
    assert(fa?.maxPrice === 5000, "maxPrice parsed as number");
  }

  // 6. Spell level and casting time normalization
  {
    const raw = `[APPLY_FILTERS: {"levels": ["cantrip", "1st", "2nd", 3], "castingTimes": ["bonus action", "reaction"], "concentration": true}]`;
    const res = parseAssistantMessage(raw);
    const fa = res.filterAction;
    assert(fa !== null, "spell filter action parsed");
    assert(fa?.targetTab === "spells", "inferred spells tab from levels");
    assert(fa?.levels?.includes(0) ?? false, "cantrip normalized to 0");
    assert(fa?.levels?.includes(1) ?? false, "1st normalized to 1");
    assert(fa?.levels?.includes(2) ?? false, "2nd normalized to 2");
    assert(fa?.levels?.includes(3) ?? false, "3 kept as 3");
    assert(fa?.castingTimes?.includes("Bonus Action") ?? false, "bonus action normalized");
    assert(fa?.castingTimes?.includes("Reaction") ?? false, "reaction normalized");
    assert(fa?.concentrationOnly === true, "concentration normalized to concentrationOnly");
  }

  // 7. Malformed JSON recovery
  {
    // Trailing comma
    const res1 = safeJsonParse('{"targetTab": "items", "rarities": ["Rare", "Very Rare"],}');
    assert(res1 !== null, "safeJsonParse recovers from trailing comma");
    assert(Array.isArray(res1?.rarities), "rarities array parsed");

    // Single quotes
    const res2 = safeJsonParse("{'targetTab': 'items', 'rarity': 'Rare'}");
    assert(res2 !== null, "safeJsonParse recovers from single quotes");
    assert(res2?.targetTab === "items", "targetTab parsed from single quotes");

    // Unquoted keys
    const res3 = safeJsonParse('{targetTab: "items", rarities: ["Rare"]}');
    assert(res3 !== null, "safeJsonParse recovers from unquoted keys");
    assert(res3?.targetTab === "items", "unquoted key targetTab parsed");

    // End-to-end parseAssistantMessage with trailing comma
    const rawMalformed = `Check this out:
[APPLY_FILTERS: {targetTab: "items", "rarities": ["Rare"], "categories": ["Weapon"],}]`;
    const res4 = parseAssistantMessage(rawMalformed);
    assert(res4.filterAction !== null, "parseAssistantMessage parsed malformed JSON tag");
    assert(res4.filterAction?.rarities?.[0] === "Rare", "rarity Rare parsed");
  }

  // 8. Mixed List + Filter actions in single message
  {
    const rawMixed = `I recommend these fire weapons for your warrior:
[APPLY_FILTERS: {"targetTab": "items", "title": "Fire Weapons", "categories": ["Weapon"], "search": "Flame"}]
[CREATE_LIST: {"name": "Warrior Fire Arsenal", "itemNames": ["Flame Tongue", "Sun Blade"]}]
Enjoy your adventure!`;

    const res = parseAssistantMessage(rawMixed);
    assert(!res.cleanedText.includes("[APPLY_FILTERS:"), "filter block stripped");
    assert(!res.cleanedText.includes("[CREATE_LIST:"), "list block stripped");
    assert(res.cleanedText.includes("I recommend these fire weapons"), "preceding text kept");
    assert(res.cleanedText.includes("Enjoy your adventure!"), "following text kept");

    assert(res.filterAction !== null, "filterAction parsed in mixed message");
    assert(res.filterAction?.title === "Fire Weapons", "filterAction title matches");
    assert(res.filterAction?.categories?.[0] === "Weapon", "filterAction category matches");

    assert(res.action !== null, "action (list) parsed in mixed message");
    assert(res.action?.name === "Warrior Fire Arsenal", "list name matches");
    assert((res.action?.itemIds.length ?? 0) > 0, "itemIds populated from itemNames");
  }

  // 9. Streaming partial action tag hiding
  {
    const inProgress = `Here is my recommendation:
[APPLY_FILTERS: {"targetTab": "items", "rari`;
    const res = parseAssistantMessage(inProgress);
    assert(res.cleanedText === "Here is my recommendation:", "in-progress tag hidden during streaming");
    assert(res.filterAction === null, "incomplete tag returns null filterAction");
  }

  // 10. Empty filter payload returns null filterAction
  {
    const emptyPayload = `Here are some items:
[APPLY_FILTERS: {}]`;
    const res = parseAssistantMessage(emptyPayload);
    assert(res.filterAction === null, "empty payload returns null filterAction");
  }
}
