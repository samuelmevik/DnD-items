import { useEffect, useMemo, useState } from "react";
import { Star, Share2, Copy, Check, Dices, X, Scale, Sparkles } from "lucide-react";
import { Item } from "@/data/items";
import { Spell } from "@/data/spells";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tag } from "./Tag";
import { Spinner } from "./Spinner";
import ItemImage from "./ItemImage";
import { cn } from "@/lib/utils";
import { API_ATTRIBUTION, fetchItemDescription } from "@/lib/api";
import { AddToListMenu } from "./AddToListMenu";
import {
  CustomList,
  copyToClipboard,
  generateSingleItemMarkdown,
} from "@/lib/customLists";
import { itemRequiresAttunement, itemAttunementDetail } from "@/lib/filters";
import { linkifyDice, DiceRollResult, rollDice } from "@/lib/diceRoller";

type ItemDetailsDialogProps = {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isCompared?: boolean;
  onToggleCompare?: () => void;
  spells: Spell[];
  onSelectSpell: (spell: Spell) => void;
  lists?: CustomList[];
  isItemInList?: (listId: string, itemId: number) => boolean;
  isSpellInList?: (listId: string, spellId: number) => boolean;
  onToggleItemInList?: (listId: string, itemId: number) => void;
  onToggleSpellInList?: (listId: string, spellId: number) => void;
  onCreateList?: (
    name: string,
    initialItemIds?: number[],
    initialSpellIds?: number[],
  ) => void;
  onRollDice?: (res: DiceRollResult) => void;
  onToast?: (msg: string) => void;
  onAskAi?: (item: Item) => void;
};

const formatPrice = (price: number) => `${price.toLocaleString()} gp`;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a case-insensitive, whole-word regex that matches any of the given
 * spell names, longest name first so e.g. "Mass Cure Wounds" wins over
 * "Cure Wounds" when both would otherwise match.
 */
function useSpellMatcher(spells: Spell[]) {
  return useMemo(() => {
    if (spells.length === 0) return null;
    const byLowerName = new Map(spells.map((s) => [s.name.toLowerCase(), s]));
    const names = [...spells]
      .map((s) => s.name)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    const regex = new RegExp(`\\b(${names.join("|")})\\b`, "gi");
    return { regex, byLowerName };
  }, [spells]);
}

/**
 * Splits plain text around any spell-name matches and dice expressions
 */
function linkifySpellAndDice(
  text: string,
  matcher: ReturnType<typeof useSpellMatcher>,
  onSelectSpell: (spell: Spell) => void,
  onRollDice: ((res: DiceRollResult) => void) | undefined,
  keyPrefix: string,
): React.ReactNode[] {
  if (!text) return [text];
  if (!matcher) return linkifyDice(text, onRollDice, keyPrefix);

  const { regex, byLowerName } = matcher;
  regex.lastIndex = 0;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const spell = byLowerName.get(matchedText.toLowerCase());
    if (!spell) continue;

    if (match.index > lastIndex) {
      nodes.push(
        ...linkifyDice(
          text.slice(lastIndex, match.index),
          onRollDice,
          `${keyPrefix}-pre-${i}`,
        ),
      );
    }
    nodes.push(
      <button
        key={`${keyPrefix}-spell-${i++}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectSpell(spell);
        }}
        className="font-medium text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
      >
        {matchedText}
      </button>,
    );
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      ...linkifyDice(text.slice(lastIndex), onRollDice, `${keyPrefix}-post`),
    );
  }
  return nodes;
}

// Splits text on ***quality title*** segments (rendered bold+italic instead
// of showing the literal asterisks), and within each segment, linkifies any
// spell names and dice expressions.
function renderDescriptionLine(
  text: string,
  lineKey: string,
  matcher: ReturnType<typeof useSpellMatcher>,
  onSelectSpell: (spell: Spell) => void,
  onRollDice?: (res: DiceRollResult) => void,
) {
  const parts = text.split(/(\*\*\*.+?\*\*\*|\*\*_.+?_\*\*)/g);
  return parts.map((part, i) => {
    const match =
      part.match(/^\*\*\*(.+)\*\*\*$/) ?? part.match(/^\*\*_(.+)_\*\*$/);
    const segmentKey = `${lineKey}-${i}`;
    return match ? (
      <em key={segmentKey} className="font-semibold italic">
        {linkifySpellAndDice(
          match[1],
          matcher,
          onSelectSpell,
          onRollDice,
          segmentKey,
        )}
      </em>
    ) : (
      <span key={segmentKey}>
        {linkifySpellAndDice(
          part,
          matcher,
          onSelectSpell,
          onRollDice,
          segmentKey,
        )}
      </span>
    );
  });
}

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
  isCompared,
  onToggleCompare,
  spells,
  onSelectSpell,
  lists,
  isItemInList,
  isSpellInList,
  onToggleItemInList,
  onToggleSpellInList,
  onCreateList,
  onRollDice,
  onToast,
  onAskAi,
}: ItemDetailsDialogProps) {
  const remote = useRemoteDescription(item);
  const spellMatcher = useSpellMatcher(spells);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);

  useEffect(() => {
    setLastRoll(null);
  }, [item]);

  const handleLocalRollDice = (res: DiceRollResult) => {
    setLastRoll(res);
    onRollDice?.(res);
  };

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

  const handleCopyLink = async () => {
    if (!item) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("tab", "items");
    const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    url.searchParams.set("item", slug);
    const ok = await copyToClipboard(url.toString());
    if (ok) {
      setCopiedLink(true);
      onToast?.(`Link to "${item.name}" copied!`);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!item) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("tab", "items");
    const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    url.searchParams.set("item", slug);
    const md = generateSingleItemMarkdown(item, url.toString());
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopiedMarkdown(true);
      onToast?.(`Discord markdown for "${item.name}" copied!`);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  const requiresAttunement = item ? itemRequiresAttunement(item) : false;
  const attunementText = item ? itemAttunementDetail(item) : null;

  return (
    <Dialog open={item != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {item && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-8">
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Copy direct link to this item"
                    aria-label="Copy item link"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copiedLink ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Share2 className="size-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    title="Copy Discord markdown for this item"
                    aria-label="Copy item markdown"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copiedMarkdown ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>

                  {onAskAi && (
                    <button
                      type="button"
                      onClick={() => onAskAi(item)}
                      title="Ask AI about this item"
                      aria-label="Ask AI about this item"
                      className="rounded-md p-1.5 text-amber-500 transition-colors hover:bg-amber-500/10 hover:text-amber-400 active:scale-95"
                    >
                      <Sparkles className="size-4" />
                    </button>
                  )}

                  {lists && isItemInList && onToggleItemInList && onCreateList && (
                    <AddToListMenu
                      itemId={item.id}
                      lists={lists}
                      isItemInList={isItemInList}
                      isSpellInList={isSpellInList ?? (() => false)}
                      onToggleItemInList={onToggleItemInList}
                      onToggleSpellInList={onToggleSpellInList ?? (() => {})}
                      onCreateList={onCreateList}
                    />
                  )}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={onToggleCompare}
                      title={
                        isCompared
                          ? "Remove from comparison"
                          : "Add to comparison"
                      }
                      aria-label="Compare item"
                      className={cn(
                        "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                        isCompared && "text-primary bg-primary/10",
                      )}
                    >
                      <Scale className="size-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    aria-pressed={isFavorite}
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        isFavorite && "fill-amber-400 text-amber-500",
                      )}
                    />
                  </button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <ItemImage item={item} variant="detail" />

              <div className="flex flex-wrap items-center gap-1.5">
                {item.tags.map((tag) => (
                  <Tag key={tag} tag={tag} />
                ))}
                {requiresAttunement && (
                  <span className="inline-flex items-center rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    {attunementText || "Requires Attunement"}
                  </span>
                )}
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

              {/* Interactive In-Dialog Dice Roll Banner */}
              {lastRoll && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground shadow-sm animate-in fade-in-0 slide-in-from-top-1"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      <Dices className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold leading-tight">
                        <span className="truncate">{lastRoll.expression}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-base text-amber-600 dark:text-amber-400 font-bold">
                          {lastRoll.total}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {lastRoll.breakdown}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const next = rollDice(lastRoll.expression);
                        handleLocalRollDice(next);
                      }}
                      className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Reroll
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastRoll(null)}
                      aria-label="Dismiss roll"
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "space-y-2 text-foreground/90 transition-opacity",
                  remote.status === "loading" && "opacity-60",
                )}
              >
                {description.map((desc, i) => (
                  <p key={i}>
                    {renderDescriptionLine(
                      desc,
                      `desc-${i}`,
                      spellMatcher,
                      onSelectSpell,
                      handleLocalRollDice,
                    )}
                  </p>
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
