import {
  formatSpellLevel,
  generateLoadoutMarkdownHandout,
  copyLoadoutMarkdownToClipboard,
  LoadoutExportData,
} from "./loadoutExport";
import { Item } from "@/data/items";
import { Spell } from "@/data/spells";
import { itemsById, spellsById } from "./retriever";

export async function runLoadoutExportTests() {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  };

  // 1. Spell level formatting
  assert(formatSpellLevel(0) === "Cantrip", "level 0 is Cantrip");
  assert(formatSpellLevel(1) === "1st-level", "level 1 is 1st-level");
  assert(formatSpellLevel(2) === "2nd-level", "level 2 is 2nd-level");
  assert(formatSpellLevel(3) === "3rd-level", "level 3 is 3rd-level");
  assert(formatSpellLevel(4) === "4th-level", "level 4 is 4th-level");
  assert(formatSpellLevel(9) === "9th-level", "level 9 is 9th-level");

  // Sample Mock Data
  const mockItem1: Item = {
    id: 101,
    name: "Boots of Elvenkind",
    slug: "boots-of-elvenkind",
    synopsis: "Grants advantage on Stealth checks.",
    description: [
      "Wondrous item, uncommon",
      "While you wear these boots, your steps make no sound, regardless of the surface you are walking on. You also have advantage on Dexterity (Stealth) checks that rely on moving silently.",
    ],
    price: 400,
    tags: ["Wondrous Item", "Uncommon"],
  };

  const mockItem2: Item = {
    id: 102,
    name: "Flame Tongue",
    slug: "flame-tongue",
    synopsis: "Sword that ignites with blazing fire.",
    description: [
      "Weapon (any sword), rare (requires attunement)",
      "You can use a bonus action to speak this magic sword's command word, causing flames to erupt from a blade.",
    ],
    price: 5000,
    tags: ["Weapon", "Rare"],
  };

  const mockSpell1: Spell = {
    id: 201,
    index: "invisibility",
    name: "Invisibility",
    level: 2,
    school: "Illusion",
    classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
    ritual: false,
    concentration: true,
    castingTime: "1 action",
    range: "Touch",
    duration: "1 hour",
    components: ["V", "S", "M"],
    description: [
      "A creature you touch becomes invisible until the spell ends.",
      "Anything the target is wearing or carrying is invisible as long as it is on the target's person.",
    ],
    higherLevel: [
      "When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.",
    ],
  };

  const mockItemsMap = new Map<number, Item>([
    [101, mockItem1],
    [102, mockItem2],
  ]);

  const mockSpellsMap = new Map<number, Spell>([[201, mockSpell1]]);

  // 2. Full loadout markdown handout generation
  const fullLoadout: LoadoutExportData = {
    name: "Infiltration Strike Pack",
    itemIds: [101, 102],
    spellIds: [201],
  };

  const md = generateLoadoutMarkdownHandout(fullLoadout, mockItemsMap, mockSpellsMap);

  assert(md.includes("# ⚔️ Infiltration Strike Pack"), "contains header title");
  assert(md.includes("*D&D 5e Tactical Loadout & Handout*"), "contains subtitle");
  assert(md.includes("💰 **Total Value:** 5,400 gp"), "contains calculated total value");
  assert(md.includes("🔮 **Attunement Required:** 1 / 3 slots"), "contains attunement slot tally");
  assert(md.includes("📦 **Contents:** 2 items, 1 spell"), "contains contents breakdown");
  assert(md.includes("## 🎒 Magic Items & Equipment (2)"), "contains items section");
  assert(md.includes("### Boots of Elvenkind"), "contains item 1 title");
  assert(md.includes("- **Rarity:** Uncommon"), "contains item 1 rarity");
  assert(md.includes("- **Value:** 400 gp"), "contains item 1 price");
  assert(md.includes("- **Attunement:** No Attunement Required"), "contains item 1 no attunement");
  assert(md.includes("*Grants advantage on Stealth checks.*"), "contains item 1 synopsis");
  assert(md.includes("### Flame Tongue"), "contains item 2 title");
  assert(md.includes("- **Rarity:** Rare"), "contains item 2 rarity");
  assert(md.includes("- **Attunement:** Requires Attunement"), "contains item 2 attunement requirement");
  assert(md.includes("## ✨ Prepared Spells & Incantations (1)"), "contains spells section");
  assert(md.includes("### Invisibility"), "contains spell title");
  assert(md.includes("- **Level & School:** 2nd-level Illusion"), "contains spell level and school");
  assert(md.includes("- **Duration:** 1 hour (Concentration)"), "contains concentration duration");
  assert(md.includes("- **Components:** V, S, M"), "contains components");
  assert(md.includes("- **Classes:** Bard, Sorcerer, Warlock, Wizard"), "contains classes");
  assert(md.includes("**At Higher Levels:**"), "contains higher levels section");
  assert(md.includes("*Exported from JustDnD Compendium*"), "contains footer tag");

  // 3. Attunement limit warning (> 3 slots)
  const attuneItemA: Item = { ...mockItem2, id: 301, name: "Attune 1" };
  const attuneItemB: Item = { ...mockItem2, id: 302, name: "Attune 2" };
  const attuneItemC: Item = { ...mockItem2, id: 303, name: "Attune 3" };
  const attuneItemD: Item = { ...mockItem2, id: 304, name: "Attune 4" };

  const heavyAttuneMap = new Map<number, Item>([
    [301, attuneItemA],
    [302, attuneItemB],
    [303, attuneItemC],
    [304, attuneItemD],
  ]);

  const heavyAttuneMd = generateLoadoutMarkdownHandout(
    { name: "Heavy Attune", itemIds: [301, 302, 303, 304], spellIds: [] },
    heavyAttuneMap,
    mockSpellsMap,
  );
  assert(
    heavyAttuneMd.includes("4 / 3 slots (⚠️ exceeds 3-slot limit)"),
    "warns when attunement exceeds standard 3 slots",
  );

  // 4. Items-only loadout (no spells section)
  const itemsOnlyMd = generateLoadoutMarkdownHandout(
    { name: "Gear Only", itemIds: [101], spellIds: [] },
    mockItemsMap,
    mockSpellsMap,
  );
  assert(itemsOnlyMd.includes("## 🎒 Magic Items & Equipment (1)"), "contains items section");
  assert(!itemsOnlyMd.includes("## ✨ Prepared Spells"), "does not contain spells section");
  assert(itemsOnlyMd.includes("📦 **Contents:** 1 item"), "contents mentions 1 item only");

  // 5. Spells-only loadout (no items section)
  const spellsOnlyMd = generateLoadoutMarkdownHandout(
    { name: "Spells Only", itemIds: [], spellIds: [201] },
    mockItemsMap,
    mockSpellsMap,
  );
  assert(!spellsOnlyMd.includes("## 🎒 Magic Items"), "does not contain items section");
  assert(spellsOnlyMd.includes("## ✨ Prepared Spells & Incantations (1)"), "contains spells section");
  assert(spellsOnlyMd.includes("📦 **Contents:** 1 spell"), "contents mentions 1 spell only");

  // 6. Empty loadout fallback
  const emptyMd = generateLoadoutMarkdownHandout(
    { name: "Empty Set", itemIds: [], spellIds: [] },
    mockItemsMap,
    mockSpellsMap,
  );
  assert(emptyMd.includes("# ⚔️ Empty Set"), "contains title for empty loadout");
  assert(emptyMd.includes("*Empty Loadout*"), "shows empty loadout notice");

  // 7. Unknown IDs are safely ignored
  const unknownIdsMd = generateLoadoutMarkdownHandout(
    { name: "Ghost Items", itemIds: [99999], spellIds: [88888] },
    mockItemsMap,
    mockSpellsMap,
  );
  assert(unknownIdsMd.includes("*Empty Loadout*"), "gracefully treats unresolvable IDs as empty");

  // 8. Default maps integration with live dataset
  const firstRealItem = Array.from(itemsById.values())[0];
  const firstRealSpell = Array.from(spellsById.values())[0];
  if (firstRealItem && firstRealSpell) {
    const liveMd = generateLoadoutMarkdownHandout({
      name: "Live DB Test",
      itemIds: [firstRealItem.id],
      spellIds: [firstRealSpell.id],
    });
    assert(liveMd.includes(firstRealItem.name), "live item included by default map");
    assert(liveMd.includes(firstRealSpell.name), "live spell included by default map");
  }

  // 9. copyLoadoutMarkdownToClipboard execution (handles clipboard in headless/test mode without throw)
  const clipResult = await copyLoadoutMarkdownToClipboard(
    fullLoadout,
    mockItemsMap,
    mockSpellsMap,
  );
  assert(typeof clipResult === "boolean", "clipboard export returns boolean without error");

  return true;
}
