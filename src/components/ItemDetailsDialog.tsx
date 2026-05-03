import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Item } from "@/data/items";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tag } from "./Tag";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";
import { API_ATTRIBUTION, fetchItemDescription } from "@/lib/api";

type ItemDetailsDialogProps = {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const formatPrice = (price: number) => `${price.toLocaleString()} gp`;

type DescriptionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; desc: string[] }
  | { status: "fallback" }
  | { status: "error" };

const useRemoteDescription = (item: Item | null): DescriptionState => {
  const [state, setState] = useState<DescriptionState>({ status: "idle" });

  useEffect(() => {
    if (!item) {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    fetchItemDescription(item.slug, controller.signal)
      .then((desc) => {
        if (controller.signal.aborted) return;
        if (desc && desc.length > 0) {
          setState({ status: "loaded", desc });
        } else {
          setState({ status: "fallback" });
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [item]);

  return state;
};

export function ItemDetailsDialog({
  item,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: ItemDetailsDialogProps) {
  const remote = useRemoteDescription(item);

  const description =
    remote.status === "loaded" ? remote.desc : item?.description ?? [];

  const sourceLabel =
    remote.status === "loading"
      ? `Loading from ${API_ATTRIBUTION}…`
      : remote.status === "loaded"
        ? `From the ${API_ATTRIBUTION}`
        : remote.status === "error"
          ? `${API_ATTRIBUTION} unavailable — showing summary`
          : null;

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
                      "size-5",
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

              {sourceLabel && (
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  {remote.status === "loading" && (
                    <Spinner className="size-3 border" />
                  )}
                  <span>{sourceLabel}</span>
                </div>
              )}

              <div
                className={cn(
                  "space-y-2 text-foreground/90 transition-opacity",
                  remote.status === "loading" && "opacity-60",
                )}
              >
                {description.map((desc, i) => (
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
