import { useState } from 'react'
import { Plus, ChevronLeft, Trash2 } from 'lucide-react'
import { useFoods } from '../hooks/useFoods'

// ─── FoodsSheet — gestion de la base d'aliments ─────────────
// Deux vues : liste (par défaut) et formulaire (création/édition).
// Pas de modale imbriquée : on swap le contenu de la BottomSheet parente.
export default function FoodsSheet() {
  const { foods, loading, addFood, updateFood, archiveFood } = useFoods()
  const [editing, setEditing] = useState(null) // null | 'new' | <food object>

  // Mode formulaire
  if (editing !== null) {
    return (
      <FoodForm
        food={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={async (data) => {
          const result = editing === 'new'
            ? await addFood(data)
            : await updateFood(editing.id, data)
          if (!result.error) setEditing(null)
          return result
        }}
        onArchive={editing === 'new' ? null : async () => {
          const result = await archiveFood(editing.id)
          if (!result.error) setEditing(null)
          return result
        }}
      />
    )
  }

  // Mode liste
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setEditing('new')}
        className="flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-3 text-sm font-medium active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={2.5} />
        Ajouter un aliment
      </button>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Chargement…</p>
      ) : foods.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Aucun aliment</p>
          <p className="text-xs text-zinc-400">Commence par en ajouter un avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {foods.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setEditing(f)}
              className={`flex items-center justify-between py-3 active:bg-zinc-50 transition-colors text-left ${
                i < foods.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-zinc-900">{f.name}</span>
                <span className="text-xs text-zinc-400">
                  {f.kcal} kcal · {f.proteins}g protéines · {f.default_unit}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire — création ou édition d'un aliment ──────────
// Champs minimaux pour le MVP : nom, kcal/100g, macros, unité par défaut.
// Le scan EAN et OpenFoodFacts viendront dans une itération suivante.
function FoodForm({ food, onCancel, onSave, onArchive }) {
  const [name,        setName]        = useState(food?.name ?? '')
  const [kcal,        setKcal]        = useState(String(food?.kcal ?? ''))
  const [proteins,    setProteins]    = useState(String(food?.proteins ?? ''))
  const [carbs,       setCarbs]       = useState(String(food?.carbs ?? ''))
  const [fats,        setFats]        = useState(String(food?.fats ?? ''))
  const [defaultUnit, setDefaultUnit] = useState(food?.default_unit ?? 'g')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  const canSave = name.trim().length > 0 && kcal !== ''

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onSave({
      name:         name.trim(),
      kcal:         parseFloat(kcal),
      proteins:     parseFloat(proteins) || 0,
      carbs:        parseFloat(carbs)    || 0,
      fats:         parseFloat(fats)     || 0,
      default_unit: defaultUnit,
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    }
  }

  // Liste des inputs numériques (macros) pour éviter la duplication
  const macroInputs = [
    { label: 'Calories',  value: kcal,     onChange: setKcal,     unit: 'kcal', help: 'Pour 100g / 100ml' },
    { label: 'Protéines', value: proteins, onChange: setProteins, unit: 'g'    },
    { label: 'Glucides',  value: carbs,    onChange: setCarbs,    unit: 'g'    },
    { label: 'Lipides',   value: fats,     onChange: setFats,     unit: 'g'    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header — retour vers la liste */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1 -ml-1 text-zinc-500 active:text-zinc-700 transition-colors w-fit"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Nom */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Nom
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Pain de mie complet"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
      </div>

      {/* Macros */}
      {macroInputs.map(({ label, value, onChange, unit, help }) => (
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

      {/* Unité par défaut */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Unité par défaut
        </label>
        <select
          value={defaultUnit}
          onChange={e => setDefaultUnit(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors appearance-none"
        >
          <option value="g">Grammes (g)</option>
          <option value="ml">Millilitres (ml)</option>
          <option value="unité">Unité</option>
          <option value="tranche">Tranche</option>
          <option value="cuillère">Cuillère</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Boutons */}
      <div className="flex gap-3 pt-2">
        {onArchive ? (
          <button
            onClick={onArchive}
            className="px-4 border border-red-200 rounded-2xl py-3.5 text-sm text-red-500 font-medium active:bg-red-50 transition-colors"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 border border-zinc-200 rounded-2xl py-3.5 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
