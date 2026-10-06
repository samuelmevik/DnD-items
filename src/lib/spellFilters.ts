import { Spell } from "../data/spells";

export const SCHOOLS = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
] as const;

export const CLASSES = [
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

export const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const levelLabel = (level: number): string =>
  level === 0 ? "Cantrip" : `Level ${level}`;

export type SpellSortKey = "level-asc" | "level-desc" | "name-asc" | "name-desc";

export const SPELL_SORT_LABELS: Record<SpellSortKey, string> = {
  "level-asc": "Level: low to high",
  "level-desc": "Level: high to low",
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
};

export const CASTING_TIMES = [
  "Action",
  "Bonus Action",
  "Reaction",
  "1 Minute+",
] as const;

export type CastingTimeCategory = (typeof CASTING_TIMES)[number];

export const getCastingTimeCategory = (
  castingTime: string,
): CastingTimeCategory => {
  const lower = (castingTime || "").toLowerCase().trim();
  if (lower.startsWith("1 bonus action") || lower === "bonus action") {
    return "Bonus Action";
  }
  if (lower.startsWith("1 reaction") || lower === "reaction") {
    return "Reaction";
  }
  if (lower.startsWith("1 action") || lower === "action") {
    return "Action";
  }
  return "1 Minute+";
};

export type SpellFilterState = {
  search: string;
  levels: number[];
  schools: string[];
  classes: string[];
  castingTimes: CastingTimeCategory[];
  ritualOnly: boolean;
  concentrationOnly: boolean;
  favoritesOnly: boolean;
  sort: SpellSortKey;
};

const matchesSearch = (spell: Spell, term: string): boolean => {
  if (!term) return true;
  const t = term.toLowerCase();
  if (spell.name.toLowerCase().includes(t)) return true;
  return spell.description.some((d) => d.toLowerCase().includes(t));
};

export type SpellFilterPredicate = {
  search?: boolean;
  levels?: boolean;
  schools?: boolean;
  classes?: boolean;
  castingTimes?: boolean;
  ritual?: boolean;
  concentration?: boolean;
  favorites?: boolean;
};

const passes = (
  spell: Spell,
  state: SpellFilterState,
  favorites: Set<number>,
  skip: SpellFilterPredicate = {},
): boolean => {
  if (!skip.search && !matchesSearch(spell, state.search)) return false;

  if (!skip.levels && state.levels.length > 0 && !state.levels.includes(spell.level)) {
    return false;
  }

  if (!skip.schools && state.schools.length > 0 && !state.schools.includes(spell.school)) {
    return false;
  }

  if (
    !skip.classes &&
    state.classes.length > 0 &&
    !spell.classes.some((c) => state.classes.includes(c))
  ) {
    return false;
  }

  if (
    !skip.castingTimes &&
    state.castingTimes &&
    state.castingTimes.length > 0 &&
    !state.castingTimes.includes(getCastingTimeCategory(spell.castingTime))
  ) {
    return false;
  }

  if (!skip.ritual && state.ritualOnly && !spell.ritual) return false;
  if (!skip.concentration && state.concentrationOnly && !spell.concentration) return false;
  if (!skip.favorites && state.favoritesOnly && !favorites.has(spell.id)) return false;

  return true;
};

const compare = (a: Spell, b: Spell, sort: SpellSortKey): number => {
  switch (sort) {
    case "level-asc":
      return a.level - b.level || a.name.localeCompare(b.name);
    case "level-desc":
      return b.level - a.level || a.name.localeCompare(b.name);
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
  }
};

export const filterSpells = (
  spells: Spell[],
  state: SpellFilterState,
  favorites: Set<number>,
): Spell[] => {
  const out = spells.filter((s) => passes(s, state, favorites));
  out.sort((a, b) => compare(a, b, state.sort));
  return out;
};

export const levelCount = (
  spells: Spell[],
  state: SpellFilterState,
  favorites: Set<number>,
  level: number,
): number => {
  const skip: SpellFilterPredicate = { levels: true };
  let count = 0;
  for (const s of spells) {
    if (passes(s, state, favorites, skip) && s.level === level) count++;
  }
  return count;
};

export const schoolCount = (
  spells: Spell[],
  state: SpellFilterState,
  favorites: Set<number>,
  school: string,
): number => {
  const skip: SpellFilterPredicate = { schools: true };
  let count = 0;
  for (const s of spells) {
    if (passes(s, state, favorites, skip) && s.school === school) count++;
  }
  return count;
};

export const classCount = (
  spells: Spell[],
  state: SpellFilterState,
  favorites: Set<number>,
  klass: string,
): number => {
  const skip: SpellFilterPredicate = { classes: true };
  let count = 0;
  for (const s of spells) {
    if (passes(s, state, favorites, skip) && s.classes.includes(klass)) count++;
  }
  return count;
};

export const castingTimeCount = (
  spells: Spell[],
  state: SpellFilterState,
  favorites: Set<number>,
  category: CastingTimeCategory,
): number => {
  const skip: SpellFilterPredicate = { castingTimes: true };
  let count = 0;
  for (const s of spells) {
    if (
      passes(s, state, favorites, skip) &&
      getCastingTimeCategory(s.castingTime) === category
    ) {
      count++;
    }
  }
  return count;
};

export const activeSpellFilterCount = (state: SpellFilterState): number => {
  let n = 0;
  if (state.search) n++;
  n += state.levels.length;
  n += state.schools.length;
  n += state.classes.length;
  n += state.castingTimes.length;
  if (state.ritualOnly) n++;
  if (state.concentrationOnly) n++;
  if (state.favoritesOnly) n++;
  return n;
};
