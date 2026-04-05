# Story 60.1 : Analytics — Stats Room landing hub avec 4 sections

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux accéder à une page "Stats Room" qui regroupe 4 sections analytics (Présences, Progression, Charge, Clubs) avec des cards d'entrée cliquables,
Afin d'avoir un point d'entrée unifié pour toutes les données analytiques de l'académie.

## Acceptance Criteria

**AC1 — Page Stats Room accessible**
- **Given** l'admin navigue vers `/analytics`
- **When** la page se charge
- **Then** la page affiche un titre "Stats Room" avec sous-titre "Tableau analytique de l'académie" en header premium dark

**AC2 — 4 cards d'entrée présentes**
- **And** 4 cards cliquables s'affichent en grille 2×2 (desktop) / 1 colonne (mobile) :
  - "Présences" → `/analytics/presences` — icône calendrier + description "Taux de présence par groupe et période"
  - "Progression" → `/analytics/progression` — icône graphique montant + description "Niveaux et maîtrise des joueurs"
  - "Charge" → `/analytics/charge` — icône thermomètre + description "Heatmap jours/heures et intensité séances"
  - "Clubs" → `/analytics/clubs` — icône écusson + description "Classement implantations et performance"

**AC3 — Cards visuellement distinctes par couleur d'accent**
- **And** chaque card a une bande colorée en haut (3px) : Présences=gold, Progression=vert, Charge=orange/ambre, Clubs=bleu
- **And** chaque card affiche un compteur rapide : nb séances total / nb joueurs actifs / séances cette semaine / nb clubs liés

**AC4 — KPIs globaux en bandeau**
- **And** un bandeau de 4 KPI globaux s'affiche en haut de la page : Total séances, Taux présence moyen, Joueurs actifs, Séances ce mois — alimentés par requêtes API existantes

**AC5 — Lien retour dashboard**
- **And** un lien "← Dashboard" permet de revenir à `/dashboard` sans rechargement complet

**AC6 — Skeleton loading**
- **And** pendant le chargement des KPIs, des blocs skeleton s'affichent à la place des valeurs numériques

**AC7 — Routing Expo Router complet**
- **And** `analytics/index.tsx` re-exporte `./page` (pattern Expo Router conforme)
- **And** les sous-routes `/analytics/presences`, `/analytics/progression`, `/analytics/charge`, `/analytics/clubs` affichent un placeholder "À venir" jusqu'à l'implémentation des stories suivantes

## Tasks / Subtasks

- [ ] Task 1 — Créer `analytics/page.tsx` hub Stats Room (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 1.1 Créer le composant `StatsRoomPage` avec header, 4 section cards, 4 KPI globaux
  - [ ] 1.2 Implémenter les 4 `SectionCard` avec couleur d'accent, titre, description, lien de navigation
  - [ ] 1.3 Charger les KPIs globaux via `@aureak/api-client` (sessions count, avg attendance, active players, clubs count)
  - [ ] 1.4 Appliquer le skeleton loading sur les valeurs KPI

- [ ] Task 2 — Mettre à jour `analytics/index.tsx` (AC: #7)
  - [ ] 2.1 Remplacer le re-export vers `../dashboard/comparison` par un re-export de `./page`

- [ ] Task 3 — Créer les placeholders sous-routes (AC: #7)
  - [ ] 3.1 `analytics/presences/index.tsx` + `analytics/presences/page.tsx` (placeholder)
  - [ ] 3.2 `analytics/progression/index.tsx` + `analytics/progression/page.tsx` (placeholder)
  - [ ] 3.3 `analytics/charge/index.tsx` + `analytics/charge/page.tsx` (placeholder)
  - [ ] 3.4 `analytics/clubs/index.tsx` + `analytics/clubs/page.tsx` (placeholder)

- [ ] Task 4 — Ajouter lien "Stats Room" dans la navigation admin (AC: #1)
  - [ ] 4.1 Ajouter "Stats Room" dans `_layout.tsx` section Analytics/Rapports avec icône bar chart

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier try/finally sur tous les loaders de KPIs
  - [ ] 5.2 Vérifier console guards dans `apps/web/`

## Dev Notes

### KPIs globaux à charger

```typescript
// Utiliser les fonctions API existantes depuis @aureak/api-client
const [sessionsCount, avgAttendance, activePlayersCount, clubsCount] = await Promise.all([
  listSessions({ limit: 1 }),           // count total
  getAttendanceStats(),                 // taux moyen
  listChildDirectory({ actif: true }),  // joueurs actifs
  listClubDirectory({ actif: true }),   // clubs liés
])
```

### SectionCard structure

```typescript
interface SectionCardProps {
  title: string
  description: string
  href: string
  accentColor: string
  quickStat: { label: string; value: string | number }
  icon: React.ReactNode
}
```

### Accents couleurs section

```typescript
const SECTION_ACCENTS = {
  presences : colors.accent.gold,
  progression: colors.status.success,   // vert #10B981
  charge    : '#F59E0B',                // ambre — constante locale CHARGE_AMBER
  clubs     : '#3B82F6',                // bleu — constante locale CLUBS_BLUE
}
```

### Notes QA
- Constantes locales `CHARGE_AMBER = '#F59E0B'` et `CLUBS_BLUE = '#3B82F6'` déclarées en haut du fichier
- Pattern try/finally obligatoire sur chaque useState loading
- `analytics/index.tsx` existant redirige vers `dashboard/comparison` — le remplacer complètement

## File List

- `aureak/apps/web/app/(admin)/analytics/page.tsx` — créer (hub Stats Room)
- `aureak/apps/web/app/(admin)/analytics/index.tsx` — modifier (re-export ./page)
- `aureak/apps/web/app/(admin)/analytics/presences/page.tsx` — créer (placeholder)
- `aureak/apps/web/app/(admin)/analytics/presences/index.tsx` — créer
- `aureak/apps/web/app/(admin)/analytics/progression/page.tsx` — créer (placeholder)
- `aureak/apps/web/app/(admin)/analytics/progression/index.tsx` — créer
- `aureak/apps/web/app/(admin)/analytics/charge/page.tsx` — créer (placeholder)
- `aureak/apps/web/app/(admin)/analytics/charge/index.tsx` — créer
- `aureak/apps/web/app/(admin)/analytics/clubs/page.tsx` — créer (placeholder)
- `aureak/apps/web/app/(admin)/analytics/clubs/index.tsx` — créer
- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (lien Stats Room)
