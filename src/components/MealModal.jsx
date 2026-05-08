import { useState } from 'react'
import { Search, X, Plus } from 'lucide-react'
import BottomSheet from './BottomSheet'
import FoodsSheet from './FoodsSheet'
import FoodIcon from './FoodIcon'
import { MEAL_TYPES, UNITS } from '../lib/constants'

// ─── MealModal ────────────────────────────────────────────────
// mealId = null  → nouveau repas : TypeStep puis ajout d'aliments
// mealId = uuid  → ajout sur repas existant : directement sur la recherche
export default function MealModal({
  open, onClose,
  mealId     = null,   // uuid du repas existant, ou null pour un nouveau
  mealType   = null,   // type du repas existant (pour le titre)
  existingMealTypes = [],
  addMeal, addMealItem,
  foods, reloadFoods,
}) {
  const isNew = mealId === null

  const [step,          setStep]          = useState(isNew ? 'type' : 'foods')
  const [selectedType,  setSelectedType]  = useState(mealType)
  const [currentMealId, setCurrentMealId] = useState(mealId)
  const [addedItems,    setAddedItems]    = useState([])

  const handleClose = () => {
    setStep(isNew ? 'type' : 'foods')
    setSelectedType(isNew ? null : mealType)
    setCurrentMealId(mealId)
    setAddedItems([])
    onClose()
  }

  // Crée le repas en DB au premier ajout si nécessaire
  const handleAddItem = async (food, quantity, unit) => {
    let id = currentMealId
    if (!id) {
      const { data, error } = await addMeal(selectedType)
      if (error) return { error }
      id = data.id
      setCurrentMealId(id)
    }
    const result = await addMealItem(id, food, quantity, unit)
    if (!result.error) {
      setAddedItems(prev => [...prev, { id: result.data.id, food, quantity, unit }])
    }
    return result
  }

  const typeLabel = MEAL_TYPES.find(t => t.id === selectedType)?.label
  const title     = step === 'type' ? 'Nouveau repas' : typeLabel ?? 'Ajouter'

  return (
    <BottomSheet open={open} onClose={handleClose} title={title}>
      {step === 'type' ? (
        <TypeStep
          existingMealTypes={existingMealTypes}
          onSelect={(type) => { setSelectedType(type); setStep('foods') }}
        />
      ) : (
        <FoodsStep
          foods={foods}
          reloadFoods={reloadFoods}
          addedItems={addedItems}
          onAddItem={handleAddItem}
          onBack={isNew ? () => { setStep('type'); setSelectedType(null) } : null}
          onDone={handleClose}
        />
      )}
    </BottomSheet>
  )
}

// ─── TypeStep ─────────────────────────────────────────────────
function TypeStep({ existingMealTypes, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {MEAL_TYPES.map(({ id, label, Icon, color }) => {
        const taken = id !== 'snack' && existingMealTypes.includes(id)
        return (
          <button
            key={id}
            onClick={() => !taken && onSelect(id)}
            disabled={taken}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors text-left ${
              taken
                ? 'bg-zinc-50 border-zinc-100 opacity-40 cursor-not-allowed'
                : 'bg-zinc-50 border-zinc-100 active:bg-zinc-100'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200">
              <Icon size={20} className={taken ? 'text-zinc-300' : color} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-semibold ${taken ? 'text-zinc-400' : 'text-zinc-900'}`}>
                {label}
              </span>
              {taken && <span className="text-xs text-zinc-400">Déjà renseigné</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── FoodsStep ────────────────────────────────────────────────
// Recherche + ajout d'aliments. addedItems = items ajoutés dans cette session.
function FoodsStep({ foods, reloadFoods, addedItems, onAddItem, onBack, onDone }) {
  const [query,        setQuery]        = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity,     setQuantity]     = useState('')
  const [unit,         setUnit]         = useState(UNITS[0].id)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)
  const [creatingFood, setCreatingFood] = useState(false)

  const closeCreating = () => { setCreatingFood(false); reloadFoods() }

  const trimmed   = query.trim()
  const filtered  = trimmed.length >= 1
    ? foods.filter(f => f.name.toLowerCase().includes(trimmed.toLowerCase()))
    : []
  const noResults = trimmed.length >= 1 && filtered.length === 0
  const recents   = trimmed.length === 0
    ? [...foods].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
    : []

  const handleFoodTap = (food) => {
    setSelectedFood(food)
    setQuantity('')
    setUnit(food.default_unit ?? 'g')
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedFood || !quantity) return
    setSaving(true)
    const result = await onAddItem(selectedFood, parseFloat(quantity), unit)
    if (result.error) { setError(result.error) }
    else { setSelectedFood(null); setQuery('') }
    setSaving(false)
  }

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Items ajoutés dans cette session */}
        {addedItems.length > 0 && (
          <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
            {addedItems.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < addedItems.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
              >
                <span className="text-sm font-medium text-zinc-900 truncate flex-1">{item.food.name}</span>
                <span className="text-xs text-zinc-400 ml-3 shrink-0">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire quantité */}
        {selectedFood ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FoodIcon id={selectedFood.icon} />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-zinc-900 truncate">{selectedFood.name}</span>
                  {selectedFood.brand && <span className="text-xs text-zinc-400">{selectedFood.brand}</span>}
                </div>
              </div>
              <button onClick={() => { setSelectedFood(null); setError(null) }} className="text-zinc-400 active:text-zinc-600 transition-colors shrink-0">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              {selectedFood.kcal} kcal
              <span className="text-zinc-300 ml-1">
                {UNITS.find(u => u.id === unit)?.isServing ? `/ 1 ${unit}` : unit === 'ml' ? '/ 100ml' : '/ 100g'}
              </span>
            </p>
            <div className="flex gap-2">
              <input
                type="number" inputMode="decimal"
                value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder={UNITS.find(u => u.id === unit)?.isServing ? '1' : '100'} autoFocus
                className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
              />
              <select
                value={unit} onChange={e => setUnit(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-3 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors appearance-none min-w-[80px] text-center"
              >
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handleConfirm} disabled={!quantity || saving}
              className="bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all">
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un aliment…"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
          </div>
        )}

        {/* Suggestions — derniers aliments ajoutés, quand la recherche est vide */}
        {!selectedFood && recents.length > 0 && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Récents
            </span>
            <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
              {recents.map((food, i) => (
                <button key={food.id} onClick={() => handleFoodTap(food)}
                  className={`flex items-center gap-3 px-4 py-3 text-left active:bg-zinc-100 transition-colors ${
                    i < recents.length - 1 ? 'border-b border-zinc-100' : ''
                  }`}>
                  <FoodIcon id={food.icon} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {food.name}{food.brand ? <span className="font-normal text-zinc-400"> · {food.brand}</span> : null}
                    </span>
                    <span className="text-xs text-zinc-400">{food.kcal} kcal · {food.proteins}g prot · {food.default_unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Résultats */}
        {!selectedFood && filtered.length > 0 && (
          <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
            {filtered.slice(0, 8).map((food, i) => (
              <button key={food.id} onClick={() => handleFoodTap(food)}
                className={`flex items-center gap-3 px-4 py-3 text-left active:bg-zinc-100 transition-colors ${
                  i < Math.min(filtered.length, 8) - 1 ? 'border-b border-zinc-100' : ''
                }`}>
                <FoodIcon id={food.icon} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 truncate">
                    {food.name}{food.brand ? <span className="font-normal text-zinc-400"> · {food.brand}</span> : null}
                  </span>
                  <span className="text-xs text-zinc-400">{food.kcal} kcal · {food.proteins}g prot · {food.default_unit}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Aucun résultat */}
        {!selectedFood && noResults && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-zinc-400">
              Aucun résultat pour <span className="font-medium text-zinc-600">« {query} »</span>
            </p>
            <button onClick={() => setCreatingFood(true)}
              className="flex items-center gap-2 bg-zinc-100 text-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium active:bg-zinc-200 transition-colors">
              <Plus size={14} strokeWidth={2.5} />
              Créer cet aliment
            </button>
          </div>
        )}

        {/* Boutons bas */}
        <div className="flex gap-3 pt-2">
          {onBack && (
            <button onClick={onBack} className="flex-1 border border-zinc-200 rounded-2xl py-3.5 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors">
              Retour
            </button>
          )}
          <button onClick={onDone} className="flex-1 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all">
            {addedItems.length > 0 ? 'Valider' : 'Fermer'}
          </button>
        </div>
      </div>

      <BottomSheet open={creatingFood} onClose={closeCreating} title="Nouvel aliment" zIndex={60}>
        <FoodsSheet
          key={creatingFood ? query : 'closed'}
          initialEditing="new"
          initialName={query}
          onCancel={closeCreating}
        />
      </BottomSheet>
    </>
  )
}
