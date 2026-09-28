import { ChevronDown } from "lucide-react";
import { SpellSortKey, SPELL_SORT_LABELS } from "@/lib/spellFilters";
import { cn } from "@/lib/utils";

type SpellSortMenuProps = {
  value: SpellSortKey;
  onChange: (value: SpellSortKey) => void;
  className?: string;
};

const ORDER: SpellSortKey[] = ["level-asc", "level-desc", "name-asc", "name-desc"];

export function SpellSortMenu({ value, onChange, className }: SpellSortMenuProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor="spell-sort-menu" className="sr-only">
        Sort spells by
      </label>
      <select
        id="spell-sort-menu"
        value={value}
        onChange={(e) => onChange(e.target.value as SpellSortKey)}
        className="h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {ORDER.map((key) => (
          <option key={key} value={key}>
            {SPELL_SORT_LABELS[key]}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
