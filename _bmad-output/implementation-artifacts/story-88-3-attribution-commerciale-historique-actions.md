# Story 88.3 — Attribution commerciale — historique d'actions

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.3
- **Story key** : `88-3-attribution-commerciale-historique-actions`
- **Priorité** : P1
- **Dépendances** : Story 88-2 done (tables `club_prospects` + `prospect_contacts` requises)
- **Source** : brainstorming 2026-04-18 idées #11, #12
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (migration 00162 append-only + trigger statut + timeline UI + modale ajout action)

## Story

En tant qu'admin,
je veux que chaque action commerciale sur un prospect soit loguée avec le commercial, la date et le type,
afin de tracer QUI a fait QUOI et décider équitablement de la rémunération.

## Acceptance Criteria

1. Table `prospect_actions` avec : `id`, `club_prospect_id` FK, `performed_by` FK `auth.users`, `action_type` enum `prospect_action_type`, `description` text, `created_at`
2. Enum `prospect_action_type` : `premier_contact`, `relance`, `identification_contact`, `obtention_rdv`, `presentation`, `closing`, `note`, `changement_statut`
3. Trigger DB : chaque UPDATE sur `club_prospects.status` insère automatiquement une action `changement_statut` avec l'ancien et le nouveau statut dans `description`
4. API : `listProspectActions(clubProspectId)`, `addProspectAction(data)`, `listMyActions(filters?)`
5. Composant `ProspectTimeline` dans la fiche prospect : timeline chronologique inversée (récent en haut)
6. Chaque entrée timeline : icône par type + nom commercial + description + date relative (il y a X jours)
7. Bouton "Ajouter une action" dans la fiche prospect avec modale (type + description libre)
8. Vue "Mes actions" pour le commercial : résumé d'activité sur tous ses prospects (nombre d'actions par type, dernières actions)
9. Table append-only : pas d'UPDATE ni DELETE sur `prospect_actions`
10. RLS : admin voit tout le tenant, commercial voit les actions sur ses prospects assignés

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase `00162_create_prospect_actions.sql` (AC: #1, #2, #3, #9, #10)
  - [ ] Enum `prospect_action_type` (8 valeurs)
  - [ ] Table `prospect_actions` : `id` UUID PK, `club_prospect_id` FK `club_prospects`, `performed_by` FK `auth.users`, `action_type` enum, `description` text, `created_at` timestamptz default NOW()
  - [ ] PAS de `updated_at` ni `deleted_at` — table append-only
  - [ ] Index sur `prospect_actions(club_prospect_id, created_at DESC)`
  - [ ] Index sur `prospect_actions(performed_by)`
  - [ ] RLS enable
  - [ ] Policy SELECT : admin = tout tenant (via join club_prospects.tenant_id), commercial = actions sur ses prospects (`club_prospects.assigned_commercial_id = auth.uid()`)
  - [ ] Policy INSERT : commercial peut insérer si `performed_by = auth.uid()` ET prospect assigné à lui
  - [ ] PAS de UPDATE/DELETE policies (append-only)
  - [ ] Trigger function `log_prospect_status_change()` : AFTER UPDATE OF status ON `club_prospects` → INSERT dans `prospect_actions` avec `action_type = 'changement_statut'`, `description = 'Statut: {OLD.status} → {NEW.status}'`, `performed_by` = current user
- [ ] Task 2 — Types TypeScript (AC: #1, #2)
  - [ ] `ProspectActionType` type union dans `enums.ts` + `PROSPECT_ACTION_TYPE_LABELS` + `PROSPECT_ACTION_TYPE_ICONS` maps
  - [ ] `ProspectAction` entity dans `entities.ts` avec `performerDisplayName` optionnel
  - [ ] `CreateProspectActionParams` : `clubProspectId`, `actionType`, `description?`
  - [ ] Exporter dans `index.ts`
- [ ] Task 3 — API client (AC: #4)
  - [ ] Ajouter dans `aureak/packages/api-client/src/admin/prospection.ts` :
  - [ ] `listProspectActions(clubProspectId)` — select + join profiles pour displayName, order by `created_at DESC`
  - [ ] `addProspectAction(params)` — insert avec `performed_by = currentUser.id`
  - [ ] `listMyActions(filters?: { limit?, offset? })` — select where `performed_by = currentUser.id`, order by `created_at DESC`
  - [ ] Snake_case → camelCase mapping explicite
- [ ] Task 4 — Composant ProspectTimeline (AC: #5, #6)
  - [ ] Créer `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectTimeline.tsx`
  - [ ] Timeline verticale : ligne verticale gauche + dots colorés par type d'action
  - [ ] Chaque entrée : icône type | nom commercial | description | date relative
  - [ ] Couleurs par type via `@aureak/theme` tokens
  - [ ] Scroll si > 10 actions
- [ ] Task 5 — Intégrer timeline dans fiche prospect (AC: #5)
  - [ ] Modifier `/developpement/prospection/clubs/[prospectId]/page.tsx` pour afficher `ProspectTimeline`
  - [ ] Section "Historique des actions" sous la section contacts
- [ ] Task 6 — Modale ajout action (AC: #7)
  - [ ] Composant `AddActionModal` — React Hook Form
  - [ ] Select type d'action (enum) + textarea description
  - [ ] Bouton dans la fiche prospect en haut : "Ajouter une action"
- [ ] Task 7 — Vue "Mes actions" (AC: #8)
  - [ ] Section dans la page `/developpement/prospection/clubs` ou composant dédié
  - [ ] Pour les commerciaux : card résumé avec nombre d'actions ce mois + dernières 5 actions
  - [ ] Pour les admins : filtre par commercial

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`
- Snake_case → camelCase : mapping explicite après `select('*')` Supabase

### Architecture
- `prospect_actions` est une table append-only (audit trail). Pas de mise à jour, pas de suppression.
- Le trigger DB garantit que chaque changement de statut est automatiquement logué, même si fait via API directe.
- La timeline est la base pour la décision de rémunération (story 88-4) — chaque commercial voit sa contribution.
- Le trigger doit utiliser `auth.uid()` pour le `performed_by` — attention : dans un trigger AFTER UPDATE, `auth.uid()` retourne l'utilisateur courant (celui qui fait la requête).
- Numéro de migration : `00162` (après 00161 de la story 88-2).

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00162_create_prospect_actions.sql` | CRÉER | Enum + table + trigger + RLS |
| `aureak/packages/types/src/enums.ts` | MODIFIER | Ajouter `ProspectActionType` + labels + icons |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `ProspectAction`, `CreateProspectActionParams` |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter nouveaux types |
| `aureak/packages/api-client/src/admin/prospection.ts` | MODIFIER | Ajouter `listProspectActions`, `addProspectAction`, `listMyActions` |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectTimeline.tsx` | CRÉER | Timeline verticale chronologique |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/AddActionModal.tsx` | CRÉER | Modale ajout action manuelle |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/[prospectId]/page.tsx` | MODIFIER | Intégrer section timeline |

### Fichiers à NE PAS modifier
- `supabase/migrations/00161_create_club_prospects_pipeline.sql` — migration story 88-2
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` — composant story 88-1

### Dépendances
- Story 88-2 done — tables `club_prospects` et `prospect_contacts` doivent exister
- Migration 00161 — FK `club_prospect_id` vers `club_prospects`
- Page fiche prospect `/developpement/prospection/clubs/[prospectId]/page.tsx` — créée en 88-2
