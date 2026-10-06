import { ParsedListAction } from "./types";
import { findItemByRef, findSpellByRef } from "./retriever";

interface ParseResult {
  cleanedText: string;
  action: ParsedListAction | null;
}

export function parseAssistantMessage(rawText: string): ParseResult {
  // Regex to detect [CREATE_LIST: {...}] or ```action:create_list ... ``` or ```json ... ```
  const actionBlockRegex = /(?:\[(?:CREATE_LIST|LIST_ACTION):\s*({[\s\S]*?})\]|```(?:action:create_list|json\s*(?={"action"|"name"))([\s\S]*?)```)/i;
  const match = rawText.match(actionBlockRegex);

  if (!match) {
    return { cleanedText: rawText, action: null };
  }

  const jsonSnippet = (match[1] || match[2] || "").trim();
  const cleanedText = rawText.replace(match[0], "").trim();

  try {
    const parsed = JSON.parse(jsonSnippet);

    const name = typeof parsed.name === "string" && parsed.name.trim()
      ? parsed.name.trim()
      : "Custom AI Collection";

    const itemIds = new Set<number>();
    const spellIds = new Set<number>();

    // Parse items (supports itemIds, items, itemNames)
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

    // Parse spells (supports spellIds, spells, spellNames)
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
      return { cleanedText: rawText, action: null };
    }

    return {
      cleanedText,
      action: {
        name,
        itemIds: Array.from(itemIds),
        spellIds: Array.from(spellIds),
      },
    };
  } catch {
    return { cleanedText: rawText, action: null };
  }
}
