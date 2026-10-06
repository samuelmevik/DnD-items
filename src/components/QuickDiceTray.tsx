import { useState, useRef, useEffect } from "react";
import { Dices, X, RotateCcw } from "lucide-react";
import { rollDice, DiceRollResult } from "@/lib/diceRoller";
import { cn } from "@/lib/utils";

type QuickDiceTrayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollDice?: (res: DiceRollResult) => void;
};

const DICE_TYPES = [
  { label: "d4", sides: 4 },
  { label: "d6", sides: 6 },
  { label: "d8", sides: 8 },
  { label: "d10", sides: 10 },
  { label: "d12", sides: 12 },
  { label: "d20", sides: 20 },
  { label: "d100", sides: 100 },
];

export function QuickDiceTray({
  open,
  onOpenChange,
  onRollDice,
}: QuickDiceTrayProps) {
  const [diceCount, setDiceCount] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [advantageMode, setAdvantageMode] = useState<"none" | "adv" | "dis">(
    "none",
  );
  const [customExpr, setCustomExpr] = useState("");
  const [history, setHistory] = useState<
    { res: DiceRollResult; time: string; advMode?: string }[]
  >([]);
  const trayRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange]);

  const handleRollDie = (sides: number) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (sides === 20 && advantageMode !== "none") {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const kept =
        advantageMode === "adv" ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
      const dropped =
        advantageMode === "adv" ? Math.min(roll1, roll2) : Math.max(roll1, roll2);
      const total = kept + modifier;
      const modStr =
        modifier === 0
          ? ""
          : modifier > 0
            ? ` + ${modifier}`
            : ` - ${Math.abs(modifier)}`;
      const advLabel = advantageMode === "adv" ? "Advantage" : "Disadvantage";

      const res: DiceRollResult = {
        expression: `1d20 (${advLabel})${modStr}`,
        rolls: [kept],
        modifier,
        total,
        breakdown: `[kept ${kept}, dropped ${dropped}]${modStr} = ${total}`,
      };
      setHistory((prev) => [{ res, time, advMode: advLabel }, ...prev].slice(0, 10));
      onRollDice?.(res);
      return;
    }

    const count = Math.max(1, Math.min(50, diceCount));
    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    const total = sum + modifier;
    const modStr =
      modifier === 0
        ? ""
        : modifier > 0
          ? ` + ${modifier}`
          : ` - ${Math.abs(modifier)}`;
    const expr = `${count}d${sides}${modStr}`;
    const breakdown =
      count === 1 && modifier === 0
        ? `${total}`
        : `[${rolls.join(", ")}]${modStr} = ${total}`;

    const res: DiceRollResult = {
      expression: expr,
      rolls,
      modifier,
      total,
      breakdown,
    };
    setHistory((prev) => [{ res, time }, ...prev].slice(0, 10));
    onRollDice?.(res);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExpr.trim()) return;
    const res = rollDice(customExpr);
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setHistory((prev) => [{ res, time }, ...prev].slice(0, 10));
    onRollDice?.(res);
    setCustomExpr("");
  };

  if (!open) return null;

  return (
    <div
      ref={trayRef}
      className="fixed bottom-16 right-4 sm:right-6 z-50 w-80 max-w-[94vw] rounded-2xl border border-amber-500/30 bg-card/95 backdrop-blur-md p-4 text-foreground shadow-2xl ring-1 ring-amber-500/20 animate-in fade-in-0 zoom-in-95"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Dices className="size-4" />
          </div>
          <span className="font-bold text-sm">Quick Dice Tray</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close dice tray"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3.5 pt-3">
        {/* Quantity and Modifier controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Quantity: <span className="font-bold text-foreground">{diceCount}</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 4, 8].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDiceCount(c)}
                  className={cn(
                    "flex-1 py-1 rounded text-xs font-semibold border transition-colors",
                    diceCount === c
                      ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Modifier:{" "}
              <span className="font-bold text-foreground">
                {modifier >= 0 ? `+${modifier}` : modifier}
              </span>
            </label>
            <div className="flex items-center gap-1">
              {[-1, 0, 2, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModifier(m)}
                  className={cn(
                    "flex-1 py-1 rounded text-xs font-semibold border transition-colors",
                    modifier === m
                      ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {m >= 0 && m !== 0 ? `+${m}` : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advantage / Disadvantage toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-muted-foreground">d20:</span>
          <button
            type="button"
            onClick={() =>
              setAdvantageMode((curr) => (curr === "adv" ? "none" : "adv"))
            }
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors",
              advantageMode === "adv"
                ? "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300"
                : "border-border bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            Advantage
          </button>
          <button
            type="button"
            onClick={() =>
              setAdvantageMode((curr) => (curr === "dis" ? "none" : "dis"))
            }
            className={cn(
              "px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors",
              advantageMode === "dis"
                ? "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300"
                : "border-border bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            Disadvantage
          </button>
        </div>

        {/* Polyhedral Dice Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {DICE_TYPES.map((die) => (
            <button
              key={die.label}
              type="button"
              onClick={() => handleRollDie(die.sides)}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-background hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95 transition-all text-foreground shadow-2xs font-bold text-xs"
            >
              <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                {die.label}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setDiceCount(1);
              setModifier(0);
              setAdvantageMode("none");
            }}
            title="Reset dice settings"
            className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-background hover:bg-accent text-muted-foreground transition-all"
          >
            <RotateCcw className="size-4" />
            <span className="text-[10px] mt-0.5">Reset</span>
          </button>
        </div>

        {/* Freeform Expression Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
          <input
            type="text"
            placeholder="e.g. 3d6+2 or 8d6"
            value={customExpr}
            onChange={(e) => setCustomExpr(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!customExpr.trim()}
            className="h-8 px-3 rounded-lg bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40 transition-colors"
          >
            Roll
          </button>
        </form>

        {/* Roll History */}
        {history.length > 0 && (
          <div className="border-t border-border/60 pt-2">
            <div className="flex items-center justify-between mb-1.5 text-[10px] uppercase font-semibold text-muted-foreground">
              <span>Recent Rolls</span>
              <button
                type="button"
                onClick={() => setHistory([])}
                className="hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-foreground truncate">
                      {h.res.expression}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      {h.res.breakdown}
                    </div>
                  </div>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400 shrink-0">
                    {h.res.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
