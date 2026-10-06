import { Scale, X, ArrowRight } from "lucide-react";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";

type CompareFloatingBarProps = {
  activeTab: "items" | "spells";
  comparedItemIds: number[];
  comparedSpellIds: number[];
  itemsMap: Map<number, Item>;
  spellsMap: Map<number, Spell>;
  onRemoveItem: (id: number) => void;
  onRemoveSpell: (id: number) => void;
  onClear: () => void;
  onOpenCompare: () => void;
};

export function CompareFloatingBar({
  activeTab,
  comparedItemIds,
  comparedSpellIds,
  itemsMap,
  spellsMap,
  onRemoveItem,
  onRemoveSpell,
  onClear,
  onOpenCompare,
}: CompareFloatingBarProps) {
  const isItems = activeTab === "items";
  const ids = isItems ? comparedItemIds : comparedSpellIds;
  const count = ids.length;

  if (count === 0) return null;

  return (
    <div
      style={{
        bottom: "max(4.5rem, calc(4.25rem + env(safe-area-inset-bottom, 0px)))",
      }}
      className="fixed left-1/2 -translate-x-1/2 z-40 flex max-w-[94vw] items-center gap-2 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md p-2 pl-3 shadow-xl ring-1 ring-primary/20 animate-in fade-in-0 slide-in-from-bottom-4 md:bottom-4"
    >
      <div className="flex items-center gap-2 pr-1">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Scale className="size-4" />
        </div>
        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
          Compare ({count}/4)
        </span>
      </div>

      {/* Mini chips */}
      <div className="hidden sm:flex items-center gap-1.5 max-w-xs md:max-w-md overflow-x-auto py-0.5">
        {ids.map((id) => {
          const name = isItems
            ? itemsMap.get(id)?.name
            : spellsMap.get(id)?.name;
          if (!name) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground whitespace-nowrap"
            >
              <span className="max-w-[100px] truncate">{name}</span>
              <button
                type="button"
                onClick={() => (isItems ? onRemoveItem(id) : onRemoveSpell(id))}
                aria-label={`Remove ${name} from compare`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-1 pl-1">
        <button
          type="button"
          onClick={onOpenCompare}
          disabled={count < 2}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <span>{count < 2 ? "Select 1 more" : "Compare"}</span>
          <ArrowRight className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear comparison tray"
          aria-label="Clear comparison tray"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
