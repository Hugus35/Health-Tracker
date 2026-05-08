import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMeals, calcItemMacros, sumMacros } from '../hooks/useMeals'
import { useFoods } from '../hooks/useFoods'
import MealModal from './MealModal'
import FoodIcon from './FoodIcon'
import { MEAL_TYPES, UNITS, MACRO_BARS } from '../lib/constants'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Journal — tableau de bord du jour ───────────────────────
export default function Journal({ settings }) {
  const [date, setDate] = useState(todayISO)

  const { meals, loading, addMeal, addMealItem, updateMealItem, removeMealItem, deleteMeal } = useMeals(date)
  // useFoods remonté ici pour être chargé avant l'ouverture du modal
  const { foods, reload: reloadFoods } = useFoods()

  // null = fermé | 'new' = nouveau repas | { id, mealType } = ajout sur repas existant
  const [mealModal, setMealModal] = useState(null)

  const isToday   = date === todayISO()
  const goBack    = () => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().slice(0, 10) })
  const goForward = () => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().slice(0, 10) })

  const allItems  = meals.flatMap(m => m.meal_items)
  const totals    = sumMacros(allItems)
  const target    = (settings?.kcal_rest ?? 2000) + (settings?.deficit_target ?? 0)
  const pct       = target > 0 ? Math.min(totals.kcal / target, 1) : 0

  const barColor =
    totals.kcal > target * 1.1 ? 'bg-red-500'
    : totals.kcal > target * 0.8 ? 'bg-emerald-500'
    : 'bg-zinc-400'

  return (
    <div className="px-6 py-8 flex flex-col gap-6">

      {/* En-tête date avec navigation */}
      <div className="flex items-center gap-2">
        <button onClick={goBack} className="p-1 text-zinc-400 active:text-zinc-700 transition-colors">
          <ChevronLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 capitalize">
            {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
          {isToday && <p className="text-xs text-zinc-400 mt-0.5">Aujourd'hui</p>}
        </div>
        <button onClick={goForward} disabled={isToday}
          className={`p-1 transition-colors ${isToday ? 'text-zinc-200 pointer-events-none' : 'text-zinc-400 active:text-zinc-700'}`}>
          <ChevronRight size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Bilan calorique */}
      <div className="bg-zinc-50 rounded-2xl p-5 flex flex-col gap-4 border border-zinc-100">
        {/* Chiffres */}
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-zinc-900 tabular-nums">
              {Math.round(totals.kcal)}
            </span>
            <span className="text-sm text-zinc-400">/ {target} kcal</span>
          </div>
          <span className="text-xs font-medium text-zinc-400 tabular-nums">
            {Math.round(pct * 100)} %
          </span>
        </div>

        {/* Barre */}
        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        {/* Macros */}
        <div className="flex gap-0 divide-x divide-zinc-200">
          <MacroCell
            label="Protéines"
            value={Math.round(totals.proteins)}
            unit="g"
            target={settings?.protein_target_g}
          />
          <MacroCell label="Glucides" value={Math.round(totals.carbs)} unit="g" />
          <MacroCell label="Lipides"  value={Math.round(totals.fats)}  unit="g" />
        </div>
      </div>

      {/* Liste des repas */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
        </div>
      ) : meals.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center">
          <p className="text-sm font-medium text-zinc-500">Aucun repas enregistré</p>
          <p className="text-xs text-zinc-400">Commence par ajouter ton premier repas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFood={() => setMealModal({ id: meal.id, mealType: meal.meal_type })}
              onUpdateItem={updateMealItem}
              onRemoveItem={removeMealItem}
              onDeleteMeal={() => deleteMeal(meal.id)}
            />
          ))}
        </div>
      )}

      {/* Bouton + Repas */}
      <button
        onClick={() => setMealModal('new')}
        className="flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={2.5} />
        Ajouter un repas
      </button>

      {/* Modal repas — key forcé pour réinitialiser le state interne à chaque ouverture */}
      <MealModal
        key={mealModal === 'new' ? 'new' : mealModal?.id ?? 'closed'}
        open={mealModal !== null}
        onClose={() => setMealModal(null)}
        mealId={mealModal !== 'new' ? mealModal?.id ?? null : null}
        mealType={mealModal !== 'new' ? mealModal?.mealType ?? null : null}
        existingMealTypes={meals.map(m => m.meal_type)}
        addMeal={addMeal}
        addMealItem={addMealItem}
        foods={foods}
        reloadFoods={reloadFoods}
      />
    </div>
  )
}

// ─── Cellule macro ────────────────────────────────────────────
function MacroCell({ label, value, unit, target }) {
  const reachedTarget = target && value >= target * 0.9 && value <= target * 1.1
  const overTarget    = target && value > target * 1.1
  const valueColor    = overTarget ? 'text-red-500' : reachedTarget ? 'text-emerald-500' : 'text-zinc-900'

  return (
    <div className="flex flex-col gap-0.5 flex-1 px-3 first:pl-0 last:pr-0">
      <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>
        {value}{unit}
        {target && (
          <span className="text-zinc-400 font-normal text-xs ml-0.5">/{target}</span>
        )}
      </span>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  )
}

// ─── Carte d'un repas ─────────────────────────────────────────
function MealCard({ meal, onAddFood, onUpdateItem, onRemoveItem, onDeleteMeal }) {
  const meta   = MEAL_TYPES.find(t => t.id === meal.meal_type) ?? MEAL_TYPES.find(t => t.id === 'snack')
  const totals = sumMacros(meal.meal_items)
  const { Icon, label, color } = meta

  // Proportions d'énergie au niveau du repas entier
  const totalMacroKcal = MACRO_BARS.reduce(
    (sum, m) => sum + totals[m.key] * m.kcalPerG, 0
  )
  const getPct = (m) =>
    totalMacroKcal > 0 ? (totals[m.key] * m.kcalPerG) / totalMacroKcal * 100 : 0

  return (
    <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} strokeWidth={1.75} />
          <span className="text-sm font-semibold text-zinc-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400 tabular-nums">
            {Math.round(totals.kcal)} kcal
          </span>
          <button
            onClick={onDeleteMeal}
            className="text-zinc-300 active:text-red-400 transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Jauges + items */}
      <div className="flex flex-col">
        {meal.meal_items.length === 0 ? (
          <button
            onClick={onAddFood}
            className="flex items-center justify-center gap-1.5 w-full py-3 text-xs font-medium text-zinc-400 active:bg-zinc-100 transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} />
            Ajouter un aliment
          </button>
        ) : (
          <>
            {/* Jauges macros du repas */}
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-zinc-100">
              {MACRO_BARS.map(m => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-20 shrink-0">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${m.color}`}
                      style={{ width: `${getPct(m)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 tabular-nums w-10 text-right shrink-0">
                    {Math.round(totals[m.key])} g
                  </span>
                </div>
              ))}
            </div>

            {meal.meal_items.map((item, i) => (
              <MealItemRow
                key={item.id}
                item={item}
                isLast={i === meal.meal_items.length - 1}
                onUpdate={(qty, unit) => onUpdateItem(meal.id, item.id, { quantity: qty, unit })}
                onRemove={() => onRemoveItem(meal.id, item.id)}
              />
            ))}

            {/* Bouton léger pour ajouter un aliment */}
            <button
              onClick={onAddFood}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 border-t border-zinc-100 text-xs font-medium text-zinc-400 active:bg-zinc-100 transition-colors"
            >
              <Plus size={12} strokeWidth={2.5} />
              Ajouter un aliment
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Ligne d'un aliment — nom + kcal + quantité éditable ──────
// Pas de barres ici — elles sont au niveau du repas entier.
function MealItemRow({ item, isLast, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [qty,     setQty]     = useState(String(item.quantity))
  const [unit,    setUnit]    = useState(item.unit)
  const [saving,  setSaving]  = useState(false)

  // Kcal live pendant la saisie
  const liveItem = editing && qty
    ? { ...item, quantity: parseFloat(qty) || 0, unit }
    : item
  const macros = calcItemMacros(liveItem)

  const handleConfirm = async () => {
    if (!qty) return
    setSaving(true)
    await onUpdate(parseFloat(qty), unit)
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setQty(String(item.quantity))
    setUnit(item.unit)
    setEditing(false)
  }

  const borderClass = isLast ? '' : 'border-b border-zinc-100'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${borderClass}`}>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Nom + kcal */}
        <div className="flex items-center justify-between gap-2">
          <FoodIcon id={item.foods.icon} size={15} />
          <span className="text-sm font-medium text-zinc-900 truncate">{item.foods.name}</span>
          <span className="text-sm font-semibold text-zinc-700 tabular-nums shrink-0">
            {Math.round(macros.kcal)} kcal
          </span>
        </div>

        {/* Quantité — bouton ✏ ou champ inline */}
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number" inputMode="decimal"
              value={qty} onChange={e => setQty(e.target.value)}
              autoFocus
              className="w-20 bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
            />
            <select
              value={unit} onChange={e => setUnit(e.target.value)}
              className="bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 appearance-none transition-colors"
            >
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <button
              onClick={handleConfirm} disabled={!qty || saving}
              className="p-1.5 rounded-lg bg-zinc-900 text-white disabled:opacity-30 active:scale-95 transition-all"
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 active:bg-zinc-100 transition-colors"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 w-fit active:opacity-60 transition-opacity"
          >
            <span className="text-xs text-zinc-400 tabular-nums">{item.quantity} {item.unit}</span>
            <Pencil size={10} className="text-zinc-300" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Poubelle */}
      <button onClick={onRemove} className="text-zinc-300 active:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
