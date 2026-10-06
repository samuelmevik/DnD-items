import { useState, useRef } from "react";
import {
  Check,
  Copy,
  CopyPlus,
  Edit2,
  Plus,
  Share2,
  Trash2,
  Star,
  Scroll,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Minus,
  FileSpreadsheet,
  Printer,
  RotateCcw,
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
  calculateListGoldTotal,
  calculateListAttunementCount,
  generateCsvSummary,
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
  onDuplicateList?: (id: string) => void;
  onRenameList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  onClearList?: (id: string) => void;
  onRemoveItemFromList?: (listId: string, itemId: number) => void;
  onRemoveSpellFromList?: (listId: string, spellId: number) => void;
  itemsMap: Map<number, Item>;
  spellsMap: Map<number, Spell>;
  activeTab: "items" | "spells";
  onSetItemQuantity?: (listId: string, itemId: number, qty: number) => void;
  onExportBackup?: () => string;
  onImportBackup?: (json: unknown) => { success: boolean; count: number; error?: string };
};

export function ListManagerDialog({
  open,
  onOpenChange,
  lists,
  activeListId,
  onSelectActiveList,
  onCreateList,
  onDuplicateList,
  onRenameList,
  onDeleteList,
  onClearList,
  onRemoveItemFromList,
  onRemoveSpellFromList,
  itemsMap,
  spellsMap,
  activeTab,
  onSetItemQuantity,
  onExportBackup,
  onImportBackup,
}: ListManagerDialogProps) {
  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMarkdownId, setCopiedMarkdownId] = useState<string | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportCsv = (list: CustomList) => {
    const csv = generateCsvSummary(list, itemsMap, spellsMap);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gear-set.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage(`Exported CSV for "${list.name}"!`);
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handlePrintList = (list: CustomList) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const totalGold = calculateListGoldTotal(list, itemsMap);
    const attuneCount = calculateListAttunementCount(list, itemsMap);

    const itemsHtml = list.itemIds
      .map((id) => {
        const item = itemsMap.get(id);
        if (!item) return "";
        const qty = list.quantities?.[id] ?? 1;
        return `<tr><td><strong>${item.name}</strong></td><td>${qty}</td><td>${(item.price * qty).toLocaleString()} gp</td><td>${item.tags.join(", ")}</td></tr>`;
      })
      .join("");

    const spellsHtml = list.spellIds
      .map((id) => {
        const spell = spellsMap.get(id);
        if (!spell) return "";
        const levelStr = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
        return `<tr><td><strong>${spell.name}</strong></td><td>${levelStr}</td><td>${spell.school}</td><td>${spell.castingTime}</td></tr>`;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${list.name} - Gear Set</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; line-height: 1.4; }
            h1 { margin-bottom: 4px; font-size: 22px; }
            .meta { color: #555; margin-bottom: 20px; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
            h2 { font-size: 16px; margin: 16px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
            th { background: #f7f7f7; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>⚔️ ${list.name}</h1>
          <div class="meta">
            <strong>Total Gold Value:</strong> ${totalGold.toLocaleString()} gp &nbsp;|&nbsp;
            <strong>Attunement:</strong> ${attuneCount} / 3 slots
          </div>
          ${
            list.itemIds.length > 0
              ? `<h2>Magic Items (${list.itemIds.length})</h2>
                 <table>
                   <thead><tr><th>Item</th><th>Qty</th><th>Total Value</th><th>Properties</th></tr></thead>
                   <tbody>${itemsHtml}</tbody>
                 </table>`
              : ""
          }
          ${
            list.spellIds.length > 0
              ? `<h2>Spells (${list.spellIds.length})</h2>
                 <table>
                   <thead><tr><th>Spell</th><th>Level</th><th>School</th><th>Casting Time</th></tr></thead>
                   <tbody>${spellsHtml}</tbody>
                 </table>`
              : ""
          }
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportBackup = () => {
    const json = onExportBackup
      ? onExportBackup()
      : JSON.stringify({ version: 1, exportedAt: Date.now(), lists }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dnd-gear-sets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup exported!");
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const res = onImportBackup?.(parsed);
        if (res?.success) {
          setBackupMessage(`Imported ${res.count} lists successfully!`);
        } else {
          setBackupMessage(`Import failed: ${res?.error || "Invalid file"}`);
        }
      } catch {
        setBackupMessage("Import failed: invalid JSON file.");
      }
      setTimeout(() => setBackupMessage(null), 3500);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
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
            inventories. Track gold budgets and share with players.
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
                const isExpanded = expandedListId === list.id;
                const totalGold = calculateListGoldTotal(list, itemsMap);
                const attuneCount = calculateListAttunementCount(list, itemsMap);

                return (
                  <div
                    key={list.id}
                    className={cn(
                      "flex flex-col rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-accent/20",
                    )}
                  >
                    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
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

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                            <span>
                              {list.itemIds.length}{" "}
                              {list.itemIds.length === 1 ? "item" : "items"}
                            </span>
                            <span>·</span>
                            <span>
                              {list.spellIds.length}{" "}
                              {list.spellIds.length === 1 ? "spell" : "spells"}
                            </span>
                            {totalGold > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  💰 {totalGold.toLocaleString()} gp
                                </span>
                              </>
                            )}
                            {attuneCount > 0 && (
                              <>
                                <span>·</span>
                                <span
                                  className={cn(
                                    "font-medium",
                                    attuneCount > 3
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-purple-600 dark:text-purple-400",
                                  )}
                                >
                                  🔮 {attuneCount}/3 attuned
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0">
                        {(list.itemIds.length > 0 || list.spellIds.length > 0) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedListId((prev) =>
                                prev === list.id ? null : list.id,
                              )
                            }
                            title="View items, spells & adjust quantities"
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <span>Contents ({list.itemIds.length + list.spellIds.length})</span>
                            {isExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                          </button>
                        )}

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

                        {onDuplicateList && (
                          <button
                            type="button"
                            onClick={() => onDuplicateList(list.id)}
                            title="Duplicate / Clone list"
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <CopyPlus className="size-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExportCsv(list)}
                          title="Export list as CSV spreadsheet"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <FileSpreadsheet className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintList(list)}
                          title="Print clean loadout sheet"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Printer className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => startRename(list)}
                          title="Rename list"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        {onClearList && (list.itemIds.length > 0 || list.spellIds.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Clear all items and spells from "${list.name}"?`)) {
                                onClearList(list.id);
                              }
                            }}
                            title="Clear all items and spells from this list"
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>
                        )}

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

                    {/* Expandable items and spells contents panel */}
                    {isExpanded && (list.itemIds.length > 0 || list.spellIds.length > 0) && (
                      <div className="border-t border-border/70 bg-muted/30 p-3 space-y-3">
                        {list.itemIds.length > 0 && (
                          <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Magic Items ({list.itemIds.length})
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {list.itemIds.map((itemId) => {
                                const item = itemsMap.get(itemId);
                                if (!item) return null;
                                const qty = list.quantities?.[itemId] ?? 1;
                                return (
                                  <div
                                    key={itemId}
                                    className="flex items-center justify-between rounded-md bg-background px-2.5 py-1 text-xs border border-border/60"
                                  >
                                    <span className="font-medium truncate pr-2">
                                      {item.name}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-muted-foreground">
                                        {(item.price * qty).toLocaleString()} gp
                                      </span>
                                      {onSetItemQuantity && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onSetItemQuantity(
                                                list.id,
                                                itemId,
                                                Math.max(1, qty - 1),
                                              )
                                            }
                                            disabled={qty <= 1}
                                            title="Decrease quantity"
                                            className="inline-flex size-5 items-center justify-center rounded border border-border bg-muted text-muted-foreground hover:bg-accent disabled:opacity-40"
                                          >
                                            <Minus className="size-3" />
                                          </button>
                                          <span className="w-5 text-center font-semibold">
                                            {qty}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onSetItemQuantity(
                                                list.id,
                                                itemId,
                                                qty + 1,
                                              )
                                            }
                                            title="Increase quantity"
                                            className="inline-flex size-5 items-center justify-center rounded border border-border bg-muted text-muted-foreground hover:bg-accent"
                                          >
                                            <Plus className="size-3" />
                                          </button>
                                        </div>
                                      )}
                                      {onRemoveItemFromList && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onRemoveItemFromList(list.id, itemId)
                                          }
                                          title="Remove from list"
                                          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                        )}

                        {list.spellIds.length > 0 && (
                          <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Spells ({list.spellIds.length})
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {list.spellIds.map((spellId) => {
                                const spell = spellsMap.get(spellId);
                                if (!spell) return null;
                                const levelStr =
                                  spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`;
                                return (
                                  <div
                                    key={spellId}
                                    className="flex items-center justify-between rounded-md bg-background px-2.5 py-1 text-xs border border-border/60"
                                  >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className="font-medium truncate">
                                        {spell.name}
                                      </span>
                                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground shrink-0">
                                        {levelStr} · {spell.school}
                                      </span>
                                    </div>
                                    {onRemoveSpellFromList && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onRemoveSpellFromList(list.id, spellId)
                                        }
                                        title="Remove from list"
                                        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup & Restore Tools */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {backupMessage ? (
                  <span className="font-medium text-primary">
                    {backupMessage}
                  </span>
                ) : (
                  "Export or restore your gear sets as JSON."
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Download className="size-3.5" />
                  <span>Export Backup</span>
                </button>
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                  <Upload className="size-3.5" />
                  <span>Import Backup</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
