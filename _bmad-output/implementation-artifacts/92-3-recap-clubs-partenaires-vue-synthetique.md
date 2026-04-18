# Story 92.3 : Recap clubs partenaires vue synthetique

Status: done

## Story

En tant qu'admin,
je veux un dashboard synthetique des clubs partenaires avec KPIs cles,
afin d'avoir une vue d'ensemble des partenariats club en un coup d'oeil.

## Acceptance Criteria

1. La page `/partenariat/clubs` affiche un dashboard KPI en lecture seule
2. KPIs affiches : nombre total de clubs partenaires, nombre de sponsors lies a des clubs, revenus totaux sponsoring club, nombre de renouvellements a venir (end_date dans les 90 jours)
3. Les donnees viennent de `club_directory` (clubs partenaires) et `sponsors` (sponsoring type club)
4. Les cartes KPI suivent le design StatCards existant
5. Une liste resumee des clubs partenaires est affichee sous les KPIs
6. Chaque ligne de la liste affiche : nom du club, nombre de joueurs lies, montant sponsoring, date fin
7. Aucune modification possible — vue lecture seule

## Tasks / Subtasks

- [x] Task 1 — API client (AC: #2, #3)
  - [x] Ajouter `getPartnershipClubStats()` dans `@aureak/api-client/src/admin/sponsors.ts`
  - [x] Query : count clubs partenaires, sum montants sponsors type club, count end_date < now+90j
  - [x] `listPartnerClubsSummary()` — join club_directory + sponsors
- [x] Task 2 — Page dashboard clubs (AC: #1, #4)
  - [x] Créer `/partenariat/clubs/page.tsx`
  - [x] 4 StatCards en haut (pattern existant)
  - [x] Try/finally sur setLoading
- [x] Task 3 — Liste resumee (AC: #5, #6, #7)
  - [x] Tableau sous les KPIs
  - [x] Colonnes : nom club, joueurs lies, montant, date fin
  - [x] Lecture seule — pas de boutons d'action

## Dev Notes

### Contraintes Stack
Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText, AureakButton, Badge, Card, Input
- **Acces Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards obligatoires** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

### Fichiers a creer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/admin/sponsors.ts` | Modifier | Stats + summary queries |
| `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` | Modifier | Remplacer placeholder |
| `aureak/apps/web/app/(admin)/partenariat/clubs/components/ClubPartnerStats.tsx` | Creer | StatCards KPI |
| `aureak/apps/web/app/(admin)/partenariat/clubs/components/ClubPartnerList.tsx` | Creer | Liste resumee |

### Dependencies
- Story 92-1 (partenariat hub) doit etre `done`
- Story 92-2 (sponsors) doit etre `done` (table `sponsors` necessaire pour les KPIs)

### References
- Pattern StatCards : `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
- Donnees clubs : `club_directory` (annuaire organisationnel)
- Donnees sponsors : `sponsors` (story 92-2)

## Dev Agent Record
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
