import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Scale, X, Star, ExternalLink } from "lucide-react";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";
import { isRarity, itemRequiresAttunement, itemAttunementDetail } from "@/lib/filters";
import { rarityRingClass } from "@/lib/rarityStyles";
import { schoolStyle } from "@/lib/schoolStyles";
import { levelLabel } from "@/lib/spellFilters";
import { Tag } from "./Tag";
import ItemImage from "./ItemImage";
import { linkifyDice, type DiceRollResult } from "@/lib/diceRoller";
import { cn } from "@/lib/utils";

type CompareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "items" | "spells";
  comparedItemIds: number[];
  comparedSpellIds: number[];
  itemsMap: Map<number, Item>;
  spellsMap: Map<number, Spell>;
  onRemoveItem: (id: number) => void;
  onRemoveSpell: (id: number) => void;
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  isItemFavorite: (id: number) => boolean;
  isSpellFavorite: (id: number) => boolean;
  onToggleItemFavorite: (id: number) => void;
  onToggleSpellFavorite: (id: number) => void;
  onRollDice?: (res: DiceRollResult) => void;
};

export function CompareDialog({
  open,
  onOpenChange,
  activeTab,
  comparedItemIds,
  comparedSpellIds,
  itemsMap,
  spellsMap,
  onRemoveItem,
  onRemoveSpell,
  onSelectItem,
  onSelectSpell,
  isItemFavorite,
  isSpellFavorite,
  onToggleItemFavorite,
  onToggleSpellFavorite,
  onRollDice,
}: CompareDialogProps) {
  const isItems = activeTab === "items";
  const items = comparedItemIds
    .map((id) => itemsMap.get(id))
    .filter((i): i is Item => i !== undefined);
  const spells = comparedSpellIds
    .map((id) => spellsMap.get(id))
    .filter((s): s is Spell => s !== undefined);

  const columnCount = isItems ? items.length : spells.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Scale className="size-5 text-primary" />
              Side-by-Side {isItems ? "Item" : "Spell"} Comparison
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Compare stats, properties, requirements, and descriptions side by side.
          </p>
        </DialogHeader>

        {isItems ? (
          items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No items selected for comparison.
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div
                className={cn(
                  "grid gap-4 min-w-[600px]",
                  columnCount === 2 && "grid-cols-2",
                  columnCount === 3 && "grid-cols-3",
                  columnCount >= 4 && "grid-cols-4",
                )}
              >
                {items.map((item) => {
                  const rarity = item.tags.find(isRarity);
                  const attune = itemRequiresAttunement(item);
                  const attuneText = itemAttunementDetail(item);
                  const fav = isItemFavorite(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col rounded-xl border border-border bg-card p-4 text-xs shadow-sm ring-1",
                        rarityRingClass(rarity),
                      )}
                    >
                      {/* Column Header */}
                      <div className="flex items-start justify-between gap-2 pb-2">
                        <h3 className="text-base font-bold text-foreground leading-tight">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleItemFavorite(item.id)}
                            title={fav ? "Remove favorite" : "Add favorite"}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Star
                              className={cn(
                                "size-4",
                                fav && "fill-amber-400 text-amber-500",
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            title="Remove from comparison"
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <ItemImage item={item} variant="card" />
                      </div>

                      {/* Specs Matrix */}
                      <div className="space-y-2 border-y border-border/60 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-bold text-sm text-foreground">
                            {item.price.toLocaleString()} gp
                            {item.notBasePrice && (
                              <span className="text-[10px] text-muted-foreground ml-1 font-normal italic">
                                +base
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Rarity</span>
                          <span className="font-semibold text-foreground">
                            {rarity || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Attunement</span>
                          <span
                            className={cn(
                              "font-semibold",
                              attune
                                ? "text-purple-600 dark:text-purple-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {attune ? attuneText || "Required" : "No"}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 py-2">
                        {item.tags.map((t) => (
                          <Tag key={t} tag={t} />
                        ))}
                      </div>

                      {/* Synopsis & Description */}
                      <div className="flex-1 space-y-2 py-2 overflow-y-auto max-h-56">
                        {item.synopsis && (
                          <p className="font-medium text-foreground italic border-l-2 border-primary/40 pl-2">
                            {item.synopsis}
                          </p>
                        )}
                        <div className="space-y-1.5 text-muted-foreground leading-relaxed">
                          {item.description.map((d, i) => (
                            <p key={i}>
                              {linkifyDice(d, onRollDice, `cmp-${item.id}-${i}`)}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Open Full Details */}
                      <div className="pt-3 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectItem(item);
                            onOpenChange(false);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 font-semibold text-foreground hover:bg-accent transition-colors"
                        >
                          <span>Full Details</span>
                          <ExternalLink className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : spells.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No spells selected for comparison.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div
              className={cn(
                "grid gap-4 min-w-[600px]",
                columnCount === 2 && "grid-cols-2",
                columnCount === 3 && "grid-cols-3",
                columnCount >= 4 && "grid-cols-4",
              )}
            >
              {spells.map((spell) => {
                const style = schoolStyle(spell.school);
                const fav = isSpellFavorite(spell.id);

                return (
                  <div
                    key={spell.id}
                    className="flex flex-col rounded-xl border border-border bg-card p-4 text-xs shadow-sm"
                  >
                    {/* Column Header */}
                    <div className="flex items-start justify-between gap-2 pb-2">
                      <h3 className="text-base font-bold text-foreground leading-tight">
                        {spell.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleSpellFavorite(spell.id)}
                          title={fav ? "Remove favorite" : "Add favorite"}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Star
                            className={cn(
                              "size-4",
                              fav && "fill-amber-400 text-amber-500",
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSpell(spell.id)}
                          title="Remove from comparison"
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
                          style.badge,
                        )}
                      >
                        {levelLabel(spell.level)} · {spell.school}
                      </span>
                    </div>

                    {/* Specs Matrix */}
                    <div className="space-y-1.5 border-y border-border/60 py-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Casting Time</span>
                        <span className="font-semibold text-foreground">
                          {spell.castingTime || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Range</span>
                        <span className="font-semibold text-foreground">
                          {spell.range || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold text-foreground">
                          {spell.duration || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Components</span>
                        <span className="font-mono font-medium text-foreground">
                          {spell.components.join(", ") || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Properties</span>
                        <div className="flex items-center gap-1 font-medium">
                          {spell.ritual && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                              Ritual
                            </span>
                          )}
                          {spell.concentration && (
                            <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 text-[10px]">
                              Conc
                            </span>
                          )}
                          {!spell.ritual && !spell.concentration && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Classes */}
                    <div className="flex flex-wrap gap-1 py-2">
                      {spell.classes.map((c) => (
                        <Tag key={c} tag={c} />
                      ))}
                    </div>

                    {/* Description */}
                    <div className="flex-1 space-y-2 py-2 overflow-y-auto max-h-56 text-muted-foreground leading-relaxed">
                      {spell.description.map((d, i) => (
                        <p key={i}>
                          {linkifyDice(d, onRollDice, `cmp-spell-${spell.id}-${i}`)}
                        </p>
                      ))}
                      {spell.higherLevel.length > 0 && (
                        <div className="border-t border-border/40 pt-2 text-foreground font-medium">
                          <span className="font-bold text-[11px] block text-muted-foreground uppercase">
                            At Higher Levels:
                          </span>
                          {spell.higherLevel.map((h, i) => (
                            <p key={i}>{h}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Open Full Details */}
                    <div className="pt-3 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSpell(spell);
                          onOpenChange(false);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 font-semibold text-foreground hover:bg-accent transition-colors"
                      >
                        <span>Full Details</span>
                        <ExternalLink className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
