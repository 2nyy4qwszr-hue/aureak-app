# Story 88.1 : Hub Prospection avec ProspectionNavBar 3 onglets

Status: done

## Story

En tant qu'admin ou commercial,
je veux un hub Prospection avec une barre de navigation à 3 onglets (Clubs, Gardiens, Entraîneurs),
afin d'accéder aux différents pipelines de prospection depuis un point d'entrée centralisé.

## Acceptance Criteria

1. La route `/developpement/prospection/` affiche un hub avec une `ProspectionNavBar` à 3 onglets : Clubs, Gardiens, Entraîneurs
2. Le layout suit le pattern `AcademieNavBar` existant (onglets horizontaux, `ScrollView` + `Pressable`, indicateur actif gold)
3. L'onglet "Clubs" redirige vers `/developpement/prospection/clubs` (page existante epic 85, conservée telle quelle)
4. L'onglet "Gardiens" redirige vers `/developpement/prospection/gardiens` (page placeholder avec empty state)
5. L'onglet "Entraîneurs" redirige vers `/developpement/prospection/entraineurs` (page placeholder avec empty state)
6. La page racine `/developpement/prospection/` redirige automatiquement vers `/developpement/prospection/clubs`
7. La sidebar conserve l'item "Développement" existant (href `/developpement/prospection`) — pas de modification sidebar
8. Le layout prospection wrape toutes les sous-pages (Slot pattern comme `academie/_layout.tsx`)

## Tasks / Subtasks

- [x] Task 1 — ProspectionNavBar composant (AC: #1, #2)
  - [x] Créer `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx`
  - [x] 3 onglets : CLUBS (`/developpement/prospection/clubs`), GARDIENS (`/developpement/prospection/gardiens`), ENTRAÎNEURS (`/developpement/prospection/entraineurs`)
  - [x] Pattern exact de `AcademieNavBar` : `useRouter`, `usePathname`, `ScrollView horizontal`, `Pressable`, `borderBottomColor: colors.accent.gold` pour actif
  - [x] Styles : `@aureak/theme` tokens uniquement (`colors`, `space`)
- [x] Task 2 — Layout prospection (AC: #6, #8)
  - [x] Modifier `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` pour devenir un redirect vers `/developpement/prospection/clubs` (ou intégrer la NavBar dans un layout)
  - [x] Option A (recommandée) : créer `_layout.tsx` avec `ProspectionNavBar` + `Slot` — les pages enfants n'incluent pas la NavBar
  - [x] Option B : chaque page enfant inclut `ProspectionNavBar` dans son headerBlock (pattern séances)
  - [x] Choisir selon le pattern le plus cohérent avec le reste de l'app
- [x] Task 3 — Page placeholder Gardiens (AC: #4)
  - [x] Créer `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`
  - [x] Créer `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/index.tsx` (re-export)
  - [x] Empty state : icône + texte "Pipeline Gardiens — bientôt disponible" + fond `colors.light.primary`
- [x] Task 4 — Page placeholder Entraîneurs (AC: #5)
  - [x] Créer `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx`
  - [x] Créer `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/index.tsx` (re-export)
  - [x] Empty state : icône + texte "Pipeline Entraîneurs — bientôt disponible" + fond `colors.light.primary`
- [x] Task 5 — Adapter page Clubs existante (AC: #3)
  - [x] Vérifier que la page `/developpement/prospection/page.tsx` (epic 85) fonctionne toujours dans le nouveau layout
  - [x] Si layout avec NavBar : la page Clubs ne doit PAS dupliquer le header "Prospection" (déjà dans la NavBar)

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` | CRÉER | Copier pattern AcademieNavBar, 3 onglets |
| `aureak/apps/web/app/(admin)/developpement/prospection/_layout.tsx` | CRÉER ou MODIFIER | Layout avec NavBar + Slot (si option A) |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | MODIFIER | Adapter au nouveau layout (redirect ou conservation) |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` | CRÉER | Page placeholder empty state |
| `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/index.tsx` | CRÉER | Re-export `./page` |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx` | CRÉER | Page placeholder empty state |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/index.tsx` | CRÉER | Re-export `./page` |

### Fichiers à NE PAS modifier
- `aureak/apps/web/app/(admin)/_layout.tsx` — sidebar existante déjà correcte (item "Développement" pointe vers `/developpement/prospection`)
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionKPIs.tsx` — composant epic 85, ne pas toucher
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ClubList.tsx` — composant epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ClubCard.tsx` — composant epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ContactForm.tsx` — composant epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ContactList.tsx` — composant epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/AdminFilters.tsx` — composant epic 85
- `aureak/apps/web/app/(admin)/developpement/prospection/[id]/` — fiche détail epic 85

### Dépendances
- Epic 86 done (rôles + permissions + sidebar dynamique) — la sidebar a déjà la section Développement/Prospection
- `AcademieNavBar` pattern de référence : `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx`
- `academie/_layout.tsx` pattern de référence : `aureak/apps/web/app/(admin)/academie/_layout.tsx`
- Page prospection existante epic 85 : `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx`

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A

### Completion Notes List
- Option A choisie : `_layout.tsx` avec `ProspectionNavBar` + `Slot` — NavBar centralisée, pas de duplication
- Page clubs existante (epic 85) déplacée dans `clubs/page.tsx` avec imports adaptés (`../_components/`)
- Header changé de "Prospection" à "Prospection Clubs" pour clarté dans le contexte onglets
- Root `page.tsx` transformé en redirect vers `/developpement/prospection/clubs`
- QA : try/finally OK, console guards OK, tokens theme uniquement

### File List
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` — CRÉÉ
- `aureak/apps/web/app/(admin)/developpement/prospection/_layout.tsx` — CRÉÉ
- `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` — MODIFIÉ (redirect)
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/page.tsx` — CRÉÉ (contenu epic 85 déplacé)
- `aureak/apps/web/app/(admin)/developpement/prospection/clubs/index.tsx` — CRÉÉ
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` — CRÉÉ (placeholder)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/index.tsx` — CRÉÉ
- `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx` — CRÉÉ (placeholder)
- `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/index.tsx` — CRÉÉ
