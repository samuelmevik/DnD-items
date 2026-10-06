import { useState, useRef, useEffect } from "react";
import {
  Star,
  X,
  ChevronDown,
  Settings,
  Share2,
  Check,
} from "lucide-react";
import { SpellSortKey } from "@/lib/spellFilters";
import { SpellSortMenu } from "./SpellSortMenu";
import type { CustomList } from "@/lib/customLists";
import { cn } from "@/lib/utils";

type SpellResultsHeaderProps = {
  count: number;
  total: number;
  sort: SpellSortKey;
  onSortChange: (sort: SpellSortKey) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  favoriteCount: number;
  activeListName?: string;
  lists?: CustomList[];
  activeListId?: string;
  onSelectActiveList?: (id: string) => void;
  onOpenListManager?: () => void;
  onShareActiveList?: () => void;
};

export function SpellResultsHeader({
  count,
  total,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  favoritesOnly,
  onFavoritesToggle,
  favoriteCount,
  activeListName = "Favorites",
  lists = [],
  activeListId,
  onSelectActiveList,
  onOpenListManager,
  onShareActiveList,
}: SpellResultsHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
        of {total.toLocaleString()} spells
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Custom Lists Selector & Filter */}
        <div className="relative inline-flex items-center rounded-md shadow-xs" ref={menuRef}>
          <button
            type="button"
            role="switch"
            aria-checked={favoritesOnly}
            onClick={onFavoritesToggle}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-l-md border px-3 text-sm transition-colors",
              favoritesOnly
                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-border bg-background text-foreground hover:bg-accent",
            )}
          >
            <Star
              className={cn("h-4 w-4", favoritesOnly && "fill-current")}
              aria-hidden
            />
            <span className="max-w-[130px] truncate sm:max-w-[180px]">
              {activeListName}
            </span>
            {favoriteCount > 0 && (
              <span className="ml-0.5 text-xs text-muted-foreground">
                ({favoriteCount})
              </span>
            )}
          </button>

          {onOpenListManager && (
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Switch or manage lists"
              title="Switch or manage lists"
              className={cn(
                "inline-flex h-9 w-8 items-center justify-center rounded-r-md border-y border-r border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                favoritesOnly && "border-amber-300 dark:border-amber-700/60",
              )}
            >
              <ChevronDown className="size-3.5" />
            </button>
          )}

          {menuOpen && (
            <div className="absolute right-0 top-full z-40 mt-1.5 w-60 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Switch Spell List / Gear Set
              </div>

              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {lists.map((list) => {
                  const isCurrent = list.id === activeListId;
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => {
                        onSelectActiveList?.(list.id);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                        isCurrent
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "hover:bg-accent/60",
                      )}
                    >
                      <span className="truncate pr-2">{list.name}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{list.spellIds.length} spells</span>
                        {isCurrent && (
                          <Check className="size-3.5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 space-y-0.5 border-t border-border pt-1">
                {onShareActiveList && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShareActiveList();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    <Share2 className="size-3.5 text-muted-foreground" />
                    <span>Share "{activeListName}" Link</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenListManager();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  <Settings className="size-3.5 text-muted-foreground" />
                  <span>Manage All Lists...</span>
                </button>
              </div>
            </div>
          )}
        </div>

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
        <SpellSortMenu value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
