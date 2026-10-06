import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  X,
  Check,
  ArrowRight,
  RotateCcw,
  Search as SearchIcon,
} from "lucide-react";
import {
  ParsedCompendiumQuery,
  SmartFilterChipData,
  SmartFacetType,
  buildItemFilterPatch,
  buildSpellFilterPatch,
} from "@/lib/filters/nlpFilterParser";
import { FilterState } from "@/lib/filters";
import { SpellFilterState } from "@/lib/spellFilters";
import { CatalogTab } from "@/lib/urlState";
import { cn } from "@/lib/utils";

export interface SmartFilterChipsProps {
  parsedIntent: ParsedCompendiumQuery;
  activeTab: CatalogTab;
  onApply: (
    targetTab: CatalogTab,
    itemPatch: Partial<FilterState>,
    spellPatch: Partial<SpellFilterState>,
    residualQuery: string,
    appliedChipLabels: string[],
  ) => void;
  onDismiss: () => void;
  onRevert?: () => void;
  canRevert?: boolean;
  className?: string;
  isFloating?: boolean;
}

const getFacetBadgeStyles = (facet: SmartFacetType): string => {
  switch (facet) {
    case "rarity":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "category":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "attunement":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "level":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
    case "school":
      return "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300";
    case "class":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "castingTime":
      return "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300";
    case "concentration":
    case "ritual":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "priceMin":
    case "priceMax":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
    default:
      return "border-border bg-muted/60 text-foreground";
  }
};

export function SmartFilterChips({
  parsedIntent,
  activeTab,
  onApply,
  onDismiss,
  onRevert,
  canRevert,
  className,
  isFloating = false,
}: SmartFilterChipsProps) {
  // Track chips dismissed for this specific raw query
  const [dismissedChipIds, setDismissedChipIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Reset dismissed IDs when the raw query changes
  useEffect(() => {
    setDismissedChipIds(new Set());
  }, [parsedIntent.rawQuery]);

  const remainingChips = useMemo(
    () => parsedIntent.chips.filter((c) => !dismissedChipIds.has(c.id)),
    [parsedIntent.chips, dismissedChipIds],
  );

  const effectiveTab: CatalogTab =
    parsedIntent.targetTab && parsedIntent.targetTab !== activeTab
      ? parsedIntent.targetTab
      : activeTab;

  const isCrossTab =
    Boolean(parsedIntent.targetTab) && parsedIntent.targetTab !== activeTab;

  const handleDismissChip = useCallback((id: string) => {
    setDismissedChipIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    if (remainingChips.length === 0) {
      onDismiss();
      return;
    }

    const itemPatch = buildItemFilterPatch(remainingChips);
    const spellPatch = buildSpellFilterPatch(remainingChips);
    const appliedLabels = remainingChips.map((c) => c.displayValue);

    onApply(
      effectiveTab,
      itemPatch,
      spellPatch,
      parsedIntent.residualQuery,
      appliedLabels,
    );
  }, [
    remainingChips,
    effectiveTab,
    parsedIntent.residualQuery,
    onApply,
    onDismiss,
  ]);

  // If all chips dismissed, hide preview
  if (remainingChips.length === 0 && !canRevert) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Smart filter suggestion"
      className={cn(
        "rounded-xl border border-border bg-card/95 p-2.5 text-xs shadow-lg backdrop-blur-md transition-all",
        isFloating &&
          "absolute left-0 right-0 top-full mt-1.5 z-40 max-w-xl animate-in fade-in slide-in-from-top-1",
        className,
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
            <Sparkles className="size-3" />
          </span>
          <span>Smart Filters Detected</span>
          {isCrossTab && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              <ArrowRight className="size-2.5" />
              <span>
                Targets {parsedIntent.targetTab === "spells" ? "Spells" : "Items"}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {canRevert && onRevert && (
            <button
              type="button"
              onClick={onRevert}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Undo last smart filter apply"
            >
              <RotateCcw className="size-2.5" />
              <span>Revert</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss smart filters"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Chip Preview List */}
      <div className="flex flex-wrap items-center gap-1.5 py-1">
        {remainingChips.map((chip: SmartFilterChipData) => {
          const badgeStyle = getFacetBadgeStyles(chip.facet);
          return (
            <span
              key={chip.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-medium transition-colors",
                badgeStyle,
              )}
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => handleDismissChip(chip.id)}
                aria-label={`Dismiss ${chip.label}`}
                className="rounded p-0.5 opacity-70 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              >
                <X className="size-3" />
              </button>
            </span>
          );
        })}

        {/* Residual query indicator if non-empty */}
        {parsedIntent.residualQuery && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-muted-foreground">
            <SearchIcon className="size-3" />
            <span>Search: &ldquo;{parsedIntent.residualQuery}&rdquo;</span>
          </span>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
        <span className="text-[11px] text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↵ Enter</kbd> to apply
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-95"
          >
            <Check className="size-3.5" />
            <span>
              {isCrossTab
                ? `Switch to ${parsedIntent.targetTab === "spells" ? "Spells" : "Items"} & Apply`
                : "Apply Intent"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
