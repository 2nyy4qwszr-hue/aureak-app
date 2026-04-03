# Story 38-3 — UX: breadcrumbs dynamiques

**Epic:** 38
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un fil d'Ariane dynamique sous le header de chaque page détail afin de savoir où je me trouve dans la hiérarchie et pouvoir naviguer rapidement vers les listes parentes.

## Acceptance Criteria
- [ ] AC1: Un composant `Breadcrumb` existe dans `@aureak/ui` acceptant `items: { label: string; href?: string }[]`
- [ ] AC2: Le breadcrumb est affiché sticky sous le header dans toutes les pages détail `[id]`
- [ ] AC3: Chaque item cliquable (avec `href`) est un lien Expo Router `<Link>`
- [ ] AC4: Le dernier item (page courante) est non cliquable et visuellement distinct (couleur muted)
- [ ] AC5: Exemples fonctionnels: "Clubs > RFC Liège", "Joueurs > Jean Dupont", "Séances > Séance 12/03"
- [ ] AC6: Le composant respecte les tokens du design system (pas de couleurs hardcodées)
- [ ] AC7: Sur mobile (< 768px), le breadcrumb se tronque intelligemment (affiche seulement parent + page courante)

## Tasks
- [ ] Créer `packages/ui/src/Breadcrumb.tsx` — composant avec `items` prop, séparateur `›`, styles via tokens
- [ ] Exporter `Breadcrumb` depuis `packages/ui/src/index.ts`
- [ ] Intégrer dans `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — items: [{label:"Clubs", href:"/clubs"}, {label: club.nom}]
- [ ] Intégrer dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — items: [{label:"Joueurs", href:"/children"}, {label: child.displayName}]
- [ ] Intégrer dans `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — items: [{label:"Séances", href:"/seances"}, {label: session.label}]
- [ ] Intégrer dans `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` — items: [{label:"Stages", href:"/stages"}, {label: stage.nom}]
- [ ] Intégrer dans `aureak/apps/web/app/(admin)/methodologie/seances/[id]/page.tsx` si existant
- [ ] Vérifier QA: aucune couleur hardcodée, aucun console.log non gardé

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/Breadcrumb.tsx` (nouveau)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
  - `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
  - `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
- Tokens à utiliser: `colors.text.muted`, `colors.border.light`, `colors.light.surface`, `transitions.fast`
- Séparateur: caractère `›` (U+203A) ou `chevron-right` icon si disponible dans `@aureak/ui`
- Position: sticky, `top: headerHeight`, `zIndex: 10`, fond `colors.light.primary`
- Pas de migration Supabase nécessaire
