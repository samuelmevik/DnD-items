import { useState } from "react";
import {
  Download,
  Share2,
  Copy,
  Check,
  X,
  Scroll,
} from "lucide-react";
import {
  SharedListData,
  calculateListGoldTotal,
  calculateListAttunementCount,
} from "@/lib/customLists";
import type { Item } from "@/data/items";
import { cn } from "@/lib/utils";

type SharedListBannerProps = {
  sharedList: SharedListData;
  itemsMap?: Map<number, Item>;
  onSaveToLists: () => void;
  onDismiss: () => void;
  onCopyShareLink: () => void;
  onCopyMarkdown: () => void;
  isSaved?: boolean;
};

export function SharedListBanner({
  sharedList,
  itemsMap,
  onSaveToLists,
  onDismiss,
  onCopyShareLink,
  onCopyMarkdown,
  isSaved = false,
}: SharedListBannerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const handleShareClick = () => {
    onCopyShareLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMarkdownClick = () => {
    onCopyMarkdown();
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const totalItems = sharedList.itemIds.length;
  const totalSpells = sharedList.spellIds.length;
  const totalGold = itemsMap ? calculateListGoldTotal(sharedList, itemsMap) : 0;
  const attuneCount = itemsMap
    ? calculateListAttunementCount(sharedList, itemsMap)
    : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/10 p-4 shadow-sm backdrop-blur-xs transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/20 p-2 text-primary">
            <Scroll className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Shared Collection
              </span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
                {totalItems} {totalItems === 1 ? "item" : "items"}
                {totalSpells > 0 && ` · ${totalSpells} ${totalSpells === 1 ? "spell" : "spells"}`}
              </span>
              {totalGold > 0 && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  💰 {totalGold.toLocaleString()} gp
                </span>
              )}
              {attuneCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    attuneCount > 3
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                      : "bg-purple-500/20 text-purple-700 dark:text-purple-300",
                  )}
                >
                  🔮 {attuneCount}/3 Attuned
                  {attuneCount > 3 ? " (Exceeds limit)" : ""}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {sharedList.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              This list was shared with you via link. You can explore the cards
              below, save it to your personal lists, or copy the link.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {!isSaved ? (
            <button
              type="button"
              onClick={onSaveToLists}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Download className="size-3.5" />
              Save to My Lists
            </button>
          ) : (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-3 text-xs font-medium text-green-700 dark:text-green-300">
              <Check className="size-3.5" />
              Saved to Lists
            </span>
          )}

          <button
            type="button"
            onClick={handleShareClick}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {copiedLink ? (
              <>
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5 text-muted-foreground" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleMarkdownClick}
            title="Copy as Markdown formatted for Discord or notes"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {copiedMarkdown ? (
              <>
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                <span>Markdown Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-foreground" />
                <span>Discord Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss shared list view and see all items"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
