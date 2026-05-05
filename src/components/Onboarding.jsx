import { useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

// ─── Constantes ──────────────────────────────────────────────
// Les 3 objectifs possibles. value (-1/0/1) pilote les calculs.
const GOALS = [
  { value: -1, label: 'Perdre du poids',  sub: 'Déficit calorique contrôlé',  Icon: TrendingDown, color: 'text-emerald-500' },
  { value:  0, label: 'Maintien',          sub: 'Stabiliser ton poids actuel', Icon: Minus,        color: 'text-zinc-400'    },
  { value:  1, label: 'Prise de masse',   sub: 'Surplus calorique maîtrisé',  Icon: TrendingUp,   color: 'text-red-500'     },
]

// ─── Logique métier (pure, sans UI) ─────────────────────────
// Calcule les 3 valeurs suggérées à partir du poids et de l'objectif.
// Appelée au moment de passer au récap (étape 4).
function compute(weight, goal) {
  const kcal_rest        = Math.round(weight * 30)
  const deficit_target   = goal * 300
  const protein_target_g = Math.round(weight * (goal === 0 ? 1.6 : 2))
  return { kcal_rest, deficit_target, protein_target_g }
}

// ─── Étape 1 — Poids ────────────────────────────────────────
function StepWeight({ value, onChange, onNext }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Quel est ton poids ?</h2>
        <p className="text-sm text-zinc-400">Utilisé pour estimer tes besoins caloriques.</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="75"
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-3xl font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
        <span className="text-base text-zinc-400 font-medium">kg</span>
      </div>

      <button
        onClick={onNext}
        disabled={!value || parseFloat(value) <= 0}
        className="bg-zinc-900 text-white rounded-2xl py-4 text-base font-medium disabled:opacity-20 active:scale-[0.98] transition-all"
      >
        Continuer
      </button>
    </div>
  )
}

// ─── Étape 2 — Objectif ─────────────────────────────────────
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
                selected
                  ? 'border-zinc-900 bg-zinc-900'
                  : 'border-zinc-100 bg-zinc-50 active:bg-zinc-100'
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
        <button
          onClick={onBack}
          className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
        >
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

// ─── Étape 3 — Protéines ────────────────────────────────────
// Optionnelle : l'user peut laisser vide, la suggestion sera utilisée.
function StepProteins({ value, onChange, onNext, onBack, suggestion }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Objectif protéines ?</h2>
        <p className="text-sm text-zinc-400">
          On te suggère <span className="font-medium text-zinc-600">{suggestion} g/jour</span>. Laisse vide pour utiliser cette valeur.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={String(suggestion)}
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-3xl font-medium text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
        />
        <span className="text-base text-zinc-400 font-medium">g</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium active:scale-[0.98] transition-all"
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── Étape 4 — Récap ────────────────────────────────────────
// Affiche les 3 valeurs calculées avec leur explication.
// L'user peut ajuster chaque champ avant de valider.
function StepRecap({ weight, goal, overrides, onOverride, onSubmit, onBack, saving, error }) {
  const goalLabel = GOALS.find(g => g.value === goal)?.label

  const hi = (text) => <span className="font-semibold text-zinc-700">{text}</span>

  const fields = [
    {
      key: 'kcal_rest',
      label: 'Calories au repos',
      unit: 'kcal / jour',
      explanation: <>Tes besoins de base les {hi('jours sans sport')}. Utilisé comme référence pour calculer ton objectif journalier.</>,
    },
    {
      key: 'deficit_target',
      label: goal === -1 ? 'Déficit calorique' : goal === 1 ? 'Surplus calorique' : 'Déficit / surplus',
      unit: 'kcal / jour',
      explanation:
        goal === -1 ? <>Mange moins que tu ne dépenses pour {hi('perdre du poids progressivement')}, sans impacter tes performances.</>
        : goal === 1 ? <>Mange plus que tu ne dépenses pour {hi('favoriser la prise de masse')} sans excès de gras.</>
        : <>Ni déficit ni surplus — l'objectif est de {hi('stabiliser ton poids')} sur la durée.</>,
    },
    {
      key: 'protein_target_g',
      label: 'Objectif protéines',
      unit: 'g / jour',
      explanation:
        goal === 0
          ? <>Apport suffisant pour {hi('préserver ta masse musculaire')} en phase de maintien.</>
          : goal === -1
            ? <>Apport élevé pour {hi('limiter la fonte musculaire')} pendant le déficit calorique.</>
            : <>Apport élevé pour {hi('optimiser la synthèse musculaire')} en phase de prise de masse.</>,
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
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              {field.label}
            </label>
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
        <button
          onClick={onBack}
          className="flex-1 border border-zinc-200 rounded-2xl py-4 text-sm text-zinc-500 font-medium active:bg-zinc-50 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex-1 bg-zinc-900 text-white rounded-2xl py-4 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {saving ? 'Enregistrement…' : 'Commencer'}
        </button>
      </div>
    </div>
  )
}

// ─── Onboarding — chef d'orchestre ──────────────────────────
export default function Onboarding({ onComplete }) {
  const [step, setStep]           = useState(0)
  const [weight, setWeight]       = useState('')
  const [goal, setGoal]           = useState(null)
  const [proteins, setProteins]   = useState('')
  const [overrides, setOverrides] = useState({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const computed = weight && goal !== null ? compute(parseFloat(weight), goal) : null

  const handleGoToRecap = () => {
    const base = compute(parseFloat(weight), goal)
    setOverrides({
      kcal_rest:        String(base.kcal_rest),
      deficit_target:   String(base.deficit_target),
      protein_target_g: proteins ? proteins : String(base.protein_target_g),
    })
    setStep(3)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    const { error } = await onComplete({
      weight_kg:        parseFloat(weight),
      kcal_rest:        parseFloat(overrides.kcal_rest),
      deficit_target:   parseFloat(overrides.deficit_target),
      protein_target_g: parseFloat(overrides.protein_target_g),
    })
    if (error) {
      setError(`Erreur : ${error}`)
      setSaving(false)
    }
  }

  const steps = [
    <StepWeight   value={weight}   onChange={setWeight}   onNext={() => setStep(1)} />,
    <StepGoal     value={goal}     onChange={setGoal}     onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <StepProteins value={proteins} onChange={setProteins} onNext={handleGoToRecap}  onBack={() => setStep(1)} suggestion={computed?.protein_target_g ?? '—'} />,
    <StepRecap
      weight={parseFloat(weight)}
      goal={goal}

      overrides={overrides}
      onOverride={(key, val) => setOverrides(prev => ({ ...prev, [key]: val }))}
      onSubmit={handleSubmit}
      onBack={() => setStep(2)}
      saving={saving}
      error={error}
    />,
  ]

  return (
    <div className="min-h-svh max-w-[390px] mx-auto flex flex-col px-6 py-14 bg-white">
      {/* Barre de progression */}
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
