import { useCallback, useEffect, useState } from 'react'
import { UNITS } from '../lib/constants'
import { supabase } from '../lib/supabase'

// ─── useMeals — journal d'un jour donné ──────────────────────
// Charge les repas + items + aliments pour une date (défaut : aujourd'hui).
// Expose add/remove pour les mutations optimistes.
export function useMeals(date = todayISO()) {
  const [meals,   setMeals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('meals')
        .select('*, meal_items(*, foods(*))')
        .eq('date', date)
        .order('created_at', { ascending: true })
      if (fetchError) throw fetchError
      setMeals(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Crée un repas vide pour la date + type donnés
  const addMeal = useCallback(async (meal_type) => {
    try {
      const { data, error: insertError } = await supabase
        .from('meals')
        .insert({ date, meal_type })
        .select()
        .single()
      if (insertError) throw insertError
      const meal = { ...data, meal_items: [] }
      setMeals(prev => [...prev, meal])
      return { data: meal }
    } catch (err) {
      return { error: err.message }
    }
  }, [date])

  // Ajoute un aliment à un repas — food est l'objet complet (avec macros)
  const addMealItem = useCallback(async (meal_id, food, quantity, unit) => {
    try {
      const { data, error: insertError } = await supabase
        .from('meal_items')
        .insert({ meal_id, food_id: food.id, quantity, unit })
        .select('*, foods(*)')
        .single()
      if (insertError) throw insertError
      setMeals(prev => prev.map(m =>
        m.id === meal_id
          ? { ...m, meal_items: [...m.meal_items, data] }
          : m
      ))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // Met à jour la quantité / unité d'un item existant
  const updateMealItem = useCallback(async (meal_id, item_id, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('meal_items')
        .update(updates)
        .eq('id', item_id)
      if (updateError) throw updateError
      setMeals(prev => prev.map(m =>
        m.id === meal_id
          ? { ...m, meal_items: m.meal_items.map(i => i.id === item_id ? { ...i, ...updates } : i) }
          : m
      ))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // Supprime un item (soft via DB cascade géré par ON DELETE CASCADE)
  const removeMealItem = useCallback(async (meal_id, item_id) => {
    try {
      const { error: deleteError } = await supabase
        .from('meal_items')
        .delete()
        .eq('id', item_id)
      if (deleteError) throw deleteError
      setMeals(prev => prev.map(m =>
        m.id === meal_id
          ? { ...m, meal_items: m.meal_items.filter(i => i.id !== item_id) }
          : m
      ))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // Supprime un repas entier (CASCADE supprime ses items)
  const deleteMeal = useCallback(async (meal_id) => {
    try {
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal_id)
      if (deleteError) throw deleteError
      setMeals(prev => prev.filter(m => m.id !== meal_id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  return { meals, loading, error, addMeal, addMealItem, updateMealItem, removeMealItem, deleteMeal }
}

// ─── Utilitaires macros ───────────────────────────────────────

// Macros pour un meal_item.
// - Unités de portion (isServing) : food.kcal est pour 1 unité → ratio = qty
// - g / ml                        : food.kcal est pour 100g/ml → ratio = qty / 100
export function calcItemMacros(item) {
  const isServing = UNITS.find(u => u.id === item.unit)?.isServing ?? false
  const ratio = isServing ? item.quantity : item.quantity / 100
  return {
    kcal:     item.foods.kcal     * ratio,
    proteins: item.foods.proteins * ratio,
    carbs:    item.foods.carbs    * ratio,
    fats:     item.foods.fats     * ratio,
  }
}

// Somme des macros d'un tableau d'items
export function sumMacros(items) {
  return items.reduce((acc, item) => {
    const m = calcItemMacros(item)
    return {
      kcal:     acc.kcal     + m.kcal,
      proteins: acc.proteins + m.proteins,
      carbs:    acc.carbs    + m.carbs,
      fats:     acc.fats     + m.fats,
    }
  }, { kcal: 0, proteins: 0, carbs: 0, fats: 0 })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
