import { ChevronDown } from "lucide-react";
import { SortKey, SORT_LABELS } from "@/lib/filters";
import { cn } from "@/lib/utils";

type SortMenuProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
  className?: string;
};

const ORDER: SortKey[] = [
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
  "rarity-asc",
  "rarity-desc",
];

export function SortMenu({ value, onChange, className }: SortMenuProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor="sort-menu" className="sr-only">
        Sort items by
      </label>
      <select
        id="sort-menu"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-9 appearance-none rounded-md border border-border bg-background pl-3 pr-8 text-sm text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {ORDER.map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
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
