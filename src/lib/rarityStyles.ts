export const rarityRingClass = (rarity: string | undefined): string => {
  switch (rarity) {
    case "Uncommon":
      return "ring-emerald-300/60 dark:ring-emerald-700/40";
    case "Rare":
      return "ring-sky-300/60 dark:ring-sky-700/40";
    case "Very Rare":
      return "ring-violet-300/60 dark:ring-violet-700/40";
    case "Legendary":
      return "ring-amber-300/70 dark:ring-amber-700/50";
    case "Artifact":
      return "ring-red-300/70 dark:ring-red-700/50";
    default:
      return "ring-transparent";
  }
};
