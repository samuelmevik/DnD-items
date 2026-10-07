import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Check,
  Plus,
  ExternalLink,
  Scroll,
  Package,
  FileText,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { Item, items, lowestPrice, highestPrice } from "@/data/items";
import { Spell, spells } from "@/data/spells";
import { ParsedListAction, ParsedFilterAction } from "@/lib/ai/types";
import { copyLoadoutMarkdownToClipboard } from "@/lib/ai/loadoutExport";
import { filterItems, FilterState } from "@/lib/filters";
import { filterSpells, SpellFilterState, CastingTimeCategory } from "@/lib/spellFilters";
import {
  itemsById,
  spellsById,
  findItemByRef,
  findSpellByRef,
  extractEntitiesFromText,
  AMBIGUOUS_SPELL_WORDS,
} from "@/lib/ai/retriever";
import { CloakIcon } from "@/components/CloakIcon";

interface AiMessageContentProps {
  content: string;
  actionList?: ParsedListAction | null;
  actionFilter?: ParsedFilterAction | null;
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  onCreateList: (name: string, itemIds: number[], spellIds: number[]) => void;
  onApplyFilters?: (action: ParsedFilterAction) => void;
  onToast?: (msg: string) => void;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EMPTY_FAVORITES = new Set<number>();

export const AiMessageContent: React.FC<AiMessageContentProps> = ({
  content,
  actionList,
  actionFilter,
  onSelectItem,
  onSelectSpell,
  onCreateList,
  onApplyFilters,
  onToast,
}) => {
  const [listCreated, setListCreated] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Fallback entity extractor: if the LLM forgot to output [CREATE_LIST:...],
  // detect any items & spells mentioned in the text so the user can still 1-click create the list!
  const effectiveActionList = useMemo(() => {
    if (actionList && (actionList.itemIds.length > 0 || actionList.spellIds.length > 0)) {
      return actionList;
    }
    const extracted = extractEntitiesFromText(content);
    if (extracted.itemIds.length + extracted.spellIds.length >= 2) {
      const defaultName =
        extracted.itemIds.length > 0 && extracted.spellIds.length === 0
          ? "Recommended Items"
          : extracted.itemIds.length === 0 && extracted.spellIds.length > 0
          ? "Recommended Spells"
          : "Recommended Loadout";

      return {
        name: defaultName,
        itemIds: extracted.itemIds,
        spellIds: extracted.spellIds,
      };
    }
    return null;
  }, [actionList, content]);

  // Spell and Item name matcher to auto-link unlinked plain-text mentions
  const entityMatcher = useMemo(() => {
    const spellMap = new Map<string, Spell>();
    const itemMap = new Map<string, Item>();
    const allNames: { name: string; type: "item" | "spell" }[] = [];

    for (const s of spells) {
      const lower = s.name.toLowerCase();
      if (lower.length >= 4 && !AMBIGUOUS_SPELL_WORDS.has(lower)) {
        spellMap.set(lower, s);
        allNames.push({ name: s.name, type: "spell" });
      }
    }

    for (const i of items) {
      const lower = i.name.toLowerCase();
      if (lower.length >= 4 && !AMBIGUOUS_SPELL_WORDS.has(lower)) {
        itemMap.set(lower, i);
        allNames.push({ name: i.name, type: "item" });
      }

      // Without suffix like " Weapon", " Armor", " Shield"
      const noSuffix = lower.replace(/\s+(weapon|armor|shield)$/i, "").trim();
      if (noSuffix.length >= 4 && !AMBIGUOUS_SPELL_WORDS.has(noSuffix) && !itemMap.has(noSuffix)) {
        itemMap.set(noSuffix, i);
        allNames.push({
          name: i.name.replace(/\s+(weapon|armor|shield)$/i, "").trim(),
          type: "item",
        });
      }

      // Slug spaced (e.g. "sun-blade" -> "Sun Blade")
      if (i.slug) {
        const slugSpaced = i.slug.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        if (slugSpaced.length >= 4 && !AMBIGUOUS_SPELL_WORDS.has(slugSpaced) && !itemMap.has(slugSpaced)) {
          itemMap.set(slugSpaced, i);
          const titleSlug = i.slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          allNames.push({ name: titleSlug, type: "item" });
        }
      }
    }

    // Sort descending by length so longer phrases match first (e.g. "Flame Tongue Weapon" before "Flame Tongue")
    allNames.sort((a, b) => b.name.length - a.name.length);
    const pattern = allNames.map((n) => escapeRegExp(n.name)).join("|");
    const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

    return { regex, spellMap, itemMap };
  }, []);

  // Helper to resolve an item link
  const resolveItem = (target: string): Item | null => {
    return findItemByRef(target);
  };

  // Helper to resolve a spell link
  const resolveSpell = (target: string): Spell | null => {
    return findSpellByRef(target);
  };

  const handleCreateList = () => {
    if (!effectiveActionList || listCreated) return;
    onCreateList(
      effectiveActionList.name,
      effectiveActionList.itemIds,
      effectiveActionList.spellIds,
    );
    setListCreated(true);
  };

  const handleExportMarkdown = async () => {
    if (!effectiveActionList) return;
    const success = await copyLoadoutMarkdownToClipboard(effectiveActionList);
    if (success) {
      setMarkdownCopied(true);
      onToast?.(`📋 Exported "${effectiveActionList.name}" Markdown handout!`);
      setTimeout(() => {
        setMarkdownCopied(false);
      }, 2000);
    } else {
      onToast?.("⚠️ Unable to copy Markdown handout to clipboard.");
    }
  };

  const handleApplyFilters = () => {
    if (!actionFilter || !onApplyFilters) return;
    onApplyFilters(actionFilter);
    setFiltersApplied(true);
    onToast?.(`🎯 Applied proposed filters to compendium!`);
  };

  const filterMatchData = useMemo(() => {
    if (!actionFilter) return null;

    if (actionFilter.targetTab === "items") {
      const fs: FilterState = {
        search: actionFilter.search || "",
        rarities: actionFilter.rarities || [],
        categories: actionFilter.categories || [],
        minPrice: actionFilter.minPrice ?? lowestPrice,
        maxPrice: actionFilter.maxPrice ?? highestPrice,
        attunement: actionFilter.attunement || "all",
        favoritesOnly: false,
        sort: "name-asc",
      };
      const matching = filterItems(items, fs, EMPTY_FAVORITES);
      return {
        type: "items" as const,
        matchingCount: matching.length,
        sampleMatches: matching.slice(0, 4),
      };
    } else {
      const sfs: SpellFilterState = {
        search: actionFilter.search || "",
        levels: actionFilter.levels || [],
        schools: actionFilter.schools || [],
        classes: actionFilter.classes || [],
        castingTimes: (actionFilter.castingTimes || []) as CastingTimeCategory[],
        ritualOnly: Boolean(actionFilter.ritualOnly),
        concentrationOnly: Boolean(actionFilter.concentrationOnly),
        favoritesOnly: false,
        sort: "level-asc",
      };
      const matching = filterSpells(spells, sfs, EMPTY_FAVORITES);
      return {
        type: "spells" as const,
        matchingCount: matching.length,
        sampleMatches: matching.slice(0, 4),
      };
    }
  }, [actionFilter]);

  const criteriaChips = useMemo(() => {
    if (!actionFilter) return [];
    const chips: { label: string; value: string; color: string }[] = [];

    if (actionFilter.targetTab === "items") {
      if (actionFilter.rarities && actionFilter.rarities.length > 0) {
        chips.push({
          label: "Rarity",
          value: actionFilter.rarities.join(", "),
          color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        });
      }
      if (actionFilter.categories && actionFilter.categories.length > 0) {
        chips.push({
          label: "Type",
          value: actionFilter.categories.join(", "),
          color: "border-sky-500/40 bg-sky-500/10 text-sky-300",
        });
      }
      if (actionFilter.attunement && actionFilter.attunement !== "all") {
        chips.push({
          label: "Attunement",
          value: actionFilter.attunement === "requires" ? "Required" : "No Attunement",
          color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        });
      }
      if (actionFilter.minPrice !== undefined || actionFilter.maxPrice !== undefined) {
        const min = actionFilter.minPrice ? `${actionFilter.minPrice.toLocaleString()} gp` : "0 gp";
        const max = actionFilter.maxPrice ? `${actionFilter.maxPrice.toLocaleString()} gp` : "∞";
        chips.push({
          label: "Price",
          value: `${min} – ${max}`,
          color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
        });
      }
      if (actionFilter.search) {
        chips.push({
          label: "Search",
          value: `"${actionFilter.search}"`,
          color: "border-violet-500/40 bg-violet-500/10 text-violet-300",
        });
      }
    } else {
      if (actionFilter.classes && actionFilter.classes.length > 0) {
        chips.push({
          label: "Class",
          value: actionFilter.classes.join(", "),
          color: "border-orange-500/40 bg-orange-500/10 text-orange-300",
        });
      }
      if (actionFilter.schools && actionFilter.schools.length > 0) {
        chips.push({
          label: "School",
          value: actionFilter.schools.join(", "),
          color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
        });
      }
      if (actionFilter.levels && actionFilter.levels.length > 0) {
        chips.push({
          label: "Level",
          value: actionFilter.levels.map((l) => (l === 0 ? "Cantrip" : `${l}`)).join(", "),
          color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
        });
      }
      if (actionFilter.castingTimes && actionFilter.castingTimes.length > 0) {
        chips.push({
          label: "Casting Time",
          value: actionFilter.castingTimes.join(", "),
          color: "border-teal-500/40 bg-teal-500/10 text-teal-300",
        });
      }
      if (actionFilter.ritualOnly) {
        chips.push({
          label: "Ritual",
          value: "Yes",
          color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
        });
      }
      if (actionFilter.concentrationOnly) {
        chips.push({
          label: "Concentration",
          value: "Yes",
          color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
        });
      }
      if (actionFilter.search) {
        chips.push({
          label: "Search",
          value: `"${actionFilter.search}"`,
          color: "border-violet-500/40 bg-violet-500/10 text-violet-300",
        });
      }
    }

    return chips;
  }, [actionFilter]);

  // Linkify unlinked names inside plain text
  const linkifyPlainText = (text: string, keyPrefix: string): React.ReactNode[] => {
    if (!text || !entityMatcher) return [text];
    const { regex, spellMap, itemMap } = entityMatcher;
    regex.lastIndex = 0;

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = regex.exec(text)) !== null) {
      const matched = match[0];
      const lower = matched.toLowerCase();
      const spell = spellMap.get(lower);
      const item = itemMap.get(lower);

      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }

      if (spell) {
        nodes.push(
          <button
            key={`${keyPrefix}_spl_${count++}`}
            type="button"
            onClick={() => onSelectSpell(spell)}
            className="my-0.5 inline-flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.2 text-xs font-semibold text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20 active:scale-95"
            title={`${spell.name} (Level ${spell.level} ${spell.school})`}
          >
            <Scroll className="size-3 text-indigo-400" />
            <span>{matched}</span>
          </button>,
        );
      } else if (item) {
        nodes.push(
          <button
            key={`${keyPrefix}_itm_${count++}`}
            type="button"
            onClick={() => onSelectItem(item)}
            className="my-0.5 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-xs font-semibold text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/20 active:scale-95"
            title={`${item.name} (${item.price} gp)`}
          >
            <CloakIcon className="size-3 text-amber-400" />
            <span>{matched}</span>
          </button>,
        );
      } else {
        nodes.push(matched);
      }

      lastIndex = match.index + matched.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  // Render markdown text with custom link tags
  const renderFormattedText = (text: string) => {
    // Regex matches [label](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      const preceding = text.substring(lastIndex, match.index);
      if (preceding) {
        parts.push(renderInlineMarkdown(preceding, `pre_${lastIndex}`));
      }

      const label = match[1];
      const href = match[2];

      if (href.startsWith("item:")) {
        const itemSlug = href.replace("item:", "");
        const item = resolveItem(itemSlug);
        parts.push(
          <button
            key={`link_item_${match.index}`}
            type="button"
            onClick={() => item && onSelectItem(item)}
            className="my-0.5 inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/20 active:scale-95"
            title={item ? `${item.name} (${item.price} gp)` : "View Item"}
          >
            <CloakIcon className="size-3 text-amber-400" />
            <span>{label}</span>
          </button>,
        );
      } else if (href.startsWith("spell:")) {
        const spellIndex = href.replace("spell:", "");
        const spell = resolveSpell(spellIndex);
        parts.push(
          <button
            key={`link_spell_${match.index}`}
            type="button"
            onClick={() => spell && onSelectSpell(spell)}
            className="my-0.5 inline-flex items-center gap-1.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/20 active:scale-95"
            title={spell ? `${spell.name} (Level ${spell.level})` : "View Spell"}
          >
            <Scroll className="size-3 text-indigo-400" />
            <span>{label}</span>
          </button>,
        );
      } else {
        parts.push(
          <a
            key={`link_a_${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-400 underline hover:text-amber-300"
          >
            {label}
            <ExternalLink className="size-3 inline" />
          </a>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(renderInlineMarkdown(text.substring(lastIndex), `post_${lastIndex}`));
    }

    return parts;
  };

  // Inline bold and auto-link formatting
  const renderInlineMarkdown = (raw: string, keyPrefix: string) => {
    const lines = raw.split("\n");
    return (
      <span key={keyPrefix}>
        {lines.map((line, lIdx) => {
          const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ") || /^\s*\d+\.\s+/.test(line);
          const cleanLine = isBullet ? line.replace(/^[\s]*([-•]|\d+\.)\s*/, "") : line;

          const boldParts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
          const renderedLine = boldParts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const inner = part.slice(2, -2);
              return (
                <strong key={`${lIdx}_${pIdx}`} className="font-semibold text-slate-100">
                  {linkifyPlainText(inner, `${keyPrefix}_bold_${lIdx}_${pIdx}`)}
                </strong>
              );
            }
            return (
              <React.Fragment key={`${lIdx}_${pIdx}`}>
                {linkifyPlainText(part, `${keyPrefix}_p_${lIdx}_${pIdx}`)}
              </React.Fragment>
            );
          });

          return (
            <React.Fragment key={`${keyPrefix}_line_${lIdx}`}>
              {isBullet ? (
                <span className="my-0.5 flex items-start gap-1.5 pl-2">
                  <span className="text-amber-500/70 select-none">•</span>
                  <span>{renderedLine}</span>
                </span>
              ) : (
                renderedLine
              )}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  return (
    <div className="space-y-3 leading-relaxed text-sm text-slate-200">
      <div>{renderFormattedText(content)}</div>

      {actionFilter && (
        <div className="mt-3 rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-950/30 to-stone-900/60 p-3.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                <SlidersHorizontal className="size-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-sky-200">
                  {actionFilter.title || (actionFilter.targetTab === "items" ? "Proposed Item Filters" : "Proposed Spell Filters")}
                </h4>
                <p className="text-[11px] text-stone-400">
                  {filterMatchData ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                      🎯 {filterMatchData.matchingCount} matching {filterMatchData.type} in compendium
                    </span>
                  ) : (
                    <span>Filters ready to apply</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyFilters}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-md transition-all ${
                filtersApplied
                  ? "bg-emerald-600 text-white"
                  : "bg-sky-600 text-white hover:bg-sky-500 active:scale-95"
              }`}
            >
              {filtersApplied ? (
                <>
                  <Check className="size-3.5" />
                  <span>Applied to Compendium</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="size-3.5" />
                  <span>Apply & View in Compendium</span>
                  <ArrowRight className="size-3" />
                </>
              )}
            </button>
          </div>

          {criteriaChips.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {criteriaChips.map((chip, idx) => (
                <span
                  key={`${chip.label}_${idx}`}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium shadow-xs ${chip.color}`}
                >
                  <span className="opacity-70">{chip.label}:</span>
                  <span className="font-semibold">{chip.value}</span>
                </span>
              ))}
            </div>
          )}

          {filterMatchData && filterMatchData.sampleMatches.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-stone-800/80 pt-2 text-xs text-stone-400">
              <span className="text-[11px] font-medium text-stone-500">Preview:</span>
              {filterMatchData.type === "items"
                ? (filterMatchData.sampleMatches as Item[]).map((itm) => (
                    <button
                      key={`preview_itm_${itm.id}`}
                      type="button"
                      onClick={() => onSelectItem(itm)}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-stone-900/60 px-1.5 py-0.5 text-xs text-amber-300 hover:border-amber-400 hover:bg-amber-500/10"
                    >
                      <Package className="size-3 text-amber-400" />
                      <span>{itm.name}</span>
                    </button>
                  ))
                : (filterMatchData.sampleMatches as Spell[]).map((spl) => (
                    <button
                      key={`preview_spl_${spl.id}`}
                      type="button"
                      onClick={() => onSelectSpell(spl)}
                      className="inline-flex items-center gap-1 rounded border border-indigo-500/20 bg-stone-900/60 px-1.5 py-0.5 text-xs text-indigo-300 hover:border-indigo-400 hover:bg-indigo-500/10"
                    >
                      <Scroll className="size-3 text-indigo-400" />
                      <span>{spl.name}</span>
                    </button>
                  ))}
              {filterMatchData.matchingCount > filterMatchData.sampleMatches.length && (
                <span className="text-[11px] text-stone-500">
                  +{filterMatchData.matchingCount - filterMatchData.sampleMatches.length} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {effectiveActionList && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-stone-900/40 p-3.5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              <div>
                <h4 className="text-sm font-semibold text-amber-200">{effectiveActionList.name}</h4>
                <p className="text-[11px] text-stone-400">
                  {effectiveActionList.itemIds.length} items · {effectiveActionList.spellIds.length} spells
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-900/90 px-2.5 py-1.5 text-xs font-semibold text-stone-200 shadow-sm transition-all hover:border-amber-500/50 hover:bg-stone-800 hover:text-amber-200 active:scale-95"
                title="Export loadout as formatted Markdown handout for Discord, Notion, or Obsidian"
              >
                {markdownCopied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Handout Copied!</span>
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5 text-amber-400" />
                    <span>Export Markdown</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCreateList}
                disabled={listCreated}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                  listCreated
                    ? "cursor-default bg-emerald-600/80 text-white"
                    : "bg-amber-600 text-white hover:bg-amber-500 active:scale-95"
                }`}
              >
                {listCreated ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Saved to Lists</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    <span>Save to My Lists</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {effectiveActionList.itemIds.map((id) => {
              const item = itemsById.get(id);
              if (!item) return null;
              return (
                <button
                  key={`action_item_${id}`}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-stone-900/80 px-2 py-1 text-xs text-amber-300 hover:border-amber-400 hover:bg-stone-800"
                >
                  <Package className="size-3 text-amber-400" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {effectiveActionList.spellIds.map((id) => {
              const spell = spellsById.get(id);
              if (!spell) return null;
              return (
                <button
                  key={`action_spell_${id}`}
                  type="button"
                  onClick={() => onSelectSpell(spell)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-stone-900/80 px-2 py-1 text-xs text-indigo-300 hover:border-indigo-400 hover:bg-stone-800"
                >
                  <Scroll className="size-3 text-indigo-400" />
                  <span>{spell.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
