import { X, RotateCcw } from "lucide-react";
import type { FilterState } from "@/lib/filters";
import type { SpellFilterState } from "@/lib/spellFilters";
import { levelLabel } from "@/lib/spellFilters";

type ActiveFilterChipsProps = {
  tab: "items" | "spells";
  itemState?: FilterState;
  onItemChange?: (patch: Partial<FilterState>) => void;
  defaultPriceRange?: [number, number];
  spellState?: SpellFilterState;
  onSpellChange?: (patch: Partial<SpellFilterState>) => void;
  onClearAll: () => void;
  onRevert?: () => void;
  canRevert?: boolean;
};

export function ActiveFilterChips({
  tab,
  itemState,
  onItemChange,
  defaultPriceRange,
  spellState,
  onSpellChange,
  onClearAll,
  onRevert,
  canRevert,
}: ActiveFilterChipsProps) {
  if (tab === "items" && itemState && onItemChange) {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (itemState.search) {
      chips.push({
        key: `search-${itemState.search}`,
        label: `"${itemState.search}"`,
        onRemove: () => onItemChange({ search: "" }),
      });
    }

    for (const r of itemState.rarities) {
      chips.push({
        key: `rarity-${r}`,
        label: r,
        onRemove: () =>
          onItemChange({
            rarities: itemState.rarities.filter((x) => x !== r),
          }),
      });
    }

    if (itemState.attunement && itemState.attunement !== "all") {
      chips.push({
        key: `attunement-${itemState.attunement}`,
        label:
          itemState.attunement === "requires"
            ? "Requires Attunement"
            : "No Attunement",
        onRemove: () => onItemChange({ attunement: "all" }),
      });
    }

    for (const c of itemState.categories) {
      chips.push({
        key: `category-${c}`,
        label: c,
        onRemove: () =>
          onItemChange({
            categories: itemState.categories.filter((x) => x !== c),
          }),
      });
    }

    if (defaultPriceRange) {
      const [floor, ceil] = defaultPriceRange;
      if (itemState.minPrice > floor || itemState.maxPrice < ceil) {
        chips.push({
          key: `price-${itemState.minPrice}-${itemState.maxPrice}`,
          label: `${itemState.minPrice.toLocaleString()} – ${itemState.maxPrice.toLocaleString()} gp`,
          onRemove: () =>
            onItemChange({ minPrice: floor, maxPrice: ceil }),
        });
      }
    }

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Active:
        </span>
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter: ${chip.label}`}
              className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {chips.length > 1 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        )}
        {canRevert && onRevert && (
          <button
            type="button"
            onClick={onRevert}
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Revert smart filter"
          >
            <RotateCcw className="size-3" />
            <span>Revert Smart Filter</span>
          </button>
        )}
      </div>
    );
  }

  if (tab === "spells" && spellState && onSpellChange) {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (spellState.search) {
      chips.push({
        key: `search-${spellState.search}`,
        label: `"${spellState.search}"`,
        onRemove: () => onSpellChange({ search: "" }),
      });
    }

    for (const lvl of spellState.levels) {
      chips.push({
        key: `level-${lvl}`,
        label: levelLabel(lvl),
        onRemove: () =>
          onSpellChange({
            levels: spellState.levels.filter((x) => x !== lvl),
          }),
      });
    }

    for (const s of spellState.schools) {
      chips.push({
        key: `school-${s}`,
        label: s,
        onRemove: () =>
          onSpellChange({
            schools: spellState.schools.filter((x) => x !== s),
          }),
      });
    }

    for (const c of spellState.classes) {
      chips.push({
        key: `class-${c}`,
        label: c,
        onRemove: () =>
          onSpellChange({
            classes: spellState.classes.filter((x) => x !== c),
          }),
      });
    }

    for (const ct of spellState.castingTimes) {
      chips.push({
        key: `ct-${ct}`,
        label: ct,
        onRemove: () =>
          onSpellChange({
            castingTimes: spellState.castingTimes.filter((x) => x !== ct),
          }),
      });
    }

    if (spellState.ritualOnly) {
      chips.push({
        key: "ritual",
        label: "Ritual only",
        onRemove: () => onSpellChange({ ritualOnly: false }),
      });
    }

    if (spellState.concentrationOnly) {
      chips.push({
        key: "concentration",
        label: "Concentration only",
        onRemove: () => onSpellChange({ concentrationOnly: false }),
      });
    }

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Active:
        </span>
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter: ${chip.label}`}
              className="rounded p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {chips.length > 1 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        )}
        {canRevert && onRevert && (
          <button
            type="button"
            onClick={onRevert}
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            title="Revert smart filter"
          >
            <RotateCcw className="size-3" />
            <span>Revert Smart Filter</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}
