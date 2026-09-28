import {
  Eye,
  Flame,
  Ghost,
  Heart,
  Shapes,
  Shield,
  Skull,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type SchoolStyle = {
  /** Badge shown in the detail dialog (e.g. "Level 3 · Evocation") */
  badge: string;
  /** Background gradient behind the card's icon panel */
  panel: string;
  /** Color of the icon itself */
  icon: string;
  /** Filter pill in the sidebar when selected */
  pillActive: string;
  /** Filter pill in the sidebar when not selected */
  pillInactive: string;
};

const SCHOOL_STYLES: Record<string, SchoolStyle> = {
  Abjuration: {
    badge:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-300",
    panel: "from-blue-100 via-blue-50 to-card dark:from-blue-950/40 dark:via-blue-950/10 dark:to-card",
    icon: "text-blue-600 dark:text-blue-400",
    pillActive:
      "border-blue-400 bg-blue-200 text-blue-900 dark:border-blue-600 dark:bg-blue-900/60 dark:text-blue-100",
    pillInactive:
      "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
  },
  Conjuration: {
    badge:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300",
    panel:
      "from-amber-100 via-amber-50 to-card dark:from-amber-950/40 dark:via-amber-950/10 dark:to-card",
    icon: "text-amber-600 dark:text-amber-400",
    pillActive:
      "border-amber-400 bg-amber-200 text-amber-900 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-100",
    pillInactive:
      "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
  },
  Divination: {
    badge:
      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-950/40 dark:text-cyan-300",
    panel: "from-cyan-100 via-cyan-50 to-card dark:from-cyan-950/40 dark:via-cyan-950/10 dark:to-card",
    icon: "text-cyan-600 dark:text-cyan-400",
    pillActive:
      "border-cyan-400 bg-cyan-200 text-cyan-900 dark:border-cyan-600 dark:bg-cyan-900/60 dark:text-cyan-100",
    pillInactive:
      "border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/70",
  },
  Enchantment: {
    badge:
      "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700/60 dark:bg-pink-950/40 dark:text-pink-300",
    panel: "from-pink-100 via-pink-50 to-card dark:from-pink-950/40 dark:via-pink-950/10 dark:to-card",
    icon: "text-pink-600 dark:text-pink-400",
    pillActive:
      "border-pink-400 bg-pink-200 text-pink-900 dark:border-pink-600 dark:bg-pink-900/60 dark:text-pink-100",
    pillInactive:
      "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-300 dark:hover:bg-pink-950/70",
  },
  Evocation: {
    badge:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300",
    panel: "from-red-100 via-red-50 to-card dark:from-red-950/40 dark:via-red-950/10 dark:to-card",
    icon: "text-red-600 dark:text-red-400",
    pillActive:
      "border-red-400 bg-red-200 text-red-900 dark:border-red-600 dark:bg-red-900/60 dark:text-red-100",
    pillInactive:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70",
  },
  Illusion: {
    badge:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-300",
    panel:
      "from-violet-100 via-violet-50 to-card dark:from-violet-950/40 dark:via-violet-950/10 dark:to-card",
    icon: "text-violet-600 dark:text-violet-400",
    pillActive:
      "border-violet-400 bg-violet-200 text-violet-900 dark:border-violet-600 dark:bg-violet-900/60 dark:text-violet-100",
    pillInactive:
      "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
  },
  Necromancy: {
    badge:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    panel:
      "from-emerald-100 via-emerald-50 to-card dark:from-emerald-950/40 dark:via-emerald-950/10 dark:to-card",
    icon: "text-emerald-700 dark:text-emerald-400",
    pillActive:
      "border-emerald-400 bg-emerald-200 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-100",
    pillInactive:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
  },
  Transmutation: {
    badge:
      "border-lime-300 bg-lime-50 text-lime-700 dark:border-lime-700/60 dark:bg-lime-950/40 dark:text-lime-300",
    panel: "from-lime-100 via-lime-50 to-card dark:from-lime-950/40 dark:via-lime-950/10 dark:to-card",
    icon: "text-lime-600 dark:text-lime-400",
    pillActive:
      "border-lime-400 bg-lime-200 text-lime-900 dark:border-lime-600 dark:bg-lime-900/60 dark:text-lime-100",
    pillInactive:
      "border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100 dark:border-lime-700 dark:bg-lime-950/40 dark:text-lime-300 dark:hover:bg-lime-950/70",
  },
};

const DEFAULT_STYLE: SchoolStyle = {
  badge: "border-border bg-secondary text-secondary-foreground",
  panel: "from-muted/50 via-muted/20 to-card",
  icon: "text-muted-foreground",
  pillActive: "border-primary bg-primary text-primary-foreground",
  pillInactive: "border-border bg-background text-foreground hover:bg-accent",
};

export const schoolStyle = (school: string): SchoolStyle =>
  SCHOOL_STYLES[school] ?? DEFAULT_STYLE;

const SCHOOL_ICONS: Record<string, LucideIcon> = {
  Abjuration: Shield,
  Conjuration: Sparkles,
  Divination: Eye,
  Enchantment: Heart,
  Evocation: Flame,
  Illusion: Ghost,
  Necromancy: Skull,
  Transmutation: Shapes,
};

export const schoolIcon = (school: string): LucideIcon =>
  SCHOOL_ICONS[school] ?? Sparkles;
