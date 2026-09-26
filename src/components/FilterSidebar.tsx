import { useId, useState } from "react";
import { Item } from "@/data/items";
import {
  CATEGORIES,
  FilterState,
  RARITIES,
  tagCount,
} from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  Shield,
  ShieldHalf,
  Shirt,
  FlaskConical,
  CircleDot,
  Slash,
  ScrollText,
  Wand,
  Wand2,
  Wrench,
  Swords,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type FilterSidebarProps = {
  items: Item[];
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  favorites: Set<number>;
  priceBounds: [number, number];
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

const RARITY_PILL_ACTIVE: Record<string, string> = {
  Common:
    "border-stone-400 bg-stone-200 text-stone-900 dark:border-stone-500 dark:bg-stone-700 dark:text-stone-100",
  Uncommon:
    "border-teal-500 bg-teal-200 text-teal-950 dark:border-teal-500 dark:bg-teal-900/70 dark:text-teal-50",
  Rare:
    "border-blue-500 bg-blue-200 text-blue-950 dark:border-blue-500 dark:bg-blue-900/70 dark:text-blue-50",
  "Very Rare":
    "border-fuchsia-500 bg-fuchsia-200 text-fuchsia-950 dark:border-fuchsia-500 dark:bg-fuchsia-900/70 dark:text-fuchsia-50",
  Legendary:
    "border-amber-500 bg-amber-300 text-amber-950 shadow-[0_0_8px_theme(colors.amber.400/60%)] dark:border-amber-400 dark:bg-amber-600/80 dark:text-amber-50",
  Artifact:
    "border-rose-600 bg-rose-300 text-rose-950 shadow-[0_0_8px_theme(colors.rose.500/60%)] dark:border-rose-500 dark:bg-rose-900/80 dark:text-rose-50",
};

const RARITY_PILL_INACTIVE: Record<string, string> = {
  Common:
    "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-300 dark:hover:bg-stone-800/70",
  Uncommon:
    "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-950/70",
  Rare:
    "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
  "Very Rare":
    "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 dark:border-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/70",
  Legendary:
    "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
  Artifact:
    "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Armor: ShieldHalf,
  Cloak: Shirt,
  Potion: FlaskConical,
  Ring: CircleDot,
  Rod: Slash,
  Scroll: ScrollText,
  Shield: Shield,
  Staff: Wand,
  Tool: Wrench,
  Wand: Wand2,
  Weapon: Swords,
  "Wondrous Item": Sparkles,
};

const PRICE_PRESETS: { label: string; range: [number, number | null] }[] = [
  { label: "< 100", range: [0, 99] },
  { label: "100 – 1k", range: [100, 1000] },
  { label: "1k – 10k", range: [1000, 10000] },
  { label: "10k+", range: [10000, null] },
];

const formatPrice = (n: number) => `${n.toLocaleString()} gp`;

const togglePill = (list: string[], tag: string): string[] =>
  list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag];

type PillProps = {
  label: string;
  active: boolean;
  count: number;
  onToggle: () => void;
  activeClass: string;
  inactiveClass?: string;
  icon?: LucideIcon;
};

function Pill({
  label,
  active,
  count,
  onToggle,
  activeClass,
  inactiveClass,
  icon: Icon,
}: PillProps) {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${label} (${count} items)`}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? activeClass
          : (inactiveClass ??
              "border-border bg-background text-foreground hover:bg-accent"),
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
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

type PriceInputProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  emptyValue: number;
  onCommit: (val: number) => void;
};

function PriceInput({
  id,
  label,
  value,
  min,
  max,
  emptyValue,
  onCommit,
}: PriceInputProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [text, setText] = useState(() => value.toLocaleString());

  // Adjust state during render when prop changes (e.g. from slider dragging or presets)
  // Recommended React pattern: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value.toLocaleString());
  }

  const commit = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) {
      setText(emptyValue.toLocaleString());
      onCommit(emptyValue);
      return;
    }
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) {
      setText(value.toLocaleString());
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    setText(clamped.toLocaleString());
    if (clamped !== value) {
      onCommit(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit(text);
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setText(value.toLocaleString());
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 100 : 10;
      const delta = e.key === "ArrowUp" ? step : -step;
      const digits = text.replace(/[^0-9]/g, "");
      const current = digits ? parseInt(digits, 10) : value;
      const next = Math.max(min, Math.min(max, current + delta));
      setText(next.toLocaleString());
      onCommit(next);
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[11px] font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
          onFocus={(e) => {
            const digits = text.replace(/[^0-9]/g, "");
            if (digits) setText(digits);
            e.currentTarget.select();
          }}
          onBlur={() => commit(text)}
          onKeyDown={handleKeyDown}
          placeholder={emptyValue.toLocaleString()}
          className="h-8 px-2.5 pr-7 text-xs tabular-nums"
          aria-label={`${label} in gold pieces`}
        />
        <span className="pointer-events-none absolute right-2 select-none text-[11px] text-muted-foreground">
          gp
        </span>
      </div>
    </div>
  );
}

function FilterContent({
  items,
  state,
  onChange,
  favorites,
  priceBounds,
}: Omit<FilterSidebarProps, "mobileOpen" | "onMobileOpenChange">) {
  const [floor, ceiling] = priceBounds;
  const minInputId = useId();
  const maxInputId = useId();

  const handleRarityToggle = (tag: string) =>
    onChange({ rarities: togglePill(state.rarities, tag) });

  const handleCategoryToggle = (tag: string) =>
    onChange({ categories: togglePill(state.categories, tag) });

  const handleSliderChange = (values: number[]) => {
    const [a, b] = values;
    onChange({ minPrice: Math.min(a, b), maxPrice: Math.max(a, b) });
  };

  const applyPreset = (range: [number, number | null]) => {
    const [lo, hi] = range;
    onChange({
      minPrice: Math.max(floor, lo),
      maxPrice: hi == null ? ceiling : Math.min(ceiling, hi),
    });
  };

  const isPresetActive = (range: [number, number | null]): boolean => {
    const [lo, hi] = range;
    const expectedMin = Math.max(floor, lo);
    const expectedMax = hi == null ? ceiling : Math.min(ceiling, hi);
    return state.minPrice === expectedMin && state.maxPrice === expectedMax;
  };

  return (
    <div className="space-y-6">
      <Section title="Rarity">
        <div className="flex flex-wrap gap-1.5">
          {RARITIES.map((tag) => (
            <Pill
              key={tag}
              label={tag}
              active={state.rarities.includes(tag)}
              count={tagCount(items, state, favorites, "rarities", tag)}
              onToggle={() => handleRarityToggle(tag)}
              activeClass={RARITY_PILL_ACTIVE[tag]}
              inactiveClass={RARITY_PILL_INACTIVE[tag]}
            />
          ))}
        </div>
      </Section>

      <Section title="Category">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((tag) => (
            <Pill
              key={tag}
              label={tag}
              active={state.categories.includes(tag)}
              count={tagCount(items, state, favorites, "categories", tag)}
              onToggle={() => handleCategoryToggle(tag)}
              activeClass="border-primary bg-primary text-primary-foreground"
              icon={CATEGORY_ICONS[tag]}
            />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.range)}
              aria-pressed={isPresetActive(preset.range)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isPresetActive(preset.range)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="space-y-3 pt-2">
          <Slider
            min={floor}
            max={ceiling}
            step={10}
            minStepsBetweenThumbs={1}
            value={[state.minPrice, state.maxPrice]}
            onValueChange={handleSliderChange}
            thumbLabels={[
              `Minimum price (${formatPrice(state.minPrice)})`,
              `Maximum price (${formatPrice(state.maxPrice)})`,
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <PriceInput
              id={minInputId}
              label="Min price"
              value={state.minPrice}
              min={floor}
              max={ceiling}
              emptyValue={floor}
              onCommit={(newMin) => {
                if (newMin > state.maxPrice) {
                  onChange({ minPrice: newMin, maxPrice: newMin });
                } else {
                  onChange({ minPrice: newMin });
                }
              }}
            />
            <PriceInput
              id={maxInputId}
              label="Max price"
              value={state.maxPrice}
              min={floor}
              max={ceiling}
              emptyValue={ceiling}
              onCommit={(newMax) => {
                if (newMax < state.minPrice) {
                  onChange({ minPrice: newMax, maxPrice: newMax });
                } else {
                  onChange({ maxPrice: newMax });
                }
              }}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function FilterSidebar({
  items,
  state,
  onChange,
  favorites,
  priceBounds,
  mobileOpen,
  onMobileOpenChange,
}: FilterSidebarProps) {
  const inner = (
    <FilterContent
      items={items}
      state={state}
      onChange={onChange}
      favorites={favorites}
      priceBounds={priceBounds}
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
