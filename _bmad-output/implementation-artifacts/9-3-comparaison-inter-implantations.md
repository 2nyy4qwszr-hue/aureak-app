# Story 9.3 : Comparaison Inter-implantations

Status: done

## Story

En tant qu'Admin,
Je veux comparer les performances entre implantations sur des métriques anonymisées (pas de noms de joueurs ni de coaches),
Afin d'identifier les meilleures pratiques et les implantations nécessitant un soutien.

## Acceptance Criteria

**AC1 — Tableau comparatif anonymisé**
- **When** l'Admin sélectionne une période et des métriques
- **Then** tableau comparatif par implantation : nom, métriques sélectionnées, classement relatif (1er/dernier/médiane) calculé côté client

**AC2 — Anonymisation stricte**
- **And** aucun nom de joueur, parent ou coach individuel n'apparaît — uniquement agrégats par implantation

**AC3 — RPC `get_comparison_report(p_from, p_to, p_metric_keys)`**
- **And** SECURITY DEFINER, rôle admin requis
- **And** retourne JSON anonymisé depuis `implantation_dashboard_stats`

**AC4 — Export CSV**
- **And** rapport exportable en CSV via Edge Function `export-comparison-report` avec mêmes règles d'anonymisation

**AC5 — Couverture FRs**
- **And** FR42 couvert : comparaison inter-implantations sur métriques anonymisées
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — RPC `get_comparison_report` (AC: #2, #3)
  - [ ] 1.1 Créer RPC SECURITY DEFINER admin-only

- [ ] Task 2 — Edge Function `export-comparison-report` (AC: #4)
  - [ ] 2.1 Créer `supabase/functions/export-comparison-report/index.ts`
  - [ ] 2.2 Générer CSV anonymisé, stocker Storage, retourner lien signé

- [ ] Task 3 — UI comparaison (AC: #1)
  - [ ] 3.1 Créer `apps/web/app/(admin)/dashboard/comparison.tsx`
  - [ ] 3.2 Tableau avec sélection métriques + classement côté client

## Dev Notes

### RPC `get_comparison_report`

```sql
CREATE OR REPLACE FUNCTION get_comparison_report(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ,
  p_metric_keys TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
BEGIN
  IF current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé — rôle admin requis';
  END IF;
  RETURN (
    SELECT jsonb_agg(row_to_json(stats))
    FROM implantation_dashboard_stats stats
    WHERE stats.tenant_id = v_tenant_id
  );
END;
$$;
REVOKE ALL ON FUNCTION get_comparison_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_comparison_report TO authenticated;
```

### Classement côté client

```typescript
// packages/business-logic/src/admin/computeRankings.ts
export function computeRankings(data: ImplantationStat[], metricKey: string) {
  const sorted = [...data].sort((a, b) => (b[metricKey] ?? 0) - (a[metricKey] ?? 0))
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
    isFirst: index === 0,
    isLast: index === sorted.length - 1,
  }))
}
```

### Edge Function `export-comparison-report`

```typescript
// supabase/functions/export-comparison-report/index.ts
// - Appelle get_comparison_report
// - Convertit en CSV (pas de données nominatives)
// - Upload sur Supabase Storage (bucket 'exports', privé)
// - Retourne lien signé 48h
// - Tracé dans audit_logs
```

### Dépendances

- **Prérequis** : Story 9.1 (`implantation_dashboard_stats`) + Story 9.4 (implantations)
- **Consommé par** : Story 10.5 (exports conformes)

### References
- [Source: epics.md#Story-9.3] — lignes 2929–2973

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
