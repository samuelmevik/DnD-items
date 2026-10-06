import { Search, Filter, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseCompendiumQuery } from "@/lib/filters/nlpFilterParser";
import { SmartFilterChips } from "./SmartFilterChips";
import type { CatalogTab } from "./Header";
import type { FilterState } from "@/lib/filters";
import type { SpellFilterState } from "@/lib/spellFilters";

type MobileBottomBarProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onOpenFilters: () => void;
  activeFilterCount: number;
  activeTab: CatalogTab;
  searchPlaceholder?: string;
  onApplySmartFilters?: (
    targetTab: CatalogTab,
    itemPatch: Partial<FilterState>,
    spellPatch: Partial<SpellFilterState>,
    residualQuery: string,
    appliedChipLabels: string[],
  ) => void;
  onRevertSmartFilters?: () => void;
  canRevertSmartFilters?: boolean;
};

export function MobileBottomBar({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onOpenFilters,
  activeFilterCount,
  activeTab,
  searchPlaceholder,
  onApplySmartFilters,
  onRevertSmartFilters,
  canRevertSmartFilters,
}: MobileBottomBarProps) {
  const defaultPlaceholder =
    activeTab === "items" ? "Search items…" : "Search spells…";
  const placeholder = searchPlaceholder ?? defaultPlaceholder;

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
  }, [searchTerm]);

  const parsedIntent = useMemo(() => {
    if (!activeTab || !searchTerm || searchTerm.trim().length < 2) return null;
    const res = parseCompendiumQuery(searchTerm, activeTab);
    return res.hasIntents ? res : null;
  }, [searchTerm, activeTab]);

  const showSmartChips = Boolean(
    parsedIntent && !isDismissed && onApplySmartFilters,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Blur active search input when scrolling occurs to dismiss the keyboard cleanly
    const handleScrollOrTouch = () => {
      if (document.activeElement === searchInputRef?.current) {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("scroll", handleScrollOrTouch, { passive: true });
    window.addEventListener("touchmove", handleScrollOrTouch, { passive: true });

    // Track visualViewport changes (software keyboard show/hide on mobile)
    const vv = window.visualViewport;
    if (!vv) {
      return () => {
        window.removeEventListener("scroll", handleScrollOrTouch);
        window.removeEventListener("touchmove", handleScrollOrTouch);
      };
    }

    const handleViewportChange = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleScrollOrTouch);
      window.removeEventListener("touchmove", handleScrollOrTouch);
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, [searchInputRef]);

  return (
    <nav
      aria-label="Mobile search and filters"
      style={{
        transform:
          keyboardOffset > 0
            ? `translate3d(0, -${keyboardOffset}px, 0)`
            : "translate3d(0, 0, 0)",
        WebkitTransform:
          keyboardOffset > 0
            ? `translate3d(0, -${keyboardOffset}px, 0)`
            : "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        paddingBottom: "max(0.65rem, env(safe-area-inset-bottom, 0px))",
      }}
      className={cn(
        "fixed bottom-0 inset-x-0 z-30",
        "border-t border-border bg-background/95 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/85",
        "px-3 pt-2",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]",
        "md:hidden",
        "transform-gpu will-change-transform",
        "touch-manipulation",
      )}
    >
      {/* Floating Smart Filter Preview docked right above mobile bar */}
      {showSmartChips && parsedIntent && onApplySmartFilters && (
        <div className="absolute bottom-full inset-x-3 mb-2 z-50">
          <SmartFilterChips
            parsedIntent={parsedIntent}
            activeTab={activeTab}
            onApply={(targetTab, itemPatch, spellPatch, residualQuery, labels) => {
              onApplySmartFilters(
                targetTab,
                itemPatch,
                spellPatch,
                residualQuery,
                labels,
              );
              setIsDismissed(true);
            }}
            onDismiss={() => setIsDismissed(true)}
            onRevert={onRevertSmartFilters}
            canRevert={canRevertSmartFilters}
          />
        </div>
      )}

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
              if (e.key === "Escape") {
                if (showSmartChips) {
                  e.preventDefault();
                  setIsDismissed(true);
                  return;
                }
                if (searchTerm) {
                  e.preventDefault();
                  onSearchChange("");
                }
              } else if (
                e.key === "Enter" &&
                showSmartChips &&
                parsedIntent &&
                onApplySmartFilters
              ) {
                e.preventDefault();
                onApplySmartFilters(
                  parsedIntent.targetTab ?? activeTab,
                  parsedIntent.itemPatch,
                  parsedIntent.spellPatch,
                  parsedIntent.residualQuery,
                  parsedIntent.chips.map((c) => c.displayValue),
                );
                setIsDismissed(true);
              }
            }}
            aria-label={placeholder}
            className="h-10 w-full rounded-xl border-border bg-card/90 pl-9 pr-8 text-base md:text-sm placeholder:text-muted-foreground/70 shadow-xs focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary"
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
