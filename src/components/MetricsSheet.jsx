import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import { METRIC_ICONS } from '../lib/constants'
import { getIcon } from '../lib/utils'

// ─── MetricsSheet — gestion du catalogue de métriques ────────
// Même pattern que FoodsSheet / ActivitiesSheet.
// id = slug unique (ex: 'reps', 'weight_kg') — généré depuis le label si non renseigné.
export default function MetricsSheet() {
  const { metrics, loading, addMetric, updateMetric, deleteMetric } = useMetrics()
  const [view,          setView]          = useState('list')
  const [editingMetric, setEditingMetric] = useState(null)

  const openCreate = () => { setEditingMetric(null); setView('form') }
  const openEdit   = (m) => { setEditingMetric(m); setView('form') }
  const backToList = () => { setEditingMetric(null); setView('list') }

  if (view === 'form') {
    return (
      <MetricForm
        metric={editingMetric}
        onCancel={backToList}
        onSave={async (data) => {
          const result = editingMetric
            ? await updateMetric(editingMetric.id, { label: data.label, unit: data.unit, icon: data.icon })
            : await addMetric(data)
          if (!result.error) backToList()
          return result
        }}
        onDelete={editingMetric ? async () => {
          const result = await deleteMetric(editingMetric.id)
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
        Ajouter une métrique
      </button>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-8">Chargement…</p>
      ) : metrics.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Aucune métrique</p>
          <p className="text-xs text-zinc-400">Ajoute des métriques pour les associer à tes activités.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {metrics.map((m, i) => {
            const iconEntry = getIcon(METRIC_ICONS, m.icon)
            return (
              <button
                key={m.id}
                onClick={() => openEdit(m)}
                className={`flex items-center gap-3 py-3 active:bg-zinc-50 transition-colors text-left ${
                  i < metrics.length - 1 ? 'border-b border-zinc-100' : ''
                }`}
              >
                {iconEntry
                  ? <iconEntry.Icon size={18} strokeWidth={1.75} className={iconEntry.color} />
                  : <div className="w-[18px]" />
                }
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-900">{m.label}</span>
                  <span className="text-xs text-zinc-400">{m.unit ? `${m.unit}` : ''}</span>
                </div>
                <ChevronRight size={16} strokeWidth={1.75} className="text-zinc-300 shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire ───────────────────────────────────────────────
function MetricForm({ metric, onCancel, onSave, onDelete }) {
  const [label,      setLabel]      = useState(metric?.label ?? '')
  const [unit,       setUnit]       = useState(metric?.unit  ?? '')
  const [icon,       setIcon]       = useState(metric?.icon  ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const isEditing = !!metric
  const slugify   = (str) => str.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

  const iconEntry = getIcon(METRIC_ICONS, icon)
  const canSave   = label.trim().length > 0

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const data = isEditing
      ? { label: label.trim(), unit: unit.trim() || null, icon: icon ?? null }
      : { id: slugify(label), label: label.trim(), unit: unit.trim() || null, icon: icon ?? null }
    const { error } = await onSave(data)
    if (error) { setError(`Erreur : ${error}`); setSaving(false) }
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

      {/* Nom + picker icône */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Nom
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Répétitions, Distance…"
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
          <button
            onClick={() => setPickerOpen(o => !o)}
            className={`w-12 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
              pickerOpen
                ? 'bg-zinc-900 border-zinc-900'
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
            {METRIC_ICONS.map(({ id, Icon, color, label: iconLabel }) => (
              <button
                key={id}
                onClick={() => { setIcon(icon === id ? null : id); setPickerOpen(false) }}
                title={iconLabel}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  icon === id ? 'bg-zinc-900' : 'bg-white active:bg-zinc-100'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} className={icon === id ? 'text-white' : color} />
              </button>
            ))}
          </div>
        )}

        {!isEditing && label.trim() && (
          <p className="text-xs text-zinc-400 mt-1.5">ID : {slugify(label)}</p>
        )}
      </div>

      {/* Unité */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
          Unité <span className="normal-case font-normal">(optionnel)</span>
        </label>
        <input
          type="text"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="kg, min, km…"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        {onDelete ? (
          <button
            onClick={onDelete}
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
