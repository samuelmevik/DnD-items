import { useEffect, useState } from "react";
import { Item } from "@/data/items";
import { useInView } from "@/hooks/useInView";
import { getItemImageUrl, getItemCategoryVisual } from "@/lib/itemImages";
import { fetchItemImage } from "@/lib/api";
import { isRarity } from "@/lib/filters";
import { cn } from "@/lib/utils";

type ItemImageProps = {
  item: Item;
  variant?: "card" | "detail";
  className?: string;
};

const rarityGlowClass = (rarity: string | undefined): string => {
  switch (rarity) {
    case "Uncommon":
      return "from-emerald-500/15 via-emerald-500/5 to-transparent";
    case "Rare":
      return "from-sky-500/15 via-sky-500/5 to-transparent";
    case "Very Rare":
      return "from-violet-500/15 via-violet-500/5 to-transparent";
    case "Legendary":
      return "from-amber-500/20 via-amber-500/5 to-transparent";
    case "Artifact":
      return "from-red-500/20 via-red-500/5 to-transparent";
    default:
      return "from-muted/40 via-muted/10 to-transparent";
  }
};

const rarityBadgeClass = (rarity: string | undefined): string => {
  switch (rarity) {
    case "Uncommon":
      return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 group-hover:border-emerald-500/60";
    case "Rare":
      return "border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10 group-hover:border-sky-500/60";
    case "Very Rare":
      return "border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10 group-hover:border-violet-500/60";
    case "Legendary":
      return "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 group-hover:border-amber-500/70";
    case "Artifact":
      return "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10 group-hover:border-red-500/70";
    default:
      return "border-border/40 text-muted-foreground/80 bg-muted/40 group-hover:border-border";
  }
};

export default function ItemImage({
  item,
  variant = "card",
  className,
}: ItemImageProps) {
  const [containerRef, isInView] = useInView<HTMLDivElement>({
    rootMargin: "200px",
    once: true,
  });

  const [imageUrl, setImageUrl] = useState<string | null>(() => getItemImageUrl(item));
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // When element enters view or item changes, ensure imageUrl is resolved
  useEffect(() => {
    const direct = getItemImageUrl(item);
    if (direct) {
      setImageUrl(direct);
      return;
    }

    if (!isInView) return;

    if (item.slug) {
      const controller = new AbortController();
      setIsLoadingUrl(true);
      fetchItemImage(item.slug, controller.signal)
        .then((url) => {
          if (!controller.signal.aborted) {
            setImageUrl(url);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoadingUrl(false);
          }
        });

      return () => controller.abort();
    }
  }, [isInView, item]);

  const rarity = item.tags.find(isRarity);
  const glow = rarityGlowClass(rarity);
  const badgeStyle = rarityBadgeClass(rarity);

  const category = getItemCategoryVisual(item);
  const CategoryIcon = category.icon;

  const isDetail = variant === "detail";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-muted/50 via-muted/20 to-card select-none",
        isDetail
          ? "h-48 sm:h-56 w-full rounded-lg border border-border/60"
          : "h-36 w-full rounded-t-xl border-b border-border/40",
        className,
      )}
    >
      {/* Ambient rarity-tinted glow background */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b transition-opacity duration-300",
          glow,
        )}
        aria-hidden="true"
      />

      {/* 1. If not yet scrolled into view: render lightweight placeholder */}
      {!isInView && (
        <div className="absolute inset-0 bg-muted/20" aria-hidden="true" />
      )}

      {/* 2. Loading state: skeleton shimmer */}
      {isInView && (isLoadingUrl || (imageUrl && !isLoaded && !hasError)) && (
        <div
          className="absolute inset-0 flex animate-pulse items-center justify-center bg-muted/30"
          aria-hidden="true"
        >
          <CategoryIcon
            className={cn(
              "text-muted-foreground/20 animate-pulse",
              isDetail ? "size-14" : "size-8",
            )}
          />
        </div>
      )}

      {/* 3. Image when available and in view */}
      {isInView && imageUrl && !hasError && (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "object-contain transition-all duration-300 drop-shadow-md",
            isDetail
              ? "max-h-44 sm:max-h-52 max-w-full p-2"
              : "max-h-32 max-w-full p-2 group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}

      {/* 4. Fallback category visual when no image or image failed */}
      {isInView && (!imageUrl || hasError) && !isLoadingUrl && (
        <div
          className="relative z-10 flex flex-col items-center justify-center gap-1.5 p-4 text-center"
          title={`${item.name} (${category.label})`}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full border shadow-inner transition-transform duration-300",
              badgeStyle,
              isDetail ? "p-4" : "p-3 group-hover:scale-110",
            )}
          >
            <CategoryIcon
              className={cn(
                "transition-colors duration-300",
                isDetail ? "size-10" : "size-7",
              )}
              aria-hidden="true"
            />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {category.label}
          </span>
        </div>
      )}
    </div>
  );
}
