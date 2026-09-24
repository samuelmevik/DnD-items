import type { LucideIcon } from "lucide-react";
import {
  CircleDot,
  Feather,
  FlaskConical,
  Gem,
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
  "potion-of-resistance-fire": "/api/2014/magic-items/potion-of-resistance-fire.png"
};

export interface ImageResolvable {
  name: string;
  slug?: string;
  image?: string;
  tags?: string[];
}

/**
 * Returns the full remote URL of the item image if available from the API or custom image field.
 */
export function getItemImageUrl(item: ImageResolvable): string | null {
  if (item.image) return item.image;
  if (!item.slug) return null;

  const path = SRD_ITEM_IMAGES[item.slug];
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_IMAGE_BASE}${path}`;
}

export type CategoryVisual = {
  icon: LucideIcon;
  label: string;
};

/**
 * Selects an appropriate fantasy category icon for items without dedicated illustrations.
 */
export function getItemCategoryVisual(tags: string[] = []): CategoryVisual {
  if (tags.includes("Weapon")) return { icon: Sword, label: "Weapon" };
  if (tags.includes("Armor") || tags.includes("Shield")) return { icon: Shield, label: "Armor" };
  if (tags.includes("Potion")) return { icon: FlaskConical, label: "Potion" };
  if (tags.includes("Ring")) return { icon: CircleDot, label: "Ring" };
  if (tags.includes("Scroll")) return { icon: Scroll, label: "Scroll" };
  if (tags.includes("Wand")) return { icon: Wand2, label: "Wand" };
  if (tags.includes("Staff") || tags.includes("Rod")) return { icon: Sparkles, label: "Staff/Rod" };
  if (tags.includes("Cloak")) return { icon: Feather, label: "Cloak/Garment" };
  if (tags.includes("Tool")) return { icon: Wrench, label: "Tool" };
  return { icon: Gem, label: "Wondrous Item" };
}
