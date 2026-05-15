import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── useWorkouts — séances de sport d'un jour donné ──────────
// Charge les sport_types (statiques) + les sessions du jour.
// Expose addSession / deleteSession pour les mutations.
export function useWorkouts(date) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*, sport_types(*)')
        .eq('date', date)
        .order('created_at')
      setSessions(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [date])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const addSession = useCallback(async (sport_type_id, duration_min) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ date, sport_type_id, duration_min })
        .select('*, sport_types(*)')
        .single()
      if (error) throw error
      setSessions(prev => [...prev, data])
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [date])

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

  return { sessions, loading, addSession, deleteSession }
}

// Kcal brûlées pour une session (calcul côté client, jamais stocké)
export function calcSessionKcal(session, weight_kg) {
  return session.sport_types.met_value * weight_kg * (session.duration_min / 60)
}
