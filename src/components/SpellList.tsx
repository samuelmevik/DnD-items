import { useEffect, useState } from "react";
import { Spell } from "@/data/spells";
import SpellCard from "./SpellCard";

type SpellListProps = {
  spells: Spell[];
  isFavorite: (id: number) => boolean;
  onSelect: (spell: Spell) => void;
  onToggleFavorite: (id: number) => void;
  resetKey?: string;
  isCompared?: (id: number) => boolean;
  onToggleCompare?: (id: number) => void;
};

const PAGE_SIZE = 100;

export default function SpellList({
  spells,
  isFavorite,
  onSelect,
  onToggleFavorite,
  resetKey,
  isCompared,
  onToggleCompare,
}: SpellListProps) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    setPageCount(1);
  }, [resetKey]);

  const visible = spells.slice(0, pageCount * PAGE_SIZE);
  const hasMore = visible.length < spells.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((spell) => (
          <SpellCard
            key={spell.id}
            spell={spell}
            isFavorite={isFavorite(spell.id)}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
            isCompared={isCompared?.(spell.id)}
            onToggleCompare={onToggleCompare}
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
              ({(spells.length - visible.length).toLocaleString()} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
