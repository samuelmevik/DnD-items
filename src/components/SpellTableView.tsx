import { useState, useEffect } from "react";
import { Star, Scale } from "lucide-react";
import type { Spell } from "@/data/spells";
import { levelLabel } from "@/lib/spellFilters";
import { schoolStyle } from "@/lib/schoolStyles";
import { cn } from "@/lib/utils";

type SpellTableViewProps = {
  spells: Spell[];
  isFavorite: (id: number) => boolean;
  onSelect: (spell: Spell) => void;
  onToggleFavorite: (id: number) => void;
  resetKey: string;
  isCompared?: (id: number) => boolean;
  onToggleCompare?: (id: number) => void;
};

const PAGE_SIZE = 100;

export function SpellTableView({
  spells,
  isFavorite,
  onSelect,
  onToggleFavorite,
  resetKey,
  isCompared,
  onToggleCompare,
}: SpellTableViewProps) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    setPageCount(1);
  }, [resetKey]);

  const visible = spells.slice(0, pageCount * PAGE_SIZE);
  const hasMore = visible.length < spells.length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 pl-3 pr-2 font-semibold">Spell Name</th>
              <th className="py-2.5 px-3">Level & School</th>
              <th className="py-2.5 px-3">Casting Time</th>
              <th className="py-2.5 px-3">Range</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Properties</th>
              <th className="py-2.5 px-3">Classes</th>
              {onToggleCompare && (
                <th className="py-2.5 px-1 w-8 text-center" title="Compare">
                  Cmp
                </th>
              )}
              <th className="py-2.5 pr-3 pl-1 w-8 text-center">Fav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((spell) => {
              const style = schoolStyle(spell.school);
              const fav = isFavorite(spell.id);

              return (
                <tr
                  key={spell.id}
                  onClick={() => onSelect(spell)}
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                >
                  <td className="py-2.5 pl-3 pr-2">
                    <div className="font-semibold text-foreground text-sm hover:underline">
                      {spell.name}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        style.badge,
                      )}
                    >
                      {levelLabel(spell.level)} · {spell.school}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                    {spell.castingTime || "—"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                    {spell.range || "—"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                    {spell.duration || "—"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {spell.ritual && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          Ritual
                        </span>
                      )}
                      {spell.concentration && (
                        <span className="rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-medium">
                          Conc
                        </span>
                      )}
                      {!spell.ritual && !spell.concentration && (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    <span className="line-clamp-1">
                      {spell.classes.join(", ")}
                    </span>
                  </td>
                  {onToggleCompare && (
                    <td
                      className="py-2.5 px-1 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCompare(spell.id)}
                        title={
                          isCompared?.(spell.id)
                            ? "Remove from comparison"
                            : "Compare"
                        }
                        aria-label="Compare spell"
                        className={cn(
                          "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground",
                          isCompared?.(spell.id) &&
                            "text-primary bg-primary/15",
                        )}
                      >
                        <Scale className="size-3.5" />
                      </button>
                    </td>
                  )}
                  <td className="py-2.5 pr-3 pl-1 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(spell.id);
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
              ({(spells.length - visible.length).toLocaleString()} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
