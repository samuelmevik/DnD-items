import { Spell } from "@/lib/spellsApi";
import SpellCard from "./SpellCard";

type SpellListProps = {
  spells: Spell[];
  isFavorite: (id: number) => boolean;
  onSelect: (spell: Spell) => void;
  onToggleFavorite: (id: number) => void;
  resetKey?: string;
};

export default function SpellList({
  spells,
  isFavorite,
  onSelect,
  onToggleFavorite,
  resetKey,
}: SpellListProps) {
  return (
    <div
      key={resetKey}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {spells.map((spell) => (
        <SpellCard
          key={spell.id}
          spell={spell}
          isFavorite={isFavorite(spell.id)}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
