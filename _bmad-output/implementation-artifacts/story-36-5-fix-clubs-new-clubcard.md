# Story 36-5 — Page fix: clubs new & ClubCard

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que mainteneur, je veux que `clubs/new.tsx` et `ClubCard.tsx` utilisent des tokens `@aureak/theme` afin d'éliminer les couleurs hardcodées et les dimensions magic-number.

## Acceptance Criteria
- [ ] AC1: `clubs/new.tsx` lignes 251 et 336 : `#f87171` remplacé par `colors.accent.red`.
- [ ] AC2: `ClubCard.tsx` ligne 23 : `#60a5fa` remplacé par `colors.entity.club` (dépend story-33-2).
- [ ] AC3: Les dimensions CIRCLE dans `ClubCard.tsx` sont extraites en constantes exportées (`CLUB_CARD_LOGO_SIZE`, `CLUB_CARD_RADIUS`).
- [ ] AC4: `rgba(255,255,255,0.85)` dans `ClubCard.tsx` remplacé par `colors.overlay.light` (dépend story-33-3).
- [ ] AC5: grep `#f87171\|#60a5fa\|rgba(255,255,255` dans les fichiers modifiés retourne 0 résultats.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/new.tsx` pour localiser précisément les lignes 251 et 336.
- [ ] Remplacer `#f87171` par `colors.accent.red` dans `clubs/new.tsx`.
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` (ou chemin réel) pour localiser les couleurs et dimensions CIRCLE.
- [ ] Remplacer `#60a5fa` par `colors.entity.club` dans `ClubCard.tsx`.
- [ ] Extraire les dimensions cercle du logo en constantes : `const CLUB_CARD_LOGO_SIZE = 48` (ou valeur réelle), `const CLUB_CARD_RADIUS = CLUB_CARD_LOGO_SIZE / 2`.
- [ ] Remplacer `rgba(255,255,255,0.85)` par `colors.overlay.light` dans `ClubCard.tsx`.
- [ ] QA scan : grep couleurs hardcodées dans les 2 fichiers modifiés.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/clubs/new.tsx`
  - Fichier `ClubCard.tsx` (chercher avec Glob `**/ClubCard.tsx`)
- **Dépend de story-33-2** : token `colors.entity.club` doit exister.
- **Dépend de story-33-3** : token `colors.overlay.light` doit exister.
- Si story-33-2 et/ou 33-3 ne sont pas `done`, utiliser les valeurs hex directes comme commentaire TODO et laisser la couleur actuelle — ne pas bloquer sur les dépendances si elles ne sont pas implémentées.
- Les constantes `CLUB_CARD_LOGO_SIZE` etc. peuvent être exportées depuis le fichier composant lui-même (pas besoin de fichier séparé)
