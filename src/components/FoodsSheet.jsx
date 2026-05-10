import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFoods } from '../hooks/useFoods'
import { FOOD_ICONS, UNITS } from '../lib/constants'
import FoodIcon from './FoodIcon'

// ─── FoodsSheet — gestion de la base d'aliments ─────────────
// Deux vues : 'list' (par défaut) et 'form' (création/édition).
// initialEditing : null → liste, 'new' → formulaire vide directement
// onCancel : callback de fermeture passé depuis MealModal
export default function FoodsSheet({ initialEditing = null, initialName = '', onCancel = null, onSaved = null }) {
  const { foods, loading, addFood, updateFood, archiveFood } = useFoods()
  const [view,        setView]        = useState(initialEditing === 'new' ? 'form' : 'list')
  const [editingFood, setEditingFood] = useState(null) // null = création, <food object> = édition

  const openCreate = () => { setEditingFood(null); setView('form') }
  const openEdit   = (food) => { setEditingFood(food); setView('form') }
  const backToList = () => { setEditingFood(null); setView('list') }

  // En mode form depuis MealModal (initialEditing='new'), "Retour" ferme le BottomSheet
  const handleCancel = view === 'form' && editingFood === null && onCancel ? onCancel : backToList

  if (view === 'form') {
    return (
      <FoodForm
        food={editingFood}
        initialName={editingFood ? undefined : initialName}
        onCancel={handleCancel}
        onSave={async (data) => {
          const result = editingFood
            ? await updateFood(editingFood.id, data)
            : await addFood(data)
          if (!result.error) {
            onSaved && !editingFood ? onSaved(result.data) : backToList()
          }
          return result
        }}
        onArchive={editingFood ? async () => {
          const result = await archiveFood(editingFood.id)
          if (!result.error) backToList()
          return result
        } : null}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={openCreate}
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
              onClick={() => openEdit(f)}
              className={`flex items-center gap-3 py-3 active:bg-zinc-50 transition-colors text-left ${
                i < foods.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              <FoodIcon id={f.icon} />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900 truncate">
                  {f.name}{f.brand ? <span className="font-normal text-zinc-400"> · {f.brand}</span> : null}
                </span>
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
function FoodForm({ food, initialName = '', onCancel, onSave, onArchive }) {
  const [icon,        setIcon]        = useState(food?.icon ?? null)
  const [pickerOpen,  setPickerOpen]  = useState(false)
  const [name,        setName]        = useState(food?.name ?? initialName)
  const [brand,       setBrand]       = useState(food?.brand ?? '')
  const [kcal,        setKcal]        = useState(String(food?.kcal ?? ''))
  const [proteins,    setProteins]    = useState(String(food?.proteins ?? ''))
  const [carbs,       setCarbs]       = useState(String(food?.carbs ?? ''))
  const [fats,        setFats]        = useState(String(food?.fats ?? ''))
  const [defaultUnit, setDefaultUnit] = useState(food?.default_unit ?? 'g')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  const iconEntry = FOOD_ICONS.find(f => f.id === icon) ?? null
  const canSave   = name.trim().length > 0 && kcal !== '' && proteins !== '' && carbs !== '' && fats !== ''

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onSave({
      icon:         icon ?? null,
      name:         name.trim(),
      brand:        brand.trim() || null,
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

  const isServing = UNITS.find(u => u.id === defaultUnit)?.isServing ?? false
  const macroRef  = isServing ? `Pour 1 ${defaultUnit}` : defaultUnit === 'ml' ? 'Pour 100ml' : 'Pour 100g'

  const macroInputs = [
    { label: 'Calories',  value: kcal,     onChange: setKcal,     unit: 'kcal', help: macroRef },
    { label: 'Protéines', value: proteins, onChange: setProteins, unit: 'g',    help: macroRef },
    { label: 'Glucides',  value: carbs,    onChange: setCarbs,    unit: 'g',    help: macroRef },
    { label: 'Lipides',   value: fats,     onChange: setFats,     unit: 'g',    help: macroRef },
  ]

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onCancel}
        className="flex items-center gap-1 -ml-1 text-zinc-500 active:text-zinc-700 transition-colors w-fit"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Nom + bouton icône */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Nom
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pain de mie complet"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
          <button
            onClick={() => setPickerOpen(o => !o)}
            className={`w-12 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
              pickerOpen
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'bg-zinc-50 border-zinc-200 active:bg-zinc-100'
            }`}
          >
            {iconEntry
              ? <iconEntry.Icon size={18} strokeWidth={1.75} className={pickerOpen ? 'text-white' : iconEntry.color} />
              : <span className="text-xs font-medium text-zinc-400">+</span>
            }
          </button>
        </div>

        {pickerOpen && (
          <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
            {FOOD_ICONS.map(({ id, Icon, color }) => (
              <button
                key={id}
                onClick={() => { setIcon(icon === id ? null : id); setPickerOpen(false) }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  icon === id ? 'bg-zinc-900' : 'bg-white active:bg-zinc-100'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} className={icon === id ? 'text-white' : color} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Marque */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Marque <span className="normal-case font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="Bjorg, Danone…"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
      </div>

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
          {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
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

      {error && <p className="text-sm text-red-500">{error}</p>}

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
