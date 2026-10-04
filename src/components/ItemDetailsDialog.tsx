import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
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

type ItemDetailsDialogProps = {
  item: Item | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  spells: Spell[];
  onSelectSpell: (spell: Spell) => void;
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
 * Splits plain text around any spell-name matches, turning each match into
 * a clickable button that opens that spell's detail dialog.
 */
function linkifySpellNames(
  text: string,
  matcher: ReturnType<typeof useSpellMatcher>,
  onSelectSpell: (spell: Spell) => void,
  keyPrefix: string,
): React.ReactNode[] {
  if (!text || !matcher) return [text];

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
      nodes.push(text.slice(lastIndex, match.index));
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

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Splits text on ***quality title*** segments (rendered bold+italic instead
// of showing the literal asterisks), and within each segment, linkifies any
// spell names so they can be clicked to open that spell's details.
function renderDescriptionLine(
  text: string,
  lineKey: string,
  matcher: ReturnType<typeof useSpellMatcher>,
  onSelectSpell: (spell: Spell) => void,
) {
  const parts = text.split(/(\*\*\*.+?\*\*\*|\*\*_.+?_\*\*)/g);
  return parts.map((part, i) => {
    const match =
      part.match(/^\*\*\*(.+)\*\*\*$/) ?? part.match(/^\*\*_(.+)_\*\*$/);
    const segmentKey = `${lineKey}-${i}`;
    return match ? (
      <em key={segmentKey} className="font-semibold italic">
        {linkifySpellNames(match[1], matcher, onSelectSpell, segmentKey)}
      </em>
    ) : (
      <span key={segmentKey}>
        {linkifySpellNames(part, matcher, onSelectSpell, segmentKey)}
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
  spells,
  onSelectSpell,
}: ItemDetailsDialogProps) {
  const remote = useRemoteDescription(item);
  const spellMatcher = useSpellMatcher(spells);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
              <ItemImage item={item} variant="detail" />

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
                  <p key={i}>
                    {renderDescriptionLine(desc, `desc-${i}`, spellMatcher, onSelectSpell)}
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
