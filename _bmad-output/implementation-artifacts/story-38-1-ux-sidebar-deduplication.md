# Story 38-1 — UX: sidebar dédupliquer entrées

**Epic:** 38
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux que la sidebar ne contienne pas de doublons fonctionnels afin de réduire la charge cognitive et faciliter la navigation.

## Acceptance Criteria
- [ ] AC1: "Dashboard séances" et "Séances" sont fusionnés en une seule entrée "Séances" dans `NAV_GROUPS`.
- [ ] AC2: "Présences (v2)" et "Présences" sont fusionnés en une seule entrée "Présences" dans `NAV_GROUPS`.
- [ ] AC3: L'URL conservée pour "Séances" est la route principale réelle (à déterminer en lisant le fichier).
- [ ] AC4: L'URL conservée pour "Présences" est la route v2 (route la plus à jour).
- [ ] AC5: Aucune entrée de navigation en doublon fonctionnel dans la sidebar après le fix.
- [ ] AC6: Le nombre total d'entrées dans `NAV_GROUPS` est réduit d'au moins 2.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/_layout.tsx` pour identifier la structure complète de `NAV_GROUPS` et les URLs exactes des doublons.
- [ ] Identifier l'URL réelle de "Dashboard séances" vs "Séances" — garder la route `/seances` principale.
- [ ] Identifier l'URL réelle de "Présences (v2)" vs "Présences" — garder la route v2 (la plus récente).
- [ ] Supprimer les entrées doublon dans `NAV_GROUPS` dans `_layout.tsx`.
- [ ] Renommer les entrées conservées avec le label simplifié ("Séances", "Présences").
- [ ] Vérifier que les routes conservées existent bien (fichiers `page.tsx` ou `index.tsx` présents).
- [ ] QA visuel : compter les entrées avant/après et confirmer réduction ≥ 2.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/_layout.tsx`
- Uniquement modifier `NAV_GROUPS` (la définition des entrées nav) — ne pas toucher au rendu de la sidebar
- Ne pas supprimer des routes qui auraient un trafic distinct (vérifier que les 2 entrées pointent bien vers la même feature)
- Si les 2 entrées pointent vers des routes différentes avec contenu distinct, signaler sans fusionner
- Pas de migration Supabase — changement purement UI de navigation
