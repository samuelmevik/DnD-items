# Project Vision & Long-Term Roadmap

## Vision
<!-- Briefly define what the application does and its ultimate objective -->
JustDnD is a blazing-fast, offline-capable, client-side D&D 5e compendium and tactical AI co-pilot for players and Dungeon Masters. Powered by on-device WebGPU local LLMs, it delivers instant stat lookups, deep multi-dimensional filtering, complex rule adjudication, and intelligent loadout curation with zero server costs, complete data privacy, and zero API keys.

The ultimate objective is to become the premier AI-augmented tabletop companion—an intelligent on-device co-DM that seamlessly bridges lightning-fast rule lookups, spell & item synergy analysis, procedural loot generation, and bespoke homebrew crafting right in the browser.

## Strategic Milestones
- [x] Milestone 1: Core Compendium & Fast Filter Engine (Items & spells dataset, multi-criteria filters, URL state sync, responsive table/grid views, keyboard shortcuts)
- [x] Milestone 2: Tactical Session Tools & Offline Caching (Side-by-side item comparator, random loot roller with CR scaling, interactive 3D dice roller, custom lists & favorites with localStorage persistence)
- [x] Milestone 3: On-Device AI Assistant with WebGPU (In-browser WebLLM worker inference, in-memory RAG grounding for items & spells, clickable entity badges, and 1-click list generation)
- [ ] Milestone 4: Intelligent Loot & Loadout Co-Pilot (Contextual encounter-based loot curation, natural-language filter driving, multi-turn session memory, and quick party balance analysis)
- [ ] Milestone 5: Generative Homebrew Studio & Balance Validator (LLM-driven custom magic item and spell creation, 5e rarity/power-budget balance checker, and flavor lore expansion)
- [ ] Milestone 6: Semantic Synergy Engine & Hands-Free Table Mode (Hybrid vector semantic search for conceptual queries like "gear to fight fiends", rules interaction solver, and hands-free voice input for DMs)

## Next Up (Atomic Candidate Ideas)
<!-- agy reads from and populates this queue -->
- [ ] Add model selector dropdown in AI assistant (Llama-3.2-1B, Qwen2.5-1.5B, Gemma-2-2B) with VRAM badges
- [x] Add "Ask AI about this item/spell" quick-action button in ItemDetailsDialog and SpellDetailsDialog
- [ ] Add real-time generation speed (tokens/sec) and GPU status telemetry to AI dialog
- [ ] Introduce pre-canned prompt chips for common table queries ("Level 3 Rogue Pack", "Anti-Undead Loadout", "Stealth Heist Prep")
- [ ] Add "Generate Thematic Variant" button on item cards (e.g., Ice Tongue from Flame Tongue)
- [ ] Natural language query bar that maps user intent directly into active filter states
- [ ] Export AI-generated loadouts as formatted Markdown handouts with item descriptions
- [ ] Cache WebGPU compiled shaders in IndexedDB for instant secondary model boot times
