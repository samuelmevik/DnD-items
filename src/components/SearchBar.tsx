import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseCompendiumQuery } from "@/lib/filters/nlpFilterParser";
import { SmartFilterChips } from "./SmartFilterChips";
import type { FilterState } from "@/lib/filters";
import type { SpellFilterState } from "@/lib/spellFilters";
import type { CatalogTab } from "@/lib/urlState";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  activeTab?: CatalogTab;
  onApplySmartFilters?: (
    targetTab: CatalogTab,
    itemPatch: Partial<FilterState>,
    spellPatch: Partial<SpellFilterState>,
    residualQuery: string,
    appliedChipLabels: string[],
  ) => void;
  onRevertSmartFilters?: () => void;
  canRevertSmartFilters?: boolean;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  inputRef,
  className,
  placeholder = "Search items by name or description…",
  ariaLabel,
  activeTab,
  onApplySmartFilters,
  onRevertSmartFilters,
  canRevertSmartFilters,
}: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Automatically reset dismissed state whenever search query changes
  useEffect(() => {
    setIsDismissed(false);
  }, [searchTerm]);

  // Click outside to collapse preview dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDismissed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parsedIntent = useMemo(() => {
    if (!activeTab || !searchTerm || searchTerm.trim().length < 2) return null;
    const res = parseCompendiumQuery(searchTerm, activeTab);
    return res.hasIntents ? res : null;
  }, [searchTerm, activeTab]);

  const showSmartChips = Boolean(
    parsedIntent &&
      !isDismissed &&
      onApplySmartFilters &&
      activeTab &&
      (isFocused || true),
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          setIsDismissed(false);
        }}
        onBlur={() => setIsFocused(false)}
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
              parsedIntent.targetTab ?? activeTab ?? "items",
              parsedIntent.itemPatch,
              parsedIntent.spellPatch,
              parsedIntent.residualQuery,
              parsedIntent.chips.map((c) => c.displayValue),
            );
            setIsDismissed(true);
          }
        }}
        aria-label={ariaLabel ?? placeholder}
        className="h-10 w-full px-9"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}

      {showSmartChips && parsedIntent && activeTab && onApplySmartFilters && (
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
          isFloating
        />
      )}
    </div>
  );
}
