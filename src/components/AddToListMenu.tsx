import { useState, useRef, useEffect } from "react";
import { Bookmark, Plus, Check } from "lucide-react";
import type { CustomList } from "@/lib/customLists";
import { cn } from "@/lib/utils";

type AddToListMenuProps = {
  itemId?: number;
  spellId?: number;
  lists: CustomList[];
  isItemInList: (listId: string, itemId: number) => boolean;
  isSpellInList: (listId: string, spellId: number) => boolean;
  onToggleItemInList: (listId: string, itemId: number) => void;
  onToggleSpellInList: (listId: string, spellId: number) => void;
  onCreateList: (
    name: string,
    initialItemIds?: number[],
    initialSpellIds?: number[],
  ) => void;
  buttonClassName?: string;
};

export function AddToListMenu({
  itemId,
  spellId,
  lists,
  isItemInList,
  isSpellInList,
  onToggleItemInList,
  onToggleSpellInList,
  onCreateList,
  buttonClassName,
}: AddToListMenuProps) {
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = (listId: string) => {
    if (itemId !== undefined) {
      onToggleItemInList(listId, itemId);
    } else if (spellId !== undefined) {
      onToggleSpellInList(listId, spellId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(
      newListName.trim(),
      itemId !== undefined ? [itemId] : [],
      spellId !== undefined ? [spellId] : [],
    );
    setNewListName("");
  };

  const isInAnyList = lists.some((l) =>
    itemId !== undefined
      ? isItemInList(l.id, itemId)
      : spellId !== undefined
        ? isSpellInList(l.id, spellId)
        : false,
  );

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Add to custom list or gear set"
        aria-label="Add to custom list"
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
          isInAnyList
            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
          buttonClassName,
        )}
      >
        <Bookmark className={cn("size-3.5", isInAnyList && "fill-current")} />
        <span>Lists</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Save to gear set / list:
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto py-1">
            {lists.map((list) => {
              const checked =
                itemId !== undefined
                  ? isItemInList(list.id, itemId)
                  : spellId !== undefined
                    ? isSpellInList(list.id, spellId)
                    : false;

              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handleToggle(list.id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="truncate pr-2">{list.name}</span>
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-1.5 flex gap-1 border-t border-border pt-1.5"
          >
            <input
              type="text"
              placeholder="New list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!newListName.trim()}
              className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              title="Create new list"
            >
              <Plus className="size-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
