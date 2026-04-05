# Story 57-6 — Implantations : Vue comparaison deux implantations côte à côte

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : low
**Effort** : M (demi-journée)

---

## Contexte

Les admins gèrent plusieurs sites (implantations). Cette story permet de sélectionner deux implantations et de comparer leurs stats côte à côte : taux de présence, taux de maîtrise moyen, charge de séances du mois, nombre de groupes, nombre de joueurs. Nouveau fichier `implantations/compare/page.tsx`.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** comparer deux implantations côte à côte sur les métriques clés,
**afin de** détecter les déséquilibres de charge et allouer les ressources efficacement.

---

## Acceptance Criteria

- [ ] AC1 — Une route `/implantations/compare` est accessible depuis la page liste des implantations via un bouton "Comparer" dans la barre d'actions
- [ ] AC2 — La page affiche deux colonnes (layout `flex: 1` chacune) avec un `ScrollView` horizontal sur mobile ; sur desktop les deux colonnes sont côte à côte (gap `space.lg`)
- [ ] AC3 — Chaque colonne présente un `Picker` / `Select` permettant de choisir une implantation parmi la liste complète ; les deux sélecteurs ne peuvent pas pointer vers la même implantation (le deuxième filtre l'option déjà choisie dans le premier)
- [ ] AC4 — Dès que les deux implantations sont sélectionnées, un appel à `compareImplantations(id1, id2)` est déclenché et les données s'affichent sous les sélecteurs
- [ ] AC5 — Les métriques comparées sont : **Présence (%)**, **Maîtrise (%)**, **Séances ce mois**, **Groupes actifs**, **Joueurs inscrits** — chacune sur une ligne avec les deux valeurs mises en vis-à-vis ; la valeur la plus haute est mise en surbrillance (fond `colors.accent.gold + '18'`)
- [ ] AC6 — Un graphique en barres horizontales est affiché pour la présence (%) et la maîtrise (%) — implémenté avec de simples `View` React Native (pas de librairie graphique) — les barres ont une largeur proportionnelle à la valeur, couleur `colors.accent.gold` pour la valeur haute, `colors.border.light` pour la plus basse
- [ ] AC7 — La fonction API `compareImplantations(id1, id2)` dans `@aureak/api-client/src/sessions/implantations.ts` appelle `getImplantationHoverStats` deux fois en parallèle (`Promise.all`) et retourne `{ impl1: ImplantationHoverStats, impl2: ImplantationHoverStats }`
- [ ] AC8 — Un état de chargement (skeleton) est affiché pendant le fetch ; `try/finally` sur le setter `setComparing`
- [ ] AC9 — Un bouton "← Retour aux implantations" navigue vers `/implantations`
- [ ] AC10 — Zéro hardcode — tokens `@aureak/theme` ; `console.error` guardé

---

## Tasks

### T1 — Fonction API `compareImplantations`

Fichier : `aureak/packages/api-client/src/sessions/implantations.ts`

```typescript
export async function compareImplantations(
  id1: string,
  id2: string,
): Promise<{
  data: { impl1: ImplantationHoverStats; impl2: ImplantationHoverStats } | null
  error: unknown
}> {
  const [res1, res2] = await Promise.all([
    getImplantationHoverStats(id1),
    getImplantationHoverStats(id2),
  ])
  if (res1.error || res2.error) {
    const err = res1.error ?? res2.error
    if (process.env.NODE_ENV !== 'production')
      console.error('[compareImplantations] error:', err)
    return { data: null, error: err }
  }
  return {
    data : { impl1: res1.data!, impl2: res2.data! },
    error: null,
  }
}
```

- [x] Fonction `compareImplantations` créée et exportée

### T2 — Page `implantations/compare/page.tsx`

Fichier : `aureak/apps/web/app/(admin)/implantations/compare/page.tsx` (nouveau)

Structure du composant `ComparePage` :

```typescript
'use client'
// State
const [implantations, setImplantations] = useState<Implantation[]>([])
const [id1,           setId1]           = useState<string | null>(null)
const [id2,           setId2]           = useState<string | null>(null)
const [result,        setResult]        = useState<{ impl1: ImplantationHoverStats; impl2: ImplantationHoverStats } | null>(null)
const [comparing,     setComparing]     = useState(false)

// Charger la liste des implantations au mount
// Déclencher compareImplantations dès que id1 et id2 sont définis et différents
```

Sections UI :
1. Header avec bouton retour + titre "Comparer deux implantations"
2. Row deux sélecteurs (filtre mutuel)
3. Si `result` : tableau de métriques + mini-barres comparatives
4. Sinon : placeholder "Sélectionnez deux implantations"

- [x] Fichier `page.tsx` créé
- [x] Fichier `index.tsx` créé (`export { default } from './page'`)

### T3 — Bouton "Comparer" dans `implantations/index.tsx`

Dans la barre d'actions en haut de page (à côté du bouton "Nouvelle implantation"), ajouter :
```tsx
<AureakButton
  variant="ghost"
  label="Comparer"
  onPress={() => router.push('/implantations/compare' as never)}
  style={{ marginLeft: space.sm }}
/>
```

- [x] Bouton "Comparer" ajouté dans la page liste

### T4 — Métriques supplémentaires (maîtrise)

La maîtrise n'est pas encore dans `getImplantationHoverStats` (story 57-5). Étendre la fonction SQL `get_implantation_hover_stats` ou créer une variante `get_implantation_compare_stats` qui inclut :

```sql
COALESCE(
  ROUND(
    100.0 * SUM(CASE WHEN e.signal = 'acquired' THEN 1 ELSE 0 END)::NUMERIC
    / NULLIF(COUNT(e.id), 0), 1
  ), 0
) AS mastery_rate_pct
```

Ajouter `masteryRatePct: number` dans `ImplantationHoverStats`.

- [x] `masteryRatePct` ajouté dans le type et la fonction SQL (migration 00124)

---

## Dépendances

- Story 57-5 `done` — `getImplantationHoverStats` + `ImplantationHoverStats` existants
- Story 49-6 `done` — `listImplantations` existant

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00119_fn_implantation_compare_stats.sql` | Créer (extension SQL) |
| `aureak/packages/types/src/entities.ts` | Modifier — `masteryRatePct` dans `ImplantationHoverStats` |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier — `compareImplantations` |
| `aureak/apps/web/app/(admin)/implantations/compare/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/implantations/compare/index.tsx` | Créer |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — bouton "Comparer" |

---

## QA post-story

```bash
grep -n "setComparing" aureak/apps/web/app/(admin)/implantations/compare/page.tsx
grep -n "console\." aureak/apps/web/app/(admin)/implantations/compare/page.tsx | grep -v "NODE_ENV"
grep -n "console\." aureak/packages/api-client/src/sessions/implantations.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-57): story 57-6 — implantations vue comparaison côte à côte
```
