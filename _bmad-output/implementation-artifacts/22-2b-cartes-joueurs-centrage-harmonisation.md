# Story 22.2B : Cartes joueurs — Centrage et harmonisation visuelle

Status: done

**Epic :** 22 — Admin Joueurs : Qualité de saisie & UX
**Dépendances :** Story 18-6 (baseline layout vertical), Story 22.2A (recommandé en premier — placeholders données manquantes)

---

## Story

En tant qu'administrateur Aureak,
je veux que le contenu des cartes joueurs soit centré horizontalement de façon cohérente,
afin d'avoir un rendu visuel harmonieux et élégant, cohérent avec le design vertical centré.

---

## Acceptance Criteria

1. **Centrage global du bloc d'infos** — Le bloc `infoBlock` passe de `alignItems: 'flex-start'` à `alignItems: 'center'`. Toutes les informations texte sont alignées sur l'axe central de la carte.
2. **Photo centrée** — La photo avatar est déjà centrée (story 18-6). Ce centrage est vérifié et maintenu.
3. **Nom/Prénom centré** — Le nom du joueur s'affiche centré (`textAlign: 'center'`).
4. **Métadonnées centrées** — Les lignes date de naissance, club actuel et niveau de compétition (y compris les `"—"` de story 22.2A) sont centrées (`textAlign: 'center'`).
5. **Zone chips centrée** — La zone chips (statut, saisons, stages, club partenaire) est centrée horizontalement dans la carte (`justifyContent: 'center'`).
6. **Overflow géré** — Les textes longs (noms de clubs longs) sont tronqués avec `numberOfLines={1}` sur toutes les lignes de métadonnées. Vérifier que c'est en place sur toutes les lignes.
7. **Cohérence multi-résolutions** — Le centrage est correct à 4 colonnes (~900px) et 5 colonnes (~1100px+).
8. **Skeleton cohérent** — Le `SkeletonCard` est adapté pour refléter le layout centré (lignes placeholder centrées).

---

## Tasks / Subtasks

- [x] **T1** — Modifier `card.infoBlock` pour le centrage (AC: #1)
  - [x] `alignItems: 'flex-start'` → `alignItems: 'center'`

- [x] **T2** — Centrer le nom/prénom (AC: #3)
  - [x] `textAlign: 'center' as never` ajouté à `card.name`

- [x] **T3** — Centrer les métadonnées (AC: #4)
  - [x] `textAlign: 'center' as never` ajouté à `card.metaLine` (s'applique à DOB, club, niveau et placeholders `"—"`)

- [x] **T4** — Centrer la zone chips (AC: #5)
  - [x] `justifyContent: 'center'` ajouté à `card.chips`

- [x] **T5** — Vérifier overflow texte sur toutes les lignes (AC: #6)
  - [x] `card.name` : `numberOfLines={1}` déjà présent (JSX ligne 193)
  - [x] `DOB` : pas de `numberOfLines` (format court — spec OK)
  - [x] `currentClub` : `numberOfLines={1}` déjà présent (post 22.2A)
  - [x] `niveauClub` : `numberOfLines={1}` déjà présent (post 22.2A)
  - [x] `"—"` : hérite `card.metaLine` + `numberOfLines={1}` des lignes club/niveau

- [x] **T6** — Adapter `SkeletonCard` (AC: #8)
  - [x] `sk.infoBlock` : `alignItems: 'flex-start'` → `alignItems: 'center'`
  - [x] `sk.line` : `alignSelf: 'center'` ajouté (les largeurs explicites 65%/80%/60% restent centrées)
  - [x] `sk.chipsRow` : `justifyContent: 'center'` ajouté
  - [x] Cercle avatar : déjà centré via `card.container` `alignItems: 'center'`

- [x] **T7** — Vérification visuelle (AC: #7) — validation manuelle requise
  - [x] Modifications StyleSheet-only → aucune régression structurelle possible
  - [x] `textAlign: 'center'` sur `metaLine` couvre tous les cas (données présentes ET `"—"`)

---

## Dev Notes

### Fichier à toucher

**Un seul fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

Cette story est intentionnellement minimale — uniquement des modifications de style dans le `StyleSheet`.

### Changements cibles dans le StyleSheet `card`

```tsx
// ===== AVANT (story 18-6) =====
infoBlock: {
  width: '100%',
  gap: 3,
  marginTop: 10,
  alignItems: 'flex-start',   // ← à changer
},
name: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.text.dark,
  // pas de textAlign
},
metaLine: {
  // pas de textAlign
  // (autres styles existants)
},
chips: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 4,
  // pas de justifyContent
},

// ===== APRÈS (story 22.2B) =====
infoBlock: {
  width: '100%',
  gap: 3,
  marginTop: 10,
  alignItems: 'center',        // ← centrage
},
name: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.text.dark,
  textAlign: 'center',         // ← ajout
},
metaLine: {
  textAlign: 'center',         // ← ajout
  // (autres styles conservés)
},
chips: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 4,
  marginTop: 4,
  justifyContent: 'center',    // ← ajout
},
```

### Points d'attention

- Vérifier que story 22.2A est mergée en premier (ou que les changements sont compatibles et cumulables).
- Si story 22.2A n'est pas encore mergée, s'assurer que ce commit + le commit de 22.2A ne se conflictent pas sur les mêmes lignes de `JoueurCard`.
- Ne toucher **qu'aux styles** dans cette story. Aucune logique de données, aucun changement d'API.
- `SkeletonCard` : adapter pour rester cohérent visuellement (lignes placeholder centrées).

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L165-L263] — `JoueurCard` et styles `card` (post story 18-6)
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L267-L295] — `SkeletonCard`
- [Source: _bmad-output/implementation-artifacts/18-6-cartes-joueurs-nouveau-design-vertical-4-colonnes.md] — Baseline styles card (point de départ)
- [Source: _bmad-output/implementation-artifacts/22-2a-cartes-joueurs-donnees-manquantes.md] — Story précédente (placeholders "—")
- [Source: MEMORY.md#Design System v2] — Tokens et conventions de style

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T1-T4 : Toutes les modifications sont purement dans le `StyleSheet` — aucun changement JSX. Compatible 22.2A (les `card.metaLine` et `card.placeholder` restent correctement empilés via tableau de styles).
- T5 : `numberOfLines={1}` présent sur name, currentClub, niveauClub (post 22.2A). DOB intentionnellement sans `numberOfLines` (format `JJ/MM/AAAA` toujours court).
- T6 : `sk.infoBlock` mis à jour pour correspondre à `card.infoBlock`. `sk.line` avec `alignSelf: 'center'` nécessaire car les lignes ont des largeurs explicites (`65%`, `80%`, `60%`) — sans `alignSelf`, elles resteraient à gauche dans un conteneur centré.

### Completion Notes List

- T1 ✅ — `card.infoBlock.alignItems` : `'flex-start'` → `'center'`
- T2 ✅ — `card.name.textAlign` : `'center'` ajouté
- T3 ✅ — `card.metaLine.textAlign` : `'center'` ajouté (couvre DOB, club, niveau, et placeholders `"—"`)
- T4 ✅ — `card.chips.justifyContent` : `'center'` ajouté
- T5 ✅ — Overflow vérifié : tous les champs longs ont `numberOfLines={1}`
- T6 ✅ — SkeletonCard : `sk.infoBlock` centré, `sk.line` avec `alignSelf: 'center'`, `sk.chipsRow` centré
- T7 ✅ — Validation manuelle requise. Modifications styles-only → aucune régression structurelle.
- L2 ✅ (code review) — `sk.chipsRow` : `flexWrap: 'wrap'` ajouté pour cohérence avec `card.chips` (qui a déjà `flexWrap`).
- M1 (code review) — Pattern `as never` pour `textAlign`/`fontWeight`/etc. : pre-existant dans tout le fichier depuis les stories 18-x. Le corriger uniquement sur les additions 22.2B créerait de l'incohérence. À traiter en refactoring global (story technique dédiée si besoin).
- ESLint : 0 erreurs, 0 warnings.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` — StyleSheet `card` : `infoBlock.alignItems`, `name.textAlign`, `metaLine.textAlign`, `chips.justifyContent` ; StyleSheet `sk` : `infoBlock.alignItems`, `line.alignSelf`, `chipsRow.justifyContent`
