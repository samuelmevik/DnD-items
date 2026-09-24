import type { LucideIcon } from "lucide-react";
import {
  Axe,
  BookOpen,
  CircleDot,
  Coins,
  Compass,
  Crosshair,
  Crown,
  Eye,
  Feather,
  Flame,
  FlaskConical,
  Footprints,
  Gem,
  Hammer,
  Hand,
  Layers,
  Music,
  Package,
  Scroll,
  Shield,
  Sparkles,
  Sword,
  Wand2,
  Wrench,
} from "lucide-react";

export const API_IMAGE_BASE = "https://www.dnd5eapi.co";

/**
 * Verified image paths hosted by dnd5eapi.co for SRD magic items.
 */
export const SRD_ITEM_IMAGES: Record<string, string> = {
  "adamantine-armor": "/api/images/magic-items/adamantine-armor.png",
  "ammunition": "/api/images/magic-items/ammunition.png",
  "ammunition-1": "/api/images/magic-items/ammunition.png",
  "ammunition-2": "/api/images/magic-items/ammunition.png",
  "ammunition-3": "/api/images/magic-items/ammunition.png",
  "amulet-of-health": "/api/images/magic-items/amulet-of-health.png",
  "amulet-of-proof-against-detection-and-location": "/api/images/magic-items/amulet-of-proof-against-detection-and-location.png",
  "amulet-of-the-planes": "/api/images/magic-items/amulet-of-the-planes.png",
  "animated-shield": "/api/images/magic-items/animated-shield.png",
  "apparatus-of-the-crab": "/api/images/magic-items/apparatus-of-the-crab.png",
  "armor": "/api/images/magic-items/armor.png",
  "armor-1": "/api/images/magic-items/armor.png",
  "armor-2": "/api/images/magic-items/armor-2.png",
  "armor-3": "/api/images/magic-items/armor-3.png",
  "armor-of-invulnerability": "/api/images/magic-items/armor-of-invulnerability.png",
  "armor-of-resistance": "/api/images/magic-items/armor-of-resistance.png",
  "armor-of-vulnerability": "/api/images/magic-items/armor-of-vulnerability.png",
  "arrow-catching-shield": "/api/images/magic-items/arrow-catching-shield.png",
  "arrow-of-slaying": "/api/images/magic-items/arrow-of-slaying.png",
  "bag-of-beans": "/api/images/magic-items/bag-of-beans.png",
  "bag-of-devouring": "/api/images/magic-items/bag-of-devouring.png",
  "bag-of-holding": "/api/images/magic-items/bag-of-holding.png",
  "bag-of-tricks": "/api/images/magic-items/bag-of-tricks.png",
  "bag-of-tricks-gray": "/api/images/magic-items/bag-of-tricks.png",
  "bag-of-tricks-rust": "/api/images/magic-items/bag-of-tricks.png",
  "bag-of-tricks-tan": "/api/images/magic-items/bag-of-tricks.png",
  "bead-of-force": "/api/images/magic-items/bead-of-force.png",
  "belt-of-dwarvenkind": "/api/images/magic-items/belt-of-dwarvenkind.png",
  "belt-of-giant-strength": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-cloud": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-fire": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-frost": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-hill": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-stone": "/api/images/magic-items/belt-of-giant-strength.png",
  "belt-of-giant-strength-storm": "/api/images/magic-items/belt-of-giant-strength.png",
  "berserker-axe": "/api/images/magic-items/berserker-axe.png",
  "boots-of-elvenkind": "/api/images/magic-items/boots-of-elvenkind.png",
  "boots-of-levitation": "/api/images/magic-items/boots-of-levitation.png",
  "boots-of-speed": "/api/images/magic-items/boots-of-speed.png",
  "boots-of-striding-and-springing": "/api/images/magic-items/boots-of-striding-and-springing.png",
  "boots-of-the-winterlands": "/api/images/magic-items/boots-of-the-winterlands.png",
  "bracers-of-archery": "/api/images/magic-items/bracers-of-archery.png",
  "bracers-of-defense": "/api/images/magic-items/bracers-of-defense.png",
  "brazier-of-commanding-fire-elementals": "/api/images/magic-items/brazier-of-commanding-fire-elementals.png",
  "brooch-of-shielding": "/api/images/magic-items/brooch-of-shielding.png",
  "broom-of-flying": "/api/images/magic-items/broom-of-flying.png",
  "candle-of-invocation": "/api/images/magic-items/candle-of-invocation.png",
  "cape-of-the-mountebank": "/api/images/magic-items/cape-of-the-mountebank.png",
  "carpet-of-flying": "/api/images/magic-items/carpet-of-flying.png",
  "carpet-of-flying-3x5": "/api/images/magic-items/carpet-of-flying.png",
  "carpet-of-flying-4x6": "/api/images/magic-items/carpet-of-flying.png",
  "carpet-of-flying-5x7": "/api/images/magic-items/carpet-of-flying.png",
  "carpet-of-flying-6x9": "/api/images/magic-items/carpet-of-flying.png",
  "censer-of-controlling-air-elementals": "/api/images/magic-items/censer-of-controlling-air-elementals.png",
  "chime-of-opening": "/api/images/magic-items/chime-of-opening.png",
  "circlet-of-blasting": "/api/images/magic-items/circlet-of-blasting.png",
  "cloak-of-arachnida": "/api/images/magic-items/cloak-of-arachnida.png",
  "cloak-of-displacement": "/api/images/magic-items/cloak-of-displacement.png",
  "cloak-of-elvenkind": "/api/images/magic-items/cloak-of-elvenkind.png",
  "cloak-of-protection": "/api/images/magic-items/cloak-of-protection.png",
  "cloak-of-the-bat": "/api/images/magic-items/cloak-of-the-bat.png",
  "cloak-of-the-manta-ray": "/api/images/magic-items/cloak-of-the-manta-ray.png",
  "crystal-ball": "/api/images/magic-items/crystal-ball.png",
  "crystal-ball-of-mind-reading": "/api/images/magic-items/crystal-ball-of-mind-reading.png",
  "crystal-ball-of-telepathy": "/api/images/magic-items/crystal-ball-of-telepathy.png",
  "crystal-ball-of-true-seeing": "/api/images/magic-items/crystal-ball-of-true-seeing.png",
  "cube-of-force": "/api/images/magic-items/cube-of-force.png",
  "cubic-gate": "/api/images/magic-items/cubic-gate.png",
  "dagger-of-venom": "/api/images/magic-items/dagger-of-venom.png",
  "dancing-sword": "/api/images/magic-items/dancing-sword.png",
  "decanter-of-endless-water": "/api/images/magic-items/decanter-of-endless-water.png",
  "deck-of-illusions": "/api/images/magic-items/deck-of-illusions.png",
  "deck-of-many-things": "/api/images/magic-items/deck-of-many-things.png",
  "defender": "/api/images/magic-items/defender.png",
  "demon-armor": "/api/images/magic-items/demon-armor.png",
  "dimensional-shackles": "/api/images/magic-items/dimensional-shackles.png",
  "dragon-scale-mail": "/api/images/magic-items/dragon-scale-mail.png",
  "dragon-scale-mail-black": "/api/images/magic-items/dragon-scale-mail-black.png",
  "dragon-scale-mail-blue": "/api/images/magic-items/dragon-scale-mail-blue.png",
  "dragon-scale-mail-brass": "/api/images/magic-items/dragon-scale-mail-brass.png",
  "dragon-scale-mail-bronze": "/api/images/magic-items/dragon-scale-mail-bronze.png",
  "dragon-scale-mail-copper": "/api/images/magic-items/dragon-scale-mail-copper.png",
  "dragon-scale-mail-gold": "/api/images/magic-items/dragon-scale-mail-gold.png",
  "dragon-scale-mail-green": "/api/images/magic-items/dragon-scale-mail-green.png",
  "dragon-scale-mail-red": "/api/images/magic-items/dragon-scale-mail-red.png",
  "dragon-scale-mail-silver": "/api/images/magic-items/dragon-scale-mail-silver.png",
  "dragon-scale-mail-white": "/api/images/magic-items/dragon-scale-mail-white.png",
  "dragon-slayer": "/api/images/magic-items/dragon-slayer.png",
  "dust-of-disappearance": "/api/images/magic-items/dust-of-disappearance.png",
  "dust-of-dryness": "/api/images/magic-items/dust-of-dryness.png",
  "dust-of-sneezing-and-choking": "/api/images/magic-items/dust-of-sneezing-and-choking.png",
  "dwarven-plate": "/api/images/magic-items/dwarven-plate.png",
  "dwarven-thrower": "/api/images/magic-items/dwarven-thrower.png",
  "efficient-quiver": "/api/images/magic-items/efficient-quiver.png",
  "efreeti-bottle": "/api/images/magic-items/efreeti-bottle.png",
  "elemental-gem": "/api/images/magic-items/elemental-gem.png",
  "elemental-gem-air": "/api/images/magic-items/elemental-gem-air.png",
  "elemental-gem-earth": "/api/images/magic-items/elemental-gem-earth.png",
  "elemental-gem-fire": "/api/images/magic-items/elemental-gem-fire.png",
  "elemental-gem-water": "/api/images/magic-items/elemental-gem-water.png",
  "potion-of-resistance": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-fire": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-acid": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-cold": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-force": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-lightning": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-necrotic": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-poison": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-psychic": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-radiant": "/api/images/magic-items/potion-of-resistance-fire.png",
  "potion-of-resistance-thunder": "/api/images/magic-items/potion-of-resistance-fire.png",
};

export interface ImageResolvable {
  name: string;
  slug?: string;
  image?: string;
  tags?: string[];
}

/**
 * Returns the full remote URL of the item image if available from the API,
 * custom image field, or smart family aliases.
 */
export function getItemImageUrl(item: ImageResolvable): string | null {
  if (item.image) return item.image;

  // 1. Direct slug lookup
  if (item.slug && SRD_ITEM_IMAGES[item.slug]) {
    const path = SRD_ITEM_IMAGES[item.slug];
    return path.startsWith("http") ? path : `${API_IMAGE_BASE}${path}`;
  }

  const s = (item.slug || "").toLowerCase();
  const n = (item.name || "").toLowerCase();

  // 2. Family fallbacks based on slug prefixes
  if (s.startsWith("potion-of-resistance")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/potion-of-resistance-fire.png`;
  }
  if (s.startsWith("dragon-scale-mail")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/dragon-scale-mail.png`;
  }
  if (s.startsWith("belt-of-giant-strength")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/belt-of-giant-strength.png`;
  }
  if (s.startsWith("bag-of-tricks")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/bag-of-tricks.png`;
  }
  if (s.startsWith("elemental-gem")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/elemental-gem.png`;
  }
  if (s.startsWith("carpet-of-flying")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/carpet-of-flying.png`;
  }
  if (s.startsWith("crystal-ball")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/crystal-ball.png`;
  }
  if (s.startsWith("ammunition") || s === "arrow-of-slaying") {
    return `${API_IMAGE_BASE}/api/images/magic-items/ammunition.png`;
  }
  if (s.startsWith("armor-of-resistance")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/armor-of-resistance.png`;
  }

  // 3. Name-based aliases
  if (n.includes("ammunition of slaying")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/arrow-of-slaying.png`;
  }
  if (n.endsWith("ammunition")) {
    return `${API_IMAGE_BASE}/api/images/magic-items/ammunition.png`;
  }
  if (n === "dragon armor") {
    return `${API_IMAGE_BASE}/api/images/magic-items/dragon-scale-mail.png`;
  }
  if (n === "dwarven armor") {
    return `${API_IMAGE_BASE}/api/images/magic-items/dwarven-plate.png`;
  }

  return null;
}

export type CategoryVisual = {
  icon: LucideIcon;
  label: string;
};

/**
 * Intelligently selects a rich, specific fantasy icon and label
 * based on item name, tags, and item category.
 */
export function getItemCategoryVisual(itemOrTags: ImageResolvable | string[] = []): CategoryVisual {
  const isArray = Array.isArray(itemOrTags);
  const tags: string[] = isArray ? itemOrTags : (itemOrTags.tags || []);
  const name: string = isArray ? "" : (itemOrTags.name || "").toLowerCase();

  // 1. Ranged Weapons & Ammunition
  if (
    name.includes("bow") ||
    name.includes("crossbow") ||
    name.includes("arrow") ||
    name.includes("bolt") ||
    name.includes("quiver")
  ) {
    return { icon: Crosshair, label: "Ranged Weapon / Ammo" };
  }

  // 2. Axes & Polearms
  if (name.includes("axe") || name.includes("halberd") || name.includes("glaive")) {
    return { icon: Axe, label: "Axe / Polearm" };
  }

  // 3. Bludgeoning & Heavy Weapons
  if (
    name.includes("hammer") ||
    name.includes("mace") ||
    name.includes("flail") ||
    name.includes("morningstar") ||
    name.includes("maul") ||
    name.includes("club")
  ) {
    return { icon: Hammer, label: "Bludgeoning Weapon" };
  }

  // 4. Bladed & General Weapons
  if (
    tags.includes("Weapon") ||
    name.includes("sword") ||
    name.includes("blade") ||
    name.includes("dagger") ||
    name.includes("scimitar") ||
    name.includes("rapier") ||
    name.includes("spear") ||
    name.includes("trident") ||
    name.includes("lance")
  ) {
    return { icon: Sword, label: "Weapon" };
  }

  // 5. Shields & Armor
  if (tags.includes("Shield") || name.includes("shield")) {
    return { icon: Shield, label: "Shield" };
  }
  if (tags.includes("Armor") || name.includes("armor") || name.includes("mail") || name.includes("plate") || name.includes("breastplate")) {
    return { icon: Shield, label: "Armor" };
  }

  // 6. Footwear
  if (name.includes("boot") || name.includes("slipper") || name.includes("shoe")) {
    return { icon: Footprints, label: "Footwear" };
  }

  // 7. Headwear
  if (
    name.includes("helm") ||
    name.includes("circlet") ||
    name.includes("crown") ||
    name.includes("hat") ||
    name.includes("cap") ||
    name.includes("mask")
  ) {
    return { icon: Crown, label: "Headwear" };
  }

  // 8. Cloaks & Robes
  if (
    tags.includes("Cloak") ||
    name.includes("cloak") ||
    name.includes("robe") ||
    name.includes("cape") ||
    name.includes("mantle") ||
    name.includes("coat")
  ) {
    return { icon: Feather, label: "Cloak / Robe" };
  }

  // 9. Handwear & Bracers
  if (name.includes("glove") || name.includes("gauntlet") || name.includes("bracer")) {
    return { icon: Hand, label: "Handwear / Bracers" };
  }

  // 10. Arcane Tomes & Books
  if (
    name.includes("tome") ||
    name.includes("manual") ||
    name.includes("book") ||
    name.includes("grimoire") ||
    name.includes("spellbook")
  ) {
    return { icon: BookOpen, label: "Tome / Grimoire" };
  }

  // 11. Scrolls
  if (tags.includes("Scroll") || name.includes("scroll")) {
    return { icon: Scroll, label: "Scroll" };
  }

  // 12. Wands, Rods, Staves
  if (tags.includes("Staff") || name.includes("staff")) {
    return { icon: Sparkles, label: "Staff" };
  }
  if (tags.includes("Rod") || name.includes("rod")) {
    return { icon: Wand2, label: "Rod" };
  }
  if (tags.includes("Wand") || name.includes("wand")) {
    return { icon: Wand2, label: "Wand" };
  }

  // 13. Rings & Belts
  if (tags.includes("Ring") || name.includes("ring") || name.includes("band")) {
    return { icon: CircleDot, label: "Ring" };
  }
  if (name.includes("belt") || name.includes("girdle") || name.includes("sash")) {
    return { icon: CircleDot, label: "Belt" };
  }

  // 14. Potions & Elixirs
  if (tags.includes("Potion") || name.includes("potion") || name.includes("elixir") || name.includes("oil") || name.includes("philter")) {
    return { icon: FlaskConical, label: "Potion / Elixir" };
  }

  // 15. Instruments
  if (
    name.includes("lute") ||
    name.includes("horn") ||
    name.includes("harp") ||
    name.includes("flute") ||
    name.includes("drum") ||
    name.includes("instrument") ||
    name.includes("pipes") ||
    name.includes("chime") ||
    name.includes("bell") ||
    name.includes("lyre")
  ) {
    return { icon: Music, label: "Instrument" };
  }

  // 16. Bags & Storage
  if (name.includes("bag") || name.includes("pouch") || name.includes("haversack") || name.includes("pack") || name.includes("chest")) {
    return { icon: Package, label: "Bag / Storage" };
  }

  // 17. Light & Fire Vessels
  if (name.includes("candle") || name.includes("lamp") || name.includes("lantern") || name.includes("torch") || name.includes("censer") || name.includes("brazier")) {
    return { icon: Flame, label: "Light / Vessel" };
  }

  // 18. Decks & Cards
  if (name.includes("deck") || name.includes("cards")) {
    return { icon: Layers, label: "Deck of Cards" };
  }

  // 19. Optics & Sight
  if (name.includes("eye") || name.includes("goggles") || name.includes("spectacles") || name.includes("lens") || name.includes("monocle")) {
    return { icon: Eye, label: "Optics / Sight" };
  }

  // 20. Navigation & Time
  if (name.includes("compass") || name.includes("clock") || name.includes("hourglass")) {
    return { icon: Compass, label: "Navigation / Time" };
  }

  // 21. Wealth & Currency
  if (name.includes("coin") || name.includes("gold") || name.includes("purse")) {
    return { icon: Coins, label: "Currency / Wealth" };
  }

  // 22. Jewelry & Gem Focus
  if (
    name.includes("amulet") ||
    name.includes("necklace") ||
    name.includes("periapt") ||
    name.includes("medallion") ||
    name.includes("talisman") ||
    name.includes("brooch") ||
    name.includes("gem") ||
    name.includes("pearl") ||
    name.includes("stone") ||
    name.includes("crystal") ||
    name.includes("orb") ||
    name.includes("pendant")
  ) {
    return { icon: Gem, label: "Jewelry / Gem Focus" };
  }

  // 23. Artisan Tools
  if (tags.includes("Tool") || name.includes("tool")) {
    return { icon: Wrench, label: "Artisan Tool" };
  }

  // 24. Default Wondrous Item
  return { icon: Sparkles, label: "Wondrous Item" };
}
