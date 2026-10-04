import { Star } from "lucide-react";
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

type SpellDetailsDialogProps = {
  spell: Spell | null;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function SpellDetailsDialog({
  spell,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: SpellDetailsDialogProps) {
  const style = spell ? schoolStyle(spell.school) : null;

  return (
    <Dialog open={spell != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {spell && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-8">
                <DialogTitle className="text-xl">{spell.name}</DialogTitle>
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

              <div className="space-y-2 text-foreground/90">
                {spell.description.map((desc, i) => (
                  <p key={i}>{desc}</p>
                ))}
              </div>

              {spell.higherLevel.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3 text-foreground/90">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    At Higher Levels
                  </h4>
                  {spell.higherLevel.map((desc, i) => (
                    <p key={i}>{desc}</p>
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
