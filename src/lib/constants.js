import {
  Apple,
  Beef, Beer, Cake, Carrot, Cherry,
  CircleDot,
  Coffee,
  Cookie,
  Croissant,
  CupSoda, Drumstick,
  Dumbbell,
  Egg, Fish,
  Footprints,
  Gauge,
  GlassWater, Grape,
  Hash,
  IceCream, Leaf, Milk,
  Minus,
  Moon,
  Nut,
  Pizza,
  Repeat2, Route,
  Salad, Sandwich, Soup,
  Timer,
  TrendingDown, TrendingUp,
  Utensils,
  UtensilsCrossed,
  Volleyball,
  Waves,
  Wheat, Wine,
  Zap
} from 'lucide-react'

// ─── Objectifs calorifiques ───────────────────────────────────────────
// Source unique partagée entre Onboarding et Settings.
export const GOALS = [
  { value: -1, label: 'Perdre du poids', Icon: TrendingDown, color: 'text-emerald-500' },
  { value:  0, label: 'Maintien',         Icon: Minus,        color: 'text-zinc-400'    },
  { value:  1, label: 'Prise de masse',   Icon: TrendingUp,   color: 'text-red-500'     },
]

// ─── Types de repas ───────────────────────────────────────────
// Source unique partagée entre MealModal et Journal.
export const MEAL_TYPES = [
  { id: 'morning', label: 'Matin',  Icon: Coffee,   color: 'text-amber-400'  },
  { id: 'lunch',   label: 'Midi',   Icon: Utensils, color: 'text-orange-400' },
  { id: 'dinner',  label: 'Soir',   Icon: Moon,     color: 'text-indigo-400' },
  { id: 'snack',   label: 'Snack',  Icon: Apple,    color: 'text-zinc-400'   },
]

// ─── Unités de mesure ─────────────────────────────────────────
// isServing = true  → macros dans foods = pour 1 unité/tranche/cuillère
// isServing = false → macros dans foods = pour 100g / 100ml
export const UNITS = [
  { id: 'g',        label: 'g',        isServing: false },
  { id: 'ml',       label: 'ml',       isServing: false },
  { id: 'unité',    label: 'unité',    isServing: true  },
  { id: 'tranche',  label: 'tranche',  isServing: true  },
  { id: 'cuillère', label: 'cuillère', isServing: true  },
]

// ─── Icônes aliments ──────────────────────────────────────────
// Icônes Lucide proposées dans le picker. L'id (string) est stocké en DB.
// getFoodIcon(id) retourne le composant React correspondant.
export const FOOD_ICONS = [
  { id: 'Apple',           Icon: Apple,           color: 'text-red-400'    },
  { id: 'Cherry',          Icon: Cherry,          color: 'text-red-500'    },
  { id: 'Grape',           Icon: Grape,           color: 'text-purple-400' },
  { id: 'Carrot',          Icon: Carrot,          color: 'text-orange-400' },
  { id: 'Leaf',            Icon: Leaf,            color: 'text-green-500'  },
  { id: 'Salad',           Icon: Salad,           color: 'text-green-400'  },
  { id: 'Beef',            Icon: Beef,            color: 'text-red-600'    },
  { id: 'Drumstick',       Icon: Drumstick,       color: 'text-amber-600'  },
  { id: 'Fish',            Icon: Fish,            color: 'text-sky-400'    },
  { id: 'Egg',             Icon: Egg,             color: 'text-yellow-400' },
  { id: 'Nut',             Icon: Nut,             color: 'text-amber-700'  },
  { id: 'Wheat',           Icon: Wheat,           color: 'text-yellow-500' },
  { id: 'Croissant',       Icon: Croissant,       color: 'text-amber-400'  },
  { id: 'Sandwich',        Icon: Sandwich,        color: 'text-amber-500'  },
  { id: 'Pizza',           Icon: Pizza,           color: 'text-orange-500' },
  { id: 'Soup',            Icon: Soup,            color: 'text-orange-400' },
  { id: 'Milk',            Icon: Milk,            color: 'text-sky-300'    },
  { id: 'Coffee',          Icon: Coffee,          color: 'text-amber-800'  },
  { id: 'GlassWater',      Icon: GlassWater,      color: 'text-sky-400'    },
  { id: 'Wine',            Icon: Wine,            color: 'text-purple-500' },
  { id: 'Beer',            Icon: Beer,            color: 'text-yellow-400' },
  { id: 'CupSoda',         Icon: CupSoda,         color: 'text-pink-400'   },
  { id: 'Cookie',          Icon: Cookie,          color: 'text-amber-600'  },
  { id: 'Cake',            Icon: Cake,            color: 'text-pink-400'   },
  { id: 'IceCream',        Icon: IceCream,        color: 'text-pink-300'   },
  { id: 'UtensilsCrossed', Icon: UtensilsCrossed, color: 'text-zinc-400'   },
]

// ─── Icônes sports ────────────────────────────────────────────
// Liste des icônes disponibles dans le picker de SportsSheet.
// L'id (string) est stocké dans sport_types.icon en DB.
// getSportIcon(id) retourne { id, Icon, color } ou null.
export const SPORT_ICONS = [
  { id: 'Dumbbell',   Icon: Dumbbell,   color: 'text-blue-500'    },
  { id: 'Zap',        Icon: Zap,        color: 'text-amber-500'   },
  { id: 'Waves',      Icon: Waves,      color: 'text-sky-400'     },
  { id: 'Footprints', Icon: Footprints, color: 'text-emerald-500' },
  { id: 'CircleDot',  Icon: CircleDot,  color: 'text-orange-500'  },
  { id: 'Volleyball', Icon: Volleyball, color: 'text-yellow-500'  },
]

// ─── Icônes métriques ─────────────────────────────────────────
// Temps, distance, poids/charge, vitesse + quelques génériques.
export const METRIC_ICONS = [
  { id: 'Timer',    Icon: Timer,    color: 'text-sky-500',    label: 'Temps'    },
  { id: 'Route',    Icon: Route,    color: 'text-teal-500',   label: 'Distance' },
  { id: 'Dumbbell', Icon: Dumbbell, color: 'text-blue-500',   label: 'Charge'   },
  { id: 'Gauge',    Icon: Gauge,    color: 'text-red-500',    label: 'Vitesse'  },
  { id: 'Hash',     Icon: Hash,     color: 'text-zinc-500',   label: 'Comptage' },
  { id: 'Repeat2',  Icon: Repeat2,  color: 'text-violet-500', label: 'Séries'   },
]


// ─── Presets MET ──────────────────────────────────────────────
// Valeurs suggérées lors de la création d'un sport.
// L'user peut ensuite saisir une valeur libre.
export const MET_PRESETS = [
  { label: 'Léger',   value: 3.5 },
  { label: 'Modéré',  value: 6.0 },
  { label: 'Intense', value: 9.0 },
]

// ─── Fourchettes macros par objectif ─────────────────────────
// Chaque objectif définit des bornes min/max et une valeur par défaut (en %).
// Utilisé dans l'onboarding et les settings pour guider + contraindre la saisie.
export const MACRO_RANGES = {
  '-1': { // Perte de poids — protéines hautes, glucides modérés
    pct_protein: { min: 35, max: 45, default: 40 },
    pct_carbs:   { min: 30, max: 40, default: 35 },
  },
  '0': { // Maintien — répartition équilibrée
    pct_protein: { min: 25, max: 40, default: 30 },
    pct_carbs:   { min: 40, max: 55, default: 45 },
  },
  '1': { // Prise de masse — glucides élevés pour l'énergie
    pct_protein: { min: 30, max: 40, default: 35 },
    pct_carbs:   { min: 40, max: 50, default: 45 },
  },
}

export const MACRO_BARS = [
  { key: 'proteins', label: 'Protéines', kcalPerG: 4, color: 'bg-emerald-500' },
  { key: 'carbs',    label: 'Glucides',  kcalPerG: 4, color: 'bg-amber-400'   },
  { key: 'fats',     label: 'Lipides',   kcalPerG: 9, color: 'bg-orange-400'  },
]  