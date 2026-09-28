import { Filter } from "lucide-react";
import { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import SearchBar from "./SearchBar";
import { cn } from "@/lib/utils";

export type CatalogTab = "items" | "spells";

type HeaderProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onOpenMobileFilters: () => void;
  activeFilterCount: number;
  rightSlot?: ReactNode;
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
  searchPlaceholder?: string;
};

const TABS: { key: CatalogTab; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "spells", label: "Spells" },
];

export function Header({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onOpenMobileFilters,
  activeFilterCount,
  rightSlot,
  activeTab,
  onTabChange,
  searchPlaceholder,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 p-3 md:gap-4 md:p-4">
        <h1 className="hidden text-lg font-semibold tracking-tight md:block">
          D&D Catalog
        </h1>

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
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="relative inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent md:hidden"
          aria-label="Open filters"
        >
          <Filter className="size-4" aria-hidden />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex-1">
          <SearchBar
            inputRef={searchInputRef}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
        {rightSlot}
        <DarkModeToggle />
      </div>
    </header>
  );
}
