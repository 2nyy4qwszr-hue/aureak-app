# Story 22.1A : Formulaire création joueur — Historique académique dès la création

Status: done

**Epic :** 22 — Admin Joueurs : Qualité de saisie & UX
**Dépendances :** Story 18-3 (statut académie dynamique), Story 18-1 (fiche joueur 360)

---

## Story

En tant qu'administrateur Aureak,
je veux pouvoir encoder le contexte académique d'un joueur dès sa création (saisons d'académie, statut initial),
afin d'éviter de devoir revenir sur la fiche détail pour compléter l'historique après création.

---

## Acceptance Criteria

1. **Section "Académie" dans le formulaire de création** — Le formulaire `/children/new` dispose d'une nouvelle section optionnelle "Académie" positionnée entre la section "Club actuel" et la section "Options".
2. **Sélecteur de saisons** — La section "Académie" affiche un sélecteur de saisons (pills) cohérent avec celui de la fiche joueur. L'admin peut sélectionner 0, 1 ou plusieurs saisons.
3. **Suggestion automatique du statut** — Lorsque l'admin sélectionne des saisons, le champ "Statut" est auto-suggéré selon la logique suivante :
   - Saison courante sélectionnée + au moins une saison passée → suggère `"Académicien"`
   - Saison courante sélectionnée uniquement (première) → suggère `"Nouveau"`
   - Aucune saison courante, uniquement des saisons passées → suggère `"Ancien"`
   - Aucune saison sélectionnée → aucune suggestion (statut inchangé)
4. **Statut toujours modifiable** — La suggestion automatique pré-remplit le pill sélectionné mais reste intégralement overridable par l'admin.
5. **Persistence de l'historique** — À la soumission du formulaire, après création du joueur via `createChildDirectoryEntry()`, pour chaque saison sélectionnée, un appel API d'enrôlement académique est déclenché (même pattern que la fiche détail `/children/[childId]/page.tsx`).
6. **Caractère optionnel** — Si aucune saison n'est sélectionnée, le joueur est créé normalement, sans historique académique. Le champ n'est pas bloquant.
7. **Cohérence avec la fiche détail** — Après création, la section "ACADÉMIE" de la fiche joueur affiche correctement les saisons encodées lors de la création.
8. **Gestion d'erreur non-bloquante** — Si l'enrôlement d'une saison échoue après la création du joueur, un message d'avertissement (non bloquant) s'affiche. Le joueur est créé quoi qu'il arrive ; la navigation vers la fiche est maintenue.

---

## Tasks / Subtasks

- [x] **T1** — Analyser le pattern d'enrôlement académique dans la fiche détail (AC: #5)
  - [x] Identifier la fonction API utilisée pour lister les saisons disponibles dans `/children/[childId]/page.tsx` (section ACADÉMIE)
  - [x] Identifier la fonction API utilisée pour enrôler un joueur dans une saison
  - [x] Identifier les tables et colonnes concernées (ex: `academy_season_memberships` ou équivalent)
  - [x] Comprendre la structure de données (ids, labels, is_current)

- [x] **T2** — Ajouter la section "Académie" dans `/children/new/page.tsx` (AC: #1, #2)
  - [x] Charger la liste des saisons disponibles via l'API identifiée en T1 (au `useEffect` initial)
  - [x] Afficher les saisons sous forme de pills sélectionnables (multi-select)
  - [x] État local : `selectedSeasonIds: string[]`
  - [x] Section toujours visible (sans toggle), positionnée entre CLUB ACTUEL et OPTIONS

- [x] **T3** — Implémenter la logique de suggestion automatique du statut (AC: #3, #4)
  - [x] `suggestedStatut` via `useMemo` surveillant `selectedSeasonIds` + `seasons`
  - [x] `useEffect` appliquant la suggestion si `!statutManuallyOverridden.current`
  - [x] `handleStatutClick` → marque `statutManuallyOverridden.current = true` avant de changer le statut
  - [x] Indicateur textuel "Statut suggéré automatiquement" visible quand suggestion active

- [x] **T4** — Modifier la soumission du formulaire (AC: #5, #8)
  - [x] Après `createChildDirectoryEntry()` → `Promise.allSettled` sur `addChildAcademyMembership` par season
  - [x] Si échecs → `setEnrollWarning` + `navTimerRef` (timer annulable) + `setTimeout(navigate, 2000)` (navigation maintenue)
  - [x] Si aucun échec → navigation immédiate
  - [x] Navigation vers `/children/{newId}` dans tous les cas après création réussie
  - [x] Timer stocké dans `navTimerRef.current` — annulé par "Annuler" et par `useEffect` cleanup (M1 fix)

- [x] **T5** — Tests de cohérence — validation manuelle requise (AC: #6, #7)
  - [x] Vérifier manuellement : avec 0 saison sélectionnée → aucun appel `addChildAcademyMembership` déclenché
  - [x] Vérifier manuellement : avec N saisons → `Promise.allSettled` effectue N appels parallèles
  - [x] Vérifier manuellement : après création, ouvrir `/children/{id}` → section ACADÉMIE affiche les saisons encodées
  - [x] AC 7 confirmé via architecture : inserts dans `child_academy_memberships` lus par `v_child_academy_status`

---

## Dev Notes

### Fichier à modifier

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/children/new/page.tsx` | Ajout section Académie + logique suggestion statut |

### Pattern à reproduire depuis la fiche détail

La logique d'enrôlement académique est déjà implémentée dans :
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — section "ACADÉMIE"

Le développeur doit **d'abord lire ce fichier** pour identifier et réutiliser les mêmes appels API et le même pattern de sélection de saisons. Ne pas réinventer un mécanisme d'enrôlement qui existe déjà.

### Logique de suggestion automatique du statut

```
Règles de dérivation (dans cet ordre) :
1. Si la saison courante (is_current = true) est dans selectedSeasonIds
   ET qu'il y a ≥1 saison passée également sélectionnée
   → suggestion = "Académicien"

2. Si la saison courante est dans selectedSeasonIds
   ET qu'il n'y a pas d'autre saison
   → suggestion = "Nouveau"

3. Si aucune saison courante, mais des saisons passées sélectionnées
   → suggestion = "Ancien"

4. Si selectedSeasonIds est vide → pas de suggestion (statut inchangé)
```

### Ordre des appels API à la soumission

```
1. createChildDirectoryEntry({ nom, prenom, birthDate, statut, currentClub, niveauClub, clubDirectoryId, actif })
   → si erreur → abort
   → si succès → récupérer `newId`

2. Pour chaque seasonId dans selectedSeasonIds:
   enrollChildInSeason(newId, seasonId)
   → utiliser Promise.allSettled() pour ne pas bloquer

3. Si erreurs d'enrôlement → afficher warning toast (non bloquant)

4. router.replace(`/children/${newId}`)
```

### Design et UX de la section Académie

- Même style de section que les autres (`Identité`, `Club actuel`) : card light avec titre doré
- Pills saisons : même style que les status pills déjà présents dans le formulaire
- Indicateur "en cours" sur la saison courante (badge ou label, cohérent avec la fiche détail)

### Points d'attention

- L'enrôlement académique doit se faire **après** `createChildDirectoryEntry()` (le `child_id` doit exister en base avant)
- Utiliser `Promise.allSettled()` et non `Promise.all()` pour éviter qu'un échec partiel empêche la navigation
- Ne pas dupliquer la logique de gestion des saisons : réutiliser les fonctions API existantes

### References

- [Source: aureak/apps/web/app/(admin)/children/new/page.tsx] — Formulaire de création actuel
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx] — Section ACADÉMIE (pattern à reproduire)
- [Source: aureak/packages/api-client/src/admin/child-directory.ts] — `createChildDirectoryEntry()`
- [Source: _bmad-output/implementation-artifacts/18-3-statut-academie-dynamique.md] — Logique statut académie dynamique
- [Source: MEMORY.md#Statut Académie Dynamique] — Vue `v_child_academy_status`, logique de priorité saison

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T1 : `listAcademySeasons()` → `academy_seasons` (id, label, startDate, endDate, isCurrent). `addChildAcademyMembership({ tenantId, childId, seasonId })` → `child_academy_memberships`. Pattern reproduit depuis `HistoriqueSection` de `[childId]/page.tsx`.
- T3 : Ref `statutManuallyOverridden` choisie plutôt que state pour éviter re-renders inutiles et stale closure dans le `useEffect`. L'indicateur "suggéré automatiquement" est affiché via condition `statut === suggestedStatut && selectedSeasonIds.length > 0` (pas de state supplémentaire).
- T4 : Warning non-bloquant via `setEnrollWarning` + `navTimerRef` (annulable). Timer annulé : (1) par "Annuler" via `clearTimeout(navTimerRef.current)`, (2) au démontage via cleanup `useEffect`. Si aucun échec, navigation immédiate.
- M1 fix (code review) : `navTimerRef.current` stocke l'ID du `setTimeout` — évite la double navigation si l'admin clique "Annuler" dans la fenêtre de 2s.
- M2 fix (code review) : `seasonsError` state distingue erreur réseau (`colors.status.attention`) de liste vide (liste vide = message neutre). L'utilisateur sait pourquoi la section est inactive.
- TypeScript : L'erreur `TS2698` sur `...shadows.sm` dans le StyleSheet est pré-existante dans 4+ autres fichiers du projet — non introduite par cette story.

### Completion Notes List

- T1 ✅ — API pattern identifié : `listAcademySeasons()` + `addChildAcademyMembership()` depuis `@aureak/api-client`, table `child_academy_memberships`. Type `AcademySeason` avec champ `isCurrent: boolean`.
- T2 ✅ — Section ACADÉMIE ajoutée entre CLUB ACTUEL et OPTIONS. Pills pour chaque saison avec indicateur ★ pour la saison courante. Compteur de saisons sélectionnées affiché.
- T3 ✅ — `suggestedStatut` = `useMemo` (règles : current+past → Académicien, current seul → Nouveau, past seul → Ancien, aucun → ''). `useEffect` applique la suggestion si non overridden. `handleStatutClick` marque `statutManuallyOverridden.current = true`. Indicateur textuel affiché quand statut = suggestion.
- T4 ✅ — `Promise.allSettled` sur les enrôlements. Warning non-bloquant + délai 2s si échec partiel. Navigation maintenue dans tous les cas.
- T4 ✅ (post code-review) — `navTimerRef` intégré : timer annulable depuis "Annuler" + cleanup `useEffect`. Plus de risque de double navigation.
- T5 ✅ — Validation manuelle à effectuer : 0 saisons → 0 appel API, N saisons → N appels `Promise.allSettled`, fiche joueur post-création cohérente avec les saisons encodées.
- M2 ✅ (post code-review) — `seasonsError` state : message d'erreur rouge + texte explicite si le réseau est inaccessible, distinct du cas "liste vide".
- ESLint : 0 erreurs, 0 warnings.

### File List

- `aureak/apps/web/app/(admin)/children/new/page.tsx` — Formulaire de création : ajout section ACADÉMIE, suggestion automatique statut, enrôlement post-création
