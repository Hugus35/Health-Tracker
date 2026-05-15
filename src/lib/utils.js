// ─── Calcul du métabolisme de base (Mifflin-St Jeor) ─────────
// Retourne le MB en kcal/jour.
// Si les données sont insuffisantes, fallback sur weight × 30.
export function calcBMR({ weight_kg, height_cm, age, sex }) {
  if (weight_kg && height_cm && age && sex) {
    const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return Math.round(sex === 'male' ? base + 5 : base - 161)
  }
  return weight_kg ? Math.round(weight_kg * 30) : 2000
}
