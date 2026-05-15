import { useState } from 'react'
import { GOALS, MACRO_RANGES } from '../lib/constants'
import { calcBMR } from '../lib/utils'

// ─── ProfileSheet — gestion du profil utilisateur ────────────
// Même pattern que FoodsSheet / SportsSheet : vue lecture + vue édition.
// Reçoit settings/updateSettings depuis App (déjà chargés) pour éviter
// un fetch Supabase supplémentaire à chaque ouverture.
// BottomSheet démonte ce composant à la fermeture → state réinitialisé
// automatiquement à la réouverture, sans besoin de reset externe.
export default function ProfileSheet({ settings, updateSettings }) {
  const [view, setView] = useState('view') // 'view' | 'form'

  if (!settings) return null

  return view === 'view'
    ? <ProfileView settings={settings} onEdit={() => setView('form')} />
    : <ProfileEdit settings={settings} updateSettings={updateSettings} onDone={() => setView('view')} />
}

// ─── Mode lecture ─────────────────────────────────────────────
function ProfileView({ settings, onEdit }) {
  const goalLabel      = GOALS.find(g => g.value === settings.goal)?.label
  const deficitDisplay = settings.deficit_target > 0 ? `+${settings.deficit_target}` : settings.deficit_target
  const pctFats        = Math.round((1 - (settings.pct_protein ?? 0.30) - (settings.pct_carbs ?? 0.45)) * 100)

  const rows = [
    { label: 'Objectif',          value: goalLabel },
    { label: 'Poids',             value: settings.weight_kg  ? `${settings.weight_kg} kg`   : '—' },
    { label: 'Taille',            value: settings.height_cm  ? `${settings.height_cm} cm`   : '—' },
    { label: 'Âge',               value: settings.age        ? `${settings.age} ans`         : '—' },
    { label: 'Sexe',              value: settings.sex === 'male' ? 'Homme' : settings.sex === 'female' ? 'Femme' : '—' },
    { label: 'Calories au repos', value: `${settings.kcal_rest} kcal` },
    { label: 'Déficit / surplus', value: `${deficitDisplay} kcal` },
    { label: '% Protéines',       value: `${Math.round((settings.pct_protein ?? 0.30) * 100)} %` },
    { label: '% Glucides',        value: `${Math.round((settings.pct_carbs ?? 0.45) * 100)} %` },
    { label: '% Lipides',         value: `${pctFats} %` },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-3 ${i < rows.length - 1 ? 'border-b border-zinc-100' : ''}`}
          >
            <span className="text-sm text-zinc-500">{row.label}</span>
            <span className="text-sm font-semibold text-zinc-900">{row.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
      >
        Modifier
      </button>
    </div>
  )
}

// ─── Mode édition ─────────────────────────────────────────────
function ProfileEdit({ settings, updateSettings, onDone }) {
  const [goal,       setGoal]       = useState(settings.goal)
  const [weight,     setWeight]     = useState(String(settings.weight_kg ?? ''))
  const [height,     setHeight]     = useState(String(settings.height_cm ?? ''))
  const [age,        setAge]        = useState(String(settings.age ?? ''))
  const [sex,        setSex]        = useState(settings.sex ?? null)
  const [kcalRest,   setKcalRest]   = useState(String(settings.kcal_rest ?? 2000))
  const [deficit,    setDeficit]    = useState(String(settings.deficit_target ?? 0))
  const [pctProtein, setPctProtein] = useState(String(Math.round((settings.pct_protein ?? 0.30) * 100)))
  const [pctCarbs,   setPctCarbs]   = useState(String(Math.round((settings.pct_carbs   ?? 0.45) * 100)))
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const pctFats = 100 - (parseFloat(pctProtein) || 0) - (parseFloat(pctCarbs) || 0)

  const handleGoalChange = (val) => {
    setGoal(val)
    setDeficit(String(val * 300))
    const ranges = MACRO_RANGES[String(val)]
    setPctProtein(String(ranges.pct_protein.default))
    setPctCarbs(String(ranges.pct_carbs.default))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await updateSettings({
      goal,
      weight_kg:      parseFloat(weight)     || null,
      height_cm:      parseFloat(height)     || null,
      age:            parseInt(age)          || null,
      sex:            sex || null,
      kcal_rest:      parseFloat(kcalRest)   || 2000,
      deficit_target: parseFloat(deficit)    || 0,
      pct_protein:    (parseFloat(pctProtein) || 30) / 100,
      pct_carbs:      (parseFloat(pctCarbs)   || 45) / 100,
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    } else {
      onDone()
    }
  }

  const bmr = calcBMR({
    weight_kg: parseFloat(weight)  || null,
    height_cm: parseFloat(height)  || null,
    age:       parseInt(age)       || null,
    sex,
  })
  const bmrFromFormula = parseFloat(weight) && parseFloat(height) && parseInt(age) && sex

  const numericInputs = [
    { label: 'Poids',  value: weight, onChange: setWeight, unit: 'kg'  },
    { label: 'Taille', value: height, onChange: setHeight, unit: 'cm'  },
    { label: 'Âge',    value: age,    onChange: setAge,    unit: 'ans' },
    {
      label:    'Calories au repos',
      value:    kcalRest,
      onChange: setKcalRest,
      unit:     'kcal',
      help:     bmrFromFormula
        ? `Mifflin-St Jeor : ${bmr} kcal — ajuste si besoin.`
        : 'Complète poids, taille, âge et sexe pour obtenir une suggestion précise.',
    },
    { label: 'Déficit / surplus', value: deficit, onChange: setDeficit, unit: 'kcal', help: 'Négatif pour un déficit, positif pour un surplus.' },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Objectif */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Objectif</label>
        <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
          {GOALS.map(({ value, label, Icon, color }) => {
            const selected = goal === value
            return (
              <button
                key={value}
                onClick={() => handleGoalChange(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${selected ? 'bg-white shadow-sm' : ''}`}
              >
                <Icon size={18} className={color} strokeWidth={1.75} />
                <span className={`text-[11px] leading-tight text-center font-medium ${selected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sexe */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Sexe</label>
        <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
          {[{ value: 'male', label: 'Homme' }, { value: 'female', label: 'Femme' }].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSex(value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                sex === value ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs numériques */}
      {numericInputs.map(({ label, value, onChange, unit, help }) => (
        <div key={label}>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">{label}</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-14 py-3 text-base font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">{unit}</span>
          </div>
          {help && <p className="text-xs text-zinc-400 mt-1.5">{help}</p>}
        </div>
      ))}

      {/* Répartition macros */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Répartition macros</label>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Protéines', value: pctProtein, onChange: setPctProtein, range: MACRO_RANGES[String(goal)].pct_protein },
            { label: 'Glucides',  value: pctCarbs,   onChange: setPctCarbs,   range: MACRO_RANGES[String(goal)].pct_carbs   },
          ].map(({ label, value, onChange, range }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex flex-col w-24 shrink-0">
                <span className="text-sm text-zinc-500">{label}</span>
                <span className="text-xs text-zinc-400">{range.min}–{range.max} %</span>
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onBlur={() => {
                    const n = parseFloat(value)
                    if (!isNaN(n)) onChange(String(Math.min(range.max, Math.max(range.min, n))))
                  }}
                  className={`w-full rounded-xl px-4 pr-10 py-2.5 text-base font-medium focus:outline-none focus:ring-2 transition-colors ${
                    !isNaN(parseFloat(value)) && (parseFloat(value) < range.min || parseFloat(value) > range.max)
                      ? 'bg-red-50 border border-red-300 text-red-500 focus:ring-red-400'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:ring-zinc-900 focus:bg-white'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 w-24 shrink-0">Lipides</span>
            <div className="relative flex-1">
              <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 pr-10 py-2.5 text-base font-medium text-zinc-400">
                {pctFats}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onDone}
          className="flex-1 border border-zinc-200 rounded-2xl py-3.5 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
