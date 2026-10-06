import { useState } from "react";
import {
  Check,
  Copy,
  Edit2,
  Plus,
  Share2,
  Trash2,
  Star,
  Scroll,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  CustomList,
  copyToClipboard,
  generateMarkdownSummary,
  generateShareUrl,
} from "@/lib/customLists";
import type { Item } from "@/data/items";
import type { Spell } from "@/data/spells";
import { cn } from "@/lib/utils";

type ListManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: CustomList[];
  activeListId: string;
  onSelectActiveList: (id: string) => void;
  onCreateList: (name: string) => void;
  onRenameList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  itemsMap: Map<number, Item>;
  spellsMap: Map<number, Spell>;
  activeTab: "items" | "spells";
};

export function ListManagerDialog({
  open,
  onOpenChange,
  lists,
  activeListId,
  onSelectActiveList,
  onCreateList,
  onRenameList,
  onDeleteList,
  itemsMap,
  spellsMap,
  activeTab,
}: ListManagerDialogProps) {
  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMarkdownId, setCopiedMarkdownId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName.trim());
    setNewListName("");
  };

  const startRename = (list: CustomList) => {
    setEditingId(list.id);
    setEditName(list.name);
  };

  const commitRename = (id: string) => {
    if (editName.trim()) {
      onRenameList(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleShare = async (list: CustomList) => {
    const url = generateShareUrl(list, activeTab);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedId(list.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyMarkdown = async (list: CustomList) => {
    const url = generateShareUrl(list, activeTab);
    const md = generateMarkdownSummary(list, itemsMap, spellsMap, url);
    const ok = await copyToClipboard(md);
    if (ok) {
      setCopiedMarkdownId(list.id);
      setTimeout(() => setCopiedMarkdownId(null), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Scroll className="size-5 text-primary" />
            Favorite Lists & Gear Sets
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Create custom gear lists for dragon hunts, dungeon loot, or shop
            inventories. Share any list directly with players using a link.
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Create new list form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Dragon Slaying Gear, Dungeon Loot..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={!newListName.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="size-4" />
              New List
            </button>
          </form>

          {/* List collection */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Lists ({lists.length})
            </h3>

            <div className="space-y-2">
              {lists.map((list) => {
                const isActive = list.id === activeListId;
                const isEditing = list.id === editingId;

                return (
                  <div
                    key={list.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                      isActive
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-accent/30",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectActiveList(list.id)}
                        title={isActive ? "Active list" : "Set as active list"}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                          isActive
                            ? "border-amber-400 bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                            : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
                        )}
                      >
                        <Star
                          className={cn("size-4", isActive && "fill-current")}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename(list.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="h-7 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => commitRename(list.id)}
                              className="rounded p-1 text-primary hover:bg-primary/10"
                            >
                              <Check className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectActiveList(list.id)}
                              className="truncate text-left font-semibold text-foreground hover:underline"
                            >
                              {list.name}
                            </button>
                            {isActive && (
                              <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Active
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                          <span>
                            {list.itemIds.length}{" "}
                            {list.itemIds.length === 1 ? "item" : "items"}
                          </span>
                          <span>·</span>
                          <span>
                            {list.spellIds.length}{" "}
                            {list.spellIds.length === 1 ? "spell" : "spells"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleShare(list)}
                        title="Copy shareable link"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        {copiedId === list.id ? (
                          <>
                            <Check className="size-3.5 text-green-600 dark:text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="size-3.5 text-muted-foreground" />
                            <span>Share</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMarkdown(list)}
                        title="Copy Discord / Markdown list"
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        {copiedMarkdownId === list.id ? (
                          <>
                            <Check className="size-3.5 text-green-600 dark:text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 text-muted-foreground" />
                            <span>Discord</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => startRename(list)}
                        title="Rename list"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Edit2 className="size-3.5" />
                      </button>

                      {lists.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteList(list.id)}
                          title="Delete list"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
