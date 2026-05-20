import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useActivities, useActivityMetrics } from '../hooks/useActivities'
import { SPORT_ICONS } from '../lib/constants'
import { getIcon } from '../lib/utils'
import ActivitiesSheet from './ActivitiesSheet'
import BottomSheet from './BottomSheet'

// Convertit un workout_item DB au format interne utilisé par le modal
function dbItemToInternal(dbItem) {
  return {
    id:              dbItem.id,
    activity:        dbItem.activities,
    duration_min:    dbItem.duration_min ?? '',
    values:          Object.fromEntries(
      (dbItem.workout_item_values ?? []).map(v => [v.metric_id, String(v.value)])
    ),
    activityMetrics: (dbItem.workout_item_values ?? []).map(v => ({
      metric_id: v.metric_id,
      metrics:   v.metrics,
    })),
  }
}

function sortedItems(session) {
  return (session?.workout_items ?? [])
    .sort((a, b) => a.item_order - b.item_order)
    .map(dbItemToInternal)
}

// ─── WorkoutModal ─────────────────────────────────────────────
// session=null          → création   (SessionStep)
// session + itemId=null → ajout      (PickerStep)
// session + itemId      → édition    (MetricsStep)
export default function WorkoutModal({
  open, onClose,
  session = null,
  initialEditingItemId = null,
  onAdd, onUpdate,
}) {
  // Gestion de l'état initial du modal selon le contexte (création vs édition, ajout d'item vs édition d'item)
  const isEditing = !!session
  const initialItems   = sortedItems(session)
  const initialView = !session ? 'session' : initialEditingItemId ? 'metrics' : 'picker'
  const initialIndex         = initialEditingItemId ? initialItems.findIndex(item => item.id === initialEditingItemId) : -1 // -1 si création ou ajout

  const [view,            setView]            = useState(initialView)
  const [items,           setItems]           = useState(initialItems)
  const [pendingActivity, setPendingActivity] = useState(initialIndex !== -1 ? initialItems[initialIndex].activity : null)
  const [editingIndex,    setEditingIndex]    = useState(initialIndex !== -1 ? initialIndex : null)
  const [name,         setName]         = useState(session?.name  ?? '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  const handleConfirm = async (itemsToSave) => {
    if (itemsToSave.length === 0) return
    console.log('[WorkoutModal] confirm →', isEditing ? 'update' : 'add', itemsToSave.map(i => i.activity.name))
    setSaving(true)
    setError(null)
    const result = isEditing
      ? await onUpdate(session.id, itemsToSave, null, name.trim() || null)
      : await onAdd(itemsToSave, null, name.trim() || null)
    if (result.error) { setError(result.error); setSaving(false) }
    else onClose()
  }

  const handleEditItem = (i) => {
    console.log('[WorkoutModal] session → metrics (edit item', i, items[i].activity.name + ')')
    setEditingIndex(i)
    setPendingActivity(items[i].activity)
    setView('metrics')
  }

  const handleMetricsConfirm = async (duration_min, values, activityMetrics) => {
    const newItem      = { activity: pendingActivity, duration_min, values, activityMetrics }
    const updatedItems = editingIndex !== null
      ? items.map((item, i) => i === editingIndex ? newItem : item)
      : [...items, newItem]

    console.log('[WorkoutModal] metricsConfirm', pendingActivity.name, { duration_min, values })
    setPendingActivity(null)
    setEditingIndex(null)
    setItems(updatedItems)

    if (isEditing) {
      await handleConfirm(updatedItems)
    } else {
      setView('session')
    }
  }

  const handleMetricsBack = () => {
    if (isEditing) { onClose(); return }
    const wasEditing = editingIndex !== null
    console.log('[WorkoutModal] metrics → ', wasEditing ? 'session' : 'picker')
    setPendingActivity(null)
    setEditingIndex(null)
    setView(wasEditing ? 'session' : 'picker')
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={name} onTitleChange={setName}>
      {view === 'session' && (
        <SessionStep
          items={items}
          saving={saving}
          error={error}
          isEditing={isEditing}
          onEditItem={handleEditItem}
          onRemoveItem={(i) => setItems(prev => prev.filter((_, j) => j !== i))}
          onPickActivity={() => setView('picker')}
          onConfirm={() => handleConfirm(items)}
        />
      )}
      {view === 'picker' && (
        <PickerStep
          onSelect={(activity) => { setPendingActivity(activity); setView('metrics') }}
          onBack={isEditing ? onClose : () => setView('session')}
          showBack={!isEditing}
        />
      )}
      {view === 'metrics' && pendingActivity && (
        <MetricsStep
          activity={pendingActivity}
          initialDuration={editingIndex !== null ? String(items[editingIndex]?.duration_min ?? '') : ''}
          initialValues={editingIndex !== null ? items[editingIndex]?.values ?? {} : {}}
          saving={saving}
          onConfirm={handleMetricsConfirm}
          onBack={handleMetricsBack}
          showBack={!isEditing}
        />
      )}
    </BottomSheet>
  )
}

// ─── SessionStep ──────────────────────────────────────────────
function SessionStep({ items, saving, error, isEditing, onEditItem, onRemoveItem, onPickActivity, onConfirm }) {
  const formatSummary = (item) => {
    const parts = []
    if (item.duration_min) parts.push(`${item.duration_min} min`)
    item.activityMetrics
      .filter(({ metric_id }) => item.values[metric_id] !== '' && item.values[metric_id] !== undefined)
      .forEach(({ metric_id, metrics: m }) => parts.push(`${item.values[metric_id]}${m?.unit ? ' ' + m.unit : ''}`))
    return parts.join(' · ') || '—'
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <div className="flex flex-col">
          {items.map((item, i) => {
            const iconEntry = getIcon(SPORT_ICONS, item.activity.icon)
            return (
              <button
                key={`${item.activity.id}-${i}`}
                onClick={() => onEditItem(i)}
                className={`flex items-center gap-3 py-3 text-left active:bg-zinc-50 transition-colors ${i < items.length - 1 ? 'border-b border-zinc-100' : ''}`}
              >
                {iconEntry && <iconEntry.Icon size={18} strokeWidth={1.75} className={`${iconEntry.color} shrink-0`} />}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-900">{item.activity.name}</span>
                  <span className="text-xs text-zinc-400">{formatSummary(item)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveItem(i) }}
                  className="text-zinc-300 active:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={onPickActivity}
        className="flex items-center justify-center gap-2 border border-zinc-200 rounded-2xl py-3 text-sm font-medium text-zinc-600 active:bg-zinc-50 transition-colors"
      >
        <Plus size={15} strokeWidth={2.5} />
        Ajouter une activité
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={onConfirm}
        disabled={items.length === 0 || saving}
        className="bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all"
      >
        {saving ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Valider la séance'}
      </button>
    </div>
  )
}

// ─── PickerStep ───────────────────────────────────────────────
function PickerStep({ onSelect, onBack, showBack = true }) {
  const { activities } = useActivities()
  const [creatingActivity, setCreatingActivity] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 -ml-1 text-zinc-500 active:text-zinc-700 transition-colors w-fit"
          >
            <ChevronLeft size={18} strokeWidth={2} />
            <span className="text-sm font-medium">Retour</span>
          </button>
        )}

        {activities.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Aucune activité — crée-en une ci-dessous.</p>
        ) : (
          <div className="flex flex-col">
            {activities.map((a, i) => {
              const iconEntry = getIcon(SPORT_ICONS, a.icon)
              return (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={`flex items-center gap-3 py-3.5 text-left active:bg-zinc-50 transition-colors ${
                    i < activities.length - 1 ? 'border-b border-zinc-100' : ''
                  }`}
                >
                  {iconEntry && <iconEntry.Icon size={18} strokeWidth={1.75} className={`${iconEntry.color} shrink-0`} />}
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900">{a.name}</span>
                    {a.muscle_group && <span className="text-xs text-zinc-400">{a.muscle_group}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setCreatingActivity(true)}
          className="text-sm text-zinc-400 font-medium py-1 active:text-zinc-600 transition-colors text-center"
        >
          + Créer une activité
        </button>
      </div>

      <BottomSheet
        open={creatingActivity}
        onClose={() => setCreatingActivity(false)}
        title="Nouvelle activité"
        zIndex={60}
      >
        <ActivitiesSheet
          initialEditing="new"
          onCancel={() => setCreatingActivity(false)}
          onSaved={(activity) => { setCreatingActivity(false); onSelect(activity) }}
        />
      </BottomSheet>
    </>
  )
}

// ─── MetricsStep ──────────────────────────────────────────────
function MetricsStep({ activity, initialDuration = '', initialValues = {}, saving = false, onConfirm, onBack, showBack = true }) {
  const { metrics, loading } = useActivityMetrics(activity.id)
  const [duration, setDuration] = useState(initialDuration)
  const [values,   setValues]   = useState(initialValues)
  const iconEntry = getIcon(SPORT_ICONS, activity.icon)

  return (
    <div className="flex flex-col gap-5">
      {showBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 -ml-1 text-zinc-500 active:text-zinc-700 transition-colors w-fit"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Retour</span>
        </button>
      )}

      <div className="flex items-center gap-3">
        {iconEntry && <iconEntry.Icon size={18} strokeWidth={1.75} className={`${iconEntry.color} shrink-0`} />}
        <span className="text-base font-semibold text-zinc-900">{activity.name}</span>
      </div>

      {/* Durée — toujours affichée */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Durée
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="—"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-16 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">min</span>
        </div>
      </div>

      {/* Métriques spécifiques à l'activité */}
      {loading ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : metrics.length > 0 && (
        <div className="flex flex-col gap-4">
          {metrics.map(({ metric_id, metrics: m }) => (
            <div key={metric_id}>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
                {m.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={values[metric_id] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [metric_id]: e.target.value }))}
                  placeholder="—"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-16 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
                />
                {m.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">
                    {m.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onConfirm(duration, values, metrics)}
        disabled={saving}
        className="bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-30 active:scale-[0.98] transition-all"
      >
        {saving ? 'Enregistrement…' : 'Confirmer'}
      </button>
    </div>
  )
}
