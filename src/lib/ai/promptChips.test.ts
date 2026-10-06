import {
  DEFAULT_PROMPT_CHIPS,
  QUICK_PROMPT_CHIPS,
  getIntelligentPromptChips,
  resolvePromptChipAction,
} from "./promptChips";
import { ChatMessage } from "./types";

export function runPromptChipTests() {
  const assert = (condition: boolean, msg: string) => {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  };

  // 1. Verify prompt chips list
  assert(QUICK_PROMPT_CHIPS.length >= 4, "should have at least 4 quick prompt chips");
  assert(DEFAULT_PROMPT_CHIPS.length >= 4, "should have at least 4 default prompt chips");

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

  // 4. Cleared / Empty chat returns empty array (cleared chat already has SAMPLE_PROMPTS)
  const clearedChips = getIntelligentPromptChips([], "");
  assert(
    clearedChips.length === 0,
    "cleared chat with no input should return empty array to prevent redundant chips",
  );

  // 5. Intelligent detection: D&D Class (Rogue)
  const rogueMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "What are the best items for a stealthy Rogue?",
      timestamp: Date.now(),
    },
  ];
  const rogueChips = getIntelligentPromptChips(rogueMessages);
  assert(rogueChips.length > 0, "should produce chips for rogue inquiry");
  const rogueLabels = rogueChips.map((c) => c.label);
  assert(
    rogueLabels.some((l) => l.includes("Rogue") || l.includes("Stealth")),
    "rogue inquiry should yield Rogue or Stealth chips",
  );

  // 6. Intelligent detection: D&D Class with level (Level 5 Paladin)
  const paladinMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "Recommend weapons and gear for my Level 5 Paladin",
      timestamp: Date.now(),
    },
  ];
  const paladinChips = getIntelligentPromptChips(paladinMessages);
  assert(
    paladinChips.some((c) => c.prompt.includes("Paladin") && c.prompt.includes("Level 5")),
    "paladin inquiry should dynamically include Paladin and Level 5",
  );

  // 7. Intelligent detection: Item comparison (Flame Tongue vs Sun Blade)
  const compareMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "Compare Flame Tongue and Sun Blade",
      timestamp: Date.now(),
    },
  ];
  const compareChips = getIntelligentPromptChips(compareMessages);
  const compareLabels = compareChips.map((c) => c.label);
  assert(
    compareLabels.some((l) => l.includes("Comparison") || l.includes("Resistances")),
    "comparing items should suggest mechanical comparison and resistances",
  );

  // 8. Intelligent detection: Encounter Theme (Undead)
  const undeadMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "We are facing a vampire lord with hordes of zombies and skeletons",
      timestamp: Date.now(),
    },
  ];
  const undeadChips = getIntelligentPromptChips(undeadMessages);
  assert(
    undeadChips.some((c) => c.prompt.toLowerCase().includes("undead") || c.label.includes("Anti-Undead") || c.label.includes("Radiant")),
    "undead encounter should suggest anti-undead or radiant chips",
  );

  // 9. Intelligent detection: Real-time draft typing
  const typingChips = getIntelligentPromptChips([], "wizard");
  assert(
    typingChips.some((c) => c.prompt.toLowerCase().includes("wizard") || c.label.includes("Wizard")),
    "typing 'wizard' in draft input should dynamically produce Wizard chips",
  );

  // 10. Intelligent deduplication: User already asked a prompt
  const askedPrompt = "Create a Level 3 Rogue gear and spell loadout pack";
  const duplicateMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: askedPrompt,
      timestamp: Date.now(),
    },
    {
      id: "2",
      role: "assistant",
      content: "Here is your Rogue loadout with Boots of Elvenkind and Dagger of Venom.",
      timestamp: Date.now(),
    },
  ];
  const deduplicatedChips = getIntelligentPromptChips(duplicateMessages);
  assert(
    !deduplicatedChips.some((c) => c.prompt.toLowerCase() === askedPrompt.toLowerCase()),
    "should not suggest prompt that the user has already asked",
  );

  // 11. Intelligent follow-up: Assistant recommended multiple items
  const assistantRecMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "What items should I get?",
      timestamp: Date.now(),
    },
    {
      id: "2",
      role: "assistant",
      content: "I recommend [Flame Tongue](item:flame-tongue) and [Cloak of Protection](item:cloak-of-protection).",
      timestamp: Date.now(),
    },
  ];
  const followUpChips = getIntelligentPromptChips(assistantRecMessages);
  assert(
    followUpChips.some((c) => c.label === "Save to My Lists" || c.label === "Budget Alternatives"),
    "assistant item recommendation should suggest saving list or budget alternatives",
  );

  return true;
}
