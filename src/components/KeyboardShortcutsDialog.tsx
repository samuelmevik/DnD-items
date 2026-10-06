import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Keyboard } from "lucide-react";

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SHORTCUTS = [
  { key: "/", desc: "Focus Search bar" },
  { key: "1", desc: "Switch to Items catalog" },
  { key: "2", desc: "Switch to Spells catalog" },
  { key: "D", desc: "Toggle Quick Dice Tray" },
  { key: "R", desc: "Open Random Loot / Spell Roller" },
  { key: "L", desc: "Open Favorite Lists & Gear Sets" },
  { key: "H", desc: "Open Recently Viewed history" },
  { key: "C", desc: "Open Side-by-Side Comparison" },
  { key: "?", desc: "Show this Keyboard Shortcuts guide" },
  { key: "Esc", desc: "Close dialogs and overlays" },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Keyboard className="size-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Quickly navigate the catalog and tools using your keyboard.
          </p>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
            {SHORTCUTS.map((s) => (
              <div
                key={s.key}
                className="flex items-center justify-between px-3.5 py-2 text-xs"
              >
                <span className="text-muted-foreground">{s.desc}</span>
                <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted/80 px-2 font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
