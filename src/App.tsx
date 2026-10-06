import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { Check, Scroll, Dices, Sparkles, RotateCcw } from "lucide-react";
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
import { MobileBottomBar } from "./components/MobileBottomBar";
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

import { useRecentHistory } from "./lib/recentHistory";
import { useCompareState } from "./lib/compareState";
import { RecentViewsDrawer } from "./components/RecentViewsDrawer";
import { CompareFloatingBar } from "./components/CompareFloatingBar";
import { CompareDialog } from "./components/CompareDialog";
import { QuickDiceTray } from "./components/QuickDiceTray";
import { RandomLootDialog } from "./components/RandomLootDialog";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
const AiAssistantDialog = lazy(() =>
  import("./components/AiAssistant/AiAssistantDialog").then((m) => ({
    default: m.AiAssistantDialog,
  })),
);

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
    duplicateList,
    renameList,
    deleteList,
    clearList,
    toggleItemInActiveList,
    toggleSpellInActiveList,
    isItemInActiveList,
    isSpellInActiveList,
    toggleItemInList,
    toggleSpellInList,
    removeItemFromList,
    removeSpellFromList,
    isItemInList,
    isSpellInList,
    setItemQuantity,
    importSharedList,
    exportBackupLists,
    importBackupLists,
  } = useCustomLists();

  // Recently viewed history
  const { recentViews, addRecent, clearRecent } = useRecentHistory();

  // Side-by-side comparison state
  const {
    comparedItemIds,
    comparedSpellIds,
    toggleItemCompare,
    toggleSpellCompare,
    isItemCompared,
    isSpellCompared,
    clearItemCompare,
    clearSpellCompare,
    compareModalOpen,
    setCompareModalOpen,
  } = useCompareState();

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
  const [diceTrayOpen, setDiceTrayOpen] = useState(false);
  const [randomLootOpen, setRandomLootOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiAssistantInitialPrompt, setAiAssistantInitialPrompt] = useState<string | null>(null);
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
    if (item) {
      addRecent("item", item.id);
    }
    setDeepLinkedParam(
      "item",
      item
        ? item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : null,
    );
  }, [addRecent]);

  const handleSelectSpell = useCallback((spell: Spell | null) => {
    setSelectedSpell(spell);
    if (spell) {
      addRecent("spell", spell.id);
    }
    setDeepLinkedParam(
      "spell",
      spell
        ? spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : null,
    );
  }, [addRecent]);

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

  const handleClearAiInitialPrompt = useCallback(() => {
    setAiAssistantInitialPrompt(null);
  }, []);

  const handleAskAiAboutItem = useCallback(
    (item: Item) => {
      handleSelectItem(null);
      setAiAssistantInitialPrompt(
        `What are the tactical synergies, rule adjudications, and creative uses for ${item.name}?`,
      );
      setAiAssistantOpen(true);
    },
    [handleSelectItem],
  );

  const handleAskAiAboutSpell = useCallback(
    (spell: Spell) => {
      handleSelectSpell(null);
      setAiAssistantInitialPrompt(
        `What are the tactical synergies, rule adjudications, and creative uses for the spell ${spell.name}?`,
      );
      setAiAssistantOpen(true);
    },
    [handleSelectSpell],
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
    addRecent("spell", spell.id);
    setDeepLinkedParam(
      "spell",
      spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    );
  }, [addRecent]);

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
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

  // Smart filter intent application and 1-click revert snapshot
  const [smartFilterRevertSnapshot, setSmartFilterRevertSnapshot] = useState<{
    tab: CatalogTab;
    itemState: FilterState;
    spellState: SpellFilterState;
    searchTerm: string;
    appliedLabels: string[];
  } | null>(null);

  const handleApplySmartFilters = useCallback(
    (
      targetTab: CatalogTab,
      itemPatch: Partial<FilterState>,
      spellPatch: Partial<SpellFilterState>,
      residualQuery: string,
      appliedChipLabels: string[],
    ) => {
      setSmartFilterRevertSnapshot({
        tab: activeTab,
        itemState: { ...state },
        spellState: { ...spellState },
        searchTerm,
        appliedLabels: appliedChipLabels,
      });

      if (targetTab !== activeTab) {
        handleTabChange(targetTab);
      }

      if (targetTab === "items") {
        updateState({
          ...itemPatch,
          search: residualQuery,
        });
      } else {
        updateSpellState({
          ...spellPatch,
          search: residualQuery,
        });
      }

      showToast(
        `✨ Applied smart filters: ${appliedChipLabels.join(", ")}${
          residualQuery ? ` • Search: "${residualQuery}"` : ""
        }`,
      );
    },
    [
      activeTab,
      state,
      spellState,
      searchTerm,
      handleTabChange,
      updateState,
      updateSpellState,
      showToast,
    ],
  );

  const handleRevertSmartFilters = useCallback(() => {
    if (!smartFilterRevertSnapshot) return;
    const {
      tab: prevTab,
      itemState: prevItem,
      spellState: prevSpell,
      searchTerm: prevSearch,
    } = smartFilterRevertSnapshot;

    if (prevTab !== activeTab) {
      handleTabChange(prevTab);
    }

    if (prevTab === "items") {
      updateState({ ...prevItem, search: prevSearch });
    } else {
      updateSpellState({ ...prevSpell, search: prevSearch });
    }

    setSmartFilterRevertSnapshot(null);
    showToast("Reverted smart filters");
  }, [
    smartFilterRevertSnapshot,
    activeTab,
    handleTabChange,
    updateState,
    updateSpellState,
    showToast,
  ]);

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
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus();
          mobileSearchInputRef.current?.select();
        } else {
          desktopSearchInputRef.current?.focus();
          desktopSearchInputRef.current?.select();
        }
      } else if (e.key === "1") {
        e.preventDefault();
        handleTabChange("items");
      } else if (e.key === "2") {
        e.preventDefault();
        handleTabChange("spells");
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setDiceTrayOpen((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setRandomLootOpen((prev) => !prev);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setListManagerOpen((prev) => !prev);
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setHistoryOpen((prev) => !prev);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCompareModalOpen(true);
      } else if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setAiAssistantOpen((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleTabChange, setCompareModalOpen]);

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
        searchInputRef={desktopSearchInputRef}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenDiceTray={() => setDiceTrayOpen((prev) => !prev)}
        onOpenRandomLoot={() => setRandomLootOpen(true)}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        recentCount={recentViews.length}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        rightSlot={
          <button
            type="button"
            onClick={() => setListManagerOpen(true)}
            title="Manage favorite lists & gear sets (L)"
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
            ? "Search items by name or description… (/)"
            : "Search spells by name or description… (/)"
        }
        onApplySmartFilters={handleApplySmartFilters}
        onRevertSmartFilters={handleRevertSmartFilters}
        canRevertSmartFilters={Boolean(smartFilterRevertSnapshot)}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:flex-row md:p-4 md:pb-6">
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
                onOpenRandomLoot={() => setRandomLootOpen(true)}
              />

              <ActiveFilterChips
                tab="items"
                itemState={state}
                onItemChange={updateState}
                defaultPriceRange={[lowestPrice, highestPrice]}
                onClearAll={handleClearFilters}
                onRevert={handleRevertSmartFilters}
                canRevert={Boolean(smartFilterRevertSnapshot)}
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
                  isCompared={isItemCompared}
                  onToggleCompare={toggleItemCompare}
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
                  isCompared={isItemCompared}
                  onToggleCompare={toggleItemCompare}
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
                onOpenRandomLoot={() => setRandomLootOpen(true)}
              />

              <ActiveFilterChips
                tab="spells"
                spellState={spellState}
                onSpellChange={updateSpellState}
                onClearAll={handleClearFilters}
                onRevert={handleRevertSmartFilters}
                canRevert={Boolean(smartFilterRevertSnapshot)}
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
                  isCompared={isSpellCompared}
                  onToggleCompare={toggleSpellCompare}
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
                  isCompared={isSpellCompared}
                  onToggleCompare={toggleSpellCompare}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Item Details Dialog with List management & comparison */}
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
        isCompared={selectedItem ? isItemCompared(selectedItem.id) : false}
        onToggleCompare={() => {
          if (selectedItem) toggleItemCompare(selectedItem.id);
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
        onAskAi={handleAskAiAboutItem}
      />

      {/* Spell Details Dialog with List management & comparison */}
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
        isCompared={selectedSpell ? isSpellCompared(selectedSpell.id) : false}
        onToggleCompare={() => {
          if (selectedSpell) toggleSpellCompare(selectedSpell.id);
        }}
        lists={lists}
        isItemInList={isItemInList}
        isSpellInList={isSpellInList}
        onToggleItemInList={toggleItemInList}
        onToggleSpellInList={toggleSpellInList}
        onCreateList={createList}
        onRollDice={handleRollDice}
        onToast={showToast}
        onAskAi={handleAskAiAboutSpell}
      />

      {/* Full List Management Dialog */}
      <ListManagerDialog
        open={listManagerOpen}
        onOpenChange={setListManagerOpen}
        lists={lists}
        activeListId={activeListId}
        onSelectActiveList={setActiveListId}
        onCreateList={createList}
        onDuplicateList={duplicateList}
        onRenameList={renameList}
        onDeleteList={deleteList}
        onClearList={clearList}
        onRemoveItemFromList={removeItemFromList}
        onRemoveSpellFromList={removeSpellFromList}
        itemsMap={itemsMap}
        spellsMap={spellsMap}
        activeTab={activeTab}
        onSetItemQuantity={setItemQuantity}
        onExportBackup={exportBackupLists}
        onImportBackup={importBackupLists}
      />

      {/* Floating Compare Tray */}
      <CompareFloatingBar
        activeTab={activeTab}
        comparedItemIds={comparedItemIds}
        comparedSpellIds={comparedSpellIds}
        itemsMap={itemsMap}
        spellsMap={spellsMap}
        onRemoveItem={toggleItemCompare}
        onRemoveSpell={toggleSpellCompare}
        onClear={activeTab === "items" ? clearItemCompare : clearSpellCompare}
        onOpenCompare={() => setCompareModalOpen(true)}
      />

      {/* Side-by-Side Compare Dialog */}
      <CompareDialog
        open={compareModalOpen}
        onOpenChange={setCompareModalOpen}
        activeTab={activeTab}
        comparedItemIds={comparedItemIds}
        comparedSpellIds={comparedSpellIds}
        itemsMap={itemsMap}
        spellsMap={spellsMap}
        onRemoveItem={toggleItemCompare}
        onRemoveSpell={toggleSpellCompare}
        onSelectItem={handleSelectItem}
        onSelectSpell={handleSelectSpell}
        isItemFavorite={isItemInActiveList}
        isSpellFavorite={isSpellInActiveList}
        onToggleItemFavorite={toggleItemInActiveList}
        onToggleSpellFavorite={toggleSpellInActiveList}
        onRollDice={handleRollDice}
      />

      {/* Quick Interactive Dice Roller */}
      <QuickDiceTray
        open={diceTrayOpen}
        onOpenChange={setDiceTrayOpen}
        onRollDice={handleRollDice}
      />

      {/* Random Loot & Spell Roller */}
      <RandomLootDialog
        open={randomLootOpen}
        onOpenChange={setRandomLootOpen}
        activeTab={activeTab}
        filteredItems={filteredItems}
        filteredSpells={filteredSpells}
        allItems={items}
        allSpells={spells}
        onSelectItem={handleSelectItem}
        onSelectSpell={handleSelectSpell}
        onToggleItemFavorite={toggleItemInActiveList}
        onToggleSpellFavorite={toggleSpellInActiveList}
        isItemFavorite={isItemInActiveList}
        isSpellFavorite={isSpellInActiveList}
      />

      {/* Recently Viewed History Drawer */}
      <RecentViewsDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        recentViews={recentViews}
        itemsMap={itemsMap}
        spellsMap={spellsMap}
        onSelectItem={handleSelectItem}
        onSelectSpell={handleSelectSpell}
        onClearRecent={clearRecent}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* WebGPU In-Browser AI Assistant (Lazy loaded on demand) */}
      {aiAssistantOpen && (
        <Suspense fallback={null}>
          <AiAssistantDialog
            open={aiAssistantOpen}
            onOpenChange={(open) => {
              setAiAssistantOpen(open);
              if (!open) {
                setAiAssistantInitialPrompt(null);
              }
            }}
            initialPrompt={aiAssistantInitialPrompt}
            onClearInitialPrompt={handleClearAiInitialPrompt}
            onSelectItem={handleSelectItem}
            onSelectSpell={handleSelectSpell}
            onCreateList={(name, itemIds, spellIds) => {
              const newList = createList(name, itemIds, spellIds);
              setActiveListId(newList.id);
            }}
            onToast={showToast}
          />
        </Suspense>
      )}

      {/* Floating AI Assistant Trigger Pill */}
      <button
        type="button"
        onClick={() => setAiAssistantOpen(true)}
        title="Open WebGPU AI Assistant (Hotkey: J)"
        aria-label="Open AI Assistant"
        className="hover:bg-stone-850 fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3.5 z-30 flex items-center gap-2 rounded-full border border-amber-500/50 bg-stone-900/90 px-3 py-2 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400 active:scale-95 md:bottom-5 md:right-5"
      >
        <Sparkles className="size-3.5 text-amber-400" />
        <span className="hidden sm:inline">AI Assistant</span>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
          WebGPU
        </span>
      </button>

      {/* Mobile Bottom Navigation & Search Bar */}
      <MobileBottomBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchInputRef={mobileSearchInputRef}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        activeFilterCount={filterCount}
        activeTab={activeTab}
        searchPlaceholder={
          activeTab === "items"
            ? "Search items by name or description…"
            : "Search spells by name or description…"
        }
        onApplySmartFilters={handleApplySmartFilters}
        onRevertSmartFilters={handleRevertSmartFilters}
        canRevertSmartFilters={Boolean(smartFilterRevertSnapshot)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-border bg-popover/95 px-4 py-3 text-xs font-semibold text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-3 sm:left-auto sm:right-6 sm:translate-x-0 md:bottom-6"
        >
          {toastMessage.startsWith("🎲") ? (
            <Dices className="size-4 shrink-0 text-amber-500" />
          ) : toastMessage.startsWith("✨") ? (
            <Sparkles className="size-4 shrink-0 text-amber-500" />
          ) : (
            <Check className="size-4 shrink-0 text-green-500" />
          )}
          <span className="truncate">{toastMessage}</span>
          {smartFilterRevertSnapshot && toastMessage.startsWith("✨") && (
            <button
              type="button"
              onClick={handleRevertSmartFilters}
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 active:scale-95 dark:text-amber-400"
            >
              <RotateCcw className="size-3" />
              <span>Undo</span>
            </button>
          )}
        </aside>
      )}
    </div>
  );
}

export default App;
