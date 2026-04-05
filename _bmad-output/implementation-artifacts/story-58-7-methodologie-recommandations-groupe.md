# Story 58-7 — Méthodologie : Recommandations exercices pour un groupe

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : ready-for-dev
**Priority** : medium
**Effort** : M (demi-journée)

---

## Contexte

Lors de la création d'une séance, le coach choisit ses thèmes et situations manuellement. Cette story introduit un algorithme de recommandation simple : en fonction du niveau moyen du groupe sélectionné, les situations pédagogiques de difficulté adaptée sont marquées "Recommandé" et triées en tête de liste dans l'étape "Contenu" de la création de séance.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** voir les exercices recommandés pour le groupe de ma séance,
**afin de** choisir rapidement des situations adaptées au niveau de mes joueurs sans parcourir toute la bibliothèque.

---

## Acceptance Criteria

- [ ] AC1 — La fonction `getRecommendedSituations(groupId: string)` dans `@aureak/api-client` calcule le niveau moyen du groupe et retourne les `MethodologySituation[]` dont `difficultyLevel` est dans `[avgLevel - 1, avgLevel, avgLevel + 1]` (borné entre 1 et 5), triées par `difficultyLevel ASC`
- [ ] AC2 — Le niveau moyen du groupe est calculé depuis les évaluations récentes des membres : `AVG(mastery_level)` sur les 3 dernières séances du groupe — si aucune donnée, le niveau moyen par défaut est 3 (Intermédiaire)
- [ ] AC3 — Les situations recommandées reçoivent `isRecommended: true` dans le retour de la fonction — les autres situations reçoivent `false`
- [ ] AC4 — Dans `seances/new.tsx` à l'étape de sélection du contenu (ou l'étape thèmes), quand `groupId` est défini, appeler `getRecommendedSituations(groupId)` et afficher les résultats dans une section "Recommandés pour ce groupe" (max 6 cards, grille 2 colonnes) avec badge "✦ Recommandé" or
- [ ] AC5 — Les situations recommandées sont affichées en priorité dans la liste complète des situations (triées en tête), avec un séparateur visuel "— Autres exercices —" entre les recommandées et le reste
- [ ] AC6 — Si `getRecommendedSituations` retourne une liste vide (pas de données d'évaluation), afficher la bibliothèque complète sans section recommandée (aucun message d'erreur)
- [ ] AC7 — Un état `loadingRecommendations: boolean` est géré avec `try/finally`
- [ ] AC8 — Le résultat de `getRecommendedSituations` est mis en cache dans un state `recommendations: Record<string, MethodologySituation[]>` indexé par `groupId` pour éviter de re-fetcher si le coach revient à l'étape précédente
- [ ] AC9 — `console.error` guardé ; zéro hardcode — tokens `@aureak/theme`
- [ ] AC10 — La fonction SQL sous-jacente est optimisée avec un index sur `(group_id, date DESC)` pour les évaluations — vérifier si l'index existe, créer si absent

---

## Tasks

### T1 — Fonction SQL `get_group_avg_level`

Fichier : `supabase/migrations/00122_fn_group_avg_level.sql`

```sql
-- Story 58-7 — Niveau moyen d'un groupe (3 dernières séances)
CREATE OR REPLACE FUNCTION get_group_avg_level(p_group_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    ROUND(AVG(e.mastery_level)::NUMERIC, 1),
    3
  )
  FROM evaluations e
  JOIN sessions s ON s.id = e.session_id
  WHERE s.group_id = p_group_id
    AND s.deleted_at IS NULL
    AND s.date >= (CURRENT_DATE - INTERVAL '90 days')
  LIMIT 1
$$;
```

Note : si la colonne `mastery_level` n'existe pas sur `evaluations`, utiliser le proxy via `signal = 'acquired' → 5, 'partially_acquired' → 3, 'not_acquired' → 1` :
```sql
AVG(CASE e.signal
  WHEN 'acquired'          THEN 5
  WHEN 'partially_acquired' THEN 3
  WHEN 'not_acquired'       THEN 1
  ELSE 3
END)
```

- [ ] Fonction SQL créée

### T2 — Fonction API `getRecommendedSituations`

Fichier : `aureak/packages/api-client/src/methodology.ts`

```typescript
export async function getRecommendedSituations(
  groupId: string,
): Promise<{ data: (MethodologySituation & { isRecommended: boolean })[]; error: unknown }> {
  // 1. Récupérer le niveau moyen du groupe
  const { data: levelData, error: levelError } = await supabase
    .rpc('get_group_avg_level', { p_group_id: groupId })
  if (levelError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getRecommendedSituations] avgLevel error:', levelError)
  }
  const avgLevel = Math.round(levelData ?? 3)
  const minLevel = Math.max(1, avgLevel - 1)
  const maxLevel = Math.min(5, avgLevel + 1)

  // 2. Récupérer toutes les situations actives
  const { data: situations, error } = await listMethodologySituations({ activeOnly: true })
  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getRecommendedSituations] situations error:', error)
    return { data: [], error }
  }

  // 3. Marquer recommandées
  const result = (situations ?? [])
    .map(s => ({
      ...s,
      isRecommended: s.difficultyLevel >= minLevel && s.difficultyLevel <= maxLevel,
    }))
    .sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))

  return { data: result, error: null }
}
```

- [ ] Fonction créée et exportée

### T3 — Intégration dans `seances/new.tsx`

Fichier : `aureak/apps/web/app/(admin)/seances/new.tsx`

```typescript
const [recommendations,       setRecommendations]       = useState<Record<string, (MethodologySituation & { isRecommended: boolean })[]>>({})
const [loadingRecommendations, setLoadingRecommendations] = useState(false)

// Déclencher quand groupId change (step 1 → step 2+)
useEffect(() => {
  if (!groupId || recommendations[groupId]) return
  setLoadingRecommendations(true)
  getRecommendedSituations(groupId)
    .then(res => {
      if (res.data.length > 0)
        setRecommendations(prev => ({ ...prev, [groupId]: res.data }))
    })
    .catch(err => {
      if (process.env.NODE_ENV !== 'production')
        console.error('[SeancesNew] recommendations error:', err)
    })
    .finally(() => setLoadingRecommendations(false))
}, [groupId])
```

Section recommandations dans l'étape contenu :
```tsx
{recommended.length > 0 && (
  <View style={{ marginBottom: space.lg }}>
    <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 1, marginBottom: space.sm }}>
      RECOMMANDÉS POUR CE GROUPE
    </AureakText>
    <View style={styles.situationGrid}>
      {recommended.slice(0, 6).map(s => (
        <SituationCard
          key={s.id}
          situation={s}
          difficulty={s.difficultyLevel}
          isRecommended={true}
          onPress={() => toggleSituation(s.id)}
        />
      ))}
    </View>
    {others.length > 0 && (
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <AureakText variant="caption" style={{ color: colors.text.muted, paddingHorizontal: space.sm }}>
          Autres exercices
        </AureakText>
        <View style={styles.separatorLine} />
      </View>
    )}
  </View>
)}
```

- [ ] Section recommandée intégrée avec try/finally
- [ ] Cache `recommendations` par `groupId` fonctionnel

---

## Dépendances

- Story 58-1 `done` — `SituationCard` avec prop `isRecommended`
- Story 58-6 `done` — `difficultyLevel` sur `MethodologySituation`
- Epic 20 `done` — `listMethodologySituations` existant

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00122_fn_group_avg_level.sql` | Créer |
| `aureak/packages/api-client/src/methodology.ts` | Modifier — `getRecommendedSituations` |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Modifier — section recommandations |

---

## QA post-story

```bash
grep -n "setLoadingRecommendations" aureak/apps/web/app/(admin)/seances/new.tsx
grep -n "finally" aureak/apps/web/app/(admin)/seances/new.tsx
grep -n "console\." aureak/packages/api-client/src/methodology.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-7 — méthodologie recommandations exercices adaptés au groupe
```
