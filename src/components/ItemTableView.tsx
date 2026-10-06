import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import type { Item } from "@/data/items";
import { isRarity, itemRequiresAttunement } from "@/lib/filters";
import { rarityRingClass } from "@/lib/rarityStyles";
import { cn } from "@/lib/utils";
import ItemImage from "./ItemImage";

type ItemTableViewProps = {
  items: Item[];
  isFavorite: (id: number) => boolean;
  onSelect: (item: Item) => void;
  onToggleFavorite: (id: number) => void;
  resetKey: string;
};

const PAGE_SIZE = 100;

export function ItemTableView({
  items,
  isFavorite,
  onSelect,
  onToggleFavorite,
  resetKey,
}: ItemTableViewProps) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    setPageCount(1);
  }, [resetKey]);

  const visible = items.slice(0, pageCount * PAGE_SIZE);
  const hasMore = visible.length < items.length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 pl-3 pr-2 w-10 text-center">Item</th>
              <th className="py-2.5 px-3 font-semibold">Name & Description</th>
              <th className="py-2.5 px-3">Rarity</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Attunement</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 pr-3 pl-2 w-10 text-center">Fav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((item) => {
              const rarity = item.tags.find(isRarity);
              const fav = isFavorite(item.id);
              const attune = itemRequiresAttunement(item);
              const category = item.tags.find((t) => !isRarity(t)) || "—";

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                >
                  <td className="py-2 pl-3 pr-2">
                    <div className="size-8 overflow-hidden rounded border border-border/80">
                      <ItemImage item={item} variant="card" />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-foreground text-sm hover:underline">
                      {item.name}
                    </div>
                    {item.synopsis && (
                      <p className="line-clamp-1 text-muted-foreground text-[11px]">
                        {item.synopsis}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {rarity && (
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ring-1",
                          rarityRingClass(rarity),
                        )}
                      >
                        {rarity}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-muted-foreground">
                    {category}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {attune ? (
                      <span className="inline-flex items-center rounded-md border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                        Required
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-right font-medium">
                    <span>{item.price.toLocaleString()} gp</span>
                    {item.notBasePrice && (
                      <span className="ml-1 text-[10px] text-muted-foreground italic">
                        +base
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 pl-2 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      title={fav ? "Remove from list" : "Add to list"}
                      aria-label={fav ? "Remove favorite" : "Add favorite"}
                      className={cn(
                        "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground",
                        fav && "text-amber-500 hover:text-amber-500",
                      )}
                    >
                      <Star
                        className={cn("size-4", fav && "fill-amber-400")}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => setPageCount((p) => p + 1)}
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-xs font-medium text-foreground shadow-xs hover:bg-accent"
          >
            <span>Load more</span>
            <span className="ml-2 text-muted-foreground">
              ({(items.length - visible.length).toLocaleString()} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
