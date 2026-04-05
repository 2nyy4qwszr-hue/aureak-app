# Story 53-9 — Séances : Filtres présets enregistrables

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-9
- **Status** : done
- **Priority** : P3
- **Type** : Feature / UX
- **Estimated effort** : S (2–4h)
- **Dependencies** : Story 19-4 (done — page séances avec filtres)

---

## User Story

**En tant qu'admin ou coach**, quand j'utilise la page des séances, je veux pouvoir sauvegarder mes combinaisons de filtres fréquentes sous forme de présets (pills cliquables), afin d'accéder d'un clic à "Mes séances cette semaine" ou "U12 tous groupes" sans reconfigurer les filtres à chaque visite.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/page.tsx`

### Filtres existants dans la page
- `period: PeriodType` — jour/semaine/mois/année
- `filterImplantId: string`
- `filterGroupId: string`
- `filterStatus: string`

### Mécanisme de persistance
Les présets sont stockés dans `localStorage` avec la clé `aureak_seances_presets`.

Structure : `SeancePreset[]` :
```typescript
type SeancePreset = {
  id: string          // uuid
  label: string       // nom affiché
  period: PeriodType
  implantId: string
  groupId: string
  status: string
  isDefault: boolean  // true = préset système non supprimable
}
```

---

## Acceptance Criteria

1. **AC1** — Une section "Présets" est affichée entre le header et les filtres dans `page.tsx`. Elle contient des pills cliquables.

2. **AC2** — Deux présets système sont inclus par défaut (non supprimables, `isDefault: true`) :
   - "Cette semaine" : `{ period: 'week', implantId: '', groupId: '', status: '' }`
   - "Planifiées" : `{ period: 'month', implantId: '', groupId: '', status: 'planifiée' }`

3. **AC3** — Un bouton "+ Sauvegarder" permet de sauvegarder la combinaison de filtres actuelle comme nouveau préset. Il ouvre une mini-popover avec un champ texte pour nommer le préset.

4. **AC4** — Cliquer un préset applique ses filtres instantanément (appelle les setters de filtres correspondants).

5. **AC5** — Chaque préset utilisateur (non-default) affiche un bouton ✕ pour le supprimer. La suppression met à jour `localStorage`.

6. **AC6** — Les présets utilisateurs sont chargés depuis `localStorage` au montage du composant via `useEffect`.

7. **AC7** — Si le nom du préset est vide lors de la sauvegarde, afficher une erreur inline "Le nom est requis".

8. **AC8** — Le préset actif est mis en évidence (bordure or, fond or 20%) si la combinaison de filtres actuelle correspond exactement à un préset.

---

## Tasks

- [x] **T — Types locaux**
  - Définir `SeancePreset` type localement dans `page.tsx` (pas dans `@aureak/types` — logique UI locale)
  - Définir `DEFAULT_PRESETS: SeancePreset[]` avec les 2 présets système

- [x] **T — State et localStorage**
  - `useState<SeancePreset[]>` : `presets`
  - `useEffect` au montage : charger depuis `localStorage.getItem('aureak_seances_presets')`
  - `useEffect` sur `presets` : sauvegarder dans `localStorage` (exclure les `isDefault`)

- [x] **T — Détection préset actif**
  - `useMemo` : comparer `{ period, filterImplantId, filterGroupId, filterStatus }` avec chaque préset
  - Si match exact → `activePresetId = preset.id`

- [x] **T — Handler appliquer préset**
  - Fonction `applyPreset(preset: SeancePreset)` :
    - `setPeriod(preset.period)`
    - `setFilterImplantId(preset.implantId)`
    - `setFilterGroupId(preset.groupId)`
    - `setFilterStatus(preset.status)`
    - `setRefDate(new Date())` si period = 'week'

- [x] **T — UI section Présets**
  - Row de pills avant les filtres
  - Pill active : fond or 20%, bordure or, texte or bold
  - Pill inactive : fond surface, bordure light
  - Bouton ✕ sur les présets utilisateurs : petite croix à droite du label
  - Bouton "+ Sauvegarder" à droite de la row

- [x] **T — Popover nom du préset**
  - Modal simple avec `TextInput` + boutons "Sauvegarder" / "Annuler"
  - Validation : `label.trim().length > 0`
  - Génère un `id = Date.now().toString()` pour le nouveau préset

- [x] **T — QA scan**
  - Pas de `try/finally` requis (pas d'appel API)
  - Vérifier que localStorage n'écrase pas les présets système
  - Vérifier qu'un préset avec un nom très long est tronqué visuellement (maxWidth + ellipsis)

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Ajouter section Présets + state localStorage + handlers |

---

## Pas de migration SQL

Cette story est 100% front-end, persistance localStorage uniquement.

---

## Commit

```
feat(epic-53): story 53-9 — filtres présets enregistrables sur la page séances
```
