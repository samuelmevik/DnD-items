import { Filter } from "lucide-react";
import { ReactNode } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import SearchBar from "./SearchBar";

type HeaderProps = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onOpenMobileFilters: () => void;
  activeFilterCount: number;
  rightSlot?: ReactNode;
};

export function Header({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onOpenMobileFilters,
  activeFilterCount,
  rightSlot,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 p-3 md:gap-4 md:p-4">
        <h1 className="hidden text-lg font-semibold tracking-tight md:block">
          D&D Item Catalog
        </h1>
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
          />
        </div>
        {rightSlot}
        <DarkModeToggle />
      </div>
    </header>
  );
}
