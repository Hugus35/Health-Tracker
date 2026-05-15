import { useState } from 'react'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useSportTypes } from '../hooks/useSportTypes'
import { SPORT_ICONS, MET_PRESETS } from '../lib/constants'
import SportIcon from './SportIcon'

// ─── SportsSheet — gestion du catalogue de sports ────────────
// Deux vues : 'list' (par défaut) et 'form' (création/édition).
// Même pattern que FoodsSheet.
// initialEditing : null → liste, 'new' → formulaire vide directement
export default function SportsSheet({ initialEditing = null, onCancel = null, onSaved = null }) {
  const { sportTypes, loading, addSportType, updateSportType, archiveSportType } = useSportTypes()
  const [view,             setView]            = useState(initialEditing === 'new' ? 'form' : 'list')
  const [editingSportType, setEditingSportType] = useState(null) // null = création, <sport> = édition

  const openCreate = () => { setEditingSportType(null); setView('form') }
  const openEdit   = (sport) => { setEditingSportType(sport); setView('form') }
  const backToList = () => { setEditingSportType(null); setView('list') }

  const handleCancel = view === 'form' && editingSportType === null && onCancel ? onCancel : backToList

  if (view === 'form') {
    return (
      <SportForm
        sport={editingSportType}
        onCancel={handleCancel}
        onSave={async (data) => {
          const result = editingSportType
            ? await updateSportType(editingSportType.id, data)
            : await addSportType(data)
          if (!result.error) {
            onSaved && !editingSportType ? onSaved(result.data) : backToList()
          }
          return result
        }}
        onArchive={editingSportType ? async () => {
          const result = await archiveSportType(editingSportType.id)
          if (!result.error) backToList()
          return result
        } : null}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={openCreate}
        className="flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-3 text-sm font-medium active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={2.5} />
        Ajouter un sport
      </button>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Chargement…</p>
      ) : sportTypes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Aucun sport</p>
          <p className="text-xs text-zinc-400">Commence par en ajouter un avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {sportTypes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => openEdit(s)}
              className={`flex items-center gap-3 py-3 active:bg-zinc-50 transition-colors text-left ${
                i < sportTypes.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              <SportIcon id={s.icon} />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900 truncate">{s.name}</span>
                <span className="text-xs text-zinc-400">MET {s.met_value}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire — création ou édition d'un sport ─────────────
function SportForm({ sport, onCancel, onSave, onArchive }) {
  const [icon,       setIcon]       = useState(sport?.icon ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [name,       setName]       = useState(sport?.name ?? '')
  const [met,        setMet]        = useState(String(sport?.met_value ?? ''))
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const iconEntry = SPORT_ICONS.find(s => s.id === icon) ?? null
  const canSave   = name.trim().length > 0 && met !== ''

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onSave({
      icon:      icon ?? null,
      name:      name.trim(),
      met_value: parseFloat(met),
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onCancel}
        className="flex items-center gap-1 -ml-1 text-zinc-500 active:text-zinc-700 transition-colors w-fit"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Nom + bouton icône */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Nom
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Yoga, Escalade…"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
          <button
            onClick={() => setPickerOpen(o => !o)}
            className={`w-12 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
              pickerOpen
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'bg-zinc-50 border-zinc-200 active:bg-zinc-100'
            }`}
          >
            {iconEntry
              ? <iconEntry.Icon size={18} strokeWidth={1.75} className={pickerOpen ? 'text-white' : iconEntry.color} />
              : <span className="text-xs font-medium text-zinc-400">+</span>
            }
          </button>
        </div>

        {pickerOpen && (
          <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
            {SPORT_ICONS.map(({ id, Icon, color }) => (
              <button
                key={id}
                onClick={() => { setIcon(icon === id ? null : id); setPickerOpen(false) }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  icon === id ? 'bg-zinc-900' : 'bg-white active:bg-zinc-100'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} className={icon === id ? 'text-white' : color} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MET — presets + saisie libre */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Intensité
        </label>
        <div className="flex gap-2 mb-3">
          {MET_PRESETS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setMet(String(value))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                parseFloat(met) === value
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 active:bg-zinc-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={met}
            onChange={e => setMet(e.target.value)}
            placeholder="6.0"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-20 py-3 text-base font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">MET</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">Utilisé pour estimer les kcal brûlées.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        {onArchive ? (
          <button
            onClick={onArchive}
            className="px-4 border border-red-200 rounded-2xl py-3.5 text-sm text-red-500 font-medium active:bg-red-50 transition-colors"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 border border-zinc-200 rounded-2xl py-3.5 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
