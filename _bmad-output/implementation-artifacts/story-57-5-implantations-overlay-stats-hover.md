# Story 57-5 — Implantations : Overlay stats au survol de card

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Les `ImplantationCard` affichent actuellement nom, adresse, groupes et photo. Cette story ajoute un overlay de statistiques qui apparaît au hover sur la card web (Pressable + `onHoverIn`/`onHoverOut` React Native Web), affichant : taux de présence moyen du mois, nombre de séances ce mois, et nombre de groupes actifs.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir les stats clés d'une implantation en survolant sa card,
**afin d'** obtenir une vue rapide de l'activité de chaque site sans ouvrir la fiche détail.

---

## Acceptance Criteria

- [ ] AC1 — Au survol (`onHoverIn`) d'une `ImplantationCard`, un overlay semi-transparent (fond `rgba(0,0,0,0.75)`) glisse depuis le bas de la card et couvre la zone inférieure (hauteur ~120px) avec une animation `translateY` (de +120 à 0) de 200ms
- [ ] AC2 — L'overlay affiche 3 métriques : **Présence ce mois** (%), **Séances ce mois** (nombre), **Groupes actifs** (nombre) — chacune avec un label et une valeur en gros
- [ ] AC3 — Les données de l'overlay sont chargées de façon différée : au premier `onHoverIn` d'une implantation, un appel API `getImplantationHoverStats(implantationId)` est déclenché ; le résultat est mis en cache dans un state `hoverStats: Record<string, ImplantationHoverStats>` pour ne pas re-fetcher au hover suivant
- [ ] AC4 — Pendant le chargement, l'overlay affiche 3 skeleton bars (gris clair, `borderRadius: radius.xs`, hauteur 16px, largeur 80%)
- [ ] AC5 — `getImplantationHoverStats(implantationId)` est une nouvelle fonction dans `@aureak/api-client/src/sessions/implantations.ts` qui retourne `{ attendanceRatePct: number, sessionCountThisMonth: number, activeGroupCount: number }`
- [ ] AC6 — La requête SQL sous-jacente calcule : `attendanceRatePct` = moyenne des taux présence des séances du mois courant pour cette implantation ; `sessionCountThisMonth` = count des séances du mois civil en cours ; `activeGroupCount` = count des groupes non supprimés liés à l'implantation
- [ ] AC7 — Au `onHoverOut`, l'overlay glisse hors de la card (`translateY(+120)`) et disparaît après 200ms
- [ ] AC8 — Sur touch (mobile/tablette), le hover n'est pas déclenché — l'overlay reste invisible (les events `onHoverIn`/`onHoverOut` ne se firing pas sur touch)
- [ ] AC9 — Zéro hardcode — tokens `@aureak/theme` ; `try/finally` sur `setLoadingHoverStats` ; `console.error` guardé
- [ ] AC10 — Le z-index de l'overlay (10) ne masque pas les badges existants ni le bouton "Modifier" de la card

---

## Tasks

### T1 — Type `ImplantationHoverStats` dans `@aureak/types`

Fichier : `aureak/packages/types/src/entities.ts`

```typescript
export type ImplantationHoverStats = {
  attendanceRatePct   : number   // 0–100
  sessionCountThisMonth: number
  activeGroupCount    : number
}
```

- [x] Type ajouté

### T2 — Fonction API `getImplantationHoverStats`

Fichier : `aureak/packages/api-client/src/sessions/implantations.ts`

```typescript
export async function getImplantationHoverStats(
  implantationId: string,
): Promise<{ data: ImplantationHoverStats | null; error: unknown }> {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase.rpc('get_implantation_hover_stats', {
    p_implantation_id: implantationId,
    p_month_start    : monthStart,
    p_month_end      : monthEnd,
  })

  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getImplantationHoverStats] error:', error)
    return { data: null, error }
  }

  const row = data?.[0]
  if (!row) return { data: { attendanceRatePct: 0, sessionCountThisMonth: 0, activeGroupCount: 0 }, error: null }

  return {
    data: {
      attendanceRatePct   : Math.round(row.attendance_rate_pct ?? 0),
      sessionCountThisMonth: row.session_count_this_month ?? 0,
      activeGroupCount    : row.active_group_count ?? 0,
    },
    error: null,
  }
}
```

- [x] Fonction `getImplantationHoverStats` créée et exportée

### T3 — Fonction SQL `get_implantation_hover_stats`

Fichier : `supabase/migrations/00118_fn_implantation_hover_stats.sql`

```sql
-- Story 57-5 — Fonction stats hover implantation
CREATE OR REPLACE FUNCTION get_implantation_hover_stats(
  p_implantation_id UUID,
  p_month_start     TIMESTAMPTZ,
  p_month_end       TIMESTAMPTZ
)
RETURNS TABLE (
  attendance_rate_pct      NUMERIC,
  session_count_this_month BIGINT,
  active_group_count       BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(
      ROUND(
        100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(a.id), 0),
        1
      ), 0
    ) AS attendance_rate_pct,
    COUNT(DISTINCT s.id) FILTER (
      WHERE s.date BETWEEN p_month_start AND p_month_end
    ) AS session_count_this_month,
    (
      SELECT COUNT(*) FROM groups g
      WHERE g.implantation_id = p_implantation_id
        AND g.deleted_at IS NULL
        AND g.is_transient = false
    ) AS active_group_count
  FROM sessions s
  JOIN groups g     ON g.id = s.group_id
  LEFT JOIN attendances a ON a.session_id = s.id
  WHERE g.implantation_id = p_implantation_id
    AND s.date BETWEEN p_month_start AND p_month_end
    AND s.deleted_at IS NULL;
$$;
```

- [x] Migration `00124` créée (numéro ajusté — dernière migration était 00123)

### T4 — State et animation hover dans `index.tsx`

```typescript
const [hoverStats,        setHoverStats]        = useState<Record<string, ImplantationHoverStats>>({})
const [loadingHoverStats, setLoadingHoverStats] = useState<Record<string, boolean>>({})
const [hoverVisible,      setHoverVisible]      = useState<Record<string, boolean>>({})

const handleHoverIn = async (implId: string) => {
  setHoverVisible(prev => ({ ...prev, [implId]: true }))
  if (hoverStats[implId]) return // déjà en cache
  setLoadingHoverStats(prev => ({ ...prev, [implId]: true }))
  try {
    const { data } = await getImplantationHoverStats(implId)
    if (data) setHoverStats(prev => ({ ...prev, [implId]: data }))
  } finally {
    setLoadingHoverStats(prev => ({ ...prev, [implId]: false }))
  }
}

const handleHoverOut = (implId: string) => {
  setHoverVisible(prev => ({ ...prev, [implId]: false }))
}
```

Overlay dans `ImplantationCard` (en position absolute, bottom: 0) :
- Animation `translateY` via `Animated.Value` ou CSS `transform`
- 3 métriques ou 3 skeletons
- Fond `rgba(0,0,0,0.75)`, `borderBottomLeftRadius: radius.card`, `borderBottomRightRadius: radius.card`

- [x] State hover ajouté dans la page principale
- [x] Handler `handleHoverIn`/`handleHoverOut` avec try/finally
- [x] Overlay animé implémenté dans `ImplantationCard`
- [x] Import `getImplantationHoverStats` et `ImplantationHoverStats` ajoutés

---

## Dépendances

- Story 49-6 `done` — `ImplantationCard` existante
- Story 57-3 (optionnel) — `max_players` peut être affiché dans l'overlay aussi

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00118_fn_implantation_hover_stats.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — `ImplantationHoverStats` |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier — `getImplantationHoverStats` |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — state hover + overlay |

---

## QA post-story

```bash
grep -n "setLoadingHoverStats" aureak/apps/web/app/(admin)/implantations/index.tsx
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
grep -n "console\." aureak/packages/api-client/src/sessions/implantations.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-57): story 57-5 — implantations overlay stats hover (présence, séances, groupes)
```
