import React from "react";
import { Dices } from "lucide-react";

export type DiceRollResult = {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  breakdown: string;
};

// Matches expressions like: 1d6, 2d8+3, 8d6, 1d10 - 2, 4d4+4
export const DICE_PATTERN = /\b(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\b/i;
export const GLOBAL_DICE_PATTERN = /\b(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\b/gi;

export function rollDice(expression: string): DiceRollResult {
  const clean = expression.trim();
  const match = clean.match(DICE_PATTERN);
  if (!match) {
    return {
      expression: clean,
      rolls: [0],
      modifier: 0,
      total: 0,
      breakdown: "0",
    };
  }

  const count = Math.min(100, Math.max(1, parseInt(match[1], 10)));
  const sides = Math.min(1000, Math.max(1, parseInt(match[2], 10)));
  const sign = match[3] === "-" ? -1 : 1;
  const modifier = match[4] ? sign * parseInt(match[4], 10) : 0;

  const rolls: number[] = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    sum += roll;
  }

  const total = Math.max(0, sum + modifier);

  let breakdown = "";
  if (count === 1 && modifier === 0) {
    breakdown = `${total}`;
  } else if (modifier !== 0) {
    const modStr = modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
    breakdown = `[${rolls.join(", ")}]${modStr} = ${total}`;
  } else {
    breakdown = `[${rolls.join(", ")}] = ${total}`;
  }

  return {
    expression: clean,
    rolls,
    modifier,
    total,
    breakdown,
  };
}

/**
 * Replaces plain text dice expressions with clickable buttons that roll dice
 */
export function linkifyDice(
  text: string,
  onRollDice: ((result: DiceRollResult) => void) | undefined,
  keyPrefix: string,
): React.ReactNode[] {
  if (!text) return [];

  const regex = /\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/gi;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  let t = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    if (match.index > lastIndex) {
      nodes.push(
        React.createElement(
          React.Fragment,
          { key: `${keyPrefix}-txt-${t++}` },
          text.slice(lastIndex, match.index),
        ),
      );
    }

    nodes.push(
      React.createElement(
        "button",
        {
          key: `${keyPrefix}-dice-${i++}`,
          type: "button",
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            const res = rollDice(matchedText);
            onRollDice?.(res);
          },
          title: `Roll ${matchedText}`,
          className:
            "inline-flex items-center gap-1 mx-0.5 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 dark:text-amber-300 dark:border-amber-500/40 active:scale-95 active:bg-amber-500/30 cursor-pointer select-none",
        },
        React.createElement(Dices, {
          className: "size-3 text-amber-600 dark:text-amber-400",
          "aria-hidden": true,
        }),
        React.createElement("span", null, matchedText),
      ),
    );

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      React.createElement(
        React.Fragment,
        { key: `${keyPrefix}-txt-${t++}` },
        text.slice(lastIndex),
      ),
    );
  }

  return nodes;
}
