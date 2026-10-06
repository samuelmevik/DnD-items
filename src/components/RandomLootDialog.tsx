import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Dices, Sparkles, Star, ExternalLink, RotateCcw } from "lucide-react";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";
import { RARITIES, isRarity, itemRequiresAttunement } from "@/lib/filters";
import { LEVELS, levelLabel } from "@/lib/spellFilters";
import { schoolStyle } from "@/lib/schoolStyles";
import { rarityRingClass } from "@/lib/rarityStyles";
import ItemImage from "./ItemImage";
import { cn } from "@/lib/utils";

type RandomLootDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "items" | "spells";
  filteredItems: Item[];
  filteredSpells: Spell[];
  allItems: Item[];
  allSpells: Spell[];
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  onToggleItemFavorite: (id: number) => void;
  onToggleSpellFavorite: (id: number) => void;
  isItemFavorite: (id: number) => boolean;
  isSpellFavorite: (id: number) => boolean;
};

export function RandomLootDialog({
  open,
  onOpenChange,
  activeTab,
  filteredItems,
  filteredSpells,
  allItems,
  allSpells,
  onSelectItem,
  onSelectSpell,
  onToggleItemFavorite,
  onToggleSpellFavorite,
  isItemFavorite,
  isSpellFavorite,
}: RandomLootDialogProps) {
  const isItems = activeTab === "items";
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [sourceMode, setSourceMode] = useState<"filtered" | "all">("filtered");
  const [isRolling, setIsRolling] = useState(false);
  const [rolledItem, setRolledItem] = useState<Item | null>(null);
  const [rolledSpell, setRolledSpell] = useState<Spell | null>(null);

  const rollRandom = useCallback(() => {
    setIsRolling(true);

    setTimeout(() => {
      if (isItems) {
        let pool = sourceMode === "filtered" ? filteredItems : allItems;
        if (selectedRarity !== "all") {
          pool = pool.filter((i) => i.tags.includes(selectedRarity));
        }
        if (pool.length === 0) pool = allItems;
        const chosen = pool[Math.floor(Math.random() * pool.length)] ?? null;
        setRolledItem(chosen);
        setRolledSpell(null);
      } else {
        let pool = sourceMode === "filtered" ? filteredSpells : allSpells;
        if (selectedLevel !== "all") {
          pool = pool.filter((s) => s.level === selectedLevel);
        }
        if (pool.length === 0) pool = allSpells;
        const chosen = pool[Math.floor(Math.random() * pool.length)] ?? null;
        setRolledSpell(chosen);
        setRolledItem(null);
      }
      setIsRolling(false);
    }, 350);
  }, [
    isItems,
    sourceMode,
    filteredItems,
    allItems,
    selectedRarity,
    filteredSpells,
    allSpells,
    selectedLevel,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-amber-500" />
            Random {isItems ? "Loot Roller" : "Spell Roller"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Roll random treasure or discover unexpected spells for your tabletop session.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3 text-xs">
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setSourceMode("filtered")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  sourceMode === "filtered"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                From Filtered ({isItems ? filteredItems.length : filteredSpells.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  sourceMode === "all"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All {isItems ? allItems.length : allSpells.length}
              </button>
            </div>

            {isItems ? (
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
              >
                <option value="all">Any Rarity</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedLevel}
                onChange={(e) =>
                  setSelectedLevel(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
              >
                <option value="all">Any Level</option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {levelLabel(lvl)}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={rollRandom}
              disabled={isRolling}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Dices className={cn("size-4", isRolling && "animate-spin")} />
              <span>{isRolling ? "Rolling..." : "Roll Dice"}</span>
            </button>
          </div>

          {/* Roll Result Display */}
          {rolledItem && (
            <div
              className={cn(
                "rounded-xl border border-border bg-card p-4 shadow-md transition-all animate-in fade-in-0 zoom-in-95 ring-1",
                rarityRingClass(rolledItem.tags.find(isRarity)),
              )}
            >
              <div className="flex items-start justify-between gap-2 pb-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    🎲 Roll Result
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {rolledItem.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleItemFavorite(rolledItem.id)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <Star
                    className={cn(
                      "size-5",
                      isItemFavorite(rolledItem.id) &&
                        "fill-amber-400 text-amber-500",
                    )}
                  />
                </button>
              </div>

              <div className="my-2">
                <ItemImage item={rolledItem} variant="card" />
              </div>

              <div className="flex flex-wrap items-center gap-2 py-2 text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {rolledItem.price.toLocaleString()} gp
                </span>
                <span>·</span>
                <span>{rolledItem.tags.find(isRarity) || "Common"}</span>
                {itemRequiresAttunement(rolledItem) && (
                  <>
                    <span>·</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      Requires Attunement
                    </span>
                  </>
                )}
              </div>

              {rolledItem.synopsis && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 my-2">
                  {rolledItem.synopsis}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    onSelectItem(rolledItem);
                    onOpenChange(false);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={rollRandom}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reroll</span>
                </button>
              </div>
            </div>
          )}

          {rolledSpell && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-md transition-all animate-in fade-in-0 zoom-in-95">
              <div className="flex items-start justify-between gap-2 pb-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    🎲 Roll Result
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {rolledSpell.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSpellFavorite(rolledSpell.id)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <Star
                    className={cn(
                      "size-5",
                      isSpellFavorite(rolledSpell.id) &&
                        "fill-amber-400 text-amber-500",
                    )}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 py-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                    schoolStyle(rolledSpell.school).badge,
                  )}
                >
                  {levelLabel(rolledSpell.level)} · {rolledSpell.school}
                </span>
                {rolledSpell.castingTime && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {rolledSpell.castingTime}
                  </span>
                )}
                {rolledSpell.range && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {rolledSpell.range}
                  </span>
                )}
              </div>

              {rolledSpell.description[0] && (
                <p className="line-clamp-3 text-xs text-muted-foreground my-2">
                  {rolledSpell.description[0]}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSpell(rolledSpell);
                    onOpenChange(false);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={rollRandom}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reroll</span>
                </button>
              </div>
            </div>
          )}

          {!rolledItem && !rolledSpell && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Dices className="size-12 stroke-[1.5] text-amber-500/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Ready to roll!
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Click "Roll Dice" above to draw a random{" "}
                {isItems ? "magic item" : "spell"} from the database.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
