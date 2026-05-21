import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── Helpers EAV ─────────────────────────────────────────────
// values : { [metric_id]: string } tel que saisi dans le formulaire
// Construit { item_id, metric_id, value } pour chaque valeur non vide, et insère dans workout_item_values.
async function insertItemValues(itemId, values) {
  const rows = Object.entries(values)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([metric_id, v]) => ({ item_id: itemId, metric_id, value: parseFloat(v) }))
  if (rows.length === 0) return
  const { error } = await supabase.from('workout_item_values').insert(rows)
  if (error) throw error
}


// ─── useWorkouts — séances de sport d'un jour donné ──────────
// Charge les sessions avec leurs items, activités et valeurs.
export function useWorkouts(date) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*, workout_items(*, activities(*, activity_metrics(*)), workout_item_values(*, metrics(*)))')
        .eq('date', date)
        .order('created_at')
      console.log(`[useWorkouts] load ${date} →`, data?.length ?? 0, 'session(s)')
      setSessions(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [date])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Crée session + items + valeurs en séquence
  const addFullSession = useCallback(async (items, notes = null, name = null) => {
    console.log('[useWorkouts] addFullSession', items.map(i => i.activity.name), { name, notes })
    try {
      // 1. Session — fallback sur les noms d'activités si pas de nom saisi
      const sessionName = name || items.map(i => i.activity.name).join(', ')
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({ date, name: sessionName, notes })
        .select()
        .single()
      if (sessionError) throw sessionError

      // 2. Items (duration_min est une colonne directe)
      const { data: insertedItems, error: itemsError } = await supabase
        .from('workout_items')
        .insert(items.map((item, i) => ({
          session_id:   session.id,
          activity_id:  item.activity.id,
          item_order:   i,
          duration_min: item.duration_min ? parseFloat(item.duration_min) : null,
        })))
        .select()
      if (itemsError) throw itemsError

      // 3. Valeurs EAV (hors duration_min)
      await Promise.all(insertedItems.map((dbItem, i) => insertItemValues(dbItem.id, items[i].values)))

      console.log('[useWorkouts] addFullSession ✓', { sessionId: session.id, items: insertedItems.length })
      await load()
      return {}
    } catch (err) {
      console.error('[useWorkouts] addFullSession ✗', err.message)
      return { error: err.message }
    }
  }, [date, load])

  // Ajoute un item à une session existante
  const addWorkoutItem = useCallback(async (sessionId, item) => {
    console.log('[useWorkouts] addWorkoutItem', sessionId, item.activity.name)
    try {
      const session  = sessions.find(s => s.id === sessionId)
      const maxOrder = Math.max(-1, ...(session?.workout_items ?? []).map(i => i.item_order))

      const { data: dbItem, error: itemError } = await supabase
        .from('workout_items')
        .insert({
          session_id:   sessionId,
          activity_id:  item.activity.id,
          item_order:   maxOrder + 1,
          duration_min: item.duration_min ? parseFloat(item.duration_min) : null,
        })
        .select()
        .single()
      if (itemError) throw itemError

      await insertItemValues(dbItem.id, item.values)

      console.log('[useWorkouts] addWorkoutItem ✓', dbItem.id)
      await load()
      return {}
    } catch (err) {
      console.error('[useWorkouts] addWorkoutItem ✗', err.message)
      return { error: err.message }
    }
  }, [sessions, load])

  // Met à jour les métriques d'un item existant
  const updateWorkoutItem = useCallback(async (itemId, item) => {
    console.log('[useWorkouts] updateWorkoutItem', itemId, item.activity.name)
    try {
      const { error: updateError } = await supabase
        .from('workout_items')
        .update({ duration_min: item.duration_min ? parseFloat(item.duration_min) : null })
        .eq('id', itemId)
      if (updateError) throw updateError

      const { error: deleteError } = await supabase.from('workout_item_values').delete().eq('item_id', itemId)
      if (deleteError) throw deleteError
      await insertItemValues(itemId, item.values)

      console.log('[useWorkouts] updateWorkoutItem ✓', itemId)
      await load()
      return {}
    } catch (err) {
      console.error('[useWorkouts] updateWorkoutItem ✗', err.message)
      return { error: err.message }
    }
  }, [load])

  // Supprime un item (cascade sur workout_item_values)
  const deleteWorkoutItem = useCallback(async (itemId) => {
    console.log('[useWorkouts] deleteWorkoutItem', itemId)
    try {
      const { error } = await supabase.from('workout_items').delete().eq('id', itemId)
      if (error) throw error
      setSessions(prev => prev.map(s => ({
        ...s,
        workout_items: (s.workout_items ?? []).filter(i => i.id !== itemId),
      })))
      return {}
    } catch (err) {
      console.error('[useWorkouts] deleteWorkoutItem ✗', err.message)
      return { error: err.message }
    }
  }, [])

  const deleteSession = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', id)
      if (error) throw error
      setSessions(prev => prev.filter(s => s.id !== id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const renameSession = useCallback(async (id, name) => {
    console.log('[useWorkouts] renameSession', id, '→', name)
    try {
      const { error } = await supabase.from('workout_sessions').update({ name }).eq('id', id)
      if (error) throw error
      setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s))
      return {}
    } catch (err) {
      console.error('[useWorkouts] renameSession ✗', err.message)
      return { error: err.message }
    }
  }, [])

  return { sessions, loading, addFullSession, addWorkoutItem, updateWorkoutItem, deleteWorkoutItem, deleteSession, renameSession, reload: load }
}

// ─── Kcal brûlées pour une session (côté client, jamais stocké) ──
// Somme sur les items ayant une activité avec met_value + une valeur duration_min.
export function calcSessionKcal(session, weight_kg) {
  if (!weight_kg || !session.workout_items?.length) return 0
  return session.workout_items.reduce((total, item) => {
    const met      = item.activities?.met_value
    const duration = item.duration_min
    if (!met || !duration) return total
    return total + met * weight_kg * (duration / 60)
  }, 0)
}
