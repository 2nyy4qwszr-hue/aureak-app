# Story 88.1 — Hub Prospection avec ProspectionNavBar 3 onglets

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.1
- **Story key** : `88-1-prospection-sidebar-page-hub`
- **Priorité** : P1
- **Dépendances** : Epic 86 done ✅
- **Source** : brainstorming 2026-04-18 idées #1, #37, #38
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (1 composant NavBar + 1 layout + 2 pages placeholder, aucune migration)

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

- [x] Task 1 — ProspectionNavBar composant (AC: #1, #2) — créée dans `components/admin/prospection/` (respect ADR 005, pas dans `app/_components/`)
- [x] Task 2 — Layout prospection (AC: #6, #8) — option A retenue : `_layout.tsx` avec NavBar + Slot, `page.tsx` = Redirect vers `/clubs`
- [x] Task 3 — Gardiens (AC: #4) — page existante epic 89.6 conservée, onglet pointe dessus (pas de placeholder nécessaire)
- [x] Task 4 — Entraîneurs placeholder (AC: #5) — créé avec empty state
- [x] Task 5 — Page Clubs (AC: #3) — contenu epic 85 déplacé vers `clubs/page.tsx`, route accessible via nouveau layout

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
