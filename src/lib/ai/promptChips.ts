export interface QuickPromptChip {
  id: string;
  label: string;
  prompt: string;
}

export const QUICK_PROMPT_CHIPS: QuickPromptChip[] = [
  {
    id: "rogue-pack",
    label: "Level 3 Rogue Pack",
    prompt: "Create a Level 3 Rogue gear and spell loadout pack",
  },
  {
    id: "anti-undead",
    label: "Anti-Undead Loadout",
    prompt: "What are the best items and spells for fighting undead encounters?",
  },
  {
    id: "stealth-heist",
    label: "Stealth Heist Prep",
    prompt: "Recommend items and spells for infiltrating a guarded castle",
  },
  {
    id: "boss-loot",
    label: "Boss Encounter Loot",
    prompt: "Generate high-impact boss encounter loot for a 5th-level party",
  },
];

export function resolvePromptChipAction(
  prompt: string,
  isGenerating: boolean,
  sendFn: (text: string) => void,
  setInputFn: (text: string) => void,
): "sent" | "filled" {
  if (isGenerating) {
    setInputFn(prompt);
    return "filled";
  }
  sendFn(prompt);
  return "sent";
}
