import { Star } from "lucide-react";
import { Item } from "@/data/items";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";

type ItemDetailsDialogProps = {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const formatPrice = (price: number) => `${price.toLocaleString()} gp`;

export function ItemDetailsDialog({
  item,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: ItemDetailsDialogProps) {
  return (
    <Dialog open={item != null} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-8">
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={isFavorite}
                  aria-label={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      isFavorite && "fill-amber-400 text-amber-500",
                    )}
                  />
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.tags.map((tag) => (
                  <Tag key={tag} tag={tag} />
                ))}
              </div>

              <div className="space-y-2 text-foreground/90">
                {item.description.map((desc, i) => (
                  <p key={i}>{desc}</p>
                ))}
              </div>

              <div className="flex items-baseline gap-2 border-t border-border pt-3">
                <span className="text-lg font-semibold">
                  {formatPrice(item.price)}
                </span>
                {item.notBasePrice && (
                  <span className="text-xs italic text-muted-foreground">
                    in addition to the base item's price
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
