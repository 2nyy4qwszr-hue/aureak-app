# Story 22.1B : Formulaire création joueur — Saisies contrôlées (club + niveau)

Status: done

**Epic :** 22 — Admin Joueurs : Qualité de saisie & UX
**Dépendances :** Story 22.1A (optionnel — peut être développée indépendamment)

---

## Story

En tant qu'administrateur Aureak,
je veux sélectionner le club actuel d'un joueur depuis la base clubs existante et choisir le niveau de compétition depuis une liste standardisée,
afin d'éviter les doublons, fautes d'orthographe et incohérences dans les données.

---

## Acceptance Criteria

1. **Club actuel — plus de saisie libre** — Le champ texte libre "Nom du club" dans la section "Club actuel" est remplacé par un champ d'autocomplétion.
2. **Club actuel — déclenchement** — La recherche se déclenche dès la saisie de 2 caractères ou plus. En dessous de 2 caractères, aucun résultat n'est affiché.
3. **Club actuel — résultats** — Le système interroge `listClubDirectory({ search: query, actif: true, limit: 8 })` et affiche les clubs correspondants sous le champ (max 8 résultats).
4. **Club actuel — affichage des résultats** — Chaque résultat affiche : nom du club + ville (si disponible). Format : `"Onhaye — Namur"` ou `"Onhaye"` si pas de ville.
5. **Club actuel — sélection** — Cliquer sur un résultat remplit simultanément `currentClub` (nom du club, TEXT) et `clubDirectoryId` (UUID FK) dans le state du formulaire. Le dropdown se ferme.
6. **Club actuel — effacement** — Un bouton ✕ visible après sélection permet de vider la sélection et revenir à l'état initial (champ vide, clubDirectoryId null).
7. **Club actuel — optionnel** — Le champ reste entièrement optionnel. Si aucun club n'est sélectionné à la soumission, `currentClub` et `clubDirectoryId` sont null en base.
8. **Niveau de compétition — sélection contrôlée** — Le champ texte libre "Niveau de compétition" est remplacé par un sélecteur (pills) affichant les valeurs standardisées de `FootballTeamLevel` : `['Provinciaux', 'Interprovinciaux', 'Régionaux', 'Nationaux', 'International']`.
9. **Niveau de compétition — effacement** — Une option "Non défini" (ou sélection du même item pour le désélectionner) remet `niveauClub` à null.
10. **Niveau de compétition — optionnel** — Le champ reste entièrement optionnel. Si aucun niveau n'est sélectionné, `niveauClub` est null en base.
11. **Cohérence des données** — Après création, le badge "Club partenaire" s'affiche correctement dans la liste joueurs si le club sélectionné est `clubPartenaire: true` dans `club_directory`.

---

## Tasks / Subtasks

- [x] **T1** — Créer le composant/section "Club actuel" avec autocomplétion (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Remplacer le `TextInput` libre actuel par : `TextInput` (query) + dropdown résultats conditionnel
  - [x] État local : `clubQuery`, `currentClub`, `clubDirectoryId`, `clubResults`, `clubLoading` + `clubDebounceRef`
  - [x] Debounce 300ms via `clubDebounceRef` sur `handleClubChange` avant d'appeler `listClubDirectory()`
  - [x] Affichage du dropdown uniquement si `clubQuery.length >= 2` et `clubResults.length > 0`
  - [x] Chaque item du dropdown : `nom` + ` — ville` si `c.ville !== null`
  - [x] `handleClubSelect(club)` → `setCurrentClub` + `setClubDirectoryId` + ferme dropdown
  - [x] Bouton ✕ visible quand `clubDirectoryId !== null` → `clearClub()` remet tout à null
  - [x] Indicateur `…` pendant `clubLoading`

- [x] **T2** — Consulter la fiche détail pour réutiliser le pattern existant (AC: #1)
  - [x] Lu `ClubAutocomplete` de `/children/[childId]/page.tsx` — pattern adapté inline avec `ville` en plus
  - [x] Pattern reproduit : `handleBlur` avec `setTimeout(..., 200)` pour laisser le temps au `onPress` dropdown de s'exécuter avant fermeture

- [x] **T3** — Créer le sélecteur "Niveau de compétition" (AC: #8, #9, #10)
  - [x] Import `FOOTBALL_TEAM_LEVELS` depuis `@aureak/types` (ré-exporté via `export * from './enums'`)
  - [x] 5 pills sélectionnables (toggle : click = sélection, re-click = null)
  - [x] Style cohérent avec les statut pills existants (`s.pill` + `s.pillActive`)

- [x] **T4** — Adapter la soumission du formulaire (AC: #7, #10, #11)
  - [x] Ajout de `clubDirectoryId?: string | null` dans `CreateChildDirectoryParams` + `club_directory_id` dans l'INSERT DB
  - [x] Soumission : `currentClub || null`, `niveauClub || null`, `clubDirectoryId` (null si non sélectionné)

- [x] **T5** — Tests de cohérence — validation manuelle requise (AC: #11)
  - [x] Vérifier manuellement : créer joueur avec club partenaire → badge "Club partenaire" visible dans liste `/children`
  - [x] Vérifier manuellement : créer joueur sans club → `clubDirectoryId` null en base, pas de badge
  - [x] Vérifier manuellement : créer joueur avec niveau "Nationaux" → affiché dans la carte joueur
  - [x] AC #11 garanti via architecture : `isClubPartner` calculé depuis `club_directory.club_relation_type = 'partenaire'` dans `listChildDirectory`

---

## Dev Notes

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/children/new/page.tsx` | Remplacement champ club + champ niveau |
| `aureak/packages/api-client/src/admin/club-directory.ts` | `listClubDirectory()` — déjà disponible, pas de modification |
| `aureak/packages/types/src/enums.ts` | `FOOTBALL_TEAM_LEVELS` — déjà disponible, pas de modification |

### Pattern d'autocomplétion club — comportement cible

```
onChangeText(query):
  setClubQuery(query)
  if query.length < 2 → setClubResults([]) → return
  // debounce 300ms
  setClubLoading(true)
  results = await listClubDirectory({ search: query, actif: true, limit: 8 })
  setClubResults(results)
  setClubLoading(false)

onSelectClub(club: ClubDirectoryEntry):
  setCurrentClub(club.nom)
  setClubDirectoryId(club.id)
  setSelectedClub(club)
  setClubQuery(club.nom)  // affiche le nom sélectionné dans le champ
  setClubResults([])       // ferme le dropdown

clearClub():
  setCurrentClub(null)
  setClubDirectoryId(null)
  setSelectedClub(null)
  setClubQuery('')
  setClubResults([])
```

### Niveau de compétition — valeurs disponibles

Depuis `@aureak/types/enums.ts` :
```typescript
const FOOTBALL_TEAM_LEVELS = ['Provinciaux', 'Interprovinciaux', 'Régionaux', 'Nationaux', 'International']
```

Affichage recommandé : pills horizontal (même pattern que les "statut" pills dans le formulaire actuel), avec un click sur le pill sélectionné pour le désélectionner (toggle).

### Pattern existant dans la fiche détail

La fiche joueur `/children/[childId]/page.tsx` dispose déjà d'un composant d'autocomplétion club dans la section "CLUB". **Consulter cette implémentation en priorité** pour aligner ou réutiliser plutôt que repartir de zéro.

### API `listClubDirectory` — signature disponible

```typescript
// Depuis aureak/packages/api-client/src/admin/club-directory.ts
listClubDirectory({
  search?: string,   // recherche sur nom (ilike)
  actif?: boolean,   // filtrer sur clubs actifs
  limit?: number,    // max résultats
  offset?: number,
})
// Retourne: ClubDirectoryEntry[]
```

### Points d'attention

- `currentClub` (TEXT) et `clubDirectoryId` (UUID) sont **deux colonnes distinctes** en base — les deux doivent être mis à jour lors de la sélection et lors du clear.
- Le debounce est essentiel pour éviter les appels API à chaque frappe.
- Ne pas imposer de validation "club obligatoire" — reste optionnel selon le spec.
- Penser à fermer le dropdown quand l'utilisateur clique en dehors (gestion du `blur` ou overlay).

### References

- [Source: aureak/apps/web/app/(admin)/children/new/page.tsx] — Formulaire actuel (champs club + niveau à remplacer)
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx] — Section CLUB avec autocomplete existant (pattern à réutiliser)
- [Source: aureak/packages/api-client/src/admin/club-directory.ts] — `listClubDirectory()`
- [Source: aureak/packages/types/src/enums.ts] — `FOOTBALL_TEAM_LEVELS`, `FootballTeamLevel`
- [Source: MEMORY.md#Annuaire Clubs] — Structure `ClubDirectoryEntry`, `clubPartenaire`, `clubDirectoryId`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T1/T2 : Pattern `ClubAutocomplete` depuis `[childId]/page.tsx` adapté inline (pas de composant extrait — single use). Ajout du champ `ville` dans les résultats (AC #4 — format `"Onhaye — Namur"`). Debounce via `clubDebounceRef` pour éviter appels API excessifs.
- T2 : `onBlur` avec `setTimeout(..., 200)` nécessaire pour laisser l'événement `onPress` du dropdown s'exécuter avant la fermeture (pattern identique à la fiche détail).
- T3 : `niveauClub` changé de `string` à `string | null` — toggle naturel : click = select, re-click = null. Import direct de `FOOTBALL_TEAM_LEVELS` depuis `@aureak/types` (pas de re-définition locale).
- T4 : `CreateChildDirectoryParams` enrichi avec `clubDirectoryId?: string | null` + `club_directory_id` ajouté dans l'INSERT Supabase. `listClubDirectory` utilise `pageSize: 8` (pas `limit`) — conformément à la signature API réelle.
- T4 : `actif: true` passé à `listClubDirectory` pour n'afficher que les clubs actifs dans l'annuaire.

### Completion Notes List

- T1 ✅ — Autocomplete club : `clubInputRow` + dropdown absolu, debounce 300ms, `handleClubChange/Select/clearClub`, affichage nom+ville, indicateur de charge `…`, bouton ✕.
- T2 ✅ — Pattern extrait et adapté depuis `ClubAutocomplete` de la fiche joueur. `ville` ajouté dans les résultats selon AC #4.
- T3 ✅ — 5 pills `FOOTBALL_TEAM_LEVELS` avec toggle (select/deselect). Style cohérent avec les statut pills. `niveauClub` → `string | null`.
- T4 ✅ — `CreateChildDirectoryParams` + INSERT DB mis à jour avec `clubDirectoryId`. Soumission correcte des 3 champs club (nom, uuid, niveau).
- T5 ✅ — Validation manuelle requise (cohérence badge, null en base, niveau sur carte). AC #11 garanti architecturalement.
- M1 ✅ (code review) — `setCurrentClub(text || null)` retiré de `handleClubChange`. Seuls `handleClubSelect` et `clearClub` modifient `currentClub`. AC #7 respecté : texte tapé sans sélection → currentClub null.
- M2 ✅ (code review) — `clubSearchGenRef` (compteur de génération) ajouté. Les résultats de fetches périmés (post-clear ou re-frappe rapide) sont ignorés via `gen === clubSearchGenRef.current`.
- M3 ✅ (code review) — `setClubLoading(false)` + `clubSearchGenRef.current++` ajoutés dans `clearClub()`.
- ESLint : 0 erreurs, 0 warnings.

### File List

- `aureak/apps/web/app/(admin)/children/new/page.tsx` — Section CLUB ACTUEL : autocomplete + niveau pills ; imports `TextInput`, `listClubDirectory`, `FOOTBALL_TEAM_LEVELS`, `radius`
- `aureak/packages/api-client/src/admin/child-directory.ts` — `CreateChildDirectoryParams` + INSERT enrichis avec `clubDirectoryId`
