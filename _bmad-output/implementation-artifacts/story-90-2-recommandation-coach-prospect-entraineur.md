# Story 90.2 — Recommandation coach → prospect entraîneur

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 90 — Prospection Entraîneurs
- **Story ID** : 90.2
- **Story key** : `90-2-recommandation-coach-prospect-entraineur`
- **Priorité** : P2
- **Dépendances** : Story 90-1 done (table `coach_prospects` + colonne `recommended_by_coach_id` créées)
- **Source** : brainstorming 2026-04-18 idée #26
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (aucune migration — colonne déjà créée en 90-1, API + modale coach + badge UI + notif admin)

## Story

En tant que coach actif de l'académie,
je veux pouvoir recommander un collègue/connaissance comme futur entraîneur de l'académie,
afin de participer au recrutement et de valoriser mon réseau professionnel.

## Acceptance Criteria

1. Le coach accède à une fonctionnalité "Recommander un entraîneur" depuis son dashboard coach (bouton ou card dédiée)
2. Un formulaire modale permet au coach de remplir : prénom, nom, email (optionnel), phone (optionnel), ville, spécialité estimée, contexte/relation (textarea expliquant pourquoi il le recommande)
3. La soumission crée une ligne dans `coach_prospects` avec : `status = 'identifie'`, `recommended_by_coach_id = profile_id_du_coach`, `source = 'recommandation_coach'`, `notes = contexte saisi par le coach`
4. Les champs commerciaux (`assigned_commercial_id`, statut, etc.) restent nuls — un admin/commercial prendra en charge ensuite
5. Une notification in-app est envoyée à tous les admins du tenant : "{coach.prenom} {coach.nom} a recommandé un entraîneur : {prospect.prenom} {prospect.nom}"
6. Dans la fiche détail prospect (page `/prospection/entraineurs/[prospectId]`), un badge "Recommandé par {coach.prenom} {coach.nom}" s'affiche si `recommended_by_coach_id` n'est pas nul
7. Dans le tableau pipeline entraîneurs (page liste), une colonne ou icône indique les prospects recommandés par un coach
8. Le coach peut voir dans son dashboard la liste de ses propres recommandations avec leur statut actuel (RLS : coach voit ses recommandations uniquement via `recommended_by_coach_id = auth.uid()`)
9. API client : `recommendCoachProspect(params)` côté coach (insert limité), `listMyRecommendations()` (SELECT filtré), ajout de `recommendedByCoach` dans la réponse de `getCoachProspect`
10. La policy RLS coach existante (créée en 90-1) permet au coach de voir ses propres recommandations mais PAS de modifier le statut ni les infos commerciales

## Tasks / Subtasks

- [ ] Task 1 — API client coach (AC: #3, #8, #9)
  - [ ] Créer `aureak/packages/api-client/src/coach/recommendations.ts`
  - [ ] `recommendCoachProspect(params: { firstName, lastName, email?, phone?, city, specialite, contextNote })` — insert dans `coach_prospects` avec `status='identifie'`, `recommended_by_coach_id = auth.uid()`, `source='recommandation_coach'`, `notes=contextNote`
  - [ ] `listMyRecommendations()` — SELECT `coach_prospects` filtré RLS (coach voit uniquement ses recommandations)
  - [ ] Exporter dans `index.ts`
- [ ] Task 2 — API client admin — enrichir (AC: #6, #9)
  - [ ] Modifier `listCoachProspects` (story 90-1) : join `profiles` sur `recommended_by_coach_id` pour récupérer `{ firstName, lastName }` du coach parrain
  - [ ] Modifier `getCoachProspect` : même join, retourner `recommendedByCoach: { id, firstName, lastName } | null`
  - [ ] Types : ajouter `CoachProspectWithRecommender = CoachProspect & { recommendedByCoach: CoachMinimal | null }`
- [ ] Task 3 — UI bouton dashboard coach (AC: #1, #2)
  - [ ] Ajouter une card "Recommander un entraîneur" dans `aureak/apps/web/app/(coach)/coach/index.tsx` (ou emplacement équivalent dashboard coach)
  - [ ] Icône + texte descriptif + CTA `Pressable` → ouvre modale
- [ ] Task 4 — Modale formulaire recommandation (AC: #2, #3)
  - [ ] Composant `RecommendCoachProspectModal` dans `aureak/apps/web/components/coach/`
  - [ ] React Hook Form + Zod validation
  - [ ] Champs : prénom, nom (required), email, phone (optionnels), ville (required), spécialité estimée (required), contexte/relation (textarea required, 20-500 chars)
  - [ ] Submit → appel `recommendCoachProspect` + toast succès + fermeture modale
  - [ ] Try/finally sur `setSubmitting` + console guard sur erreurs
- [ ] Task 5 — UI badge fiche prospect (AC: #6)
  - [ ] Modifier `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/[prospectId]/page.tsx` (story 90-1)
  - [ ] Si `recommendedByCoach != null` → afficher badge `colors.accent.gold` + texte "Recommandé par {firstName} {lastName}"
  - [ ] Si note contextuelle saisie (champ `notes` rempli par coach) → section dédiée "Contexte de la recommandation" au-dessus des notes admin
- [ ] Task 6 — UI indicateur tableau pipeline (AC: #7)
  - [ ] Modifier `CoachProspectTable` (story 90-1)
  - [ ] Ajouter icône (ex. 🤝 ou similaire via composant icône du thème) dans la colonne PRÉNOM NOM si `recommendedByCoach != null`
  - [ ] Tooltip au hover : "Recommandé par {firstName} {lastName}"
- [ ] Task 7 — Notification in-app admins (AC: #5)
  - [ ] À la soumission côté coach, créer une notification admin via la table `notifications` (ou `in_app_notifications` selon pattern existant — vérifier `@aureak/api-client/src/notifications.ts`)
  - [ ] Type : `coach_recommendation` (ajouter enum si besoin, sinon utiliser générique)
  - [ ] Cible : tous les users avec rôle `admin` du même tenant
  - [ ] Contenu : "{coach.firstName} {coach.lastName} a recommandé un entraîneur : {prospect.firstName} {prospect.lastName}"
  - [ ] Action : lien vers fiche prospect `/developpement/prospection/entraineurs/[prospectId]`
- [ ] Task 8 — Section "Mes recommandations" dashboard coach (AC: #8)
  - [ ] Composant `MyCoachRecommendations` dans `components/coach/`
  - [ ] Liste compacte : nom prospect, date, statut actuel (badge)
  - [ ] `listMyRecommendations()` au mount
  - [ ] Empty state : "Tu n'as pas encore recommandé d'entraîneur"
  - [ ] Intégrer dans le dashboard coach sous la card "Recommander un entraîneur"

## Dev Notes

### Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens — jamais de couleurs hardcodées
- Try/finally obligatoire sur tout state setter de chargement
- Console guards obligatoires : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Accès Supabase UNIQUEMENT via `@aureak/api-client`
- Snake_case → camelCase : mapping explicite
- Forms : React Hook Form + Zod
- Soft-delete : le coach ne peut pas supprimer une recommandation (pas de UI delete)

### Architecture
- **Aucune migration DB** : la colonne `recommended_by_coach_id` est déjà créée par la migration 00166 (story 90-1).
- Les policies RLS coach existent déjà (créées en 90-1) : coach peut SELECT ses recommandations, ne peut PAS UPDATE. Pour l'INSERT, ajouter une policy spécifique si nécessaire — vérifier dans la migration 90-1 et éventuellement patch via nouvelle migration mineure uniquement si la policy manque.
- Si policy INSERT coach absente en 90-1 → créer migration `00167_coach_recommendation_insert_policy.sql` (1 policy INSERT, rien d'autre).
- Le statut du prospect recommandé démarre à `identifie` (étape 1 du pipeline). L'admin/commercial qualifie ensuite.
- Pas de workflow de validation par admin : la recommandation crée directement un prospect — l'admin peut décider de passer en `perdu` si non pertinent.

### Fichiers à créer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/coach/recommendations.ts` | CRÉER | API coach recommendations |
| `aureak/packages/api-client/src/admin/coach-prospection.ts` | MODIFIER | Enrichir list/get avec join profiles |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Exporter fonctions coach |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter `CoachProspectWithRecommender`, `CoachMinimal` si manquant |
| `aureak/apps/web/components/coach/RecommendCoachProspectModal.tsx` | CRÉER | Modale formulaire coach |
| `aureak/apps/web/components/coach/MyCoachRecommendations.tsx` | CRÉER | Liste recommandations coach |
| `aureak/apps/web/app/(coach)/coach/index.tsx` | MODIFIER | Ajouter card + section recommandations |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/[prospectId]/page.tsx` | MODIFIER | Badge + section contexte |
| `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/_components/CoachProspectTable.tsx` | MODIFIER | Icône recommandation colonne nom |
| `supabase/migrations/00167_coach_recommendation_insert_policy.sql` | CRÉER SI BESOIN | UNIQUEMENT si policy INSERT coach manque en 90-1 |

### Fichiers à NE PAS modifier
- `supabase/migrations/00166_create_coach_prospects_pipeline.sql` — migration 90-1, ne pas toucher rétroactivement
- `aureak/apps/web/app/(admin)/developpement/prospection/entraineurs/page.tsx` — page liste 90-1 (colonnes inchangées sauf ajout icône via `CoachProspectTable`)
- Tables / policies Epic 88 (clubs prospects) — indépendantes

### Dépendances
- Story 90-1 done (table `coach_prospects` + colonne `recommended_by_coach_id` + policies RLS de base)
- Pattern notifications : vérifier `@aureak/api-client/src/notifications.ts` pour l'API existante (créer notif in-app)
- Dashboard coach existant : `aureak/apps/web/app/(coach)/coach/index.tsx` — emplacement pour intégrer les cards

### Notes policy RLS
Avant d'implémenter, vérifier dans `00166_create_coach_prospects_pipeline.sql` qu'il existe bien :
```sql
-- Policy attendue : coach peut INSERT sur ses propres recommandations
CREATE POLICY coach_prospects_insert_own_recommendation ON coach_prospects
  FOR INSERT WITH CHECK (
    recommended_by_coach_id = auth.uid()
    AND status = 'identifie'
    AND tenant_id = current_tenant_id()
  );
```
Si absente → migration 00167 avec cette policy uniquement.

### Notes notifications
Pattern attendu : utiliser la fonction existante `notifyAdmins({ tenantId, type, payload })` de `@aureak/api-client/src/notifications.ts`. Si la fonction n'existe pas sous ce nom exact, explorer le package pour trouver l'équivalent (ex. `createNotification`, `sendInAppNotification`). Ne PAS créer une nouvelle table de notifications — réutiliser l'infra existante.
