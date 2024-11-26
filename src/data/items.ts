export type Item = {
  id: number;
  name: string;
  description: string;
  price: number;
  tags: string[];
}

export const items: Item[] = [
  {
    id: 1,
    name: "Vorpal Sword",
    description: "A legendary sword capable of decapitation.",
    price: 5000,
    tags: ["weapon", "sword", "legendary"],
  },
  {
    id: 2,
    name: "Bag of Holding",
    description: "A magical bag with an interior space larger than its exterior.",
    price: 500,
    tags: ["container", "magic"],
  },
  {
    id: 3,
    name: "Potion of Healing",
    description: "Restores 2d4+2 hit points when consumed.",
    price: 50,
    tags: ["potion", "consumable"],
  },
  {
    id: 4,
    name: "Ring of Protection",
    description: "Grants a +1 bonus to AC and saving throws.",
    price: 3500,
    tags: ["ring", "magic", "protection"],
  },
  {
    id: 5,
    name: "Wand of Magic Missiles",
    description: "Casts Magic Missile as a 1st-level spell.",
    price: 300,
    tags: ["wand", "magic"]
  },
];

export const lowestPrice = Math.min(...items.map(item => item.price));
export const highestPrice = Math.max(...items.map(item => item.price));

export const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

