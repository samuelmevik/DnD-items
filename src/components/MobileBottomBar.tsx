import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CatalogTab } from "./Header";

type MobileBottomBarProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onOpenFilters: () => void;
  activeFilterCount: number;
  activeTab: CatalogTab;
  searchPlaceholder?: string;
};

export function MobileBottomBar({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onOpenFilters,
  activeFilterCount,
  activeTab,
  searchPlaceholder,
}: MobileBottomBarProps) {
  const defaultPlaceholder =
    activeTab === "items" ? "Search items…" : "Search spells…";
  const placeholder = searchPlaceholder ?? defaultPlaceholder;

  return (
    <nav
      aria-label="Mobile search and filters"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {/* Search Input Container */}
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && searchTerm) {
                e.preventDefault();
                onSearchChange("");
              }
            }}
            aria-label={placeholder}
            className="h-10 w-full rounded-xl border-border bg-card/90 pl-9 pr-8 text-sm placeholder:text-muted-foreground/70 shadow-xs focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={
            activeFilterCount > 0
              ? `Filters (${activeFilterCount} active)`
              : "Open filters"
          }
          className={cn(
            "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-colors active:scale-95",
            activeFilterCount > 0
              ? "border-primary/60 bg-primary/10 text-primary hover:bg-primary/15"
              : "border-border bg-card/90 text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Filter
            className={cn("size-4", activeFilterCount > 0 && "text-primary")}
            aria-hidden
          />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
