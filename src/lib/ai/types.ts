export interface AiModelOption {
  id: string;
  label: string;
  family: "gemma" | "llama" | "smollm" | "qwen";
  badge: string;
  description: string;
  vramMB: number;
  isDefault?: boolean;
}

export const AVAILABLE_MODELS: AiModelOption[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B",
    family: "llama",
    badge: "Recommended · Fast",
    description: "Meta's lightweight 1B model (~880 MB VRAM). Extremely fast, reliable WebGPU execution.",
    vramMB: 879,
    isDefault: true,
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    label: "Gemma 2 2B",
    family: "gemma",
    badge: "Google Gemma",
    description: "Google's Gemma 2 2B model (~1.9 GB VRAM). Official stable Gemma release with rich lore details.",
    vramMB: 1895,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 1.5B",
    family: "qwen",
    badge: "Smart & Precise",
    description: "Alibaba's Qwen 2.5 1.5B (~1.1 GB VRAM). Outstanding reasoning, instruction following, and structured output.",
    vramMB: 1120,
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    label: "SmolLM2 1.7B",
    family: "smollm",
    badge: "Compact",
    description: "Hugging Face's compact conversational model (~1.7 GB VRAM).",
    vramMB: 1774,
  },
];

export interface ParsedListAction {
  name: string;
  itemIds: number[];
  spellIds: number[];
}

export interface ParsedFilterAction {
  targetTab: "items" | "spells";
  title?: string;
  // Item-specific facets
  rarities?: string[];
  categories?: string[];
  attunement?: "all" | "requires" | "none";
  minPrice?: number;
  maxPrice?: number;
  // Spell-specific facets
  levels?: number[];
  schools?: string[];
  classes?: string[];
  castingTimes?: string[];
  ritualOnly?: boolean;
  concentrationOnly?: boolean;
  // Common facets
  search?: string;
  favoritesOnly?: boolean;
  sort?: string;
  // Pre-computed partial state patches
  itemPatch?: Record<string, unknown>;
  spellPatch?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  actionList?: ParsedListAction | null;
  actionFilter?: ParsedFilterAction | null;
  isStreaming?: boolean;
  error?: string;
}

export interface WebGpuStatus {
  supported: boolean;
  reason?: string;
  adapterName?: string;
}
