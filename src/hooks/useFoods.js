import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── useFoods — gestion de la BD d'aliments ──────────────────
// Fetch initial des aliments non-archivés, puis insert/update/archive
// en local + DB (optimistic update à la Onboarding).
export function useFoods() {
  const [foods,   setFoods]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Chargement initial — uniquement les aliments non-archivés
  useEffect(() => {
    async function load() {
      try {
        const { data, error: fetchError } = await supabase
          .from('foods')
          .select('*')
          .eq('is_archived', false)
          .order('name', { ascending: true })
        if (fetchError) throw fetchError
        setFoods(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Création — insert + ajout local
  const addFood = useCallback(async (food) => {
    try {
      const { data, error: insertError } = await supabase
        .from('foods')
        .insert(food)
        .select()
        .single()
      if (insertError) throw insertError
      setFoods(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // Mise à jour — update + remplacement local
  const updateFood = useCallback(async (id, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('foods')
        .update(updates)
        .eq('id', id)
      if (updateError) throw updateError
      setFoods(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f)
                            .sort((a, b) => a.name.localeCompare(b.name)))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  // Soft delete — passage à is_archived = true + retrait de la liste
  const archiveFood = useCallback(async (id) => {
    try {
      const { error: archiveError } = await supabase
        .from('foods')
        .update({ is_archived: true })
        .eq('id', id)
      if (archiveError) throw archiveError
      setFoods(prev => prev.filter(f => f.id !== id))
      return {}
    } catch (err) {
      return { error: err.message }
    }
  }, [])

  return { foods, loading, error, addFood, updateFood, archiveFood }
}
