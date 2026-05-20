import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useActivities, useActivityMetrics } from '../hooks/useActivities'
import { useMetrics } from '../hooks/useMetrics'
import { SPORT_ICONS, METRIC_ICONS, MET_PRESETS } from '../lib/constants'
import { getIcon } from '../lib/utils'

// ─── ActivitiesSheet — gestion du catalogue d'activités ──────
// Catalogue unifié sports + exercices.
// Deux vues : 'list' (par défaut) et 'form' (création/édition).
// Même pattern que FoodsSheet.
// initialEditing : null → liste, 'new' → formulaire vide directement
export default function ActivitiesSheet({ initialEditing = null, onCancel = null, onSaved = null }) {
  const { activities, loading, addActivity, updateActivity, archiveActivity } = useActivities()
  const [view,             setView]            = useState(initialEditing === 'new' ? 'form' : 'list')
  const [editingActivity,  setEditingActivity] = useState(null) // null = création, <activity> = édition

  const openCreate = () => { setEditingActivity(null); setView('form') }
  const openEdit   = (activity) => { setEditingActivity(activity); setView('form') }
  const backToList = () => { setEditingActivity(null); setView('list') }

  const handleCancel = view === 'form' && editingActivity === null && onCancel ? onCancel : backToList

  if (view === 'form') {
    return (
      <ActivityForm
        activity={editingActivity}
        onCancel={handleCancel}
        onSave={async (data, metrics) => {
          const result = editingActivity
            ? await updateActivity(editingActivity.id, data, metrics)
            : await addActivity(data, metrics)
          if (!result.error) {
            onSaved && !editingActivity ? onSaved(result.data) : backToList()
          }
          return result
        }}
        onArchive={editingActivity ? async () => {
          const result = await archiveActivity(editingActivity.id)
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
        Ajouter une activité
      </button>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Chargement…</p>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Aucune activité</p>
          <p className="text-xs text-zinc-400">Commence par en ajouter une avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {activities.map((a, i) => (
            <button
              key={a.id}
              onClick={() => openEdit(a)}
              className={`flex items-center gap-3 py-3 active:bg-zinc-50 transition-colors text-left ${
                i < activities.length - 1 ? 'border-b border-zinc-100' : ''
              }`}
            >
              {(() => { const e = getIcon(SPORT_ICONS, a.icon); return e ? <e.Icon size={18} strokeWidth={1.75} className={`${e.color} shrink-0`} /> : null })()}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-900 truncate">{a.name}</span>
                <span className="text-xs text-zinc-400">
                  {a.met_value ? `MET ${a.met_value}` : ''}
                  {a.met_value && a.muscle_group ? ' · ' : ''}
                  {a.muscle_group ?? ''}
                </span>
              </div>
              <ChevronRight size={16} strokeWidth={1.75} className="text-zinc-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire — création ou édition d'une activité ─────────
function ActivityForm({ activity, onCancel, onSave, onArchive }) {
  const [icon,         setIcon]         = useState(activity?.icon         ?? null)
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [name,         setName]         = useState(activity?.name         ?? '')
  const [met,          setMet]          = useState(String(activity?.met_value    ?? ''))
  const [muscleGroup,  setMuscleGroup]  = useState(activity?.muscle_group ?? '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  // Métriques — [{ metric_id }]
  const { metrics: allMetrics, loading: metricsLoading }         = useMetrics()
  const { metrics: existingMetrics, loading: existingLoading }   = useActivityMetrics(activity?.id ?? null)
  const [selectedMetrics, setSelectedMetrics] = useState([])

  useEffect(() => {
    setSelectedMetrics(existingMetrics.map(({ metric_id }) => ({ metric_id })))
  }, [existingMetrics])

  const isMetricSelected = (metric_id) => selectedMetrics.some(m => m.metric_id === metric_id)

  const toggleMetric = (metric_id) => {
    setSelectedMetrics(prev =>
      isMetricSelected(metric_id)
        ? prev.filter(m => m.metric_id !== metric_id)
        : [...prev, { metric_id }]
    )
  }

  const iconEntry = SPORT_ICONS.find(s => s.id === icon) ?? null
  const canSave   = name.trim().length > 0

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onSave(
      {
        icon:         icon ?? null,
        name:         name.trim(),
        met_value:    met !== '' ? parseFloat(met) : null,
        muscle_group: muscleGroup.trim() || null,
      },
      selectedMetrics
    )
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
            placeholder="Bench press, Yoga…"
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

      {/* Groupe musculaire */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Groupe musculaire <span className="normal-case font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={muscleGroup}
          onChange={e => setMuscleGroup(e.target.value)}
          placeholder="Pectoraux, Dos…"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
      </div>

      {/* MET — presets + saisie libre */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Intensité <span className="normal-case font-normal">(optionnel)</span>
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
        <p className="text-xs text-zinc-400 mt-1.5">Utilisé pour estimer les kcal brûlées. Laisser vide si non applicable.</p>
      </div>

      {/* Métriques associées */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1 block">
          Métriques <span className="normal-case font-normal">(optionnel)</span>
        </label>
        <p className="text-xs text-zinc-400 mb-3">
          Sélectionne les métriques à saisir lors d'une séance.
        </p>

        {metricsLoading || existingLoading ? (
          <p className="text-xs text-zinc-400 py-2">Chargement…</p>
        ) : allMetrics.length === 0 ? (
          <p className="text-xs text-zinc-400 py-2">Aucune métrique disponible. Ajoutes-en depuis les réglages.</p>
        ) : (
          <div className="flex flex-col rounded-2xl border border-zinc-200 overflow-hidden">
            {allMetrics.map((m, i) => {
              const selected  = isMetricSelected(m.id)
              const iconEntry = getIcon(METRIC_ICONS, m.icon)

              return (
                <button
                  key={m.id}
                  onClick={() => toggleMetric(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    i < allMetrics.length - 1 ? 'border-b border-zinc-100' : ''
                  } ${selected ? 'bg-zinc-50' : 'bg-white active:bg-zinc-50'}`}
                >
                  {/* Checkbox visuelle */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'
                  }`}>
                    {selected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Icône + label */}
                  {iconEntry
                    ? <iconEntry.Icon size={16} strokeWidth={1.75} className={iconEntry.color} />
                    : <div className="w-4" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900">{m.label}</span>
                    {m.unit && <span className="text-xs text-zinc-400 ml-1.5">{m.unit}</span>}
                  </div>

                </button>
              )
            })}
          </div>
        )}
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
