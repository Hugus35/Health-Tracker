import { useState } from 'react'
import { GOALS, MACRO_RANGES } from '../lib/constants'
import { calcBMR } from '../lib/utils'


// ─── Logique métier (pure, sans UI) ──────────────────────────
// Calcule les valeurs suggérées à partir du poids, du profil et de l'objectif.
// kcal_rest via Mifflin-St Jeor si les données sont disponibles, sinon weight × 30.
function computeSuggestions(weight, goal, profile = {}) {
  const kcal_rest      = calcBMR({ weight_kg: weight, ...profile })
  const deficit_target = goal * 300
  const ranges         = MACRO_RANGES[String(goal)]
  const pct_protein    = ranges.pct_protein.default
  const pct_carbs      = ranges.pct_carbs.default
  return { kcal_rest, deficit_target, pct_protein, pct_carbs }
}

// ─── Étape 1 — Poids ─────────────────────────────────────────
function StepWeight({ value, onChange, onNext }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Quel est ton poids ?</h2>
        <p className="text-sm text-zinc-400">Utilisé pour estimer tes besoins caloriques.</p>
      </div>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="75"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 pr-16 py-4 text-3xl font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-zinc-400 font-medium">kg</span>
      </div>

      <button
        onClick={onNext}
        disabled={!value}
        className="bg-zinc-900 text-white rounded-2xl py-4 text-base font-medium disabled:opacity-20 active:scale-[0.98] transition-all"
      >
        Continuer
      </button>
    </div>
  )
}

// ─── Étape 2 — Profil ────────────────────────────────────────
function StepProfile({ height, age, sex, onChange, onNext, onBack }) {
  const canContinue = height || age || sex  // tous optionnels mais au moins un rempli encourage à continuer

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Ton profil</h2>
        <p className="text-sm text-zinc-400">Utilisé à terme pour calculer ton métabolisme de base.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Sexe */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Sexe</label>
          <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
            {[{ value: 'male', label: 'Homme' }, { value: 'female', label: 'Femme' }].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange('sex', sex === value ? null : value)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  sex === value ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Taille */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Taille</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={height}
              onChange={e => onChange('height', e.target.value)}
              placeholder="175"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 pr-16 py-4 text-3xl font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-zinc-400 font-medium">cm</span>
          </div>
        </div>

        {/* Âge */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Âge</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={e => onChange('age', e.target.value)}
              placeholder="25"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 pr-20 py-4 text-3xl font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-zinc-400 font-medium">ans</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors">
          Retour
        </button>
        <button onClick={onNext} className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all">
          {canContinue ? 'Continuer' : 'Passer'}
        </button>
      </div>
    </div>
  )
}

// ─── Étape 3 — Objectif ──────────────────────────────────────
function StepGoal({ value, onChange, onNext, onBack }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Quel est ton objectif ?</h2>
        <p className="text-sm text-zinc-400">On adaptera tes recommandations en conséquence.</p>
      </div>

      <div className="flex flex-col gap-3">
        {GOALS.map(({ value: val, label, sub, Icon, color }) => {
          const selected = value === val
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-100 bg-zinc-50 active:bg-zinc-100'
              }`}
            >
              <div className={`p-2 rounded-xl ${selected ? 'bg-white/20' : 'bg-white border border-zinc-200'}`}>
                <Icon size={20} className={selected ? 'text-white' : color} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-semibold ${selected ? 'text-white' : 'text-zinc-900'}`}>{label}</span>
                <span className={`text-xs ${selected ? 'text-zinc-300' : 'text-zinc-400'}`}>{sub}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors">
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={value === null}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium disabled:opacity-20 active:scale-[0.98] transition-all"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── Étape 4 — Macros ────────────────────────────────────────
// Répartition protéines / glucides / lipides en %.
// Les inputs sont bornés à la fourchette recommandée pour l'objectif choisi.
function StepMacros({ pctProtein, pctCarbs, onChange, onNext, onBack, goal }) {
  const ranges  = MACRO_RANGES[String(goal)]
  const pctFats = 100 - (parseFloat(pctProtein) || 0) - (parseFloat(pctCarbs) || 0)

  const macroFields = [
    { label: 'Protéines', value: pctProtein, key: 'pctProtein', range: ranges.pct_protein },
    { label: 'Glucides',  value: pctCarbs,   key: 'pctCarbs',   range: ranges.pct_carbs   },
  ]

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Répartition des macros</h2>
        <p className="text-sm text-zinc-400">Fourchettes recommandées pour ton objectif. Ajuste dans ces limites.</p>
      </div>

      <div className="flex flex-col gap-4">
        {macroFields.map(({ label, value, key, range }) => {
          const num      = parseFloat(value)
          const outRange = !isNaN(num) && (num < range.min || num > range.max)
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>
                <span className="text-xs text-zinc-400">{range.min}–{range.max} %</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={value}
                  onChange={e => onChange(key, e.target.value)}
                  onBlur={() => {
                    const n = parseFloat(value)
                    if (!isNaN(n)) onChange(key, String(Math.min(range.max, Math.max(range.min, n))))
                  }}
                  className={`w-full rounded-2xl px-5 pr-12 py-4 text-3xl font-medium placeholder:text-zinc-300 focus:outline-none focus:ring-2 transition-colors ${
                    outRange
                      ? 'bg-red-50 border border-red-300 text-red-500 focus:ring-red-400'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 focus:ring-zinc-900 focus:bg-white'
                  }`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-zinc-400 font-medium">%</span>
              </div>
              {outRange && <p className="text-xs text-red-500 mt-1.5">Entre {range.min} et {range.max} %</p>}
            </div>
          )
        })}

        {/* Lipides — lecture seule */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Lipides</label>
          <div className="relative">
            <div className="w-full rounded-2xl px-5 pr-12 py-4 text-3xl font-medium border bg-zinc-100 border-zinc-200 text-zinc-400">
              {pctFats}
            </div>
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base text-zinc-400 font-medium">%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors">
          Retour
        </button>
        <button onClick={onNext} className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all">
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── Étape 5 — Récap ─────────────────────────────────────────
function StepRecap({ weight, goal, overrides, onOverride, onSubmit, onBack, saving, error }) {
  const goalLabel = GOALS.find(g => g.value === goal)?.label
  const hi        = (text) => <span className="font-semibold text-zinc-700">{text}</span>
  const pctFats   = 100 - (parseFloat(overrides.pct_protein) || 0) - (parseFloat(overrides.pct_carbs) || 0)

  const fields = [
    {
      key:         'kcal_rest',
      label:       'Calories au repos',
      unit:        'kcal / jour',
      explanation: <>Tes besoins de base les {hi('jours sans sport')}. Utilisé comme référence pour ton objectif journalier.</>,
    },
    {
      key:   'deficit_target',
      label: goal === -1 ? 'Déficit calorique' : goal === 1 ? 'Surplus calorique' : 'Déficit / surplus',
      unit:  'kcal / jour',
      explanation:
        goal === -1 ? <>Mange moins que tu ne dépenses pour {hi('perdre du poids progressivement')}.</>
        : goal === 1 ? <>Mange plus que tu ne dépenses pour {hi('favoriser la prise de masse')}.</>
        : <>Ni déficit ni surplus — l'objectif est de {hi('stabiliser ton poids')}.</>,
    },
    {
      key:         'pct_protein',
      label:       'Protéines',
      unit:        '%',
      explanation: goal === 0
        ? <>Apport suffisant pour {hi('préserver ta masse musculaire')} en maintien.</>
        : goal === -1
          ? <>Apport élevé pour {hi('limiter la fonte musculaire')} en déficit.</>
          : <>Apport pour {hi('optimiser la synthèse musculaire')} en prise de masse.</>,
    },
    {
      key:         'pct_carbs',
      label:       'Glucides',
      unit:        '%',
      explanation: <>Principale source d'énergie — {hi('carburant pour l\'effort')}. Les lipides prennent le reste ({pctFats}%).</>,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Tes recommandations</h2>
        <p className="text-sm text-zinc-400">
          Basé sur <span className="font-medium text-zinc-600">{weight} kg</span> · <span className="font-medium text-zinc-600">{goalLabel}</span>. Ajuste si besoin.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map(field => (
          <div key={field.key} className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{field.label}</label>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={overrides[field.key]}
                onChange={e => onOverride(field.key, e.target.value)}
                className="w-28 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xl font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-colors"
              />
              <span className="text-sm text-zinc-400">{field.unit}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{field.explanation}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors">
          Retour
        </button>
        <button
          onClick={onSubmit}
          disabled={saving || pctFats < 0}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Commencer'}
        </button>
      </div>
    </div>
  )
}

// ─── Onboarding — chef d'orchestre ───────────────────────────
export default function Onboarding({ onComplete }) {
  const [step,       setStep]       = useState(0)
  const [weight,     setWeight]     = useState('')
  const [profile,    setProfile]    = useState({ height: '', age: '', sex: null })
  const [goal,       setGoal]       = useState(null)
  const [pctProtein, setPctProtein] = useState('')
  const [pctCarbs,   setPctCarbs]   = useState('')
  const [overrides,  setOverrides]  = useState({})
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)

  const profileForCompute = {
    height_cm: parseFloat(profile.height) || null,
    age:       parseInt(profile.age)      || null,
    sex:       profile.sex,
  }

  const handleProfileChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }))

  const handleGoToMacros = () => {
    const base = computeSuggestions(parseFloat(weight), goal, profileForCompute)
    setPctProtein(String(base.pct_protein))
    setPctCarbs(String(base.pct_carbs))
    setStep(3)
  }

  const handleGoToRecap = () => {
    const base = computeSuggestions(parseFloat(weight), goal, profileForCompute)
    setOverrides({
      kcal_rest:      String(base.kcal_rest),
      deficit_target: String(base.deficit_target),
      pct_protein:    pctProtein || String(base.pct_protein),
      pct_carbs:      pctCarbs   || String(base.pct_carbs),
    })
    setStep(4)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onComplete({
      weight_kg:      parseFloat(weight),
      height_cm:      parseFloat(profile.height) || null,
      age:            parseInt(profile.age)       || null,
      sex:            profile.sex || null,
      kcal_rest:      parseFloat(overrides.kcal_rest),
      deficit_target: parseFloat(overrides.deficit_target),
      pct_protein:    parseFloat(overrides.pct_protein) / 100,
      pct_carbs:      parseFloat(overrides.pct_carbs)   / 100,
      goal,
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    }
  }

  const steps = [
    <StepWeight
      value={weight}
      onChange={setWeight}
      onNext={() => setStep(1)}
    />,
    <StepProfile
      height={profile.height}
      age={profile.age}
      sex={profile.sex}
      onChange={handleProfileChange}
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    />,
    <StepGoal
      value={goal}
      onChange={setGoal}
      onNext={handleGoToMacros}
      onBack={() => setStep(1)}
    />,
    <StepMacros
      pctProtein={pctProtein}
      pctCarbs={pctCarbs}
      onChange={(key, val) => key === 'pctProtein' ? setPctProtein(val) : setPctCarbs(val)}
      onNext={handleGoToRecap}
      onBack={() => setStep(2)}
      goal={goal}
    />,
    <StepRecap
      weight={parseFloat(weight)}
      goal={goal}
      overrides={overrides}
      onOverride={(key, val) => setOverrides(prev => ({ ...prev, [key]: val }))}
      onSubmit={handleSubmit}
      onBack={() => setStep(3)}
      saving={saving}
      error={error}
    />,
  ]

  return (
    <div className="min-h-svh max-w-[390px] mx-auto flex flex-col px-6 py-14 bg-white">
      <div className="flex gap-1.5 mb-12">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-zinc-900' : 'bg-zinc-100'}`}
          />
        ))}
      </div>
      {steps[step]}
    </div>
  )
}
