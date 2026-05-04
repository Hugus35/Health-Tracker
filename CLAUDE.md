# CLAUDE.md — Calorie Tracker

## Vue d'ensemble

Application mobile-first de suivi calorique et de macronutriments, déployée en tant que PWA (Progressive Web App) installable sur iOS via Safari. Outil personnel, un seul utilisateur, pas d'authentification.

---

## Stack technique

| Couche | Choix |
|---|---|
| Frontend | React + Vite |
| Style | Tailwind CSS (`@tailwindcss/vite`) |
| PWA | `vite-plugin-pwa` |
| Scan code-barres | `@zxing/browser` + `@zxing/library` |
| Graphes | `recharts` |
| Base de données | Supabase (PostgreSQL hébergé) |
| Client DB | `@supabase/supabase-js` |
| Hosting | Vercel |

---

## Variables d'environnement

Fichier `.env.local` à la racine (ne jamais committer) :

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## Structure du projet

```
src/
  components/
    Journal.jsx          # journal du jour — liste des repas + total kcal/macros
    MealEntry.jsx        # saisie d'un repas (type + aliments)
    FoodSearch.jsx       # recherche dans la BD perso
    Scanner.jsx          # caméra + ZXing, retourne un code EAN
    FoodForm.jsx         # saisie manuelle d'un aliment
    WebFoodSearch.jsx    # recherche sur OpenFoodFacts (déclenchée manuellement)
    Reporting.jsx        # graphes jour / semaine / 4 semaines
    Settings.jsx         # objectifs caloriques et protéines
    BottomNav.jsx        # navigation mobile (4 onglets)
    FoodModal.jsx        # modale partagée — encapsule le flux d'ajout d'aliment
  hooks/
    useSupabase.js       # client Supabase partagé (singleton)
    useOpenFoodFacts.js  # appels API OFF (recherche par EAN ou par nom)
    useDay.js            # état du jour courant (date, tag training/repos)
  lib/
    supabase.js          # initialisation du client Supabase
  App.jsx
  main.jsx
```

---

## Schéma de base de données

```sql
-- Base d'aliments personnelle
create table foods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  barcode       text unique,
  kcal          numeric not null,           -- energy-kcal_100g
  proteins      numeric not null default 0, -- proteins_100g
  carbs         numeric not null default 0, -- carbohydrates_100g
  sugar         numeric,                    -- sugars_100g (sous-ensemble de carbs)
  fats          numeric not null default 0, -- fat_100g
  fiber         numeric,                    -- fiber_100g
  sodium        numeric,                    -- sodium_100g
  default_unit  text not null default 'g',  -- unité proposée par défaut à la saisie d'un repas
  is_archived   boolean not null default false,
  created_at    timestamptz default now()
);

-- Journal des repas
create table meals (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,
  meal_type   text check (meal_type in ('morning','lunch','dinner','snack')),
  created_at  timestamptz default now()
);

-- Aliments dans un repas
create table meal_items (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid references meals(id) on delete cascade,
  food_id     uuid references foods(id),
  quantity    numeric not null,
  unit        text not null default 'g', -- ex : g, kg, ml, L, cl, unité, tranche, cuillère
  created_at  timestamptz default now()
);

-- Tag journalier (training / repos)
create table training_days (
  date  date primary key,
  type  text check (type in ('strength','cardio','rest')) default 'strength'
);

-- Objectifs et préférences
create table settings (
  id               int primary key default 1,
  kcal_rest        numeric default 2000,
  kcal_training    numeric default 2400,
  protein_target_g numeric default 160,
  check (id = 1)
);

insert into settings default values;
```

---

## Scénarios utilisateur principaux

### S1 — Ajouter un aliment à la BD / au journal

1. Entrée : recherche texte **ou** scan EAN (caméra via ZXing)
2. Recherche dans la table `foods` (BD perso)
3. **Trouvé** → ajouter au journal directement
4. **Non trouvé** → afficher bouton « Chercher sur la toile »
5. Appel OpenFoodFacts API (par EAN ou par nom)
6. **Trouvé sur OFF** → afficher fiche → l'utilisateur valide → sauver dans `foods` → ajouter au journal
7. **Non trouvé sur OFF** → formulaire de saisie manuelle → sauver dans `foods` → ajouter au journal
8. Après saisie manuelle uniquement : proposer optionnellement de contribuer les données à OpenFoodFacts

### S2 — Saisir un repas

1. Ouvrir le journal du jour
2. Définir le tag du jour si absent : **Training** ou **Repos** (une seule fois par jour, stocké dans `training_days`)
3. Sélectionner le type de repas : Matin / Midi / Soir / Snack
4. Ajouter des aliments :
   - Recherche dans la BD perso (FoodSearch)
   - Si aliment absent : bouton **Ajouter un aliment** → ouvre FoodModal (flux S1 complet, inline)
   - Kcal et macros mis à jour en temps réel à chaque ajout
5. Valider → création du `meal` + `meal_items` dans Supabase

### S3 — Reporting

1. Onglet Reporting
2. Sélecteur de vue : Jour / Semaine / 4 semaines
3. Indicateurs affichés :
   - Kcal consommées vs objectif (différencié training / repos via `training_days`)
   - Répartition macros (protéines / glucides / lipides en %) — graphe `recharts`
   - Tendance kcal sur 4 semaines (courbe)

### S4 — Premier lancement (onboarding)

1. Détection : aucune entrée dans `settings.kcal_rest` (valeur par défaut)
2. Écran d'onboarding :
   - Objectif kcal jour de repos
   - Objectif kcal jour d'entraînement
   - Objectif protéines (g/jour) — **optionnel**, peut être défini plus tard dans Settings
3. Sauvegarde dans `settings` → accès au journal

---

## Composant FoodModal

Modale réutilisable qui encapsule l'intégralité du flux S1. Elle est appelée :
- Depuis le bouton « + Ajouter un aliment » dans MealEntry (ajout inline)
- Depuis la page dédiée à la gestion de la BD d'aliments

Props attendues :
- `onFoodSelected(food, quantity)` — callback appelé quand l'utilisateur confirme un aliment

États internes gérés par la modale :
1. `search` — champ texte ou résultat du scan EAN
2. `results` — résultats BD perso
3. `webResults` — résultats OFF (chargés seulement après action explicite)
4. `manualForm` — formulaire de saisie si rien trouvé

---

## Règles de développement

- **Mobile-first** : tous les composants sont conçus pour une largeur de 390px (iPhone 14). L'expérience desktop est acceptable mais pas prioritaire.
- **Pas d'authentification** : RLS Supabase désactivé, accès direct via `anon_key`. L'app est personnelle.
- **Offline partiel** : les données déjà chargées restent accessibles grâce au service worker. Les écritures nécessitent une connexion.
- **Pas d'état global lourd** : préférer `useState` / `useContext` léger plutôt que Redux ou Zustand.
- **Calcul des macros** : toujours calculé côté client. Les valeurs dans `foods` sont pour 100g (ou 100ml). Avant le calcul, convertir `quantity` en grammes/ml selon `unit` (ex : 1 kg → 1000, 1 L → 1000, 1 cl → 10). Pour les unités non métriques (tranche, unité, cuillère), la conversion doit être renseignée manuellement dans le formulaire ou estimée. Ne jamais stocker les macros calculées dans la DB.
- **Unité par défaut** : à l'ajout d'un aliment dans un repas, le champ `unit` de `meal_items` est pré-rempli avec `foods.default_unit`. L'utilisateur peut le modifier ponctuellement sans que cela affecte la valeur stockée dans `foods`.
- **OpenFoodFacts** : endpoint `https://world.openfoodfacts.org/api/v2/product/{barcode}.json` pour les EAN, `https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1` pour la recherche par nom. Pas de clé API requise.
- **ZXing** : utiliser `BrowserMultiFormatReader` depuis `@zxing/browser`. Toujours libérer le flux caméra (`reader.reset()`) à l'unmount du composant Scanner.

---

## Commandes utiles

```bash
npm run dev       # serveur de développement local
npm run build     # build de production
npm run preview   # prévisualiser le build en local
```

Déploiement : push sur `main` → Vercel déploie automatiquement.

