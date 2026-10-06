import { useState, useEffect } from "react";
import { Star, Share2, Copy, Check, Dices, X, Scale } from "lucide-react";
import { Spell } from "@/data/spells";
import { levelLabel } from "@/lib/spellFilters";
import { schoolStyle } from "@/lib/schoolStyles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";
import { AddToListMenu } from "./AddToListMenu";
import {
  CustomList,
  copyToClipboard,
  generateSingleSpellMarkdown,
} from "@/lib/customLists";
import { linkifyDice, DiceRollResult, rollDice } from "@/lib/diceRoller";

type SpellDetailsDialogProps = {
  spell: Spell | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isCompared?: boolean;
  onToggleCompare?: () => void;
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
};

export function SpellDetailsDialog({
  spell,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
  lists,
  isItemInList,
  isSpellInList,
  onToggleItemInList,
  onToggleSpellInList,
  onCreateList,
  onRollDice,
  onToast,
}: SpellDetailsDialogProps) {
  const style = spell ? schoolStyle(spell.school) : null;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);

  useEffect(() => {
    setLastRoll(null);
  }, [spell]);

  const handleLocalRollDice = (res: DiceRollResult) => {
    setLastRoll(res);
    onRollDice?.(res);
  };

  const handleCopyLink = async () => {
    if (!spell) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("tab", "spells");
    const slug = spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    url.searchParams.set("spell", slug);
    const ok = await copyToClipboard(url.toString());
    if (ok) {
      setCopiedLink(true);
      onToast?.(`Link to "${spell.name}" copied!`);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!spell) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("tab", "spells");
    const slug = spell.index || spell.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    url.searchParams.set("spell", slug);
    const md = generateSingleSpellMarkdown(spell, url.toString());
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopiedMarkdown(true);
      onToast?.(`Discord markdown for "${spell.name}" copied!`);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  return (
    <Dialog open={spell != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {spell && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-8">
                <DialogTitle className="text-xl">{spell.name}</DialogTitle>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Copy direct link to this spell"
                    aria-label="Copy spell link"
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
                    title="Copy Discord markdown for this spell"
                    aria-label="Copy spell markdown"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copiedMarkdown ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>

                  {lists && isSpellInList && onToggleSpellInList && onCreateList && (
                    <AddToListMenu
                      spellId={spell.id}
                      lists={lists}
                      isItemInList={isItemInList ?? (() => false)}
                      isSpellInList={isSpellInList}
                      onToggleItemInList={onToggleItemInList ?? (() => {})}
                      onToggleSpellInList={onToggleSpellInList}
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
                      aria-label="Compare spell"
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    style?.badge,
                  )}
                >
                  {levelLabel(spell.level)} · {spell.school}
                </span>
                {spell.ritual && <Tag tag="Ritual" />}
                {spell.concentration && <Tag tag="Concentration" />}
                {spell.classes.map((c) => (
                  <Tag key={c} tag={c} />
                ))}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Casting Time</dt>
                  <dd className="font-medium">{spell.castingTime || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Range</dt>
                  <dd className="font-medium">{spell.range || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{spell.duration || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Components</dt>
                  <dd className="font-medium">
                    {spell.components.join(", ") || "—"}
                  </dd>
                </div>
              </dl>

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

              <div className="space-y-2 text-foreground/90">
                {spell.description.map((desc, i) => (
                  <p key={i}>
                    {linkifyDice(desc, handleLocalRollDice, `spell-desc-${i}`)}
                  </p>
                ))}
              </div>

              {spell.higherLevel.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3 text-foreground/90">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    At Higher Levels
                  </h4>
                  {spell.higherLevel.map((desc, i) => (
                    <p key={i}>
                      {linkifyDice(desc, handleLocalRollDice, `spell-higher-${i}`)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
