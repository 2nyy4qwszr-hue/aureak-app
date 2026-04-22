# Story 88.4 — Règles d'attribution configurables

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.4
- **Story key** : `88-4-regles-attribution-configurables`
- **Priorité** : P2
- **Dépendances** : Stories 88-2 + 88-3 done
- **Source** : brainstorming 2026-04-18 idée #13
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (migration 00163 + CRUD règles + modale conversion avec suggestion attribution)

## Story

En tant qu'admin,
je veux pouvoir configurer des règles d'attribution commerciale (répartition % du crédit entre commerciaux),
afin que les commerciaux connaissent les règles à l'avance et éviter les conflits de rémunération.

## Acceptance Criteria

1. Table `attribution_rules` avec : `id`, `tenant_id` FK, `rule_name` text, `description` text, `conditions` JSONB (ex: `{"min_actions": 3}`), `percentages` JSONB (ex: `{"qualifier": 40, "closer": 60}`), `is_default` boolean, `created_at`, `updated_at`, `deleted_at`
2. Contrainte : un seul `is_default = true` par `tenant_id`
3. Seed de la règle par défaut : "Standard 50/50" — `{"qualifier": 50, "closer": 50}`
4. Page admin `/developpement/prospection/attribution` pour CRUD des règles
5. Liste des règles avec badge "Par défaut" sur la règle active
6. Formulaire création/édition : nom, description, pourcentages (qualifier + closer = 100%)
7. Lors de la conversion d'un prospect (statut → `converti`), modale affichant la répartition suggérée basée sur les actions + la règle par défaut
8. L'admin peut ajuster manuellement les pourcentages avant validation dans la modale de conversion
9. RLS : admin only (lecture + écriture)
10. API : `listAttributionRules`, `createAttributionRule`, `updateAttributionRule`, `deleteAttributionRule`, `suggestAttribution(clubProspectId)`

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase `00163_create_attribution_rules.sql` (AC: #1, #2, #3, #9)
  - [ ] Table `attribution_rules` avec colonnes spécifiées
  - [ ] JSONB pour `conditions` et `percentages`
  - [ ] Partial unique index : `CREATE UNIQUE INDEX ON attribution_rules(tenant_id) WHERE is_default = true AND deleted_at IS NULL`
  - [ ] RLS enable, policies admin only (via JWT role check)
  - [ ] Trigger `updated_at`
  - [ ] Soft-delete
  - [ ] Seed : INSERT règle "Standard 50/50" avec `is_default = true` pour le tenant existant
- [ ] Task 2 — Types TypeScript (AC: #1)
  - [ ] `AttributionRule` entity dans `entities.ts`
  - [ ] `AttributionPercentages` type : `{ qualifier: number, closer: number, [key: string]: number }`
  - [ ] `AttributionSuggestion` type : `{ ruleApplied: AttributionRule, commercials: Array<{ commercialId: string, displayName: string, actionCount: number, suggestedPercentage: number }> }`
  - [ ] `CreateAttributionRuleParams`, `UpdateAttributionRuleParams`
  - [ ] Exporter dans `index.ts`
- [ ] Task 3 — API client (AC: #10)
  - [ ] Ajouter dans `aureak/packages/api-client/src/admin/prospection.ts` ou fichier dédié `attribution.ts` :
  - [ ] `listAttributionRules()` — select order by is_default DESC, rule_name
  - [ ] `createAttributionRule(params)` — insert, gérer le toggle is_default
  - [ ] `updateAttributionRule(id, params)` — update partiel
  - [ ] `deleteAttributionRule(id)` — soft-delete (pas la règle par défaut)
  - [ ] `suggestAttribution(clubProspectId)` — query prospect_actions groupées par performed_by + appliquer la règle par défaut
  - [ ] Snake_case → camelCase mapping explicite
- [ ] Task 4 — UI page attribution (AC: #4, #5, #6)
  - [ ] Page `/developpement/prospection/attribution/page.tsx` + `index.tsx`
  - [ ] Ajouter onglet "ATTRIBUTION" dans `ProspectionNavBar` (4e onglet)
  - [ ] Liste des règles en cards : nom, description, pourcentages, badge "Par défaut"
  - [ ] Bouton "Ajouter une règle"
  - [ ] Actions : éditer, supprimer, définir comme défaut
- [ ] Task 5 — Formulaire règle (AC: #6)
  - [ ] Modale `AttributionRuleModal` — React Hook Form + Zod
  - [ ] Champs : nom, description, pourcentage qualifier (slider ou input), pourcentage closer (calculé = 100 - qualifier)
  - [ ] Validation Zod : qualifier + closer = 100
- [ ] Task 6 — Modale conversion avec attribution (AC: #7, #8)
  - [ ] Modifier le flux de conversion prospect → converti (story 88-2)
  - [ ] Quand statut passe à `converti` : afficher modale avec :
    - [ ] Suggestion automatique (basée sur actions + règle par défaut)
    - [ ] Détail par commercial : nom, nombre d'actions, % suggéré
    - [ ] Inputs ajustables pour chaque %, total doit = 100%
    - [ ] Bouton "Valider la conversion"
  - [ ] Stocker la répartition finale dans `club_prospects` (colonne JSONB `attribution_result` à ajouter si besoin)

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`
- Forms : React Hook Form + Zod pour validation

### Architecture
- Feature avancée mais simplifiable en V1 : les règles prédéfinies (40/60, 50/50, 100/0) couvrent 90% des cas.
- La suggestion automatique est basée sur le nombre et type d'actions par commercial (query `prospect_actions` GROUP BY `performed_by`).
- JSONB pour `percentages` permet d'évoluer vers N commerciaux (pas seulement qualifier/closer).
- Le partial unique index garantit un seul défaut par tenant au niveau DB.
- Numéro de migration : `00163` (après 00162 de story 88-3).

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00163_create_attribution_rules.sql` | CRÉER | Table + index unique + RLS + seed |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `AttributionRule`, `AttributionSuggestion`, params |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/prospection.ts` | MODIFIER | Ajouter CRUD attribution + suggestAttribution |
| `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` | MODIFIER | Ajouter 4e onglet "ATTRIBUTION" |
| `aureak/apps/web/app/(admin)/developpement/prospection/attribution/page.tsx` | CRÉER | Page admin CRUD règles |
| `aureak/apps/web/app/(admin)/developpement/prospection/attribution/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/attribution/_components/AttributionRuleModal.tsx` | CRÉER | Formulaire création/édition règle |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/page.tsx` | MODIFIER | Ajouter modale conversion avec attribution |

### Fichiers à NE PAS modifier
- `supabase/migrations/00161_create_club_prospects_pipeline.sql` — sauf si ajout colonne `attribution_result` JSONB à `club_prospects` (dans ce cas, migration séparée dans 00163)
- `supabase/migrations/00162_create_prospect_actions.sql` — migration story 88-3

### Dépendances
- Story 88-3 done — table `prospect_actions` doit exister pour calculer la suggestion
- Story 88-2 done — table `club_prospects` + page fiche prospect
- Story 88-1 done — `ProspectionNavBar` à modifier (ajout onglet)
