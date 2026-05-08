import {
  Apple, Coffee, Moon, Utensils,
  Beef, Beer, Cake, Carrot, Cherry, Cookie, CupSoda, Drumstick,
  Egg, Fish, GlassWater, Grape, IceCream, Leaf, Milk, Nut,
  Pizza, Salad, Sandwich, Soup, UtensilsCrossed, Wheat, Wine, Croissant,
} from 'lucide-react'

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

// Retourne l'entrée complète { id, Icon, color } depuis le nom stocké en DB
export function getFoodIcon(id) {
  return id ? (FOOD_ICONS.find(f => f.id === id) ?? null) : null
}

export const MACRO_BARS = [
  { key: 'proteins', label: 'Protéines', kcalPerG: 4, color: 'bg-emerald-500' },
  { key: 'carbs',    label: 'Glucides',  kcalPerG: 4, color: 'bg-amber-400'   },
  { key: 'fats',     label: 'Lipides',   kcalPerG: 9, color: 'bg-orange-400'  },
]  