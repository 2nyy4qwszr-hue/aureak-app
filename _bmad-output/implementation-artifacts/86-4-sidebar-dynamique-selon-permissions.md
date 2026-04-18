# Story 86.4 : Sidebar dynamique selon permissions

Status: done

## Story

En tant qu'utilisateur,
je veux que la sidebar n'affiche que les sections auxquelles j'ai accès,
afin de voir uniquement MON app sans confusion.

## Acceptance Criteria

1. La sidebar se construit dynamiquement en fonction des permissions de l'utilisateur connecté
2. L'admin voit les 9 sections (Dashboard, Activités, Méthodologie, Académie, Événements, Prospection, Marketing, Partenariat, Performances)
3. Un commercial ne voit que Dashboard + Prospection (+ overrides éventuels)
4. Un coach ne voit que Dashboard + Activités + Méthodologie (+ overrides éventuels)
5. La sidebar se met à jour en temps réel si les permissions changent (via le switch de rôle)
6. Aucune route cachée n'est accessible par URL directe si l'utilisateur n'a pas la permission

## Tasks / Subtasks

- [x] Task 1 — Hook useUserSections (AC: #1, #5)
  - [x] Créer `useUserSections()` qui appelle `getUserPermissions` et retourne les sections autorisées
  - [x] Intégrer avec le store Zustand (réactif au switch de rôle)
- [x] Task 2 — Refactor sidebar _layout.tsx (AC: #1, #2, #3, #4)
  - [x] Filtrer les items de navigation en fonction de `useUserSections()`
  - [x] Conserver l'ordre et les icônes existants
  - [x] Ajouter les 3 nouvelles sections (Prospection, Marketing, Partenariat) avec icônes
- [x] Task 3 — Route guard (AC: #6)
  - [x] Middleware ou guard dans `_layout.tsx` qui redirige vers Dashboard si accès non autorisé
  - [x] Message discret "Accès non autorisé" si tentative d'accès par URL

## Dev Notes

- La sidebar actuelle est dans `aureak/apps/web/app/(admin)/_layout.tsx`
- Les items de navigation sont définis en dur — cette story les rend dynamiques
- Le hook `useUserSections` doit être performant (cache les permissions, pas de re-fetch à chaque render)
- Dépend de 86-2 (switch rôle) et 86-3 (permissions) pour fonctionner complètement

### Project Structure Notes

- Layout dans `aureak/apps/web/app/(admin)/_layout.tsx`
- Hook dans `aureak/packages/business-logic/src/hooks/` ou directement dans `apps/web/`

### References

- [Source: aureak/apps/web/app/(admin)/_layout.tsx — sidebar actuelle]
- [Brainstorming: idée #35 Architecture — Sidebar dynamique]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List
- Hook useUserSections created — calls getUserPermissions, reactive to role switch via Zustand
- Sidebar NAV_GROUPS now includes section property mapped to AppSection enum
- 3 new sections added: Prospection (renamed from Développement), Marketing, Partenariat
- MegaphoneIcon + HandshakeIcon created for Marketing + Partenariat
- Route guard in _layout.tsx redirects to Dashboard if unauthorized route access
- Placeholder pages created for /marketing and /partenariat
- Old hardcoded commercial filter replaced by dynamic permission-based filtering

### File List
- aureak/apps/web/hooks/useUserSections.ts (NEW)
- aureak/apps/web/app/(admin)/_layout.tsx (MODIFIED)
- aureak/packages/ui/src/icons/MegaphoneIcon.tsx (NEW)
- aureak/packages/ui/src/icons/HandshakeIcon.tsx (NEW)
- aureak/packages/ui/src/icons/index.ts (MODIFIED)
- aureak/packages/ui/src/index.ts (MODIFIED)
- aureak/apps/web/app/(admin)/marketing/page.tsx (NEW)
- aureak/apps/web/app/(admin)/marketing/index.tsx (NEW)
- aureak/apps/web/app/(admin)/partenariat/page.tsx (NEW)
- aureak/apps/web/app/(admin)/partenariat/index.tsx (NEW)
