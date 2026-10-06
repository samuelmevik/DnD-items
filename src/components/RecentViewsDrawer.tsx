import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { History, Trash2, ArrowUpRight } from "lucide-react";
import type { RecentView } from "@/lib/recentHistory";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";
import { isRarity } from "@/lib/filters";
import { rarityRingClass } from "@/lib/rarityStyles";
import { schoolStyle } from "@/lib/schoolStyles";
import { levelLabel } from "@/lib/spellFilters";
import { cn } from "@/lib/utils";

type RecentViewsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentViews: RecentView[];
  itemsMap: Map<number, Item>;
  spellsMap: Map<number, Spell>;
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  onClearRecent: () => void;
};

export function RecentViewsDrawer({
  open,
  onOpenChange,
  recentViews,
  itemsMap,
  spellsMap,
  onSelectItem,
  onSelectSpell,
  onClearRecent,
}: RecentViewsDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <History className="size-5 text-primary" />
              Recently Viewed
            </DialogTitle>
            {recentViews.length > 0 && (
              <button
                type="button"
                onClick={onClearRecent}
                title="Clear recent history"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Items and spells you've recently examined. Click to reopen details.
          </p>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {recentViews.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No items or spells viewed recently. Browse the catalog to build your history!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {recentViews.map((entry) => {
                if (entry.type === "item") {
                  const item = itemsMap.get(entry.id);
                  if (!item) return null;
                  const rarity = item.tags.find(isRarity);
                  return (
                    <button
                      key={`item-${entry.id}`}
                      type="button"
                      onClick={() => {
                        onSelectItem(item);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left text-xs transition-all hover:bg-accent hover:shadow-xs",
                        rarityRingClass(rarity),
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span className="truncate group-hover:underline">
                            {item.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground uppercase font-mono">
                            Item
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5 text-muted-foreground text-[11px]">
                          {rarity && <span>{rarity}</span>}
                          <span>·</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {item.price.toLocaleString()} gp
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </button>
                  );
                } else {
                  const spell = spellsMap.get(entry.id);
                  if (!spell) return null;
                  const style = schoolStyle(spell.school);
                  return (
                    <button
                      key={`spell-${entry.id}`}
                      type="button"
                      onClick={() => {
                        onSelectSpell(spell);
                        onOpenChange(false);
                      }}
                      className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left text-xs transition-all hover:bg-accent hover:shadow-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span className="truncate group-hover:underline">
                            {spell.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground uppercase font-mono">
                            Spell
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5 text-muted-foreground text-[11px]">
                          <span className={cn("font-medium", style.icon)}>
                            {levelLabel(spell.level)} · {spell.school}
                          </span>
                          {spell.castingTime && (
                            <>
                              <span>·</span>
                              <span>{spell.castingTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    </button>
                  );
                }
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
