import { Item } from "@/data/items";
import { Spell } from "@/data/spells";
import { itemsById as defaultItemsById, spellsById as defaultSpellsById } from "@/lib/ai/retriever";
import { isRarity, itemRequiresAttunement, itemAttunementDetail } from "@/lib/filters";
import { copyToClipboard } from "@/lib/customLists";

export interface LoadoutExportData {
  name: string;
  itemIds: number[];
  spellIds: number[];
}

export function formatSpellLevel(level: number): string {
  if (level === 0) return "Cantrip";
  if (level === 1) return "1st-level";
  if (level === 2) return "2nd-level";
  if (level === 3) return "3rd-level";
  return `${level}th-level`;
}

export function generateLoadoutMarkdownHandout(
  loadout: LoadoutExportData,
  itemsMap: Map<number, Item> = defaultItemsById,
  spellsMap: Map<number, Spell> = defaultSpellsById,
): string {
  const resolvedItems: Item[] = [];
  for (const id of loadout.itemIds) {
    const item = itemsMap.get(id);
    if (item) resolvedItems.push(item);
  }

  const resolvedSpells: Spell[] = [];
  for (const id of loadout.spellIds) {
    const spell = spellsMap.get(id);
    if (spell) resolvedSpells.push(spell);
  }

  if (resolvedItems.length === 0 && resolvedSpells.length === 0) {
    return `# ⚔️ ${loadout.name || "Loadout"}\n\n*Empty Loadout*`;
  }

  const lines: string[] = [];

  // Title
  lines.push(`# ⚔️ ${loadout.name || "D&D 5e Loadout"}`);
  lines.push("*D&D 5e Tactical Loadout & Handout*");
  lines.push("");

  // Summary blockquote
  const summaryParts: string[] = [];

  if (resolvedItems.length > 0) {
    const totalGold = resolvedItems.reduce((acc, it) => acc + (it.price || 0), 0);
    summaryParts.push(`💰 **Total Value:** ${totalGold.toLocaleString()} gp`);

    const attunementCount = resolvedItems.reduce(
      (acc, it) => acc + (itemRequiresAttunement(it) ? 1 : 0),
      0,
    );
    const attuneWarning = attunementCount > 3 ? " (⚠️ exceeds 3-slot limit)" : "";
    summaryParts.push(`🔮 **Attunement Required:** ${attunementCount} / 3 slots${attuneWarning}`);
  }

  const contentsParts: string[] = [];
  if (resolvedItems.length > 0) {
    contentsParts.push(`${resolvedItems.length} item${resolvedItems.length === 1 ? "" : "s"}`);
  }
  if (resolvedSpells.length > 0) {
    contentsParts.push(`${resolvedSpells.length} spell${resolvedSpells.length === 1 ? "" : "s"}`);
  }
  summaryParts.push(`📦 **Contents:** ${contentsParts.join(", ")}`);

  lines.push(`> ${summaryParts.join(" | ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Items section
  if (resolvedItems.length > 0) {
    lines.push(`## 🎒 Magic Items & Equipment (${resolvedItems.length})`);
    lines.push("");

    resolvedItems.forEach((item, index) => {
      lines.push(`### ${item.name}`);

      const rarity = item.tags.find(isRarity) || "Common";
      const categories = item.tags.filter((t) => !isRarity(t)).join(", ") || "Wondrous Item";
      const attuneDetail =
        itemAttunementDetail(item) ||
        (itemRequiresAttunement(item) ? "Requires Attunement" : "No Attunement Required");

      lines.push(`- **Rarity:** ${rarity}`);
      lines.push(`- **Type:** ${categories}`);
      lines.push(`- **Value:** ${item.price.toLocaleString()} gp`);
      lines.push(`- **Attunement:** ${attuneDetail}`);

      if (item.synopsis) {
        lines.push("");
        lines.push(`*${item.synopsis}*`);
      }

      if (item.description && item.description.length > 0) {
        lines.push("");
        lines.push(item.description.join("\n\n"));
      }

      if (index < resolvedItems.length - 1) {
        lines.push("");
      }
    });

    if (resolvedSpells.length > 0) {
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Spells section
  if (resolvedSpells.length > 0) {
    lines.push(`## ✨ Prepared Spells & Incantations (${resolvedSpells.length})`);
    lines.push("");

    resolvedSpells.forEach((spell, index) => {
      lines.push(`### ${spell.name}`);

      const levelStr = formatSpellLevel(spell.level);
      lines.push(`- **Level & School:** ${levelStr} ${spell.school}`);
      lines.push(`- **Casting Time:** ${spell.castingTime}`);
      lines.push(`- **Range:** ${spell.range}`);
      lines.push(`- **Components:** ${spell.components.join(", ")}`);

      const durationStr = spell.concentration
        ? `${spell.duration} (Concentration)`
        : spell.duration;
      lines.push(`- **Duration:** ${durationStr}`);

      if (spell.classes && spell.classes.length > 0) {
        lines.push(`- **Classes:** ${spell.classes.join(", ")}`);
      }
      if (spell.ritual) {
        lines.push("- **Ritual:** Yes");
      }

      if (spell.description && spell.description.length > 0) {
        lines.push("");
        lines.push(spell.description.join("\n\n"));
      }

      if (spell.higherLevel && spell.higherLevel.length > 0) {
        lines.push("");
        lines.push(`**At Higher Levels:**\n\n${spell.higherLevel.join("\n\n")}`);
      }

      if (index < resolvedSpells.length - 1) {
        lines.push("");
      }
    });
  }

  lines.push("");
  lines.push("---");
  lines.push("*Exported from JustDnD Compendium*");

  return lines.join("\n");
}

export async function copyLoadoutMarkdownToClipboard(
  loadout: LoadoutExportData,
  itemsMap?: Map<number, Item>,
  spellsMap?: Map<number, Spell>,
): Promise<boolean> {
  const markdown = generateLoadoutMarkdownHandout(loadout, itemsMap, spellsMap);
  return await copyToClipboard(markdown);
}
