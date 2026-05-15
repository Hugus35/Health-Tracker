import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── useSportTypes — gestion du catalogue de sports ──────────
// Fetch initial des sports non-archivés, puis insert/update/archive.
// Même pattern que useFoods.
export function useSportTypes() {
  const [sportTypes, setSportTypes] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('sport_types')
        .select('*')
        .eq('is_archived', false)
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      setSportTypes(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const addSportType = useCallback(async (sport) => {
    try {
      const { data, error: insertError } = await supabase
        .from('sport_types')
        .insert(sport)
        .select()
        .single()
      if (insertError) throw insertError
      setSportTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const updateSportType = useCallback(async (id, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('sport_types')
        .update(updates)
        .eq('id', id)
      if (updateError) throw updateError
      setSportTypes(prev =>
        prev.map(s => s.id === id ? { ...s, ...updates } : s)
            .sort((a, b) => a.name.localeCompare(b.name))
      )
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  const archiveSportType = useCallback(async (id) => {
    try {
      const { error: archiveError } = await supabase
        .from('sport_types')
        .update({ is_archived: true })
        .eq('id', id)
      if (archiveError) throw archiveError
      setSportTypes(prev => prev.filter(s => s.id !== id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  return { sportTypes, loading, error, addSportType, updateSportType, archiveSportType, reload: load }
}
