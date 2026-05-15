import { useState } from 'react'
import { X } from 'lucide-react'
import BottomSheet from './BottomSheet'
import SportsSheet from './SportsSheet'
import SportIcon from './SportIcon'
import { useSportTypes } from '../hooks/useSportTypes'

// ─── WorkoutModal ─────────────────────────────────────────────
// Sélection du sport dans une liste, puis saisie de la durée.
// Même pattern que MealModal : sélection → formulaire → ajout → fermeture.
// Création inline d'un sport possible via SportsSheet (comme FoodsSheet dans MealModal).
export default function WorkoutModal({ open, onClose, onAdd }) {
  const { sportTypes } = useSportTypes()
  const [selectedSport, setSelectedSport] = useState(null)
  const [duration,      setDuration]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState(null)
  const [creatingSport, setCreatingSport] = useState(false)

  const handleClose = () => {
    setSelectedSport(null)
    setDuration('')
    setError(null)
    setCreatingSport(false)
    onClose()
  }

  const handleConfirm = async () => {
    if (!selectedSport || !duration) return
    setSaving(true)
    const result = await onAdd(selectedSport.id, parseFloat(duration))
    if (result.error) setError(result.error)
    else handleClose()
    setSaving(false)
  }

  return (
    <>
      <BottomSheet open={open} onClose={handleClose} title="Nouvelle séance">
        <div className="flex flex-col gap-4">

          {/* Formulaire durée — affiché après sélection d'un sport */}
          {selectedSport ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SportIcon id={selectedSport.icon} />
                  <span className="text-sm font-semibold text-zinc-900">{selectedSport.name}</span>
                </div>
                <button
                  onClick={() => { setSelectedSport(null); setDuration(''); setError(null) }}
                  className="text-zinc-400 active:text-zinc-600 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={duration}
                onChange={e => setDuration(e.target.value < 0 ? '' : e.target.value)}
                placeholder="45"
                autoFocus
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
              />
              <p className="text-xs text-zinc-400">Durée en minutes</p>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleConfirm}
                disabled={!duration || saving}
                className="bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                {saving ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          ) : (
            /* Liste des sports + bouton création */
            <div className="flex flex-col gap-3">
              <div className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                {sportTypes.map((sport, i) => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport)}
                    className={`flex items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-100 transition-colors ${
                      i < sportTypes.length - 1 ? 'border-b border-zinc-100' : ''
                    }`}
                  >
                    <SportIcon id={sport.icon} />
                    <span className="text-sm font-medium text-zinc-900">{sport.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCreatingSport(true)}
                className="text-sm text-zinc-400 font-medium py-1 active:text-zinc-600 transition-colors text-center"
              >
                + Créer un sport
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Sheet création inline d'un sport */}
      <BottomSheet
        open={creatingSport}
        onClose={() => setCreatingSport(false)}
        title="Nouveau sport"
        zIndex={60}
      >
        <SportsSheet
          key={creatingSport ? 'open' : 'closed'}
          initialEditing="new"
          onCancel={() => setCreatingSport(false)}
          onSaved={(sport) => { setCreatingSport(false); setSelectedSport(sport) }}
        />
      </BottomSheet>
    </>
  )
}
