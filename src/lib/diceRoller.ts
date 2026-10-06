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
