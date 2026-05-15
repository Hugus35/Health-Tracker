import { Apple, ChevronRight, Dumbbell, User } from 'lucide-react'
import { useState } from 'react'
import BottomSheet from './BottomSheet'
import FoodsSheet from './FoodsSheet'
import ProfileSheet from './ProfileSheet'
import SportsSheet from './SportsSheet'

// ─── Constantes ──────────────────────────────────────────────

const SETTINGS_ITEMS = [
  { id: 'profile',   label: 'Profil',        sub: 'Poids, objectif, macros',   Icon: User,     color: 'text-blue-500'    },
  { id: 'foods',     label: 'Mes aliments',  sub: "Base d'aliments perso",     Icon: Apple,    color: 'text-emerald-500' },
  { id: 'sports',    label: 'Mes sports',    sub: 'Catalogue de sports',       Icon: Dumbbell, color: 'text-orange-500'  },
]

// ─── Page principale Settings ─────────────────────────────────
// Les settings sont passés en paramètres de ProfileSheet pour éviter une latence au chargement du modal
export default function Settings({ settings, updateSettings }) {
  const [openSheet, setOpenSheet] = useState(null)  // 'profile' | 'foods' | 'sports' | null

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Réglages</h1>

      <div className="flex flex-col gap-2">
        {SETTINGS_ITEMS.map(({ id, label, sub, Icon, color }) => (
          <button
            key={id}
            onClick={() => setOpenSheet(id)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 active:bg-zinc-100 transition-colors text-left"
          >
            <div className="p-2 rounded-xl bg-white border border-zinc-200">
              <Icon size={20} className={color} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-semibold text-zinc-900">{label}</span>
              <span className="text-xs text-zinc-400">{sub}</span>
            </div>
            <ChevronRight size={18} className="text-zinc-300" strokeWidth={1.75} />
          </button>
        ))}
      </div>

      <BottomSheet
        open={openSheet === 'profile'} onClose={() => setOpenSheet(null)} title="Profil">
        <ProfileSheet settings={settings} updateSettings={updateSettings} />
      </BottomSheet>

      <BottomSheet open={openSheet === 'foods'} onClose={() => setOpenSheet(null)} title="Mes aliments">
        <FoodsSheet />
      </BottomSheet>

      <BottomSheet open={openSheet === 'sports'} onClose={() => setOpenSheet(null)} title="Mes sports">
        <SportsSheet />
      </BottomSheet>
    </div>
  )
}
