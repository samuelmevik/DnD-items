import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { highestPrice, Item, items, lowestPrice } from "./data/items";
import {
  activeFilterCount,
  FilterState,
  filterItems,
} from "./lib/filters";
import { useFavorites } from "./lib/favorites";
import { useFilterState } from "./lib/urlState";
import { Header } from "./components/Header";
import FilterSidebar from "./components/FilterSidebar";
import ItemList from "./components/ItemList";
import { ResultsHeader } from "./components/ResultsHeader";
import { EmptyState } from "./components/EmptyState";
import { ItemDetailsDialog } from "./components/ItemDetailsDialog";

const defaultFilterState: FilterState = {
  search: "",
  rarities: [],
  categories: [],
  minPrice: lowestPrice,
  maxPrice: highestPrice,
  favoritesOnly: false,
  sort: "price-asc",
};

function App() {
  const [state, updateState, resetState] = useFilterState(defaultFilterState);
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const deferredState = useDeferredValue(state);

  const filteredItems = useMemo(
    () => filterItems(items, deferredState, favorites),
    [deferredState, favorites],
  );

  const handleSearchChange = useCallback(
    (search: string) => updateState({ search }),
    [updateState],
  );

  const handleClearFilters = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleFavoritesToggle = useCallback(() => {
    updateState({ favoritesOnly: !state.favoritesOnly });
  }, [state.favoritesOnly, updateState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterCount = activeFilterCount(state);
  const hasActiveFilters =
    filterCount > 0 ||
    state.minPrice !== defaultFilterState.minPrice ||
    state.maxPrice !== defaultFilterState.maxPrice;

  const resetKey = useMemo(
    () =>
      [
        deferredState.search,
        deferredState.rarities.join(","),
        deferredState.categories.join(","),
        deferredState.minPrice,
        deferredState.maxPrice,
        deferredState.favoritesOnly,
        deferredState.sort,
        favorites.size,
      ].join("|"),
    [deferredState, favorites.size],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        searchTerm={state.search}
        onSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        activeFilterCount={filterCount}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-4">
        <FilterSidebar
          items={items}
          state={state}
          onChange={updateState}
          favorites={favorites}
          priceBounds={[lowestPrice, highestPrice]}
          mobileOpen={mobileFiltersOpen}
          onMobileOpenChange={setMobileFiltersOpen}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ResultsHeader
            count={filteredItems.length}
            total={items.length}
            sort={state.sort}
            onSortChange={(sort) => updateState({ sort })}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            favoritesOnly={state.favoritesOnly}
            onFavoritesToggle={handleFavoritesToggle}
            favoriteCount={favorites.size}
          />

          {filteredItems.length === 0 ? (
            <div className="min-h-[50vh]">
              <EmptyState onClearFilters={handleClearFilters} />
            </div>
          ) : (
            <ItemList
              items={filteredItems}
              isFavorite={isFavorite}
              onSelect={setSelectedItem}
              onToggleFavorite={toggleFavorite}
              resetKey={resetKey}
            />
          )}
        </div>
      </main>

      <ItemDetailsDialog
        item={selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
        onToggleFavorite={() => {
          if (selectedItem) toggleFavorite(selectedItem.id);
        }}
      />
    </div>
  );
}

export default App;
