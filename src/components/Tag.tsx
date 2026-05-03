import { cn } from "@/lib/utils";
import { isRarity } from "@/lib/filters";

const RARITY_CLASSES: Record<string, string> = {
  Common:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
  Uncommon:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  Rare:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/40 dark:text-sky-300",
  "Very Rare":
    "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-300",
  Legendary:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300",
  Artifact:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300",
};

const CATEGORY_CLASS =
  "border-border bg-secondary text-secondary-foreground";

type TagProps = {
  tag: string;
  className?: string;
};

export function Tag({ tag, className }: TagProps) {
  const rarity = isRarity(tag);
  const variantClass = rarity ? RARITY_CLASSES[tag] : CATEGORY_CLASS;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClass,
        className,
      )}
    >
      {tag}
    </span>
  );
}
