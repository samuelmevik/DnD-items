import {
  decodeTab,
  decodeSpellFilters,
  encodeSpellFilters,
  decodeFilters,
  encodeFilters,
} from "./urlState";
import { FilterState } from "./filters";
import { SpellFilterState } from "./spellFilters";

const defaultSpellFilters: SpellFilterState = {
  search: "",
  levels: [],
  schools: [],
  classes: [],
  ritualOnly: false,
  concentrationOnly: false,
  favoritesOnly: false,
  sort: "level-asc",
};

const defaultItemFilters: FilterState = {
  search: "",
  rarities: [],
  categories: [],
  minPrice: 0,
  maxPrice: 50000,
  favoritesOnly: false,
  sort: "price-asc",
};

// Simple standalone assertions for test runners or direct execution
export function runUrlStateTests() {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  };

  // 1. Tab decoding
  assert(decodeTab("") === "items", "empty search should default to items");
  assert(decodeTab("?tab=spells") === "spells", "tab=spells should decode to spells");
  assert(decodeTab("?tab=items") === "items", "tab=items should decode to items");
  assert(decodeTab("?tab=invalid") === "items", "invalid tab should fallback to items");

  // 2. Spell filters decoding
  const decodedSpells = decodeSpellFilters(
    "?tab=spells&q=fireball&lvl=0,3,99&school=evocation,unknown&cls=wizard,cleric&rit=1&conc=1&fav=1&sort=name-asc",
    defaultSpellFilters,
  );

  assert(decodedSpells.search === "fireball", "search matches fireball");
  assert(
    decodedSpells.levels.length === 2 &&
      decodedSpells.levels.includes(0) &&
      decodedSpells.levels.includes(3),
    "levels should parse valid ints 0 and 3 and ignore 99",
  );
  assert(
    decodedSpells.schools.length === 1 && decodedSpells.schools[0] === "Evocation",
    "schools should parse Evocation and ignore unknown",
  );
  assert(
    decodedSpells.classes.length === 2 &&
      decodedSpells.classes.includes("Cleric") &&
      decodedSpells.classes.includes("Wizard"),
    "classes should parse Cleric and Wizard",
  );
  assert(decodedSpells.ritualOnly === true, "ritualOnly is true");
  assert(decodedSpells.concentrationOnly === true, "concentrationOnly is true");
  assert(decodedSpells.favoritesOnly === true, "favoritesOnly is true");
  assert(decodedSpells.sort === "name-asc", "sort is name-asc");

  // 3. Spell filters encoding
  const encodedSpells = encodeSpellFilters(
    {
      ...defaultSpellFilters,
      search: "cure",
      levels: [1, 2],
      schools: ["Evocation"],
      classes: ["Cleric"],
      ritualOnly: true,
      concentrationOnly: false,
      favoritesOnly: true,
      sort: "name-desc",
    },
    defaultSpellFilters,
  );

  const params = new URLSearchParams(encodedSpells);
  assert(params.get("tab") === "spells", "encoded has tab=spells");
  assert(params.get("q") === "cure", "encoded has q=cure");
  assert(params.get("lvl") === "1,2", "encoded has lvl=1,2");
  assert(params.get("school") === "Evocation", "encoded has school=Evocation");
  assert(params.get("cls") === "Cleric", "encoded has cls=Cleric");
  assert(params.get("rit") === "1", "encoded has rit=1");
  assert(params.get("conc") == null, "encoded omits conc when false");
  assert(params.get("fav") === "1", "encoded has fav=1");
  assert(params.get("sort") === "name-desc", "encoded has sort=name-desc");

  // 4. Backward compatibility of item filters
  const decodedItems = decodeFilters("?q=sword&fav=1&sort=name-asc", defaultItemFilters);
  assert(decodedItems.search === "sword", "item search matches sword");
  assert(decodedItems.favoritesOnly === true, "item fav matches true");
  assert(decodedItems.sort === "name-asc", "item sort matches name-asc");

  const encodedItems = encodeFilters(
    { ...defaultItemFilters, search: "axe", favoritesOnly: true },
    defaultItemFilters,
  );
  const itemParams = new URLSearchParams(encodedItems);
  assert(itemParams.get("q") === "axe", "item encoded has q=axe");
  assert(itemParams.get("fav") === "1", "item encoded has fav=1");

  return true;
}
