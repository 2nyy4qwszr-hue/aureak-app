# Story 24.2 : Séquences Pédagogiques — CRUD & Réordonnancement

Status: done

## Story

En tant qu'admin,
je veux créer, modifier et réordonner des séquences pédagogiques à l'intérieur d'un thème,
afin de structurer la progression d'apprentissage du thème en chapitres ordonnés indépendants.

## Acceptance Criteria

1. La section **Séquences pédagogiques** dans l'onglet `sequences-pedagogiques` liste toutes les séquences du thème triées par `sortOrder`.
2. L'admin peut créer une nouvelle séquence en saisissant un titre minimum (champ obligatoire) + description optionnelle.
3. Chaque séquence affiche : numéro d'ordre, titre, description (si présente), boutons ↑ / ↓ pour réordonner.
4. Les boutons ↑ / ↓ permutent les `sortOrder` de deux séquences adjacentes et sauvegardent immédiatement en DB.
5. Le bouton ↑ est masqué pour la première séquence ; le bouton ↓ est masqué pour la dernière.
6. L'admin peut modifier le titre et la description d'une séquence existante via un mode édition inline.
7. L'admin peut supprimer une séquence après confirmation (`window.confirm`). La suppression en cascade supprime les liens `sequence_criteria` mais **pas** les critères eux-mêmes (ils deviennent orphelins de séquence — prévu dans Story 24.4).
8. Aucune contrainte imposée sur le nombre de séquences par thème.
9. Les `shortCues` (mots-clés terrain) et `coachVideoUrl` restent éditables dans le mode édition (champs existants conservés).

## Tasks / Subtasks

- [x] Vérifier `listSequencesByTheme` dans `themes.ts` — confirme tri par `sort_order` (AC: #1)

- [x] Ajouter boutons ↑ / ↓ dans `SectionSequences.tsx` (AC: #3, #4, #5)
  - [x] Fonction `handleMoveUp(seqId: string)` : swap `sortOrder` avec la séquence précédente
  - [x] Fonction `handleMoveDown(seqId: string)` : swap `sortOrder` avec la séquence suivante
  - [x] Appeler `updateThemeSequence(id, { sortOrder: newOrder })` pour les deux séquences
  - [x] Re-fetch `loadSequences()` après chaque swap
  - [x] Masquer ↑ si `idx === 0`, masquer ↓ si `idx === sequences.length - 1`

- [x] Ajouter la suppression de séquence (AC: #7)
  - [x] Bouton 🗑 dans la row header de chaque séquence
  - [x] `window.confirm` avant delete
  - [x] Ajouter `deleteThemeSequence(id)` dans l'API client si absent
  - [x] Supabase DELETE sur `theme_sequences` par ID + appel `loadSequences()`

- [x] Vérifier que la création de séquence (titre requis, description optionnelle) fonctionne (AC: #2)
  - [x] Le champ description est ajouté dans le formulaire de création si absent

- [x] Vérifier le mode édition inline : titre + description + shortCues + coachVideoUrl (AC: #6, #9)

- [ ] Tests manuels (AC: #1 à #9)
  - [ ] Créer 3 séquences, réordonner avec ↑/↓, vérifier persistence après reload
  - [ ] Supprimer une séquence du milieu — les autres conservent leur ordre
  - [ ] Modifier titre et description inline

## Dev Notes

### Ce qui existe déjà — à NE PAS réécrire

`SectionSequences.tsx` est **déjà implémentée** avec :
- Création (titre obligatoire)
- Mode édition inline (description + coachVideoUrl + shortCues)
- Affichage liste avec critères liés
- `loadSequences()` / `toggleOpen()` / `toggleEdit()` / `handleAddSeq()` / `handleSaveEdit()`

Ce qui **manque** :
1. Boutons ↑/↓ pour le réordonnancement
2. Bouton de suppression
3. Champ description dans le formulaire de création

### Pattern de swap sortOrder

```ts
// Dans SectionSequences.tsx
const handleMoveUp = async (seqId: string) => {
  const idx = sequences.findIndex(s => s.id === seqId)
  if (idx <= 0) return
  const curr = sequences[idx]
  const prev = sequences[idx - 1]
  await Promise.all([
    updateThemeSequence(curr.id, { sortOrder: prev.sortOrder ?? idx - 1 }),
    updateThemeSequence(prev.id, { sortOrder: curr.sortOrder ?? idx }),
  ])
  await loadSequences()
}
```

### API — deleteThemeSequence

Vérifier si `deleteThemeSequence` existe dans `@aureak/api-client/src/referentiel/themes.ts`. Si absent :

```ts
export async function deleteThemeSequence(id: string): Promise<void> {
  const { error } = await supabase.from('theme_sequences').delete().eq('id', id)
  if (error) throw error
}
```

⚠ La FK `criteria.sequence_id` est `NOT NULL` avec `ON DELETE CASCADE` sur `theme_sequences` → supprimer une séquence **supprime en cascade ses critères** (et les faults de ces critères). C'est un comportement destructif important à indiquer dans la confirmation :
> "Supprimer cette séquence supprimera également tous ses critères et erreurs associées. Continuer ?"

Note : Story 24.4 changera `sequence_id` en nullable. Jusqu'à la Story 24.4, cette cascade reste active.

### Complexité cachée — sortOrder gaps

Après plusieurs suppressions/réordres, les `sortOrder` peuvent avoir des trous (0, 2, 5...). Le swap fonctionne quand même car on compare les valeurs. Pas besoin de ré-indexer à chaque opération.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

Alignement avec le pattern existant :
```
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionSequences.tsx  ← à modifier
aureak/packages/api-client/src/referentiel/themes.ts  ← ajouter deleteThemeSequence si absent
```

### References

- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionSequences.tsx] — composant existant complet
- [Source: aureak/packages/api-client/src/referentiel/themes.ts#updateThemeSequence] — pattern update existant
- [Source: supabase/migrations/00005_referentiel_themes.sql] — table theme_sequences structure + RLS
- [Source: supabase/migrations/00006_referentiel_criteria.sql] — FK cascade criteria → theme_sequences

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Code review appliqué : H1 (champ titre dans édition inline), H2 (description affichée en lecture), M1 (try/catch handleMoveUp/Down/Delete), M2 (movingId/deletingId anti double-clic).

### File List

- `aureak/packages/api-client/src/referentiel/themes.ts` — ajout `deleteThemeSequence`
- `aureak/packages/api-client/src/index.ts` — export `deleteThemeSequence`
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionSequences.tsx` — ↑/↓/🗑 + description création + champ titre/description édition inline + affichage description lecture + error handling + anti double-clic
