# Story 46.1 : BUG — Fiche séance — joueurs du groupe non affichés

Status: done

## Story

En tant qu'admin Aureak consultant une fiche séance,
je veux voir la liste des joueurs du groupe associé à la séance,
afin de visualiser qui est attendu et préparer la gestion des présences.

## Acceptance Criteria

1. La fiche séance `(admin)/seances/[sessionId]/page.tsx` affiche une section "Joueurs du groupe" avec la liste des membres du groupe lié à la séance
2. Si la séance n'a pas de groupe (`group_id` null) → section cachée ou message "Séance ponctuelle — pas de groupe fixe"
3. Chaque joueur affiche : prénom + nom, photo si disponible (avatar initiales sinon), âge ou date naissance
4. La liste est triée par nom alphabétique
5. Le nombre de joueurs est affiché dans le header de la section (ex: "Joueurs du groupe (12)")

## Tasks / Subtasks

- [x] T1 — API : récupérer les joueurs du groupe depuis la fiche séance
  - [x] T1.1 — Dans `@aureak/api-client/src/sessions/implantations.ts` : vérifier que `listGroupMembersWithDetails(groupId)` existe et retourne `GroupMemberWithDetails[]`
  - [x] T1.2 — Si absent : ajouter `listGroupMembersWithDetails` qui joint `group_members` + `child_directory` sur `child_id`

- [x] T2 — UI : afficher la section dans la fiche séance
  - [x] T2.1 — Dans `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` : lire `session.groupId`
  - [x] T2.2 — Si `groupId` non-null : charger `listGroupMembersWithDetails(groupId)` dans un state `groupMembers`
  - [x] T2.3 — Afficher section "Joueurs du groupe" avec liste compacte (avatar + nom + âge)
  - [x] T2.4 — Header section avec count : "Joueurs du groupe (N)"
  - [x] T2.5 — Si `groupId` null : afficher "Séance ponctuelle — aucun groupe fixe"

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T3.2 — Playwright : naviguer vers une fiche séance avec groupe → vérifier affichage joueurs

## Dev Notes

### Stack constraints
- React Native Web (View, StyleSheet) — pas de className/Tailwind
- Styles via `@aureak/theme` tokens uniquement
- Accès Supabase via `@aureak/api-client` uniquement
- try/finally sur tout setState de chargement

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/sessions/implantations.ts` | Vérifier/ajouter `listGroupMembersWithDetails` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter section joueurs groupe |

### Pattern avatar initiales
```typescript
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
```

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- `listGroupMembersWithDetails` existait déjà dans `implantations.ts` (Story 44.5) — aucune modification API nécessaire.
- Fonction déjà exportée depuis `@aureak/api-client/src/index.ts`.
- `GroupMemberWithDetails` existait déjà dans `@aureak/types/src/entities.ts`.
- Ajout de l'import `listGroupMembersWithDetails` + type `GroupMemberWithDetails` dans la page séance.
- State `groupMembers: GroupMemberWithDetails[]` ajouté, chargé dans `load()` après récupération session.
- Tri alphabétique via `localeCompare('fr')` appliqué côté client.
- Helpers `initials()` et `getAge()` définis dans le composant (non exportés).
- Section UI insérée entre la carte Coaches et les Thèmes pédagogiques.
- `npx tsc --noEmit` → zéro erreur.
- Playwright skipped — app non démarrée au moment du commit.

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | modifié |
| `aureak/packages/api-client/src/sessions/implantations.ts` | inchangé (fonction existante) |
| `aureak/packages/types/src/entities.ts` | inchangé (type existant) |
