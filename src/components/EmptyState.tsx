import { SearchX } from "lucide-react";

export function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
      <SearchX
        className="size-10 text-muted-foreground"
        aria-hidden
      />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No items match your filters</h3>
        <p className="text-sm text-muted-foreground">
          Try removing a filter or clearing all to see more results.
        </p>
      </div>
      <button
        type="button"
        onClick={onClearFilters}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Clear filters
      </button>
    </div>
  );
}
