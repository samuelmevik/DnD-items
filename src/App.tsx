import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { highestPrice, Item, items, lowestPrice } from "./data/items";
import { activeFilterCount, FilterState, filterItems } from "./lib/filters";
import { useFavorites } from "./lib/favorites";
import { useFilterState } from "./lib/urlState";
import { Header, CatalogTab } from "./components/Header";
import FilterSidebar from "./components/FilterSidebar";
import ItemList from "./components/ItemList";
import { ResultsHeader } from "./components/ResultsHeader";
import { EmptyState } from "./components/EmptyState";
import { ItemDetailsDialog } from "./components/ItemDetailsDialog";

import { Spell, useSpells } from "./lib/spellsApi";
import {
  SpellFilterState,
  activeSpellFilterCount,
  filterSpells,
} from "./lib/spellFilters";
import { useSpellFavorites } from "./lib/spellFavorites";
import SpellFilterSidebar from "./components/SpellFilterSidebar";
import SpellList from "./components/SpellList";
import { SpellResultsHeader } from "./components/SpellResultsHeader";
import { SpellDetailsDialog } from "./components/SpellDetailsDialog";
import { Spinner } from "./components/Spinner";

// Bundled background images — Vite resolves these to hashed URLs at build
// time, so they ship with the site for every visitor. Replace these two
// files in src/assets/ with your own art (any image format works).
import itemsBackground from "./assets/items-background.jpg";
import spellsBackground from "./assets/spells-background.jpg";

const defaultFilterState: FilterState = {
  search: "",
  rarities: [],
  categories: [],
  minPrice: lowestPrice,
  maxPrice: highestPrice,
  favoritesOnly: false,
  sort: "price-asc",
};

const defaultSpellFilterState: SpellFilterState = {
  search: "",
  levels: [],
  schools: [],
  classes: [],
  ritualOnly: false,
  concentrationOnly: false,
  favoritesOnly: false,
  sort: "level-asc",
};

function App() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("items");

  // ---- Items state (unchanged from before) ----
  const [state, updateState, resetState] = useFilterState(defaultFilterState);
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // ---- Spells state ----
  const [spellState, setSpellState] = useState<SpellFilterState>(
    defaultSpellFilterState,
  );
  const updateSpellState = useCallback(
    (patch: Partial<SpellFilterState>) =>
      setSpellState((s) => ({ ...s, ...patch })),
    [],
  );
  const resetSpellState = useCallback(
    () => setSpellState(defaultSpellFilterState),
    [],
  );
  const {
    spells,
    status: spellsStatus,
    progress: spellsProgress,
    error: spellsError,
  } = useSpells();
  const {
    favorites: spellFavorites,
    toggle: toggleSpellFavorite,
    isFavorite: isSpellFavorite,
  } = useSpellFavorites();
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Used when a spell name is clicked inside an item's description: close
  // the item dialog and open that spell's dialog instead.
  const handleSelectSpellFromItem = useCallback((spell: Spell) => {
    setSelectedItem(null);
    setSelectedSpell(spell);
  }, []);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const deferredState = useDeferredValue(state);
  const deferredSpellState = useDeferredValue(spellState);

  const filteredItems = useMemo(
    () => filterItems(items, deferredState, favorites),
    [deferredState, favorites],
  );

  const filteredSpells = useMemo(
    () => filterSpells(spells, deferredSpellState, spellFavorites),
    [spells, deferredSpellState, spellFavorites],
  );

  const searchTerm = activeTab === "items" ? state.search : spellState.search;

  const handleSearchChange = useCallback(
    (search: string) => {
      if (activeTab === "items") updateState({ search });
      else updateSpellState({ search });
    },
    [activeTab, updateState, updateSpellState],
  );

  const handleClearFilters = useCallback(() => {
    if (activeTab === "items") resetState();
    else resetSpellState();
  }, [activeTab, resetState, resetSpellState]);

  const handleFavoritesToggle = useCallback(() => {
    if (activeTab === "items") {
      updateState({ favoritesOnly: !state.favoritesOnly });
    } else {
      updateSpellState({ favoritesOnly: !spellState.favoritesOnly });
    }
  }, [
    activeTab,
    state.favoritesOnly,
    spellState.favoritesOnly,
    updateState,
    updateSpellState,
  ]);

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

  const itemFilterCount = activeFilterCount(state);
  const spellFilterCount = activeSpellFilterCount(spellState);
  const filterCount = activeTab === "items" ? itemFilterCount : spellFilterCount;

  const hasActiveItemFilters =
    itemFilterCount > 0 ||
    state.minPrice !== defaultFilterState.minPrice ||
    state.maxPrice !== defaultFilterState.maxPrice;
  const hasActiveSpellFilters = spellFilterCount > 0;
  const hasActiveFilters =
    activeTab === "items" ? hasActiveItemFilters : hasActiveSpellFilters;

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

  const spellResetKey = useMemo(
    () =>
      [
        deferredSpellState.search,
        deferredSpellState.levels.join(","),
        deferredSpellState.schools.join(","),
        deferredSpellState.classes.join(","),
        deferredSpellState.ritualOnly,
        deferredSpellState.concentrationOnly,
        deferredSpellState.favoritesOnly,
        deferredSpellState.sort,
        spellFavorites.size,
      ].join("|"),
    [deferredSpellState, spellFavorites.size],
  );

  return (
    <div className="relative min-h-screen text-foreground">
      {/* Background image, swapped per tab. Fixed so it doesn't scroll with content. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-[background-image] duration-300"
        style={{
          backgroundImage: `url(${activeTab === "items" ? itemsBackground : spellsBackground})`,
        }}
      />
      {/* Tints the image so cards/text stay readable in both light and dark mode */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-background/60" />

      <Header
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        activeFilterCount={filterCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder={
          activeTab === "items"
            ? "Search items by name or description…"
            : "Search spells by name or description…"
        }
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-4">
        {activeTab === "items" ? (
          <FilterSidebar
            items={items}
            state={state}
            onChange={updateState}
            favorites={favorites}
            priceBounds={[lowestPrice, highestPrice]}
            mobileOpen={mobileFiltersOpen}
            onMobileOpenChange={setMobileFiltersOpen}
          />
        ) : (
          <SpellFilterSidebar
            spells={spells}
            state={spellState}
            onChange={updateSpellState}
            favorites={spellFavorites}
            mobileOpen={mobileFiltersOpen}
            onMobileOpenChange={setMobileFiltersOpen}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {activeTab === "items" ? (
            <>
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
            </>
          ) : spellsStatus === "loading" && spells.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              <p>
                Loading spells from the D&D 5e API…
                {spellsProgress.total > 0
                  ? ` (${spellsProgress.loaded}/${spellsProgress.total})`
                  : ""}
              </p>
              <p className="max-w-xs text-center text-xs">
                This only happens once per browser — spells are cached locally
                after the first load.
              </p>
            </div>
          ) : spellsStatus === "error" ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <p>Couldn't load spells{spellsError ? `: ${spellsError}` : "."}</p>
            </div>
          ) : (
            <>
              <SpellResultsHeader
                count={filteredSpells.length}
                total={spells.length}
                sort={spellState.sort}
                onSortChange={(sort) => updateSpellState({ sort })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                favoritesOnly={spellState.favoritesOnly}
                onFavoritesToggle={handleFavoritesToggle}
                favoriteCount={spellFavorites.size}
              />

              {filteredSpells.length === 0 ? (
                <div className="min-h-[50vh]">
                  <EmptyState onClearFilters={handleClearFilters} />
                </div>
              ) : (
                <SpellList
                  spells={filteredSpells}
                  isFavorite={isSpellFavorite}
                  onSelect={setSelectedSpell}
                  onToggleFavorite={toggleSpellFavorite}
                  resetKey={spellResetKey}
                />
              )}
            </>
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
        spells={spells}
        onSelectSpell={handleSelectSpellFromItem}
      />

      <SpellDetailsDialog
        spell={selectedSpell}
        onOpenChange={(open) => !open && setSelectedSpell(null)}
        isFavorite={selectedSpell ? isSpellFavorite(selectedSpell.id) : false}
        onToggleFavorite={() => {
          if (selectedSpell) toggleSpellFavorite(selectedSpell.id);
        }}
      />
    </div>
  );
}

export default App;
