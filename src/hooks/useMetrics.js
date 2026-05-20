import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── useMetrics — gestion du catalogue de métriques ──────────
// Même pattern que useFoods / useActivities.
export function useMetrics() {
  const [metrics,  setMetrics]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('metrics')
        .select('*')
        .order('label', { ascending: true })
      if (fetchError) throw fetchError
      setMetrics(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const addMetric = useCallback(async (metric) => {
    try {
      const { data, error: insertError } = await supabase
        .from('metrics')
        .insert(metric)
        .select()
        .single()
      if (insertError) throw insertError
      setMetrics(prev => [...prev, data].sort((a, b) => a.label.localeCompare(b.label)))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const updateMetric = useCallback(async (id, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('metrics')
        .update(updates)
        .eq('id', id)
      if (updateError) throw updateError
      setMetrics(prev =>
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
            .sort((a, b) => a.label.localeCompare(b.label))
      )
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const deleteMetric = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('metrics')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError
      setMetrics(prev => prev.filter(m => m.id !== id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  return { metrics, loading, error, addMetric, updateMetric, deleteMetric, reload: load }
}
