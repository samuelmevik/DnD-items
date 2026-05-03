import { useEffect, useState } from "react";
import { Item } from "@/data/items";
import ItemCard from "./ItemCard";

type ItemListProps = {
  items: Item[];
  isFavorite: (id: number) => boolean;
  onSelect: (item: Item) => void;
  onToggleFavorite: (id: number) => void;
  resetKey: string;
};

const PAGE_SIZE = 100;

export default function ItemList({
  items,
  isFavorite,
  onSelect,
  onToggleFavorite,
  resetKey,
}: ItemListProps) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    setPageCount(1);
  }, [resetKey]);

  const visible = items.slice(0, pageCount * PAGE_SIZE);
  const hasMore = visible.length < items.length;

  return (
    <div className="space-y-6">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isFavorite={isFavorite(item.id)}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => setPageCount((p) => p + 1)}
            className="inline-flex h-10 items-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <span>Load more</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({(items.length - visible.length).toLocaleString()} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
