# Calorie Tracker

Application mobile-first de suivi calorique, macronutriments et séances sport. Le projet est conçu comme une PWA installable sur iPhone via Safari, avec stockage et logique métier gérées via Supabase et un front React + Vite.

## Vue d'ensemble

Le produit vise à aider un seul utilisateur à :

- suivre son alimentation au jour le jour,
- enregistrer ses repas et leurs macros,
- saisir des séances de sport avec des métriques variables,
- comparer consommation, dépenses énergétiques et objectifs,
- gérer son catalogue d'aliments et d'activités personnel.

L'application est pensée pour un usage simple, sans authentification, avec un parcours fluide sur mobile.

## Stack technique

- Frontend : React + Vite
- Backend : Python
- Base de données : Supabase (PostgreSQL hébergé)
- Déploiement : Vercel

## Fonctionnalités actuelles

### Journal / Dashboard

- vue du jour avec repas et séances,
- totaux kcal et macros calculés côté client,
- affichage des sessions sport et du nombre de kcal brûlées,
- ajout rapide de repas et de séances.

### Gestion des repas

- ajout d'un repas selon le type (matin / midi / soir / snack),
- recherche dans les aliments personnels,
- quantité et unité modulables,
- création d'un aliment à la volée si absent.

### Gestion des activités et séances sport

- catalogue d'activités avec MET, icône et groupe musculaire,
- séances composées d'items/series avec métriques variables,
- calcul de kcal via la formule MET × poids × durée/60,
- ordre d'affichage des métriques géré par le client.

### Reporting

- vue semaine / 4 semaines,
- comparaison kcal consommées vs objectif,
- kcal brûlées lors des séances,
- répartition des macros,
- historique des activités sport sur la période sélectionnée.

### Paramètres et onboarding

- onboarding initial si le poids n'est pas encore renseigné,
- objectifs de déficit/surplus,
- profil utilisateur (poids, taille, âge, sexe),
- paramètres de ratio protéines / glucides / lipides.

### Gestion des données de référence

- aliments personnels avec archivage,
- activités personnelles avec archivage,
- métriques configurables pour chaque activité.

## Structure du projet

```text
src/
  components/
    Journal.jsx
    MealModal.jsx
    FoodsSheet.jsx
    FoodIcon.jsx
    WorkoutModal.jsx
    ActivitiesSheet.jsx
    BottomSheet.jsx
    Onboarding.jsx
    Reporting.jsx
    Settings.jsx
    BottomNav.jsx
  hooks/
    useMeals.js
    useFoods.js
    useWorkouts.js
    useActivities.js
    useMetrics.js
    useSettings.js
  lib/
    supabase.js
    constants.js
    utils.js
  App.jsx
  main.jsx
```

## Configuration environnementale

Créer un fichier `.env.local` à la racine du projet :

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

> Ce fichier ne doit pas être commité.

## Base de données

Le schéma actuel s'appuie sur plusieurs tables principales :

- `foods` : aliments personnels
- `meals` : repas du journal
- `meal_items` : aliments dans un repas
- `activities` : catalogue sports/exercices
- `metrics` : métriques globales
- `activity_metrics` : association métrique / activité
- `workout_sessions` : séances sport
- `workout_items` : items d'une séance
- `workout_item_values` : valeurs EAV des métriques
- `settings` : profil et objectifs utilisateur

Les migrations SQL sont présentes dans le dossier `migrations/`.

## Démarrage local

```bash
npm install
npm run dev
```

Le projet s'ouvre ensuite sur le port Vite standard, généralement :

```text
http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev       # démarrage du serveur de développement
npm run build     # build de production
npm run preview   # prévisualisation du build local
npm run lint      # vérification ESLint
```

## Notes importantes

- L'application est conçue pour mobile-first, avec un point de vue 390px (iPhone 14).
- Pas d'authentification : accès direct via la clé anon Supabase.
- Le comportement est partiellement offline sur les données déjà chargées, mais les écritures nécessitent une connexion.
- Les calculs de macros et de kcal sont faits côté client ; ils ne sont pas stockés en base.
- La PWA est prévue pour un déploiement Vercel.

## Déploiement

Le dépôt est prêt pour un déploiement Vercel standard sur la branche principale. Le push sur `main` déclenche le déploiement automatique.

## À retenir

Ce projet est un tracker de santé personnel, orienté simplicité, suivi quotidien et prise de décision sur les habitudes alimentaires et sportives. La version actuelle met l'accent sur :

- journal alimentaire,
- suivi des séances sportives,
- reporting de consommation et dépense,
- gestion des catalogues personnels,
- expérience mobile fluide et installable.
