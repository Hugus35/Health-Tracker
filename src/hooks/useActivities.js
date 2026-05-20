import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── useActivityMetrics — métriques d'une activité ───────────
export function useActivityMetrics(activityId) {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(!!activityId)

  useEffect(() => {
    if (!activityId) return
    supabase
      .from('activity_metrics')
      .select('metric_id, metrics(id, label, unit)')
      .eq('activity_id', activityId)
      .then(({ data }) => { setMetrics(data ?? []); setLoading(false) })
  }, [activityId])

  return { metrics, loading }
}

// ─── useActivities — gestion du catalogue d'activités ────────
// Catalogue unifié sports + exercices.
// Même pattern que useFoods / useSportTypes.
export function useActivities() {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('is_archived', false)
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      setActivities(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // metrics = [{ metric_id, is_default }] — optionnel
  const addActivity = useCallback(async (activity, metrics = []) => {
    try {
      const { data, error: insertError } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single()
      if (insertError) throw insertError

      if (metrics.length > 0) {
        const rows = metrics.map(m => ({ activity_id: data.id, metric_id: m.metric_id }))
        const { error: metricsError } = await supabase.from('activity_metrics').insert(rows)
        if (metricsError) throw metricsError
      }

      setActivities(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // metrics = [{ metric_id, is_default }] — si fourni, remplace toutes les activity_metrics existantes
  const updateActivity = useCallback(async (id, updates, metrics) => {
    try {
      const { error: updateError } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
      if (updateError) throw updateError

      if (metrics !== undefined) {
        const { error: deleteError } = await supabase
          .from('activity_metrics')
          .delete()
          .eq('activity_id', id)
        if (deleteError) throw deleteError

        if (metrics.length > 0) {
          const rows = metrics.map(m => ({ activity_id: id, metric_id: m.metric_id }))
          const { error: insertError } = await supabase.from('activity_metrics').insert(rows)
          if (insertError) throw insertError
        }
      }

      setActivities(prev =>
        prev.map(a => a.id === id ? { ...a, ...updates } : a)
            .sort((a, b) => a.name.localeCompare(b.name))
      )
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const archiveActivity = useCallback(async (id) => {
    try {
      const { error: archiveError } = await supabase
        .from('activities')
        .update({ is_archived: true })
        .eq('id', id)
      if (archiveError) throw archiveError
      setActivities(prev => prev.filter(a => a.id !== id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  return { activities, loading, error, addActivity, updateActivity, archiveActivity, reload: load }
}
