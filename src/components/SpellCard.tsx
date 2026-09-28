import { Star } from "lucide-react";
import { Spell } from "@/lib/spellsApi";
import { levelLabel } from "@/lib/spellFilters";
import { schoolStyle, schoolIcon } from "@/lib/schoolStyles";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";

type SpellCardProps = {
  spell: Spell;
  isFavorite: boolean;
  onSelect: (spell: Spell) => void;
  onToggleFavorite: (id: number) => void;
};

export default function SpellCard({
  spell,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: SpellCardProps) {
  const style = schoolStyle(spell.school);
  const Icon = schoolIcon(spell.school);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(spell)}
        className="relative flex flex-1 flex-col items-stretch gap-3 p-4 text-left focus:outline-none"
        aria-label={`View details for ${spell.name}`}
      >
        {/* Faded background watermark of the school's icon */}
        <Icon
          className={cn(
            "pointer-events-none absolute -bottom-5 -right-5 size-32 opacity-[0.08] transition-transform duration-300 group-hover:scale-105",
            style.icon,
          )}
          aria-hidden
          strokeWidth={1.5}
        />

        <div className="relative z-10 flex flex-1 flex-col gap-3">
          <h3 className="pr-9 text-base font-semibold leading-tight">
            {spell.name}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                style.badge,
              )}
            >
              {levelLabel(spell.level)} · {spell.school}
            </span>
            {spell.ritual && <Tag tag="Ritual" />}
            {spell.concentration && <Tag tag="Concentration" />}
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            {spell.classes.map((c) => (
              <Tag key={c} tag={c} />
            ))}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(spell.id);
        }}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Remove ${spell.name} from favorites`
            : `Add ${spell.name} to favorites`
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
