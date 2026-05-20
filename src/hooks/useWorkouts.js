import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
        .select('*, workout_items(*, activities(*), workout_item_values(*, metrics(*)))')
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
      const values = insertedItems.flatMap((dbItem, i) =>
        Object.entries(items[i].values)
          .filter(([, v]) => v !== '' && v !== null && v !== undefined)
          .map(([metric_id, value]) => ({
            item_id: dbItem.id,
            metric_id,
            value:   parseFloat(value),
          }))
      )
      if (values.length > 0) {
        const { error: valuesError } = await supabase
          .from('workout_item_values')
          .insert(values)
        if (valuesError) throw valuesError
      }

      console.log('[useWorkouts] addFullSession ✓', { sessionId: session.id, items: values.length, values: values.length })
      await load()
      return {}
    } catch (err) {
      console.error('[useWorkouts] addFullSession ✗', err.message)
      return { error: err.message }
    }
  }, [date, load])

  // Met à jour une session existante : update nom/notes + delete/reinsert items+valeurs
  const updateFullSession = useCallback(async (sessionId, items, notes = null, name = null) => {
    console.log('[useWorkouts] updateFullSession', sessionId, items.map(i => i.activity.name), { name, notes })
    try {
      // 1. Update session
      const sessionName = name || items.map(i => i.activity.name).join(', ')
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .update({ name: sessionName, notes })
        .eq('id', sessionId)
      if (sessionError) throw sessionError

      // 2. Supprimer les items existants (cascade sur workout_item_values)
      const { error: deleteError } = await supabase
        .from('workout_items')
        .delete()
        .eq('session_id', sessionId)
      if (deleteError) throw deleteError

      // 3. Réinsérer les items
      const { data: insertedItems, error: itemsError } = await supabase
        .from('workout_items')
        .insert(items.map((item, i) => ({
          session_id:   sessionId,
          activity_id:  item.activity.id,
          item_order:   i,
          duration_min: item.duration_min ? parseFloat(item.duration_min) : null,
        })))
        .select()
      if (itemsError) throw itemsError

      // 4. Réinsérer les valeurs EAV
      const values = insertedItems.flatMap((dbItem, i) =>
        Object.entries(items[i].values)
          .filter(([, v]) => v !== '' && v !== null && v !== undefined)
          .map(([metric_id, value]) => ({ item_id: dbItem.id, metric_id, value: parseFloat(value) }))
      )
      if (values.length > 0) {
        const { error: valuesError } = await supabase.from('workout_item_values').insert(values)
        if (valuesError) throw valuesError
      }

      console.log('[useWorkouts] updateFullSession ✓', sessionId)
      await load()
      return {}
    } catch (err) {
      console.error('[useWorkouts] updateFullSession ✗', err.message)
      return { error: err.message }
    }
  }, [load])

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

  return { sessions, loading, addFullSession, updateFullSession, deleteSession, renameSession, reload: load }
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
