# Story 90.2 : Recommandation coach prospect entraineur

Status: done

## Story

En tant que coach,
je veux pouvoir recommander un entraineur potentiel depuis mon dashboard,
afin de contribuer au recrutement de l'academie.

## Acceptance Criteria

1. Un bouton "Recommander un entraineur" est visible sur le dashboard coach
2. Le bouton ouvre un formulaire simplifie : nom, telephone/email, relation avec le coach, commentaire
3. A la soumission, un `coach_prospect` est cree avec `status = 'identified'` et `source = 'recommendation_coach'`
4. Une notification in-app est envoyee au manager assigne (ou a tous les managers si aucun n'est assigne)
5. Le coach recoit un feedback visuel de confirmation
6. Le coach peut voir la liste de ses recommandations passees

## Tasks / Subtasks

- [x] Task 1 — Bouton dashboard coach (AC: #1)
  - [x] Ajouter un bouton/card "Recommander un entraineur" sur le dashboard coach
  - [x] Icone pertinente (ex: user-plus, share)
- [x] Task 2 — Formulaire recommandation (AC: #2, #3)
  - [x] Modal formulaire simplifie
  - [x] Champs : nom, contact (email ou tel), relation, commentaire
  - [x] Soumission → createCoachProspect avec source = 'recommendation_coach'
  - [x] Try/finally sur setSaving
- [x] Task 3 — Notification manager (AC: #4)
  - [x] Creer notification in-app via le systeme existant (table `notifications` ou equivalent)
  - [x] Message : "[Coach] recommande [Nom] comme entraineur potentiel"
  - [x] Destinataire : manager assigne ou tous les managers
- [x] Task 4 — Feedback et historique (AC: #5, #6)
  - [x] Toast/message de succes apres soumission
  - [x] Section "Mes recommandations" accessible depuis le dashboard coach
  - [x] Liste des prospects recommandes par le coach connecte

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
| `aureak/apps/web/app/(admin)/dashboard/` ou `(coach)/` | Modifier | Bouton recommander |
| `aureak/apps/web/app/(admin)/prospection/entraineurs/components/RecommendCoachForm.tsx` | Creer | Formulaire simplifie |
| `aureak/packages/api-client/src/admin/coachProspects.ts` | Modifier | createRecommendation helper |
| `aureak/packages/api-client/src/notifications.ts` | Modifier | Notification manager |

### Dependencies
- Story 90-1 (pipeline entraineurs) doit etre `done`

### Notes techniques
- Verifier le systeme de notifications in-app existant avant d'implementer — adapter selon la table/le pattern en place
- Le dashboard coach peut etre dans `(coach)/` ou `(admin)/` selon le role — verifier le routing existant

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A
### Completion Notes List
- Migration 00152 : ajout colonne `recommended_by_id` + RLS INSERT pour coaches sur `coach_prospects` et `inapp_notifications`
- Types : `recommendedById` ajouté à `CoachProspect` et `CreateCoachProspectParams`
- API : `createCoachRecommendation`, `listMyRecommendations`, `listAdminUserIds`, `createInAppNotification`
- UI : `RecommendCoachModal` composant + bouton dashboard coach + section "Mes recommandations" + toast succès
- Notifications envoyées à tous les admins du tenant
- QA : try/finally OK, console guards OK, pas de catch silencieux
### File List
- `supabase/migrations/00152_coach_recommendation_support.sql`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/admin/coachProspects.ts`
- `aureak/packages/api-client/src/notifications.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(coach)/coach/dashboard/index.tsx`
- `aureak/apps/web/app/(coach)/coach/dashboard/_components/RecommendCoachModal.tsx`
