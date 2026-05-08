import { getFoodIcon } from '../lib/constants'

// Affiche l'icône Lucide d'un aliment (colorée) à partir de son id string.
// Retourne null si aucune icône n'est associée.
export default function FoodIcon({ id, size = 18 }) {
  const entry = getFoodIcon(id)
  return entry
    ? <entry.Icon size={size} strokeWidth={1.75} className={`${entry.color} shrink-0`} />
    : null
}
