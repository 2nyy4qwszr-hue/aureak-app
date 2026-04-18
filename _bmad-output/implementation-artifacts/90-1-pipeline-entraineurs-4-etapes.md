# Story 90.1 : Pipeline entraineurs 4 etapes

Status: done

## Story

En tant qu'admin ou manager,
je veux un pipeline de prospection entraineurs en 4 etapes,
afin de suivre le recrutement de nouveaux coachs pour l'academie.

## Acceptance Criteria

1. Une table `coach_prospects` existe avec : `id`, `name`, `email`, `phone`, `status` enum (`identified`, `contacted`, `interview`, `recruited`), `experience_years` (int), `diplomas` (text[]), `assigned_manager_id` (FK profiles nullable), `source` (text), `notes` (text), `created_at`, `updated_at`, `deleted_at`, `tenant_id`
2. La route `/prospection/entraineurs` affiche un pipeline Kanban a 4 colonnes (Identifie / Contacte / Entretien / Recrute)
3. Chaque carte affiche : nom, source, diplomes, manager assigne
4. Un formulaire d'ajout permet de creer un prospect entraineur
5. Le statut est modifiable par dropdown sur chaque carte
6. Filtre par manager assigne disponible
7. Layout compatible avec le hub Prospection (ProspectionNavBar)
8. Soft-delete uniquement

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #8)
  - [x] Creer migration pour l'enum `coach_prospect_status` : `identified`, `contacted`, `interview`, `recruited`
  - [x] Creer table `coach_prospects` avec toutes les colonnes
  - [x] RLS : admin et manager peuvent CRUD, coach lecture seule
  - [x] Index sur `status`, `assigned_manager_id`
- [x] Task 2 — Types TypeScript (AC: #1)
  - [x] Ajouter `CoachProspectStatus` enum dans `@aureak/types/enums.ts`
  - [x] Ajouter type `CoachProspect` dans `@aureak/types`
- [x] Task 3 — API client (AC: #3, #4, #5)
  - [x] Creer `aureak/packages/api-client/src/admin/coachProspects.ts`
  - [x] `listCoachProspects(filters?)` — avec filtre par status et manager
  - [x] `createCoachProspect(data)`
  - [x] `updateCoachProspect(id, data)` — incluant changement de statut
  - [x] `deleteCoachProspect(id)` — soft-delete
- [x] Task 4 — Page pipeline (AC: #2, #3, #7)
  - [x] Modifier `aureak/apps/web/app/(admin)/prospection/entraineurs/page.tsx`
  - [x] Vue Kanban 4 colonnes avec cartes
  - [x] Responsive : colonnes empilees sur mobile
- [x] Task 5 — Formulaire ajout (AC: #4)
  - [x] Modal formulaire avec validation Zod
  - [x] Champs : nom, email, phone, source, experience, diplomes, notes, manager
- [x] Task 6 — Interactions (AC: #5, #6)
  - [x] Changement de statut via dropdown sur chaque carte
  - [x] Filtre par manager assigne

## Dev Notes

### Contraintes Stack
Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText, AureakButton, Badge, Card, Input
- **Acces Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards obligatoires** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

### Fichiers a creer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00149_create_coach_prospects.sql` | Cree | Enum + table + RLS + index + trigger |
| `aureak/packages/types/src/enums.ts` | Modifie | CoachProspectStatus + labels |
| `aureak/packages/types/src/entities.ts` | Modifie | CoachProspect, CoachProspectListItem, Create/UpdateParams |
| `aureak/packages/api-client/src/admin/coachProspects.ts` | Cree | CRUD complet |
| `aureak/packages/api-client/src/index.ts` | Modifie | Export des fonctions |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx` | Modifie | Pipeline complet |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachStatCards.tsx` | Cree | 4 stat cards |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachProspectTable.tsx` | Cree | Tableau + dropdown statut inline |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CreateCoachProspectModal.tsx` | Cree | Modale RHF + Zod |

### Dependencies
- Story 88-1 (hub prospection sidebar) doit etre `done`

### Notes techniques
- Le numero de migration (00148) est indicatif — verifier `ls supabase/migrations/ | tail -5` au moment de l'implementation
- Les stories 89-x et 90-x partagent le meme hub prospection (88-1) mais sont independantes entre elles

## Dev Agent Record
### Agent Model Used
claude-opus-4-6
### Debug Log References
### Completion Notes List
- Migration 00149 avec enum `coach_prospect_status` 4 valeurs, table, RLS (admin/commercial CRUD + coach SELECT), index, trigger updated_at
- Types dans entities.ts (CoachProspect + ListItem + Create/Update params) + enums.ts (CoachProspectStatus + labels)
- API client coachProspects.ts : list (filtres status/manager + resolve display names), create, update, updateStatus, delete (soft)
- UI : page avec StatCards (total/entretien/recrutes/nouveaux ce mois), filtres status pills + filtre manager, tableau 7 colonnes avec dropdown statut inline, modale creation RHF+Zod
- Tous les patterns respectes : try/finally, console guards, snake_case mapping, as never pour style arrays, tokens theme
### File List
- supabase/migrations/00149_create_coach_prospects.sql
- aureak/packages/types/src/enums.ts
- aureak/packages/types/src/entities.ts
- aureak/packages/api-client/src/admin/coachProspects.ts
- aureak/packages/api-client/src/index.ts
- aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx
- aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachStatCards.tsx
- aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachProspectTable.tsx
- aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CreateCoachProspectModal.tsx
