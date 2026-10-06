import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";
import { itemRequiresAttunement, isRarity } from "./filters";

export type CustomList = {
  id: string;
  name: string;
  itemIds: number[];
  spellIds: number[];
  quantities?: Record<number, number>;
  createdAt: number;
  updatedAt: number;
};

export type SharedListData = {
  name: string;
  itemIds: number[];
  spellIds: number[];
  quantities?: Record<number, number>;
};

const LISTS_STORAGE_KEY = "dnd-items.custom-lists.v1";
const ACTIVE_LIST_ID_KEY = "dnd-items.active-list-id.v1";
const LEGACY_ITEM_FAVS_KEY = "dnd-items.favorites";
const LEGACY_SPELL_FAVS_KEY = "spell-favorites";

export const DEFAULT_LIST_ID = "default";

function readLegacyNumbers(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((n): n is number => typeof n === "number");
    }
  } catch {
    // ignore
  }
  return [];
}

function readListsFromStorage(): CustomList[] {
  if (typeof window === "undefined") {
    return [
      {
        id: DEFAULT_LIST_ID,
        name: "Favorites",
        itemIds: [],
        spellIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  try {
    const raw = window.localStorage.getItem(LISTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: Partial<CustomList>, index: number) => ({
          id: item.id || `list_${index}_${Date.now()}`,
          name: item.name?.trim() || "Untitled List",
          itemIds: Array.isArray(item.itemIds)
            ? Array.from(new Set(item.itemIds.filter((n): n is number => typeof n === "number")))
            : [],
          spellIds: Array.isArray(item.spellIds)
            ? Array.from(new Set(item.spellIds.filter((n): n is number => typeof n === "number")))
            : [],
          quantities: item.quantities && typeof item.quantities === "object" ? item.quantities : {},
          createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
        }));
      }
    }
  } catch {
    // ignore parse error
  }

  // Fallback: migrate legacy single-list favorites
  const legacyItemIds = readLegacyNumbers(LEGACY_ITEM_FAVS_KEY);
  const legacySpellIds = readLegacyNumbers(LEGACY_SPELL_FAVS_KEY);

  const initialList: CustomList = {
    id: DEFAULT_LIST_ID,
    name: "Favorites",
    itemIds: Array.from(new Set(legacyItemIds)),
    spellIds: Array.from(new Set(legacySpellIds)),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return [initialList];
}

function readActiveListIdFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_LIST_ID;
  try {
    const raw = window.localStorage.getItem(ACTIVE_LIST_ID_KEY);
    return raw || DEFAULT_LIST_ID;
  } catch {
    return DEFAULT_LIST_ID;
  }
}

function writeListsToStorage(lists: CustomList[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // ignore quota/privacy errors
  }
}

function writeActiveListIdToStorage(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_LIST_ID_KEY, id);
  } catch {
    // ignore quota/privacy errors
  }
}

export function parseSharedListFromUrl(search: string): SharedListData | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const name =
    params.get("sharedList") ||
    params.get("listName") ||
    params.get("list");
  const itemsRaw = params.get("items") || params.get("itemIds");
  const spellsRaw = params.get("spells") || params.get("spellIds");
  const quantitiesRaw = params.get("qty") || params.get("quantities");

  if (!name && !itemsRaw && !spellsRaw) return null;

  const itemIds = itemsRaw
    ? itemsRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];

  const spellIds = spellsRaw
    ? spellsRaw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];

  if (itemIds.length === 0 && spellIds.length === 0 && !name) {
    return null;
  }

  const quantities: Record<number, number> = {};
  if (quantitiesRaw) {
    for (const pair of quantitiesRaw.split(",")) {
      const [idStr, qStr] = pair.split(":");
      const id = Number(idStr?.trim());
      const q = Number(qStr?.trim());
      if (Number.isInteger(id) && id > 0 && Number.isInteger(q) && q > 0) {
        quantities[id] = q;
      }
    }
  }

  return {
    name: name ? name.trim() : "Shared Gear Set",
    itemIds: Array.from(new Set(itemIds)),
    spellIds: Array.from(new Set(spellIds)),
    quantities: Object.keys(quantities).length > 0 ? quantities : undefined,
  };
}

export function generateShareUrl(
  list: {
    name: string;
    itemIds: number[];
    spellIds: number[];
    quantities?: Record<number, number>;
  },
  tab: "items" | "spells" = "items",
): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("tab", tab);
  url.searchParams.set("sharedList", list.name);
  if (list.itemIds.length > 0) {
    url.searchParams.set("items", list.itemIds.join(","));
  }
  if (list.spellIds.length > 0) {
    url.searchParams.set("spells", list.spellIds.join(","));
  }
  if (list.quantities && Object.keys(list.quantities).length > 0) {
    const qtyParts = Object.entries(list.quantities)
      .filter(([id, q]) => list.itemIds.includes(Number(id)) && q > 1)
      .map(([id, q]) => `${id}:${q}`);
    if (qtyParts.length > 0) {
      url.searchParams.set("qty", qtyParts.join(","));
    }
  }
  return url.toString();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

export function calculateListGoldTotal(
  list: { itemIds: number[]; quantities?: Record<number, number> },
  itemsMap: Map<number, Item>,
): number {
  return list.itemIds.reduce((sum, id) => {
    const item = itemsMap.get(id);
    const qty = Math.max(1, list.quantities?.[id] ?? 1);
    return sum + (item ? item.price * qty : 0);
  }, 0);
}

export function calculateListAttunementCount(
  list: { itemIds: number[] },
  itemsMap: Map<number, Item>,
): number {
  return list.itemIds.reduce((sum, id) => {
    const item = itemsMap.get(id);
    if (!item) return sum;
    return sum + (itemRequiresAttunement(item) ? 1 : 0);
  }, 0);
}

export function generateMarkdownSummary(
  list: { name: string; itemIds: number[]; spellIds: number[]; quantities?: Record<number, number> },
  itemsMap: Map<number, Item>,
  spellsMap: Map<number, Spell>,
  shareUrl?: string,
): string {
  const lines: string[] = [];
  lines.push(`⚔️ **${list.name}**`);
  lines.push(`*D&D 5e Custom Gear & Spell Collection*`);

  const totalGold = calculateListGoldTotal(list, itemsMap);
  const attuneCount = calculateListAttunementCount(list, itemsMap);

  const summaryParts: string[] = [];
  if (list.itemIds.length > 0) {
    summaryParts.push(`💰 Total Value: ${totalGold.toLocaleString()} gp`);
    summaryParts.push(
      `🔮 Attunement: ${attuneCount} / 3 slots${attuneCount > 3 ? " (⚠️ exceeds limit)" : ""}`,
    );
  }
  if (summaryParts.length > 0) {
    lines.push(`_${summaryParts.join(" · ")}_`);
  }
  lines.push("");

  if (list.itemIds.length > 0) {
    lines.push(`**Magic Items (${list.itemIds.length}):**`);
    for (const id of list.itemIds) {
      const item = itemsMap.get(id);
      if (item) {
        const rarity =
          item.tags.find((t) =>
            [
              "Common",
              "Uncommon",
              "Rare",
              "Very Rare",
              "Legendary",
              "Artifact",
            ].includes(t),
          ) || "";
        const qty = list.quantities?.[id] ?? 1;
        const qtyStr = qty > 1 ? ` (×${qty})` : "";
        const itemTotal = item.price * qty;
        const priceStr = `${itemTotal.toLocaleString()} gp${qty > 1 ? ` (${item.price.toLocaleString()} gp ea)` : ""}`;
        const attunementStr = itemRequiresAttunement(item)
          ? " · Requires Attunement"
          : "";
        lines.push(
          `• **${item.name}**${qtyStr} (${rarity}${attunementStr}) — ${priceStr}${
            item.synopsis ? `\n  _${item.synopsis}_` : ""
          }`,
        );
      }
    }
    lines.push("");
  }

  if (list.spellIds.length > 0) {
    lines.push(`**Spells (${list.spellIds.length}):**`);
    for (const id of list.spellIds) {
      const spell = spellsMap.get(id);
      if (spell) {
        const levelStr = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
        const traits = [
          levelStr,
          spell.school,
          spell.castingTime,
          spell.ritual ? "Ritual" : null,
          spell.concentration ? "Concentration" : null,
        ]
          .filter(Boolean)
          .join(" · ");
        lines.push(`• **${spell.name}** (${traits})`);
      }
    }
    lines.push("");
  }

  if (shareUrl) {
    lines.push(`🔗 *View interactive list online:*`);
    lines.push(shareUrl);
  }

  return lines.join("\n");
}

export function generateCsvSummary(
  list: { name: string; itemIds: number[]; spellIds: number[]; quantities?: Record<number, number> },
  itemsMap: Map<number, Item>,
  spellsMap: Map<number, Spell>,
): string {
  const rows: string[][] = [
    ["Type", "Name", "Details", "Quantity", "Price (gp)", "Total (gp)"],
  ];
  for (const id of list.itemIds) {
    const item = itemsMap.get(id);
    if (item) {
      const qty = list.quantities?.[id] ?? 1;
      const rarity = item.tags.find(isRarity) || "";
      const attune = itemRequiresAttunement(item) ? "Requires Attunement" : "No Attunement";
      rows.push([
        "Item",
        `"${item.name.replace(/"/g, '""')}"`,
        `"${[rarity, attune].filter(Boolean).join(" · ")}"`,
        String(qty),
        String(item.price),
        String(item.price * qty),
      ]);
    }
  }
  for (const id of list.spellIds) {
    const spell = spellsMap.get(id);
    if (spell) {
      const levelStr = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
      rows.push([
        "Spell",
        `"${spell.name.replace(/"/g, '""')}"`,
        `"${[levelStr, spell.school, spell.castingTime].filter(Boolean).join(" · ")}"`,
        "1",
        "0",
        "0",
      ]);
    }
  }
  return rows.map((r) => r.join(",")).join("\n");
}

export function generateSingleItemMarkdown(
  item: Item,
  shareUrl?: string,
): string {
  const lines: string[] = [];
  const rarity =
    item.tags.find((t) =>
      [
        "Common",
        "Uncommon",
        "Rare",
        "Very Rare",
        "Legendary",
        "Artifact",
      ].includes(t),
    ) || "";
  const attune = itemRequiresAttunement(item) ? " · Requires Attunement" : "";
  lines.push(
    `⚔️ **${item.name}** (${rarity}${attune}) — ${item.price.toLocaleString()} gp`,
  );
  if (item.synopsis) {
    lines.push(`_${item.synopsis}_`);
  }
  lines.push("");
  for (const p of item.description) {
    lines.push(p);
  }
  if (shareUrl) {
    lines.push("");
    lines.push(`🔗 *View in Catalog:* ${shareUrl}`);
  }
  return lines.join("\n");
}

export function generateSingleSpellMarkdown(
  spell: Spell,
  shareUrl?: string,
): string {
  const lines: string[] = [];
  const levelStr = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
  lines.push(`✨ **${spell.name}**`);
  lines.push(`*${levelStr} · ${spell.school}*`);
  lines.push(`• **Casting Time:** ${spell.castingTime}`);
  lines.push(`• **Range:** ${spell.range}`);
  lines.push(`• **Duration:** ${spell.duration}`);
  lines.push(`• **Components:** ${spell.components.join(", ")}`);
  lines.push(`• **Classes:** ${spell.classes.join(", ")}`);
  if (spell.ritual) lines.push(`• **Ritual:** Yes`);
  if (spell.concentration) lines.push(`• **Concentration:** Yes`);
  lines.push("");
  for (const p of spell.description) {
    lines.push(p);
  }
  if (spell.higherLevel && spell.higherLevel.length > 0) {
    lines.push("");
    lines.push(`**At Higher Levels:**`);
    for (const h of spell.higherLevel) {
      lines.push(h);
    }
  }
  if (shareUrl) {
    lines.push("");
    lines.push(`🔗 *View in Catalog:* ${shareUrl}`);
  }
  return lines.join("\n");
}

export function useCustomLists() {
  const [lists, setLists] = useState<CustomList[]>(readListsFromStorage);
  const [activeListId, setActiveListIdRaw] = useState<string>(
    readActiveListIdFromStorage,
  );

  useEffect(() => {
    writeListsToStorage(lists);
  }, [lists]);

  useEffect(() => {
    writeActiveListIdToStorage(activeListId);
  }, [activeListId]);

  const activeList = useMemo(() => {
    const found = lists.find((l) => l.id === activeListId);
    return (
      found ??
      lists[0] ?? {
        id: DEFAULT_LIST_ID,
        name: "Favorites",
        itemIds: [],
        spellIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  }, [lists, activeListId]);

  const activeItemIds = useMemo(
    () => new Set(activeList.itemIds),
    [activeList.itemIds],
  );

  const activeSpellIds = useMemo(
    () => new Set(activeList.spellIds),
    [activeList.spellIds],
  );

  const setActiveListId = useCallback(
    (id: string) => {
      if (lists.some((l) => l.id === id)) {
        setActiveListIdRaw(id);
      }
    },
    [lists],
  );

  const createList = useCallback(
    (name: string, initialItemIds: number[] = [], initialSpellIds: number[] = []): CustomList => {
      const trimmedName = name.trim() || "New List";
      const id = `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newList: CustomList = {
        id,
        name: trimmedName,
        itemIds: Array.from(new Set(initialItemIds)),
        spellIds: Array.from(new Set(initialSpellIds)),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setLists((prev) => [...prev, newList]);
      setActiveListIdRaw(id);
      return newList;
    },
    [],
  );

  const renameList = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLists((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, name: trimmed, updatedAt: Date.now() } : l,
      ),
    );
  }, []);

  const deleteList = useCallback((id: string) => {
    setLists((prev) => {
      if (prev.length <= 1) {
        // Don't leave zero lists; reset the last one to empty Favorites
        return [
          {
            id: DEFAULT_LIST_ID,
            name: "Favorites",
            itemIds: [],
            spellIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      }
      const filtered = prev.filter((l) => l.id !== id);
      return filtered;
    });

    setActiveListIdRaw((current) => {
      if (current === id) {
        return lists.find((l) => l.id !== id)?.id ?? DEFAULT_LIST_ID;
      }
      return current;
    });
  }, [lists]);

  const toggleItemInList = useCallback((listId: string, itemId: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const exists = l.itemIds.includes(itemId);
        const nextItemIds = exists
          ? l.itemIds.filter((id) => id !== itemId)
          : [...l.itemIds, itemId];
        const nextQuantities = { ...(l.quantities || {}) };
        if (exists) {
          delete nextQuantities[itemId];
        }
        return {
          ...l,
          itemIds: nextItemIds,
          quantities: nextQuantities,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const toggleSpellInList = useCallback((listId: string, spellId: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const exists = l.spellIds.includes(spellId);
        const nextSpellIds = exists
          ? l.spellIds.filter((id) => id !== spellId)
          : [...l.spellIds, spellId];
        return {
          ...l,
          spellIds: nextSpellIds,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const toggleItemInActiveList = useCallback(
    (itemId: number) => {
      toggleItemInList(activeList.id, itemId);
    },
    [activeList.id, toggleItemInList],
  );

  const toggleSpellInActiveList = useCallback(
    (spellId: number) => {
      toggleSpellInList(activeList.id, spellId);
    },
    [activeList.id, toggleSpellInList],
  );

  const isItemInList = useCallback(
    (listId: string, itemId: number): boolean => {
      const list = lists.find((l) => l.id === listId);
      return list ? list.itemIds.includes(itemId) : false;
    },
    [lists],
  );

  const isSpellInList = useCallback(
    (listId: string, spellId: number): boolean => {
      const list = lists.find((l) => l.id === listId);
      return list ? list.spellIds.includes(spellId) : false;
    },
    [lists],
  );

  const isItemInActiveList = useCallback(
    (itemId: number): boolean => activeItemIds.has(itemId),
    [activeItemIds],
  );

  const isSpellInActiveList = useCallback(
    (spellId: number): boolean => activeSpellIds.has(spellId),
    [activeSpellIds],
  );

  const importSharedList = useCallback(
    (
      name: string,
      itemIds: number[],
      spellIds: number[],
      quantities?: Record<number, number>,
    ): CustomList => {
      const id = `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const imported: CustomList = {
        id,
        name: name.trim() || "Imported List",
        itemIds: Array.from(new Set(itemIds)),
        spellIds: Array.from(new Set(spellIds)),
        quantities: quantities ? { ...quantities } : {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setLists((prev) => [...prev, imported]);
      setActiveListIdRaw(id);
      return imported;
    },
    [],
  );

  const setItemQuantity = useCallback(
    (listId: string, itemId: number, qty: number) => {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== listId) return l;
          const nextQuantities = { ...(l.quantities || {}) };
          if (qty <= 1) {
            delete nextQuantities[itemId];
          } else {
            nextQuantities[itemId] = Math.min(999, Math.max(1, qty));
          }
          return {
            ...l,
            quantities: nextQuantities,
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const exportBackupLists = useCallback((): string => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: Date.now(),
        lists,
      },
      null,
      2,
    );
  }, [lists]);

  const importBackupLists = useCallback(
    (parsedJson: unknown): { success: boolean; count: number; error?: string } => {
      try {
        let importedLists: CustomList[] = [];
        if (Array.isArray(parsedJson)) {
          importedLists = parsedJson as CustomList[];
        } else if (
          parsedJson &&
          typeof parsedJson === "object" &&
          Array.isArray((parsedJson as { lists?: unknown }).lists)
        ) {
          importedLists = (parsedJson as { lists: CustomList[] }).lists;
        } else {
          return { success: false, count: 0, error: "Invalid backup format." };
        }

        const valid = importedLists
          .filter((l) => l && typeof l === "object" && typeof l.name === "string")
          .map((l, i) => ({
            id: l.id || `imported_${Date.now()}_${i}`,
            name: l.name.trim() || "Imported List",
            itemIds: Array.isArray(l.itemIds)
              ? Array.from(new Set(l.itemIds.filter((n): n is number => typeof n === "number")))
              : [],
            spellIds: Array.isArray(l.spellIds)
              ? Array.from(new Set(l.spellIds.filter((n): n is number => typeof n === "number")))
              : [],
            quantities: l.quantities && typeof l.quantities === "object" ? l.quantities : {},
            createdAt: typeof l.createdAt === "number" ? l.createdAt : Date.now(),
            updatedAt: typeof l.updatedAt === "number" ? l.updatedAt : Date.now(),
          }));

        if (valid.length === 0) {
          return { success: false, count: 0, error: "No valid lists found in backup." };
        }

        setLists((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd: CustomList[] = [];
          for (const list of valid) {
            let finalId = list.id;
            if (existingIds.has(finalId)) {
              finalId = `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            }
            existingIds.add(finalId);
            toAdd.push({ ...list, id: finalId });
          }
          return [...prev, ...toAdd];
        });

        return { success: true, count: valid.length };
      } catch (e: unknown) {
        return {
          success: false,
          count: 0,
          error: e instanceof Error ? e.message : "Failed to parse backup.",
        };
      }
    },
    [],
  );

  const duplicateList = useCallback(
    (id: string): CustomList | null => {
      const source = lists.find((l) => l.id === id);
      if (!source) return null;
      const newId = `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const clone: CustomList = {
        id: newId,
        name: `${source.name} (Copy)`,
        itemIds: [...source.itemIds],
        spellIds: [...source.spellIds],
        quantities: { ...(source.quantities || {}) },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setLists((prev) => [...prev, clone]);
      setActiveListIdRaw(newId);
      return clone;
    },
    [lists],
  );

  const removeItemFromList = useCallback((listId: string, itemId: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const nextQuantities = { ...(l.quantities || {}) };
        delete nextQuantities[itemId];
        return {
          ...l,
          itemIds: l.itemIds.filter((id) => id !== itemId),
          quantities: nextQuantities,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const removeSpellFromList = useCallback((listId: string, spellId: number) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          spellIds: l.spellIds.filter((id) => id !== spellId),
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const clearList = useCallback((listId: string) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          itemIds: [],
          spellIds: [],
          quantities: {},
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  return {
    lists,
    activeList,
    activeListId: activeList.id,
    activeItemIds,
    activeSpellIds,
    setActiveListId,
    createList,
    duplicateList,
    renameList,
    deleteList,
    clearList,
    toggleItemInList,
    toggleSpellInList,
    removeItemFromList,
    removeSpellFromList,
    toggleItemInActiveList,
    toggleSpellInActiveList,
    setItemQuantity,
    isItemInList,
    isSpellInList,
    isItemInActiveList,
    isSpellInActiveList,
    importSharedList,
    exportBackupLists,
    importBackupLists,
  };
}
