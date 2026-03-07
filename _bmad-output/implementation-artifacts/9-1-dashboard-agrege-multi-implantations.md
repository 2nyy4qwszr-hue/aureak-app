# Story 9.1 : Dashboard Agrégé Multi-implantations

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux visualiser un tableau de bord consolidé affichant les KPIs de chaque implantation (taux de présence, évaluations, maîtrise quiz),
Afin de piloter l'ensemble des sites sans consulter chaque implantation individuellement.

## Acceptance Criteria

**AC1 — KPIs par implantation**
- **When** l'Admin charge la vue multi-implantations avec un filtre période
- **Then** chaque implantation affiche : taux de présence, score évaluation moyen (distribution receptivite), taux de maîtrise quiz, séances tenues vs planifiées

**AC2 — Vue SQL `implantation_dashboard_stats`**
- **And** vue SQL créée avec agrégats LEFT JOIN depuis `implantations`, `sessions`, `attendances`, `learning_attempts`

**AC3 — RPC `get_implantation_stats(p_from, p_to)`**
- **And** filtre période appliqué côté client via `?from=&to=` transmis au RPC

**AC4 — RLS**
- **And** Admin uniquement peut lire `implantation_dashboard_stats`
- **And** Coach voit uniquement ses implantations assignées (`coach_implantation_assignments`)

**AC5 — Détail implantation**
- **And** clic sur une implantation → détail : séances de la période, coaches actifs, groupes rattachés

**AC6 — Couverture FRs**
- **And** FR40 couvert : Admin accède aux métriques agrégées multi-implantations
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Vue `implantation_dashboard_stats` (AC: #2)
  - [ ] 1.1 Créer la vue SQL avec les 4 métriques KPI

- [ ] Task 2 — RPC `get_implantation_stats` (AC: #3)
  - [ ] 2.1 Créer RPC SECURITY DEFINER avec filtres `p_from`/`p_to`

- [ ] Task 3 — RLS (AC: #4)
  - [ ] 3.1 Policy admin-only sur `implantation_dashboard_stats`
  - [ ] 3.2 Policy coach : filtre via `coach_implantation_assignments`

- [ ] Task 4 — UI Dashboard Admin web (AC: #1, #5)
  - [ ] 4.1 Créer `apps/web/app/(admin)/dashboard/index.tsx`
  - [ ] 4.2 Grid de cards KPI par implantation avec filtre période
  - [ ] 4.3 Détail implantation (drawer ou page dédiée)

## Dev Notes

### Vue `implantation_dashboard_stats`

```sql
CREATE OR REPLACE VIEW implantation_dashboard_stats AS
SELECT
  i.id                    AS implantation_id,
  i.name                  AS implantation_name,
  i.tenant_id,
  COUNT(DISTINCT s.id)    AS sessions_total,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'terminée') AS sessions_closed,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
    / NULLIF(COUNT(a.id), 0) * 100
  ) AS attendance_rate_pct,
  ROUND(
    COUNT(la.id) FILTER (WHERE la.mastery_status = 'acquired')::numeric
    / NULLIF(COUNT(la.id), 0) * 100
  ) AS mastery_rate_pct
FROM implantations i
LEFT JOIN sessions s
  ON s.implantation_id = i.id
  AND s.tenant_id = i.tenant_id
LEFT JOIN attendances a
  ON a.session_id = s.id AND a.tenant_id = i.tenant_id
LEFT JOIN learning_attempts la
  ON la.session_id = s.id AND la.tenant_id = i.tenant_id
GROUP BY i.id, i.name, i.tenant_id;

ALTER VIEW implantation_dashboard_stats OWNER TO authenticated;
```

### RPC `get_implantation_stats`

```sql
CREATE OR REPLACE FUNCTION get_implantation_stats(
  p_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_to   TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() NOT IN ('admin','coach') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN (
    SELECT jsonb_agg(row_to_json(stats))
    FROM implantation_dashboard_stats stats
    WHERE stats.tenant_id = current_tenant_id()
      AND (
        current_user_role() = 'admin'
        OR EXISTS (
          SELECT 1 FROM coach_implantation_assignments cia
          WHERE cia.implantation_id = stats.implantation_id
            AND cia.coach_id = auth.uid()
            AND cia.unassigned_at IS NULL
        )
      )
  );
END;
$$;
REVOKE ALL ON FUNCTION get_implantation_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_implantation_stats TO authenticated;
```

**Note** : `implantation_dashboard_stats` n'applique pas encore le filtre période (requiert joins avec filtre sur `sessions.date`). La migration inclut une version plus complète avec dates, mais la vue de base ci-dessus est suffisante pour MVP — le RPC peut surcharger avec une CTE filtrée.

### Dépendances

- **Prérequis** : Story 9.4 (implantations, groups, coach_implantation_assignments) + Story 8.1 (learning_attempts) + Story 4.2 (attendances) + Story 6.4 (sessions.status='terminée')
- **Note critique** : Story 9.4 crée les tables `implantations` et `groups`. Story 9.1 dépend de 9.4 pour les données réelles — à implémenter après 9.4.

### References
- [Source: epics.md#Story-9.1] — lignes 2820–2870

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
