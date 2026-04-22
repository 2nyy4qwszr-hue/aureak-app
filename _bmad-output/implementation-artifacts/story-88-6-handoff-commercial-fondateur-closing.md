# Story 88.6 — Handoff commercial -> fondateur (vue closing)

Status: review

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 88 — Prospection Clubs (CRM)
- **Story ID** : 88.6
- **Story key** : `88-6-handoff-commercial-fondateur-closing`
- **Priorité** : P2
- **Dépendances** : Stories 88-2 + 88-3 done ; 88-4 optionnel
- **Source** : brainstorming 2026-04-18 idées #9, #10
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (pas de nouvelle table — pill filtre + 2 modales + badges statut + notif optionnelle)

## Story

En tant qu'admin/fondateur,
je veux voir une vue filtrée des prospects "prêts pour closing" avec le décisionnaire identifié et le RDV qualifié,
afin de me concentrer sur les deals chauds sans chercher dans tout le pipeline.

## Acceptance Criteria

1. Pill filtre "CLOSING" dans la barre de filtres de `/developpement/prospection/clubs`
2. Ce filtre montre uniquement les prospects avec statut `rdv_qualifie` ou `closing`
3. Chaque prospect dans cette vue affiche : nom club, ville, décisionnaire identifié (nom + rôle), commercial assigné, dernière action (type + date), nombre de contacts
4. Badge visuel gold (`colors.accent.gold`) pour les prospects en statut `closing`
5. Badge visuel orange pour les prospects en statut `rdv_qualifie`
6. Actions rapides inline : bouton "Converti" (vert) et bouton "Perdu" (rouge) sur chaque ligne
7. Clic "Converti" : modale de confirmation avec champ notes + attribution (story 88-4) → met le statut à `converti`
8. Clic "Perdu" : modale de confirmation avec champ "Raison de la perte" obligatoire → met le statut à `perdu`
9. Chaque action (converti/perdu) crée automatiquement une `prospect_action` (via trigger DB story 88-3)
10. Notification au fondateur quand un commercial passe un prospect à `rdv_qualifie` (edge function ou in-app)

## Tasks / Subtasks

- [ ] Task 1 — Filtre closing (AC: #1, #2)
  - [ ] Ajouter pill "CLOSING" dans la `FiltresRow` ou composant de filtres de la page clubs
  - [ ] Filtre : `status IN ('rdv_qualifie', 'closing')`
  - [ ] Le filtre est un toggle (actif/inactif), pas un remplacement de la vue
  - [ ] Compteur sur la pill : nombre de prospects en closing
- [ ] Task 2 — Vue enrichie closing (AC: #3, #4, #5)
  - [ ] Colonnes supplémentaires quand filtre closing actif : DECISIONNAIRE (nom + rôle du contact `is_decisionnaire = true`), DERNIERE ACTION (type + date relative)
  - [ ] Badge statut : `closing` = fond gold (`colors.accent.gold`), `rdv_qualifie` = fond orange
  - [ ] Style : police plus grande ou card distincte pour les prospects closing (attention visuelle accrue)
- [ ] Task 3 — Actions rapides (AC: #6, #7, #8)
  - [ ] Boutons inline "Converti" (vert accent) et "Perdu" (rouge) sur chaque ligne en vue closing
  - [ ] Modale `ConvertProspectModal` : résumé prospect + notes + section attribution (si story 88-4 done, sinon juste notes)
  - [ ] Modale `LostProspectModal` : résumé prospect + champ "Raison de la perte" (required) + notes optionnelles
  - [ ] Appel API `updateClubProspectStatus(id, 'converti')` ou `updateClubProspectStatus(id, 'perdu')`
  - [ ] Le trigger DB story 88-3 logge automatiquement le changement de statut dans `prospect_actions`
- [ ] Task 4 — Notification fondateur (AC: #10)
  - [ ] Option A (simple, recommandée V1) : notification in-app via table `notifications` existante
  - [ ] Quand `club_prospects.status` passe à `rdv_qualifie` : insérer notification pour tous les admins du tenant
  - [ ] Option B (future) : Edge Function email via Resend — hors scope V1
  - [ ] Trigger DB ou logique côté API dans `updateClubProspectStatus`

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`

### Architecture
- Story legere qui ajoute une vue filtree sur la page existante (story 88-2). Pas de nouvelle table.
- Le handoff est implicite : le commercial met le statut a `rdv_qualifie`, le fondateur voit le deal apparaitre dans la vue closing.
- Les actions rapides "Converti" et "Perdu" sont les deux terminaisons du pipeline. Apres, le prospect sort du pipeline actif.
- La notification est la seule partie qui pourrait necessiter une migration (si table `notifications` n'existe pas encore). Verifier avant d'implementer.
- Si story 88-4 est done : la modale "Converti" integre la suggestion d'attribution. Sinon, simple confirmation avec notes.

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/page.tsx` | MODIFIER | Ajouter pill filtre CLOSING + logique filtrage |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ClosingBadge.tsx` | CRÉER | Badge gold/orange par statut |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ConvertProspectModal.tsx` | CRÉER | Modale conversion avec notes |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/LostProspectModal.tsx` | CRÉER | Modale perte avec raison obligatoire |
| `aureak/apps/web/app/(admin)/developpement/prospection/clubs/_components/ProspectTable.tsx` | MODIFIER | Colonnes enrichies en mode closing + boutons actions |
| `aureak/packages/api-client/src/admin/prospection.ts` | MODIFIER | Ajouter logique notification dans updateClubProspectStatus si besoin |
| `supabase/migrations/00165_prospect_closing_notification.sql` | CRÉER (optionnel) | Trigger notification admin quand statut = rdv_qualifie (si table notifications existe) |

### Fichiers à NE PAS modifier
- `supabase/migrations/00161_create_club_prospects_pipeline.sql` — migration story 88-2
- `supabase/migrations/00162_create_prospect_actions.sql` — migration story 88-3
- `aureak/apps/web/app/(admin)/developpement/prospection/_components/ProspectionNavBar.tsx` — pas de nouvel onglet pour cette story

### Dépendances
- Story 88-2 done — table `club_prospects` + page pipeline clubs + `ProspectTable`
- Story 88-3 done — table `prospect_actions` + trigger changement statut (les actions sont auto-loguees)
- Story 88-4 (optionnel) — si done, integrer la modale attribution dans la conversion. Sinon, conversion simple.
