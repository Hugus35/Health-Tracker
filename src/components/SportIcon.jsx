import { getSportIcon } from '../lib/constants'

// Affiche l'icône Lucide colorée d'un sport à partir de son id DB.
// Retourne null si l'id est inconnu.
export default function SportIcon({ id, size = 18 }) {
  const entry = getSportIcon(id)
  return entry
    ? <entry.Icon size={size} strokeWidth={1.75} className={`${entry.color} shrink-0`} />
    : null
}
