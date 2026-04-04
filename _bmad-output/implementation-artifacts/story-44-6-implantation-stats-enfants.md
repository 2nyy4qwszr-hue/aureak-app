# Story 44.6 : Implantation enrichie — stats groupes et listing enfants

Status: ready-for-dev

## Story

En tant qu'admin,
je veux voir le nombre d'enfants par groupe et un listing des enfants dans la fiche implantation,
afin d'avoir une vue d'ensemble complète de l'implantation sans naviguer dans chaque groupe.

## Acceptance Criteria

1. La fiche implantation affiche pour chaque groupe : nom du groupe, nombre de coaches, **nombre d'enfants** (badge)
2. Chaque groupe est expandable (clic) pour révéler la liste des enfants : nom + club actuel
3. Le nombre total d'enfants de l'implantation est affiché dans le header de la fiche
4. Les enfants listés sont cliquables → `router.push('/children/' + childId)`
5. Si un groupe n'a pas d'enfants → afficher "Aucun joueur inscrit"

## Technical Tasks

- [ ] Lire `aureak/apps/web/app/(admin)/implantations/` — trouver la page de détail implantation
- [ ] Lire `aureak/packages/api-client/src/sessions/implantations.ts` — vérifier `listGroupMembersWithProfiles`
- [ ] Pour chaque groupe de l'implantation : charger `listGroupMembersWithProfiles(groupId)` → compter + lister
- [ ] Ajouter state `expandedGroups: Set<string>` pour les groupes ouverts
- [ ] Afficher badge nombre d'enfants sur chaque groupe card
- [ ] Section expandable : liste compacte nom + club
- [ ] Compter le total dans le header de la fiche implantation
- [ ] Styles tokens uniquement
- [ ] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/implantations/[implantationId]/page.tsx` ou `index.tsx` (modifier)

## Dependencies

- `listGroupMembersWithProfiles` ✅ (déjà dans `@aureak/api-client`)
- `listGroupsByImplantation` ✅
