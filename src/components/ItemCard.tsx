import { Star, Scale } from "lucide-react";
import { Item } from "@/data/items";
import { isRarity, itemRequiresAttunement } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Tag } from "./Tag";
import { rarityRingClass } from "@/lib/rarityStyles";
import ItemImage from "./ItemImage";

type ItemCardProps = {
  item: Item;
  isFavorite: boolean;
  onSelect: (item: Item) => void;
  onToggleFavorite: (id: number) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: number) => void;
};

const formatPrice = (n: number) => `${n.toLocaleString()} gp`;

export default function ItemCard({
  item,
  isFavorite,
  onSelect,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
}: ItemCardProps) {
  const rarity = item.tags.find(isRarity);
  const ringClass = rarityRingClass(rarity);
  const requiresAttunement = itemRequiresAttunement(item);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm ring-1 transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2",
        ringClass,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex flex-1 flex-col items-stretch text-left focus:outline-none"
        aria-label={`View details for ${item.name}`}
      >
        <ItemImage item={item} variant="card" />

        <div className="flex flex-1 flex-col items-stretch gap-3 p-4">
          <h3 className="pr-9 text-base font-semibold leading-tight">
            {item.name}
          </h3>

          <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
            {item.synopsis}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {item.tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
            {requiresAttunement && (
              <span className="inline-flex items-center rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                Attunement
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-base font-semibold">
              {formatPrice(item.price)}
            </span>
            {item.notBasePrice && (
              <span className="text-xs italic text-muted-foreground">
                + base item
              </span>
            )}
          </div>
        </div>
      </button>

      {onToggleCompare && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(item.id);
          }}
          aria-pressed={isCompared}
          title={isCompared ? "Remove from comparison" : "Compare item"}
          aria-label={isCompared ? "Remove from comparison" : "Compare item"}
          className={cn(
            "absolute right-11 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground",
            isCompared && "text-primary bg-primary/15 border border-primary/40",
          )}
        >
          <Scale className="size-4" aria-hidden />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(item.id);
        }}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Remove ${item.name} from favorites`
            : `Add ${item.name} to favorites`
        }
        className={cn(
          "absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground",
          isFavorite && "text-amber-500 hover:text-amber-500",
        )}
      >
        <Star
          className={cn("h-4 w-4", isFavorite && "fill-amber-400")}
          aria-hidden
        />
      </button>
    </article>
  );
}
