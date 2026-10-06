import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, Scroll } from "lucide-react";
import { highestPrice, Item, items, lowestPrice } from "./data/items";
import { activeFilterCount, FilterState, filterItems } from "./lib/filters";
import {
  CatalogTab,
  useCatalogUrlState,
  removeSharedParamsFromUrl,
  decodeDeepLinkedItem,
  decodeDeepLinkedSpell,
  setDeepLinkedParam,
} from "./lib/urlState";
import {
  SharedListData,
  copyToClipboard,
  generateMarkdownSummary,
  generateShareUrl,
  parseSharedListFromUrl,
  useCustomLists,
  calculateListGoldTotal,
  calculateListAttunementCount,
} from "./lib/customLists";
import { Header } from "./components/Header";
import FilterSidebar from "./components/FilterSidebar";
import ItemList from "./components/ItemList";
import { ItemTableView } from "./components/ItemTableView";
import { ResultsHeader } from "./components/ResultsHeader";
import { EmptyState } from "./components/EmptyState";
import { ItemDetailsDialog } from "./components/ItemDetailsDialog";
import { SharedListBanner } from "./components/SharedListBanner";
import { ListManagerDialog } from "./components/ListManagerDialog";
import { ActiveFilterChips } from "./components/ActiveFilterChips";
import type { DiceRollResult } from "./lib/diceRoller";

import { Spell, spells } from "./data/spells";
import {
  SpellFilterState,
  activeSpellFilterCount,
  filterSpells,
} from "./lib/spellFilters";
import SpellFilterSidebar from "./components/SpellFilterSidebar";
import SpellList from "./components/SpellList";
import { SpellTableView } from "./components/SpellTableView";
import { SpellResultsHeader } from "./components/SpellResultsHeader";
import { SpellDetailsDialog } from "./components/SpellDetailsDialog";

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
  attunement: "all",
};

const defaultSpellFilterState: SpellFilterState = {
  search: "",
  levels: [],
  schools: [],
  classes: [],
  castingTimes: [],
  ritualOnly: false,
  concentrationOnly: false,
  favoritesOnly: false,
  sort: "level-asc",
};

function App() {
  const {
    activeTab,
    setActiveTab,
    itemState: state,
    updateItemState: updateState,
    resetItemState: resetState,
    spellState,
    updateSpellState,
    resetSpellState,
  } = useCatalogUrlState(defaultFilterState, defaultSpellFilterState);

  // Custom multiple lists system
  const {
    lists,
    activeList,
    activeListId,
    activeItemIds,
    activeSpellIds,
    setActiveListId,
    createList,
    renameList,
    deleteList,
    toggleItemInActiveList,
    toggleSpellInActiveList,
    isItemInActiveList,
    isSpellInActiveList,
    toggleItemInList,
    toggleSpellInList,
    isItemInList,
    isSpellInList,
    setItemQuantity,
    importSharedList,
    exportBackupLists,
    importBackupLists,
  } = useCustomLists();

  // Fast item and spell lookups
  const itemsMap = useMemo(() => new Map(items.map((i) => [i.id, i])), []);
  const spellsMap = useMemo(() => new Map(spells.map((s) => [s.id, s])), []);

  // Shared List via URL link (e.g. DM shared gear set)
  const [sharedList] = useState<SharedListData | null>(() => {
    if (typeof window === "undefined") return null;
    return parseSharedListFromUrl(window.location.search);
  });
  const [sharedListDismissed, setSharedListDismissed] = useState(false);
  const [isSavedShared, setIsSavedShared] = useState(false);
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const isViewingShared = Boolean(sharedList && !sharedListDismissed);

  // Effective favorite sets based on whether viewing a shared list or regular active list
  const effectiveItemFavorites = useMemo(() => {
    if (isViewingShared && sharedList) {
      return new Set(sharedList.itemIds);
    }
    return activeItemIds;
  }, [isViewingShared, sharedList, activeItemIds]);

  const effectiveSpellFavorites = useMemo(() => {
    if (isViewingShared && sharedList) {
      return new Set(sharedList.spellIds);
    }
    return activeSpellIds;
  }, [isViewingShared, sharedList, activeSpellIds]);

  // View mode (grid vs table) with local persistence
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const stored = localStorage.getItem("dnd-view-mode");
    return stored === "table" ? "table" : "grid";
  });

  const handleViewModeChange = useCallback((mode: "grid" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("dnd-view-mode", mode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Deep linking item/spell lookup helpers
  const findItemByParam = useCallback(
    (val: string): Item | null => {
      const norm = val.trim().toLowerCase();
      const byId = Number(norm);
      if (!Number.isNaN(byId) && itemsMap.has(byId)) return itemsMap.get(byId) ?? null;
      return (
        items.find(
          (i) =>
            (i.slug && i.slug.toLowerCase() === norm) ||
            i.name.toLowerCase() === norm ||
            i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === norm,
        ) ?? null
      );
    },
    [itemsMap],
  );

  const findSpellByParam = useCallback(
    (val: string): Spell | null => {
      const norm = val.trim().toLowerCase();
      const byId = Number(norm);
      if (!Number.isNaN(byId) && spellsMap.has(byId)) return spellsMap.get(byId) ?? null;
      return (
        spells.find(
          (s) =>
            (s.index && s.index.toLowerCase() === norm) ||
            s.name.toLowerCase() === norm ||
            s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === norm,
        ) ?? null
      );
    },
    [spellsMap],
  );

  const handleSelectItem = useCallback((item: Item | null) => {
    setSelectedItem(item);
    setDeepLinkedParam(
      "item",
      item
        ? item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : null,
    );
  }, []);

  const handleSelectSpell = useCallback((spell: Spell | null) => {
    setSelectedSpell(spell);
    setDeepLinkedParam(
      "spell",
      spell
        ? spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : null,
    );
  }, []);

  // Deep linking initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    const linkedItemName = decodeDeepLinkedItem(search);
    const linkedSpellName = decodeDeepLinkedSpell(search);

    if (linkedItemName) {
      const item = findItemByParam(linkedItemName);
      if (item) {
        setSelectedItem(item);
        setActiveTab("items");
      }
    } else if (linkedSpellName) {
      const spell = findSpellByParam(linkedSpellName);
      if (spell) {
        setSelectedSpell(spell);
        setActiveTab("spells");
      }
    }
  }, [findItemByParam, findSpellByParam, setActiveTab]);

  // Dice roll toast handler
  const handleRollDice = useCallback(
    (roll: DiceRollResult) => {
      showToast(`🎲 ${roll.expression}: ${roll.breakdown}`);
    },
    [showToast],
  );

  // Active list metrics (gold total & attunement budget)
  const activeListGoldTotal = useMemo(() => {
    const listToCalc = isViewingShared && sharedList ? sharedList : activeList;
    return calculateListGoldTotal(listToCalc, itemsMap);
  }, [isViewingShared, sharedList, activeList, itemsMap]);

  const activeListAttunementCount = useMemo(() => {
    const listToCalc = isViewingShared && sharedList ? sharedList : activeList;
    return calculateListAttunementCount(listToCalc, itemsMap);
  }, [isViewingShared, sharedList, activeList, itemsMap]);

  useEffect(() => {
    document.title =
      activeTab === "items" ? "D&D Magic Items Catalog" : "D&D Spells Catalog";
  }, [activeTab]);

  // Used when a spell name is clicked inside an item's description: close
  // the item dialog and open that spell's dialog instead.
  const handleSelectSpellFromItem = useCallback((spell: Spell) => {
    setSelectedItem(null);
    setSelectedSpell(spell);
    setDeepLinkedParam(
      "spell",
      spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    );
  }, []);

  const handleTabChange = useCallback(
    (tab: CatalogTab) => {
      setActiveTab(tab);
      if (tab === "items") {
        setSelectedSpell(null);
        setDeepLinkedParam("spell", null);
      } else {
        setSelectedItem(null);
        setDeepLinkedParam("item", null);
      }
    },
    [setActiveTab],
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // If a shared list is active, we constrain items/spells to the shared list by default
  const effectiveItemState = useMemo(() => {
    if (isViewingShared && sharedList) {
      return { ...state, favoritesOnly: true };
    }
    return state;
  }, [isViewingShared, sharedList, state]);

  const effectiveSpellState = useMemo(() => {
    if (isViewingShared && sharedList) {
      return { ...spellState, favoritesOnly: true };
    }
    return spellState;
  }, [isViewingShared, sharedList, spellState]);

  const deferredState = useDeferredValue(effectiveItemState);
  const deferredSpellState = useDeferredValue(effectiveSpellState);

  const filteredItems = useMemo(
    () => filterItems(items, deferredState, effectiveItemFavorites),
    [deferredState, effectiveItemFavorites],
  );

  const filteredSpells = useMemo(
    () => filterSpells(spells, deferredSpellState, effectiveSpellFavorites),
    [deferredSpellState, effectiveSpellFavorites],
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
    if (isViewingShared) {
      // If viewing shared, dismissing or toggling returns to all items
      setSharedListDismissed(true);
      removeSharedParamsFromUrl();
      if (activeTab === "items") {
        updateState({ favoritesOnly: false });
      } else {
        updateSpellState({ favoritesOnly: false });
      }
      return;
    }
    if (activeTab === "items") {
      updateState({ favoritesOnly: !state.favoritesOnly });
    } else {
      updateSpellState({ favoritesOnly: !spellState.favoritesOnly });
    }
  }, [
    isViewingShared,
    activeTab,
    state.favoritesOnly,
    spellState.favoritesOnly,
    updateState,
    updateSpellState,
  ]);

  // Shared List Actions
  const handleSaveSharedList = useCallback(() => {
    if (!sharedList) return;
    const imported = importSharedList(
      sharedList.name,
      sharedList.itemIds,
      sharedList.spellIds,
      sharedList.quantities,
    );
    setIsSavedShared(true);
    setSharedListDismissed(true);
    removeSharedParamsFromUrl();
    if (activeTab === "items") {
      updateState({ favoritesOnly: true });
    } else {
      updateSpellState({ favoritesOnly: true });
    }
    showToast(`Saved "${imported.name}" to your lists!`);
  }, [
    sharedList,
    importSharedList,
    activeTab,
    updateState,
    updateSpellState,
    showToast,
  ]);

  const handleDismissShared = useCallback(() => {
    setSharedListDismissed(true);
    removeSharedParamsFromUrl();
    if (activeTab === "items") {
      updateState({ favoritesOnly: false });
    } else {
      updateSpellState({ favoritesOnly: false });
    }
    showToast("Viewing all items");
  }, [activeTab, updateState, updateSpellState, showToast]);

  const handleCopySharedLink = useCallback(async () => {
    if (!sharedList) return;
    const url = generateShareUrl(sharedList, activeTab);
    const ok = await copyToClipboard(url);
    if (ok) {
      showToast("Link copied to clipboard!");
    }
  }, [sharedList, activeTab, showToast]);

  const handleCopySharedMarkdown = useCallback(async () => {
    if (!sharedList) return;
    const url = generateShareUrl(sharedList, activeTab);
    const md = generateMarkdownSummary(sharedList, itemsMap, spellsMap, url);
    const ok = await copyToClipboard(md);
    if (ok) {
      showToast("Discord markdown copied to clipboard!");
    }
  }, [sharedList, activeTab, itemsMap, spellsMap, showToast]);

  const handleShareActiveList = useCallback(async () => {
    const url = generateShareUrl(activeList, activeTab);
    const ok = await copyToClipboard(url);
    if (ok) {
      showToast(`Share link for "${activeList.name}" copied!`);
    }
  }, [activeList, activeTab, showToast]);

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
        deferredState.attunement,
        deferredState.minPrice,
        deferredState.maxPrice,
        deferredState.favoritesOnly,
        deferredState.sort,
        effectiveItemFavorites.size,
      ].join("|"),
    [deferredState, effectiveItemFavorites.size],
  );

  const spellResetKey = useMemo(
    () =>
      [
        deferredSpellState.search,
        deferredSpellState.levels.join(","),
        deferredSpellState.schools.join(","),
        deferredSpellState.classes.join(","),
        deferredSpellState.castingTimes.join(","),
        deferredSpellState.ritualOnly,
        deferredSpellState.concentrationOnly,
        deferredSpellState.favoritesOnly,
        deferredSpellState.sort,
        effectiveSpellFavorites.size,
      ].join("|"),
    [deferredSpellState, effectiveSpellFavorites.size],
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
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-background/90" />

      <Header
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        activeFilterCount={filterCount}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        rightSlot={
          <button
            type="button"
            onClick={() => setListManagerOpen(true)}
            title="Manage favorite lists & gear sets"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Scroll className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Lists</span>
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {lists.length}
            </span>
          </button>
        }
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
            favorites={effectiveItemFavorites}
            priceBounds={[lowestPrice, highestPrice]}
            mobileOpen={mobileFiltersOpen}
            onMobileOpenChange={setMobileFiltersOpen}
          />
        ) : (
          <SpellFilterSidebar
            spells={spells}
            state={spellState}
            onChange={updateSpellState}
            favorites={effectiveSpellFavorites}
            mobileOpen={mobileFiltersOpen}
            onMobileOpenChange={setMobileFiltersOpen}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Shared List Banner if viewing from a shared link */}
          {isViewingShared && sharedList && (
            <SharedListBanner
              sharedList={sharedList}
              itemsMap={itemsMap}
              onSaveToLists={handleSaveSharedList}
              onDismiss={handleDismissShared}
              onCopyShareLink={handleCopySharedLink}
              onCopyMarkdown={handleCopySharedMarkdown}
              isSaved={isSavedShared}
            />
          )}

          {activeTab === "items" ? (
            <>
              <ResultsHeader
                count={filteredItems.length}
                total={items.length}
                sort={state.sort}
                onSortChange={(sort) => updateState({ sort })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                favoritesOnly={isViewingShared ? true : state.favoritesOnly}
                onFavoritesToggle={handleFavoritesToggle}
                favoriteCount={effectiveItemFavorites.size}
                activeListName={
                  isViewingShared && sharedList
                    ? sharedList.name
                    : activeList.name
                }
                lists={lists}
                activeListId={activeListId}
                onSelectActiveList={setActiveListId}
                onOpenListManager={() => setListManagerOpen(true)}
                onShareActiveList={handleShareActiveList}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                totalGold={
                  isViewingShared || state.favoritesOnly
                    ? activeListGoldTotal
                    : undefined
                }
                attunementCount={
                  isViewingShared || state.favoritesOnly
                    ? activeListAttunementCount
                    : undefined
                }
              />

              <ActiveFilterChips
                tab="items"
                itemState={state}
                onItemChange={updateState}
                defaultPriceRange={[lowestPrice, highestPrice]}
                onClearAll={handleClearFilters}
              />

              {filteredItems.length === 0 ? (
                <div className="min-h-[50vh]">
                  <EmptyState onClearFilters={handleClearFilters} tab="items" />
                </div>
              ) : viewMode === "grid" ? (
                <ItemList
                  items={filteredItems}
                  isFavorite={
                    isViewingShared
                      ? (id: number) => effectiveItemFavorites.has(id)
                      : isItemInActiveList
                  }
                  onSelect={handleSelectItem}
                  onToggleFavorite={toggleItemInActiveList}
                  resetKey={resetKey}
                />
              ) : (
                <ItemTableView
                  items={filteredItems}
                  isFavorite={
                    isViewingShared
                      ? (id: number) => effectiveItemFavorites.has(id)
                      : isItemInActiveList
                  }
                  onSelect={handleSelectItem}
                  onToggleFavorite={toggleItemInActiveList}
                  resetKey={resetKey}
                />
              )}
            </>
          ) : (
            <>
              <SpellResultsHeader
                count={filteredSpells.length}
                total={spells.length}
                sort={spellState.sort}
                onSortChange={(sort) => updateSpellState({ sort })}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                favoritesOnly={isViewingShared ? true : spellState.favoritesOnly}
                onFavoritesToggle={handleFavoritesToggle}
                favoriteCount={effectiveSpellFavorites.size}
                activeListName={
                  isViewingShared && sharedList
                    ? sharedList.name
                    : activeList.name
                }
                lists={lists}
                activeListId={activeListId}
                onSelectActiveList={setActiveListId}
                onOpenListManager={() => setListManagerOpen(true)}
                onShareActiveList={handleShareActiveList}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />

              <ActiveFilterChips
                tab="spells"
                spellState={spellState}
                onSpellChange={updateSpellState}
                onClearAll={handleClearFilters}
              />

              {filteredSpells.length === 0 ? (
                <div className="min-h-[50vh]">
                  <EmptyState onClearFilters={handleClearFilters} tab="spells" />
                </div>
              ) : viewMode === "grid" ? (
                <SpellList
                  spells={filteredSpells}
                  isFavorite={
                    isViewingShared
                      ? (id: number) => effectiveSpellFavorites.has(id)
                      : isSpellInActiveList
                  }
                  onSelect={handleSelectSpell}
                  onToggleFavorite={toggleSpellInActiveList}
                  resetKey={spellResetKey}
                />
              ) : (
                <SpellTableView
                  spells={filteredSpells}
                  isFavorite={
                    isViewingShared
                      ? (id: number) => effectiveSpellFavorites.has(id)
                      : isSpellInActiveList
                  }
                  onSelect={handleSelectSpell}
                  onToggleFavorite={toggleSpellInActiveList}
                  resetKey={spellResetKey}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Item Details Dialog with List management */}
      <ItemDetailsDialog
        item={selectedItem}
        onOpenChange={(open) => !open && handleSelectItem(null)}
        isFavorite={
          selectedItem
            ? isViewingShared
              ? effectiveItemFavorites.has(selectedItem.id)
              : isItemInActiveList(selectedItem.id)
            : false
        }
        onToggleFavorite={() => {
          if (selectedItem) toggleItemInActiveList(selectedItem.id);
        }}
        spells={spells}
        onSelectSpell={handleSelectSpellFromItem}
        lists={lists}
        isItemInList={isItemInList}
        isSpellInList={isSpellInList}
        onToggleItemInList={toggleItemInList}
        onToggleSpellInList={toggleSpellInList}
        onCreateList={createList}
        onRollDice={handleRollDice}
        onToast={showToast}
      />

      {/* Spell Details Dialog with List management */}
      <SpellDetailsDialog
        spell={selectedSpell}
        onOpenChange={(open) => !open && handleSelectSpell(null)}
        isFavorite={
          selectedSpell
            ? isViewingShared
              ? effectiveSpellFavorites.has(selectedSpell.id)
              : isSpellInActiveList(selectedSpell.id)
            : false
        }
        onToggleFavorite={() => {
          if (selectedSpell) toggleSpellInActiveList(selectedSpell.id);
        }}
        lists={lists}
        isItemInList={isItemInList}
        isSpellInList={isSpellInList}
        onToggleItemInList={toggleItemInList}
        onToggleSpellInList={toggleSpellInList}
        onCreateList={createList}
        onRollDice={handleRollDice}
        onToast={showToast}
      />

      {/* Full List Management Dialog */}
      <ListManagerDialog
        open={listManagerOpen}
        onOpenChange={setListManagerOpen}
        lists={lists}
        activeListId={activeListId}
        onSelectActiveList={setActiveListId}
        onCreateList={createList}
        onRenameList={renameList}
        onDeleteList={deleteList}
        itemsMap={itemsMap}
        spellsMap={spellsMap}
        activeTab={activeTab}
        onSetItemQuantity={setItemQuantity}
        onExportBackup={exportBackupLists}
        onImportBackup={importBackupLists}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-border bg-popover px-4 py-2.5 text-xs font-semibold text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <Check className="size-4 text-green-500" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}

export default App;
