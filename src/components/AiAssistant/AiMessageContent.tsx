import React, { useMemo, useState } from "react";
import { Sparkles, Check, Plus, ExternalLink, Scroll, Package } from "lucide-react";
import { Item, items } from "@/data/items";
import { Spell, spells } from "@/data/spells";
import { ParsedListAction } from "@/lib/ai/types";
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
  onSelectItem: (item: Item) => void;
  onSelectSpell: (spell: Spell) => void;
  onCreateList: (name: string, itemIds: number[], spellIds: number[]) => void;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const AiMessageContent: React.FC<AiMessageContentProps> = ({
  content,
  actionList,
  onSelectItem,
  onSelectSpell,
  onCreateList,
}) => {
  const [listCreated, setListCreated] = useState(false);

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

      {effectiveActionList && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-stone-900/40 p-3.5 shadow-md">
          <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-400" />
              <div>
                <h4 className="font-semibold text-amber-200 text-sm">{effectiveActionList.name}</h4>
                <p className="text-[11px] text-stone-400">
                  {effectiveActionList.itemIds.length} items · {effectiveActionList.spellIds.length} spells
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateList}
              disabled={listCreated}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-xs transition-all ${
                listCreated
                  ? "bg-emerald-600/80 text-white cursor-default"
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
