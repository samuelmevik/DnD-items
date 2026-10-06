import { QUICK_PROMPT_CHIPS, resolvePromptChipAction } from "./promptChips";

export function runPromptChipTests() {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  };

  // 1. Verify prompt chips list
  assert(QUICK_PROMPT_CHIPS.length >= 4, "should have at least 4 quick prompt chips");

  const labels = QUICK_PROMPT_CHIPS.map((c) => c.label);
  assert(labels.includes("Level 3 Rogue Pack"), "contains Level 3 Rogue Pack");
  assert(labels.includes("Anti-Undead Loadout"), "contains Anti-Undead Loadout");
  assert(labels.includes("Stealth Heist Prep"), "contains Stealth Heist Prep");
  assert(labels.includes("Boss Encounter Loot"), "contains Boss Encounter Loot");

  for (const chip of QUICK_PROMPT_CHIPS) {
    assert(typeof chip.id === "string" && chip.id.length > 0, `chip id is valid: ${chip.id}`);
    assert(typeof chip.label === "string" && chip.label.length > 0, `chip label is valid: ${chip.label}`);
    assert(typeof chip.prompt === "string" && chip.prompt.length > 0, `chip prompt is valid: ${chip.prompt}`);
  }

  // 2. Action resolution when idle (!isGenerating)
  let sentMessage = "";
  let filledInput = "";
  const resultIdle = resolvePromptChipAction(
    "Create a Level 3 Rogue pack",
    false,
    (msg) => {
      sentMessage = msg;
    },
    (txt) => {
      filledInput = txt;
    },
  );

  assert(resultIdle === "sent", "should return 'sent' when not generating");
  assert(
    sentMessage === "Create a Level 3 Rogue pack",
    "should immediately trigger send when not generating",
  );
  assert(filledInput === "", "should not fill input when sent immediately");

  // 3. Action resolution when generating (isGenerating)
  sentMessage = "";
  filledInput = "";
  const resultGenerating = resolvePromptChipAction(
    "Anti-Undead Loadout query",
    true,
    (msg) => {
      sentMessage = msg;
    },
    (txt) => {
      filledInput = txt;
    },
  );

  assert(resultGenerating === "filled", "should return 'filled' when generating");
  assert(
    filledInput === "Anti-Undead Loadout query",
    "should fill input when generating",
  );
  assert(sentMessage === "", "should not trigger send when generating");

  return true;
}
