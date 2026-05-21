import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { calcItemMacros, sumMacros, useMeals } from '../hooks/useMeals'
import { calcSessionKcal, useWorkouts } from '../hooks/useWorkouts'
import { FOOD_ICONS, MACRO_BARS, MEAL_TYPES, SPORT_ICONS, UNITS } from '../lib/constants'
import { getIcon } from '../lib/utils'
import MealModal from './MealModal'
import WorkoutModal from './WorkoutModal'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Journal — tableau de bord du jour ───────────────────────
export default function Journal({ settings }) {
  const [date, setDate] = useState(todayISO)
  const [tab,  setTab]  = useState('meals') // 'meals' | 'sport'

  const { meals, loading: loadingMeals, addMeal, addMealItem, updateMealItem, removeMealItem, deleteMeal } = useMeals(date)
  const { sessions, loading: loadingSport, addFullSession, addWorkoutItem, updateWorkoutItem, deleteWorkoutItem, renameSession, deleteSession } = useWorkouts(date)

  const [mealModal,    setMealModal]    = useState(null)
  const [workoutModal, setWorkoutModal] = useState(null)

  const isToday   = date === todayISO()
  const goBack    = () => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().slice(0, 10) })
  const goForward = () => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().slice(0, 10) })

  const allItems    = meals.flatMap(m => m.meal_items)
  const totals      = sumMacros(allItems)
  const kcalSport   = sessions.reduce((sum, s) => sum + calcSessionKcal(s, settings?.weight_kg ?? 0), 0)
  const target      = (settings?.kcal_rest ?? 2000) + Math.round(kcalSport) + (settings?.deficit_target ?? 0)
  const pct         = target > 0 ? Math.min(totals.kcal / target, 1) : 0

  const pctProtein      = settings?.pct_protein ?? 0.30
  const pctCarbs        = settings?.pct_carbs   ?? 0.45
  const pctFats         = 1 - pctProtein - pctCarbs
  const proteinTarget   = Math.round((target * pctProtein) / 4)
  const carbsTarget     = Math.round((target * pctCarbs)   / 4)
  const fatsTarget      = Math.round((target * pctFats)    / 9)

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

        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        <div className="flex gap-0 divide-x divide-zinc-200">
          <MacroCell label="Protéines" value={Math.round(totals.proteins)} unit="g" target={proteinTarget} />
          <MacroCell label="Glucides"  value={Math.round(totals.carbs)}    unit="g" target={carbsTarget}   />
          <MacroCell label="Lipides"   value={Math.round(totals.fats)}     unit="g" target={fatsTarget}    />
        </div>
      </div>

      {/* Bandeau Repas / Sport */}
      <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
        {[{ id: 'meals', label: 'Repas' }, { id: 'sport', label: 'Sport' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet actif */}
      {tab === 'meals' ? (
        <>
          {loadingMeals ? (
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

          <button
            onClick={() => setMealModal('new')}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ajouter un repas
          </button>
        </>
      ) : (
        <>
          {/* Bilan sport */}
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-zinc-900 tabular-nums">
                {Math.round(kcalSport)}
              </span>
              <span className="text-sm text-zinc-400">kcal brûlées</span>
            </div>
          </div>

          {loadingSport ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-8 text-center">
              <p className="text-sm font-medium text-zinc-500">Aucune séance enregistrée</p>
              <p className="text-xs text-zinc-400">Commence par ajouter ta première séance.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map(session => (
                <WorkoutCard
                  key={session.id}
                  session={session}
                  weightKg={settings?.weight_kg ?? 0}
                  onRename={(id, name) => renameSession(id, name)}
                  onEditItem={(itemId) => { console.log('[Journal] open modal → metrics', itemId); setWorkoutModal({ session, initialEditingItemId: itemId }) }}
                  onAddActivity={() => { console.log('[Journal] open modal → picker', session.id); setWorkoutModal({ session }) }}
                  onDelete={() => deleteSession(session.id)}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => { console.log('[Journal] open modal → new session'); setWorkoutModal('new') }}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all mt-1"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ajouter une séance
          </button>
        </>
      )}

      {/* Modals */}
      <MealModal
        key={mealModal === 'new' ? 'new' : mealModal?.id ?? 'closed'}
        open={mealModal !== null}
        onClose={() => setMealModal(null)}
        mealId={mealModal !== 'new' ? mealModal?.id ?? null : null}
        mealType={mealModal !== 'new' ? mealModal?.mealType ?? null : null}
        existingMealTypes={meals.map(m => m.meal_type)}
        addMeal={addMeal}
        addMealItem={addMealItem}
      />
      <WorkoutModal
        key={workoutModal === 'new' ? 'new' : `${workoutModal?.session?.id ?? ''}-${workoutModal?.initialEditingItemId ?? ''}`}
        open={workoutModal !== null}
        onClose={() => setWorkoutModal(null)}
        session={workoutModal !== 'new' ? workoutModal?.session ?? null : null}
        initialEditingItemId={workoutModal?.initialEditingItemId}
        onAdd={addFullSession}
        onAddItem={addWorkoutItem}
        onUpdateItem={updateWorkoutItem}
        onDeleteItem={deleteWorkoutItem}
        onRenameSession={renameSession}
      />
    </div>
  )
}


// ─── Carte d'une séance ───────────────────────────────────────
function WorkoutCard({ session, onRename, onEditItem, onAddActivity, onDelete }) {
  const [editingName, setEditingName] = useState(false)
  const [name,        setName]        = useState(session.name)
  const [renaming,    setRenaming]    = useState(false)

  //const kcal     = Math.round(calcSessionKcal(session, weightKg))
  const totalMin = (session.workout_items ?? []).reduce((sum, item) => sum + (item.duration_min ?? 0), 0)
  const items    = (session.workout_items ?? []).sort((a, b) => a.item_order - b.item_order)

  const handleNameBlur = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setName(session.name); setEditingName(false); return }
    if (trimmed === session.name) { setEditingName(false); return }
    setRenaming(true)
    await onRename(session.id, trimmed)
    setRenaming(false)
    setEditingName(false)
  }

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => {
              if (e.key === 'Enter')  e.target.blur()
              if (e.key === 'Escape') { setName(session.name); setEditingName(false) }
            }}
            disabled={renaming}
            className="flex-1 min-w-0 mr-3 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold text-zinc-900 truncate flex-1 min-w-0 mr-3 text-left"
          >
            {session.name}
          </button>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {totalMin > 0 && <span className="text-sm font-semibold text-zinc-600 tabular-nums">{totalMin} min</span>}
          <button onClick={onDelete} className="text-zinc-300 active:text-red-400 transition-colors">
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y divide-zinc-100">
        {items.map((item) => {
          const activity    = item.activities
          const iconEntry   = getIcon(SPORT_ICONS, activity?.icon)
          const metricOrder = Object.fromEntries(
            (activity?.activity_metrics ?? []).map(am => [am.metric_id, am.display_order])
          )
          const otherValues = (item.workout_item_values ?? [])
            .slice()
            .sort((a, b) => (metricOrder[a.metric_id] ?? 99) - (metricOrder[b.metric_id] ?? 99))
            .map(v => v.metrics?.unit ? `${v.value} ${v.metrics.unit}` : `${v.value} ${v.metrics?.label ?? ''}`.trim())
            .filter(Boolean)

          return (
            <button
              key={item.id}
              onClick={() => onEditItem(item.id)}
              className="flex items-center gap-3 px-4 py-3 text-left w-full active:bg-zinc-100 transition-colors"
            >
              {iconEntry && <iconEntry.Icon size={18} strokeWidth={1.75} className={`${iconEntry.color} shrink-0`} />}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900">{activity?.name}</span>
                {otherValues.length > 0 && <span className="text-xs text-zinc-400">{otherValues.join(' · ')}</span>}
              </div>
              {item.duration_min > 0 && (
                <span className="text-xs text-zinc-400 shrink-0 mr-1">{item.duration_min} min</span>
              )}
              <ChevronRight size={14} strokeWidth={1.75} className="text-zinc-300 shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Ajouter une activité */}
      <button
        onClick={onAddActivity}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 border-t border-zinc-100 text-xs font-medium text-zinc-400 active:bg-zinc-100 transition-colors"
      >
        <Plus size={12} strokeWidth={2.5} />
        Ajouter une activité
      </button>

      {session.notes && (
        <p className="px-4 py-2 text-xs text-zinc-400 border-t border-zinc-100">{session.notes}</p>
      )}
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
        {value}
        {target && (
          <span className="text-zinc-400 font-normal text-xs ml-0.5">/{target}{unit}</span>
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

  const totalMacroKcal = MACRO_BARS.reduce((sum, m) => sum + totals[m.key] * m.kcalPerG, 0)
  const getPct = (m) => totalMacroKcal > 0 ? (totals[m.key] * m.kcalPerG) / totalMacroKcal * 100 : 0

  return (
    <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} strokeWidth={1.75} />
          <span className="text-sm font-semibold text-zinc-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-600 tabular-nums">
            {Math.round(totals.kcal)} kcal
          </span>
          <button onClick={onDeleteMeal} className="text-zinc-300 active:text-red-400 transition-colors">
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

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

// ─── Ligne d'un aliment ───────────────────────────────────────
function MealItemRow({ item, isLast, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [qty,     setQty]     = useState(String(item.quantity))
  const [unit,    setUnit]    = useState(item.unit)
  const [saving,  setSaving]  = useState(false)

  const liveItem = editing && qty ? { ...item, quantity: parseFloat(qty) || 0, unit } : item
  const macros   = calcItemMacros(liveItem)

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

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-b border-zinc-100'}`}>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {(() => { const e = getIcon(FOOD_ICONS, item.foods.icon); return e ? <e.Icon size={15} strokeWidth={1.75} className={`${e.color} shrink-0`} /> : null })()}
          <span className="text-sm font-medium text-zinc-900 truncate flex-1">{item.foods.name}</span>
          <span className="text-xs font-medium text-zinc-400 tabular-nums shrink-0">
            {Math.round(macros.kcal)} kcal
          </span>
        </div>

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

      <button onClick={onRemove} className="text-zinc-300 active:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
