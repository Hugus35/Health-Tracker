import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .single()
      if (fetchError) throw fetchError
      setSettings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings() 
  }, [fetchSettings])

  const updateSettings = useCallback(async (updates) => {
    try {
      const { error: updateError } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', 1)
      if (updateError) throw updateError
      // Mise à jour locale immédiate sans re-fetch
      setSettings(prev => ({ ...prev, ...updates }))
      return {}
    } catch (err) {
      console.error('updateSettings error:', err)
      return { error: err.message }
    }
  }, [])

  return { settings, loading, error, updateSettings, refetch: fetchSettings }
}
