import { useState } from 'react'
import { ChevronRight, User, Apple, Dumbbell, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import BottomSheet from './BottomSheet'
import FoodsSheet from './FoodsSheet'

// ─── Constantes ──────────────────────────────────────────────
// Les 3 objectifs — value (-1/0/1) stocké dans settings.goal.
// Le pill agit aussi comme preset rapide pour deficit_target (-300 / 0 / +300).
const GOALS = [
  { value: -1, label: 'Perdre du poids', Icon: TrendingDown, color: 'text-emerald-500' },
  { value:  0, label: 'Maintien',         Icon: Minus,        color: 'text-zinc-400'    },
  { value:  1, label: 'Prise de masse',   Icon: TrendingUp,   color: 'text-red-500'     },
]

// ─── Page principale Settings ───────────────────────────────
// Liste de 3 entrées qui ouvrent chacune une BottomSheet.
export default function Settings({ settings, updateSettings }) {
  const [openSheet, setOpenSheet] = useState(null) // 'profile' | 'foods' | 'exercises' | null

  const items = [
    { id: 'profile',   label: 'Profil',         sub: 'Poids, objectif, calories', Icon: User,     color: 'text-blue-500'    },
    { id: 'foods',     label: 'Mes aliments',   sub: 'Base d\'aliments perso',    Icon: Apple,    color: 'text-emerald-500' },
    { id: 'exercises', label: 'Mes exercices',  sub: 'Catalogue d\'exercices',    Icon: Dumbbell, color: 'text-red-500'     },
  ]

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Réglages</h1>

      <div className="flex flex-col gap-2">
        {items.map(({ id, label, sub, Icon, color }) => (
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

      {/* Sheet Profil */}
      <BottomSheet
        open={openSheet === 'profile'}
        onClose={() => setOpenSheet(null)}
        title="Profil"
      >
        {settings && (
          <ProfileSheet settings={settings} updateSettings={updateSettings} />
        )}
      </BottomSheet>

      {/* Sheets aliments / exercices — à coder */}
      <BottomSheet
        open={openSheet === 'foods'}
        onClose={() => setOpenSheet(null)}
        title="Mes aliments"
      >
        <FoodsSheet />
      </BottomSheet>

      <BottomSheet
        open={openSheet === 'exercises'}
        onClose={() => setOpenSheet(null)}
        title="Mes exercices"
      >
        <p className="text-sm text-zinc-400">À venir</p>
      </BottomSheet>
    </div>
  )
}

// ─── Profil — vue + édition ─────────────────────────────────
// Bascule entre lecture (par défaut) et édition au clic sur "Modifier".
function ProfileSheet({ settings, updateSettings }) {
  const [editing, setEditing] = useState(false)

  return editing
    ? <ProfileEdit settings={settings} updateSettings={updateSettings} onDone={() => setEditing(false)} />
    : <ProfileView settings={settings} onEdit={() => setEditing(true)} />
}

// ─── Mode lecture ────────────────────────────────────────────
function ProfileView({ settings, onEdit }) {
  const goalLabel = GOALS.find(g => g.value === settings.goal)?.label
  const deficitDisplay = settings.deficit_target > 0
    ? `+${settings.deficit_target}`
    : settings.deficit_target

  const rows = [
    { label: 'Poids',              value: `${settings.weight_kg} kg`   },
    { label: 'Objectif',           value: goalLabel                    },
    { label: 'Calories au repos',  value: `${settings.kcal_rest} kcal` },
    { label: 'Déficit / surplus',  value: `${deficitDisplay} kcal`     },
    { label: 'Objectif protéines', value: `${settings.protein_target_g} g` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-3 ${i < rows.length - 1 ? 'border-b border-zinc-100' : ''}`}
          >
            <span className="text-sm text-zinc-500">{row.label}</span>
            <span className="text-sm font-semibold text-zinc-900">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onEdit}
        className="bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
      >
        Modifier
      </button>
    </div>
  )
}

// ─── Mode édition ────────────────────────────────────────────
// Le pill objectif est un preset rapide qui ajuste deficit_target
// (-300 / 0 / +300). L'utilisateur peut ensuite affiner le déficit manuellement.
function ProfileEdit({ settings, updateSettings, onDone }) {
  const [goal,     setGoal]     = useState(settings.goal)
  const [weight,   setWeight]   = useState(String(settings.weight_kg))
  const [kcalRest, setKcalRest] = useState(String(settings.kcal_rest))
  const [deficit,  setDeficit]  = useState(String(settings.deficit_target))
  const [proteins, setProteins] = useState(String(settings.protein_target_g))
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  // Click sur un pill : on bascule l'objectif et on met à jour
  // deficit_target avec la valeur preset (±300 / 0).
  const handleGoalChange = (val) => {
    setGoal(val)
    setDeficit(String(val * 300))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await updateSettings({
      weight_kg:        parseFloat(weight),
      kcal_rest:        parseFloat(kcalRest),
      deficit_target:   parseFloat(deficit),
      protein_target_g: parseFloat(proteins),
      goal,
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    } else {
      onDone()
    }
  }

  // Définition des inputs numériques pour éviter la duplication
  const inputs = [
    { label: 'Poids',              value: weight,   onChange: setWeight,   unit: 'kg'   },
    { label: 'Calories au repos',  value: kcalRest, onChange: setKcalRest, unit: 'kcal' },
    { label: 'Déficit / surplus',  value: deficit,  onChange: setDeficit,  unit: 'kcal', help: 'Négatif pour un déficit, positif pour un surplus.' },
    { label: 'Objectif protéines', value: proteins, onChange: setProteins, unit: 'g'    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Segmented control — objectif (icône colorée + label complet) */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Objectif
        </label>
        <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
          {GOALS.map(({ value, label, Icon, color }) => {
            const selected = goal === value
            return (
              <button
                key={value}
                onClick={() => handleGoalChange(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${
                  selected ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Icon size={18} className={color} strokeWidth={1.75} />
                <span className={`text-[11px] leading-tight text-center font-medium ${
                  selected ? 'text-zinc-900' : 'text-zinc-500'
                }`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Inputs numériques */}
      {inputs.map(({ label, value, onChange, unit, help }) => (
        <div key={label}>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
            {label}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-14 py-3 text-base font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">{unit}</span>
          </div>
          {help && <p className="text-xs text-zinc-400 mt-1.5">{help}</p>}
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Boutons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onDone}
          className="flex-1 border border-zinc-200 rounded-2xl py-3.5 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
