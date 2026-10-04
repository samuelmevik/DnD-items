import { useId } from "react";
import { Spell } from "@/data/spells";
import {
  CLASSES,
  LEVELS,
  SCHOOLS,
  SpellFilterState,
  classCount,
  levelCount,
  levelLabel,
  schoolCount,
} from "@/lib/spellFilters";
import { schoolStyle } from "@/lib/schoolStyles";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

type SpellFilterSidebarProps = {
  spells: Spell[];
  state: SpellFilterState;
  onChange: (patch: Partial<SpellFilterState>) => void;
  favorites: Set<number>;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type PillProps = {
  label: string;
  active: boolean;
  count: number;
  onToggle: () => void;
  activeClass?: string;
  inactiveClass?: string;
};

function Pill({
  label,
  active,
  count,
  onToggle,
  activeClass,
  inactiveClass,
}: PillProps) {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${label} (${count} spells)`}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? (activeClass ?? "border-primary bg-primary text-primary-foreground")
          : (inactiveClass ??
              "border-border bg-background text-foreground hover:bg-accent"),
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          active
            ? "opacity-80"
            : inactiveClass
              ? "opacity-70"
              : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SpellFilterContent({
  spells,
  state,
  onChange,
  favorites,
}: Omit<SpellFilterSidebarProps, "mobileOpen" | "onMobileOpenChange">) {
  const ritualId = useId();
  const concentrationId = useId();

  return (
    <div className="space-y-6">
      <Section title="Level">
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => (
            <Pill
              key={level}
              label={levelLabel(level)}
              active={state.levels.includes(level)}
              count={levelCount(spells, state, favorites, level)}
              onToggle={() => onChange({ levels: toggleValue(state.levels, level) })}
            />
          ))}
        </div>
      </Section>

      <Section title="School">
        <div className="flex flex-wrap gap-1.5">
          {SCHOOLS.map((school) => {
            const style = schoolStyle(school);
            return (
              <Pill
                key={school}
                label={school}
                active={state.schools.includes(school)}
                count={schoolCount(spells, state, favorites, school)}
                onToggle={() => onChange({ schools: toggleValue(state.schools, school) })}
                activeClass={style.pillActive}
                inactiveClass={style.pillInactive}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Class">
        <div className="flex flex-wrap gap-1.5">
          {CLASSES.map((klass) => (
            <Pill
              key={klass}
              label={klass}
              active={state.classes.includes(klass)}
              count={classCount(spells, state, favorites, klass)}
              onToggle={() => onChange({ classes: toggleValue(state.classes, klass) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Casting">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id={ritualId}
              checked={state.ritualOnly}
              onCheckedChange={(checked) => onChange({ ritualOnly: checked === true })}
            />
            <Label htmlFor={ritualId} className="text-sm font-normal">
              Ritual only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={concentrationId}
              checked={state.concentrationOnly}
              onCheckedChange={(checked) =>
                onChange({ concentrationOnly: checked === true })
              }
            />
            <Label htmlFor={concentrationId} className="text-sm font-normal">
              Concentration only
            </Label>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function SpellFilterSidebar({
  spells,
  state,
  onChange,
  favorites,
  mobileOpen,
  onMobileOpenChange,
}: SpellFilterSidebarProps) {
  const inner = (
    <SpellFilterContent
      spells={spells}
      state={state}
      onChange={onChange}
      favorites={favorites}
    />
  );

  return (
    <>
      <aside className="hidden h-fit w-64 shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm md:block">
        <h2 className="mb-4 text-base font-semibold">Filters</h2>
        {inner}
      </aside>

      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogContent className="left-0 top-0 h-screen max-w-xs translate-x-0 translate-y-0 overflow-y-auto rounded-none data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:rounded-none md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Filters</h2>
            <button
              type="button"
              onClick={() => onMobileOpenChange(false)}
              aria-label="Close filters"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          {inner}
        </DialogContent>
      </Dialog>
    </>
  );
}
