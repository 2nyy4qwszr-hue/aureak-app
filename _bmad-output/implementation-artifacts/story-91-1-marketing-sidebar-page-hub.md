# Story 91.1 — Hub Marketing (4 onglets : Médiathèque, Réseaux, Campagnes, Analytics)

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 91 — Marketing
- **Story ID** : 91.1
- **Story key** : `91-1-marketing-sidebar-page-hub`
- **Priorité** : P2
- **Dépendances** : Epic 86 done ✅ (rôle `marketeur` dans `user_role`, sidebar dynamique, item Marketing déjà pointé vers `/marketing`)
- **Source** : brainstorming 2026-04-18 idées #27, #28, #29, #30
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (1 layout + 1 NavBar + 4 pages placeholder, aucune migration, aucun type, aucune API)

## Story

En tant qu'admin ou marketeur,
je veux une section Marketing structurée avec 4 onglets (Médiathèque, Réseaux sociaux, Campagnes, Analytics),
afin d'organiser toutes les activités marketing depuis un hub centralisé.

## Acceptance Criteria

1. La route `/marketing` affiche un hub avec une `MarketingNavBar` à 4 onglets
2. Onglets dans l'ordre : **MÉDIATHÈQUE | RÉSEAUX | CAMPAGNES | ANALYTICS**
3. Chaque onglet redirige vers sa sous-route (`/marketing/mediatheque`, `/marketing/reseaux`, `/marketing/campagnes`, `/marketing/analytics`)
4. Le layout suit le pattern `AcademieNavBar` existant (onglets horizontaux, `ScrollView` + `Pressable`, indicateur actif gold `colors.accent.gold`)
5. Chaque page placeholder affiche un empty state "Bientôt disponible" + icône centrée + fond `colors.light.primary`
6. La route racine `/marketing` redirige automatiquement vers `/marketing/mediatheque`
7. L'item sidebar Marketing (déjà configuré en Epic 86 → `href: '/marketing'`) continue de fonctionner sans modification de `lib/admin/nav-config.ts`
8. **Cleanup legacy** : l'ancien placeholder `(admin)/developpement/marketing/page.tsx` (Story 63.3) est **soit supprimé** (avec `index.tsx`), **soit remplacé par un `<Redirect>` vers `/marketing`** pour éviter un orphelin dans Expo Router

## Tasks / Subtasks

- [x] Task 1 — `MarketingNavBar` composant (AC: #1, #2, #4)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/_components/MarketingNavBar.tsx`
  - [x] 4 onglets dans l'ordre : MÉDIATHÈQUE (`/marketing/mediatheque`), RÉSEAUX (`/marketing/reseaux`), CAMPAGNES (`/marketing/campagnes`), ANALYTICS (`/marketing/analytics`)
  - [x] Pattern exact de `AcademieNavBar` : `useRouter`, `usePathname`, `ScrollView horizontal`, `Pressable`, `borderBottomColor: colors.accent.gold` pour actif
  - [x] Styles : `@aureak/theme` tokens uniquement (`colors`, `space`)
- [x] Task 2 — Layout marketing (AC: #1, #6)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/_layout.tsx` avec `MarketingNavBar` + `Slot`
  - [x] Modifier `aureak/apps/web/app/(admin)/marketing/page.tsx` pour `<Redirect href="/marketing/mediatheque" />`
  - [x] Garder/créer `aureak/apps/web/app/(admin)/marketing/index.tsx` (re-export de `page.tsx`)
- [x] Task 3 — Page placeholder Médiathèque (AC: #5)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` — empty state "Médiathèque — bientôt disponible"
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/mediatheque/index.tsx` (re-export)
- [x] Task 4 — Page placeholder Réseaux (AC: #5)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/reseaux/page.tsx` — empty state
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/reseaux/index.tsx` (re-export)
- [x] Task 5 — Page placeholder Campagnes (AC: #5)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/campagnes/page.tsx` — empty state
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/campagnes/index.tsx` (re-export)
- [x] Task 6 — Page placeholder Analytics (AC: #5)
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/analytics/page.tsx` — empty state
  - [x] Créer `aureak/apps/web/app/(admin)/marketing/analytics/index.tsx` (re-export)
- [x] Task 7 — Cleanup legacy `developpement/marketing` (AC: #8)
  - [x] Option A (recommandée) : supprimer `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` + `index.tsx`
  - [x] Option B : remplacer par `<Redirect href="/marketing" />` si besoin de garder le lien
  - [x] Vérifier qu'aucun lien dans le code ne pointe encore vers `/developpement/marketing` (grep)

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Pas de fichier non-route sous `app/` : les composants (`MarketingNavBar`) vont dans `_components/` (sous-dossier ignoré par le router)
- Pas de migration, pas de types, pas d'API-client (story UI-only)

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/marketing/_components/MarketingNavBar.tsx` | CRÉER | NavBar 4 onglets, pattern AcademieNavBar |
| `aureak/apps/web/app/(admin)/marketing/_layout.tsx` | CRÉER | Layout avec NavBar + Slot |
| `aureak/apps/web/app/(admin)/marketing/page.tsx` | MODIFIER | Redirect vers `/marketing/mediatheque` |
| `aureak/apps/web/app/(admin)/marketing/index.tsx` | CRÉER si absent | Re-export |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/page.tsx` | CRÉER | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/mediatheque/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/marketing/reseaux/page.tsx` | CRÉER | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/reseaux/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/marketing/campagnes/page.tsx` | CRÉER | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/campagnes/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/marketing/analytics/page.tsx` | CRÉER | Placeholder |
| `aureak/apps/web/app/(admin)/marketing/analytics/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` | SUPPRIMER (ou redirect) | Legacy Story 63.3 |
| `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` | SUPPRIMER (ou redirect) | Legacy Story 63.3 |

### Fichiers à NE PAS modifier
- `aureak/apps/web/lib/admin/nav-config.ts` — item Marketing déjà configuré en Epic 86 (`href: '/marketing'`)
- `aureak/apps/web/app/(admin)/_layout.tsx` — sidebar dynamique déjà fonctionnelle

### Dépendances
- Epic 86 done ✅ (`user_role` inclut `marketeur`, sidebar dynamique `buildNavGroups`)
- Pattern de référence : `aureak/apps/web/app/(admin)/academie/_layout.tsx` + `_components/AcademieNavBar.tsx`
- Pattern prospection hub : `_bmad-output/implementation-artifacts/story-88-1-prospection-sidebar-page-hub.md` (structure très similaire)

### Note historique
Story initialement implémentée dans PR #18 (closed 2026-04-18, bundle Epic 91+92). Contenu ré-adapté pour reprise story-par-story sur main. Ajout de la Task 7 (cleanup legacy) qui n'était pas dans la PR originale.
