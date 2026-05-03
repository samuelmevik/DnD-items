import { Star, X } from "lucide-react";
import { SortKey } from "@/lib/filters";
import { SortMenu } from "./SortMenu";
import { cn } from "@/lib/utils";

type ResultsHeaderProps = {
  count: number;
  total: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  favoriteCount: number;
};

export function ResultsHeader({
  count,
  total,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  favoritesOnly,
  onFavoritesToggle,
  favoriteCount,
}: ResultsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-muted-foreground"
      >
        Showing{" "}
        <span className="font-medium text-foreground">
          {count.toLocaleString()}
        </span>{" "}
        of {total.toLocaleString()} items
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={favoritesOnly}
          onClick={onFavoritesToggle}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
            favoritesOnly
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-border bg-background text-foreground hover:bg-accent",
          )}
        >
          <Star
            className={cn("h-4 w-4", favoritesOnly && "fill-current")}
            aria-hidden
          />
          Favorites
          {favoriteCount > 0 && (
            <span className="ml-0.5 text-xs text-muted-foreground">
              ({favoriteCount})
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
        <SortMenu value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
