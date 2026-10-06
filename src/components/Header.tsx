import { Dices, Sparkles, History, Keyboard, Bot } from "lucide-react";
import { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import SearchBar from "./SearchBar";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/lib/filters";
import type { SpellFilterState } from "@/lib/spellFilters";

export type CatalogTab = "items" | "spells";

type HeaderProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onOpenMobileFilters?: () => void;
  activeFilterCount?: number;
  rightSlot?: ReactNode;
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
  searchPlaceholder?: string;
  onOpenDiceTray?: () => void;
  onOpenRandomLoot?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenHistory?: () => void;
  recentCount?: number;
  onOpenShortcuts?: () => void;
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

const TABS: { key: CatalogTab; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "spells", label: "Spells" },
];

export function Header({
  searchTerm,
  onSearchChange,
  searchInputRef,
  rightSlot,
  activeTab,
  onTabChange,
  searchPlaceholder,
  onOpenDiceTray,
  onOpenRandomLoot,
  onOpenAiAssistant,
  onOpenHistory,
  recentCount,
  onOpenShortcuts,
  onApplySmartFilters,
  onRevertSmartFilters,
  canRevertSmartFilters,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 p-2.5 sm:gap-3.5 sm:p-3 md:p-4">
        {/* Left: Brand title & Segmented Tabs */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex select-none items-center gap-1.5 font-bold tracking-tight text-foreground">
            <span className="text-base font-extrabold text-primary sm:text-lg">D&D</span>
            <span className="hidden text-xs font-semibold text-muted-foreground sm:inline sm:text-sm">Catalog</span>
          </div>

          <div
            role="tablist"
            aria-label="Catalog section"
            className="flex items-center gap-1 rounded-full border border-border bg-background p-1"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 sm:text-sm transition-colors",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Search Bar (Desktop only, moved to MobileBottomBar on mobile) */}
        <div className="mx-2 hidden max-w-xl flex-1 md:block">
          <SearchBar
            inputRef={searchInputRef}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder={searchPlaceholder}
            activeTab={activeTab}
            onApplySmartFilters={onApplySmartFilters}
            onRevertSmartFilters={onRevertSmartFilters}
            canRevertSmartFilters={canRevertSmartFilters}
          />
        </div>

        {/* Right: Quick Tools */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              title="AI Assistant (WebGPU) (Hotkey: J)"
              aria-label="Open AI Assistant"
              className="inline-flex size-9 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-500 transition-colors hover:border-amber-400 hover:bg-amber-500/20 active:scale-95"
            >
              <Bot className="size-4 text-amber-500" />
            </button>
          )}

          {onOpenDiceTray && (
            <button
              type="button"
              onClick={onOpenDiceTray}
              title="Quick Dice Tray (Hotkey: D)"
              aria-label="Open dice tray"
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-amber-500/40 hover:bg-accent"
            >
              <Dices className="size-4 text-amber-500" />
            </button>
          )}

          {onOpenRandomLoot && (
            <button
              type="button"
              onClick={onOpenRandomLoot}
              title={`Roll Random ${activeTab === "items" ? "Loot" : "Spell"} (Hotkey: R)`}
              aria-label="Roll random loot or spell"
              className="hidden size-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-accent sm:inline-flex"
            >
              <Sparkles className="size-4 text-primary" />
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              title="Recently Viewed History (Hotkey: H)"
              aria-label="Recently viewed history"
              className={cn(
                "relative size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                recentCount !== undefined && recentCount > 0
                  ? "inline-flex"
                  : "hidden sm:inline-flex",
              )}
            >
              <History className="size-4" />
              {recentCount !== undefined && recentCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {recentCount > 9 ? "9+" : recentCount}
                </span>
              )}
            </button>
          )}

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts (Hotkey: ?)"
              aria-label="Keyboard shortcuts"
              className="hidden size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
            >
              <Keyboard className="size-4" />
            </button>
          )}

          {rightSlot}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
