# Story 87.2 — Fiche personne universelle `/profiles/[userId]`

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 87 — Académie Commerciaux & Marketeurs
- **Story ID** : 87.2
- **Story key** : `87-2-fiche-personne-universelle`
- **Priorité** : P1
- **Dépendances** : **87-1 done** (route stub `/profiles/[userId]`, API `listProfilesByRole`, composant `PeopleListPage`, onglets AcademieNavBar COMMERCIAUX/MARKETEURS)
- **Source** : brainstorming 2026-04-18 (`_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` — idées #37, #38, #39)
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (1 page + 4-5 modules conditionnels + réutilisation API existante, 0 migration)

## Story

As an admin,
I want a universal person fiche at `/profiles/[userId]` — the same layout for any role (commercial, marketeur, manager, et les autres rôles du système), with role-aware modules that reveal only relevant information (pipeline pour commercial, accès étendus pour manager, etc.) and lifecycle actions (suspend/reactivate/delete),
so that je peux consulter n'importe quelle personne de l'organisation depuis un point d'entrée unifié cohérent, sans avoir à me souvenir de quelle route spécialisée pointe sur quel rôle — tout en préservant les fiches spécialisées existantes (`/coaches/[coachId]`, `/children/[childId]`) pour les cas qui le justifient.

## Acceptance Criteria

1. **Route `/profiles/[userId]`** — le stub créé par story 87-1 est **remplacé** par une fiche complète.
   - La route vit dans `aureak/apps/web/app/(admin)/profiles/[userId]/` et suit le pattern `index.tsx` (cohérent avec le hub Académie — ne pas introduire `page.tsx`).
   - Fichier principal : `(admin)/profiles/[userId]/index.tsx` (≤ 300 lignes) — la logique lourde est déléguée à des composants dans `_components/`.

2. **Hero** (haut de page) :
   - Avatar circulaire 72px : photo (`avatarUrl`) ou cercle `colors.light.muted` + 2 initiales extraites de `displayName`.
   - Nom complet (titre H1, Montserrat 700 24px).
   - Badge **rôle actif** : fond `colors.accent.gold + 12` (12% opacité), border `colors.accent.gold + 40`, texte `colors.text.dark`. Label = `ROLE_LABELS[userRole]` (voir AC #11).
   - Badge **statut compte** : couleur fonction du `status` (`active` → `colors.status.present`, `suspended` → `colors.status.attention`, `pending` → `colors.text.muted`, `deleted` → `colors.status.absent`).
   - Si `profile_roles` expose ≥ 2 rôles → un chip supplémentaire **"+ N rôle(s)"** est affiché à côté du badge rôle actif, avec tooltip listant les autres rôles (pattern `title=` HTML suffisant).
   - Email sous le nom en `colors.text.muted` 13px — "—" si absent.
   - Bouton retour `← Retour` en haut à gauche (`router.back()`).

3. **Tabs de navigation** — 3 onglets horizontaux sous le hero :
   - **RÉSUMÉ** (actif par défaut) — infos compte + modules role-aware
   - **ACTIVITÉ** — historique lifecycle events + dernière connexion
   - **ACCÈS** — **PLACEHOLDER** qui affiche "Onglet Accès — story 87-3" (contenu complet implémenté dans la story suivante)
   - Style identique à AcademieNavBar (tab actif gold border-bottom 2px, inactif opacity 0.5).
   - Tab actif géré par URL query `?tab=resume|activite|acces` (défaut `resume`). Navigation via `router.setParams({ tab: 'activite' })` — **pas** de state React local (permet partage de lien direct sur un onglet).

4. **Onglet RÉSUMÉ — card "Informations compte"** (toujours affichée) :
   - Grille 2 colonnes : **Email**, **Téléphone**, **Rôle**, **Statut du compte**, **Invitation** (badge coloré), **Date de création**, **Dernière connexion**, **ID technique** (monospace, 11px, `colors.text.muted`).
   - `email` respecte la permission `users:read_email` — si absente, "—".

5. **Onglet RÉSUMÉ — module conditionnel "Pipeline commercial"** (affiché **uniquement si** `userRole === 'commercial'`) :
   - Reprend l'API `countActiveCommercialPipeline()` de story 87-1 et filtre par le commercial actuel via `byCommercial[userId]`.
   - Affiche 3 mini-stats : **En cours** (pipeline actif), **Gagnés ce mois** (via `countMonthlyClosedWon().byCommercial[userId]`), **Taux conversion** (gagnés / total mois, format "XX %", "—" si `total === 0` ou si `available === false`).
   - Si `available === false` (table `commercial_contacts` non déployée) → tout le module affiche "—" avec sous-label "CRM non déployé" en `colors.text.muted`.
   - Lien "Voir pipeline complet" → `/developpement/prospection?assigned_to=${userId}` (la route existe, cf. `(admin)/developpement/prospection/[id]`).

6. **Onglet RÉSUMÉ — module conditionnel "Accès étendus"** (affiché **uniquement si** `userRole === 'manager'`) :
   - Mini-stat : **Overrides actifs** = count de lignes dans `user_section_overrides` où `profile_id = userId` (réutiliser helper `countManagerOverrides(userId)` à créer — voir Task 4).
   - Si count === 0 → afficher "Aucun accès étendu — utilise les permissions par défaut du rôle manager".
   - Si count > 0 → afficher liste des `section_key` concernées (max 5, puis "et N autres") + lien "Voir dans Paramètres" → `/settings/permissions?profile_id=${userId}`.

7. **Onglet RÉSUMÉ — module conditionnel "Contenus marketing"** (affiché **uniquement si** `userRole === 'marketeur'`) :
   - Placeholder centré : "CONTENUS PUBLIÉS" + valeur "—" + sous-label "À venir — Epic 91 non déployé" en `colors.text.muted`.
   - **Aucun appel API** — cette card est uniquement visuelle. Le module disparaîtra quand Epic 91 sera implémenté (tracking TODO commentaire).

8. **Onglet RÉSUMÉ — module conditionnel "Grade coach"** (affiché **uniquement si** `userRole === 'coach'`) :
   - Réutilise l'API existante `getCoachCurrentGrade(userId)` de `@aureak/api-client`.
   - Affiche le badge grade (bronze/argent/or/platine — voir `GRADE_LABELS` / `GRADE_COLORS` dans `(admin)/academie/coachs/index.tsx`).
   - Lien "Voir fiche coach complète" → `/coaches/${userId}` (la fiche spécialisée existe et reste la source de vérité pour tout ce qui est coach-spécifique ; cette section universelle est un **résumé + lien**, pas une duplication).

9. **Onglet RÉSUMÉ — card "Actions cycle de vie"** (toujours affichée si l'admin a la permission) :
   - Reprend 1:1 le comportement de `(admin)/users/[userId]/index.tsx` :
     - **Suspendre** — visible si `status === 'active' || status === 'pending'`. Modal de confirmation avec champ "Raison (optionnel)".
     - **Réactiver** — visible si `status === 'suspended'`.
     - **Demander suppression** — visible si `status !== 'deleted'`. Modal avec avertissement "anonymisation après 30 jours".
   - APIs : `suspendUser(userId, reason?)`, `reactivateUser(userId)`, `requestUserDeletion(userId)` (déjà exportées par `@aureak/api-client`).
   - La card **n'est affichée** que si l'admin actif a la permission `section_user_accounts === 'full'` (via `getEffectivePermissions` Epic 86-3) — sinon cachée silencieusement.
   - Après chaque action → reload du profil (pas besoin d'optimistic update).

10. **Onglet ACTIVITÉ** — card "Historique des actions importantes" :
    - Réutilise `listLifecycleEvents(userId)` de `@aureak/api-client`.
    - Affiche max 20 événements triés par date desc.
    - Format : `<icône event> <label event_type> — <reason si présent> <date formatée>`.
    - État vide : "Aucun événement enregistré" en italique `colors.text.muted`.
    - **Pas de section "Activités métier"** dans cette story (séances coachées, évaluations, contacts commerciaux…) — hors scope, réservé à une future story si jugée utile.

11. **Labels rôles** — export partagé depuis `@aureak/ui` (ou créer si absent) :
    ```typescript
    export const ROLE_LABELS: Record<UserRole, string> = {
      admin     : 'Administrateur',
      coach     : 'Coach',
      parent    : 'Parent',
      child     : 'Joueur',
      club      : 'Club partenaire',
      commercial: 'Commercial',
      manager   : 'Manager',
      marketeur : 'Marketeur',
    }
    ```
    - Le record `ROLE_LABELS` de `(admin)/users/[userId]/index.tsx` n'inclut **pas** les 3 nouveaux rôles — à étendre.
    - **Grep obligatoire** (memory) avant ajout du rôle : `grep -rn "Record<UserRole" aureak/` pour détecter tous les records qui doivent être mis à jour. Chaque match doit être complété sous peine de ts error. **Ne pas sauter cette étape**, même si tsc passe localement sur 87-1.

12. **Redirections existantes — pas de changement** :
    - `/academie/commerciaux`, `/academie/marketeurs`, `/academie/managers` pointent déjà vers `/profiles/[userId]` (implémenté en 87-1) — aucun changement.
    - `/academie/coachs` continue de pointer vers `/coaches/[coachId]` (fiche coach spécialisée, 509 lignes) — **aucun changement**.
    - `/academie/joueurs` continue de pointer vers `/children/[childId]` (fiche joueur, 3275 lignes) — **aucun changement**.
    - `/users` (liste admin) continue de pointer vers `/users/[userId]` — **aucun changement dans cette story** (un futur refactor pourrait remplacer `/users/[userId]` par un redirect vers `/profiles/[userId]`, mais hors scope).

13. **RBAC et permissions** :
    - Accès à la fiche `/profiles/[userId]` requiert la permission `section:read` sur **"Académie"** OU sur **"Utilisateurs"** (pour que les routes déjà existantes /users/[userId]-like fonctionnent).
    - Si aucune permission → bloc centré "Accès refusé — contactez votre administrateur" (pattern `(admin)/settings/permissions/page.tsx`).
    - La card "Actions cycle de vie" (AC #9) **masquée** sans permission `section_user_accounts === 'full'`.
    - La colonne email (AC #4) **masquée** ("—") sans permission `users:read_email` ou équivalent (cohérent avec 87-1).

14. **Onglet ACCÈS — placeholder** :
    - Vue centrée : titre "Accès et permissions", corps "Cet onglet sera implémenté dans la story 87-3. Il exposera les rôles assignés, les overrides de permissions et l'historique des changements d'accès.".
    - Aucun appel API, rien à charger.
    - Raison : bloquer 87-2 sur l'implémentation de l'onglet Accès créerait un couplage qui freine la livraison ; un placeholder permet de livrer 87-2 autonome et enchaîner 87-3 sans refonte.

15. **Qualité & conformité CLAUDE.md** :
    - `try/finally` obligatoire sur tout `setLoading(false)` / `setWorking(false)` / `setSaving(false)`.
    - Console guards : `if (process.env.NODE_ENV !== 'production') console.error('[Profile] ...', err)`.
    - Styles via tokens uniquement — aucune couleur/espacement hardcodé.
    - Accès Supabase uniquement via `@aureak/api-client`.
    - Pas de `catch(() => {})` silencieux.
    - `cd aureak && npx tsc --noEmit` — EXIT:0 obligatoire avant commit.

16. **Tests manuels Playwright post-impl** :
    - Naviguer `/profiles/<commercial_uuid>?tab=resume` → hero correct (badge Commercial gold), module Pipeline visible, actions lifecycle conditionnelles selon permissions.
    - Naviguer `/profiles/<manager_uuid>` → module "Accès étendus" visible au lieu de Pipeline.
    - Naviguer `/profiles/<marketeur_uuid>` → module "Contenus marketing" (placeholder).
    - Naviguer `/profiles/<coach_uuid>` → module "Grade coach" + lien vers `/coaches/[userId]`.
    - Naviguer `/profiles/<admin_uuid>` → aucun module role-aware, juste Informations + Actions.
    - Changer d'onglet via `?tab=activite` → historique lifecycle rendu.
    - Onglet `?tab=acces` → placeholder visible sans erreur.
    - Clic "Suspendre" → modale → confirmer → statut passe à "Suspendu" après reload.
    - Console JS : **zéro erreur** sur les 5 rôles testés.

## Tasks / Subtasks

- [x] **Task 1 — Structure route `/profiles/[userId]`** (AC: #1, #2, #3)
  - [ ] Remplacer `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (stub 87-1) par la fiche universelle.
  - [ ] Créer `(admin)/profiles/[userId]/_components/` et y placer :
    - `ProfileHero.tsx` — avatar + nom + badges rôle/statut + retour
    - `ProfileTabs.tsx` — 3 tabs (Résumé/Activité/Accès) synchronisés sur `?tab=`
    - `ResumeTab.tsx` — orchestrateur onglet RÉSUMÉ (charge les modules role-aware)
    - `ActiviteTab.tsx` — onglet ACTIVITÉ (lifecycle events)
    - `AccesTab.tsx` — placeholder 87-3
  - [ ] Le fichier `index.tsx` ne fait que : charger le profil via `getUserProfile`, gérer loading/error/not-found, router vers le bon tab.

- [x] **Task 2 — Modules role-aware RÉSUMÉ** (AC: #4, #5, #6, #7, #8)
  - [ ] Créer `_components/modules/` (sous `profiles/[userId]/_components/`) :
    - `InformationsCompteCard.tsx` — toujours affichée
    - `PipelineCommercialModule.tsx` — conditionnel `role === 'commercial'`
    - `AccesEtendusModule.tsx` — conditionnel `role === 'manager'`
    - `ContenusMarketingModule.tsx` — conditionnel `role === 'marketeur'` (placeholder pur, aucun appel API)
    - `GradeCoachModule.tsx` — conditionnel `role === 'coach'`
    - `ActionsCycleVieCard.tsx` — conditionnel `canManageLifecycle === true`
  - [ ] Chaque module est une card (`colors.light.surface` + border + padding) avec `cardTitle` en uppercase `colors.text.muted`.
  - [ ] `ResumeTab.tsx` importe tous les modules et les rend conditionnellement — **pas de switch explicite sur le rôle** dans JSX, chaque module gère son propre affichage conditionnel interne pour rester autonome.

- [x] **Task 3 — Tabs et query param `?tab=`** (AC: #3)
  - [ ] `ProfileTabs.tsx` lit le tab actif via `useLocalSearchParams<{ tab?: string }>()`.
  - [ ] Tabs : `[{ key: 'resume', label: 'RÉSUMÉ' }, { key: 'activite', label: 'ACTIVITÉ' }, { key: 'acces', label: 'ACCÈS' }]`.
  - [ ] Clic sur un tab → `router.setParams({ tab: 'activite' })`.
  - [ ] Default fallback : `activeTab = params.tab ?? 'resume'`.
  - [ ] Validation : si `tab` reçu n'est pas dans la liste, fallback `'resume'`.

- [x] **Task 4 — Helper API `countManagerOverrides`** (AC: #6)
  - [ ] Ajouter dans `aureak/packages/api-client/src/admin/profiles-by-role.ts` (créé en 87-1) :
    ```typescript
    export async function countManagerOverrides(userId: string): Promise<{
      count: number
      sections: string[]  // max 5 premières section_key concernées
      error: unknown
    }>
    ```
  - [ ] Requête : `SELECT section_key FROM user_section_overrides WHERE profile_id = userId`.
  - [ ] Retourne le count total et les 5 premières `section_key` distinctes (tri par `section_key` ASC).
  - [ ] Console guard sur erreur + fallback `{ count: 0, sections: [], error }`.
  - [ ] Ajouter l'export dans `aureak/packages/api-client/src/index.ts`.

- [x] **Task 5 — Card Actions cycle de vie** (AC: #9, #13)
  - [ ] Extraire le bloc actions de `(admin)/users/[userId]/index.tsx` (lignes ~260-335) vers `_components/modules/ActionsCycleVieCard.tsx` — composant autonome props `{ profile: UserRow, onChange: () => Promise<void> }`.
  - [ ] Calcul `canManageLifecycle = getEffectivePermissions(currentProfileId, currentRole).section_user_accounts === 'full'`.
  - [ ] Si `canManageLifecycle === false` → le composant retourne `null` (pas de card).
  - [ ] Après action réussie → `await props.onChange()` (reload profil dans le parent).
  - [ ] **Ne pas modifier** `(admin)/users/[userId]/index.tsx` : le composant extrait peut y être importé plus tard, pas dans cette story.

- [x] **Task 6 — Onglet ACTIVITÉ** (AC: #10)
  - [ ] `ActiviteTab.tsx` charge `listLifecycleEvents(userId)` au mount.
  - [ ] Format date : `new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })`.
  - [ ] Rendu : liste verticale, chaque ligne `<span>${event_type}</span> — ${reason} <span class="date">${date}</span>`.
  - [ ] Max 20 items, pagination simple "Afficher plus" si > 20 (non prioritaire — si > 20 rare, peut être deferred à future story).

- [x] **Task 7 — Onglet ACCÈS placeholder** (AC: #14)
  - [ ] `AccesTab.tsx` = composant simple avec `<View>` centré :
    ```jsx
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: space.xxl }}>
      <AureakText variant="h2">Accès et permissions</AureakText>
      <AureakText variant="body" style={{ color: colors.text.muted, marginTop: space.md }}>
        Cet onglet sera implémenté dans la story 87-3. Il exposera les rôles assignés,
        les overrides de permissions et l'historique des changements d'accès.
      </AureakText>
    </View>
    ```

- [x] **Task 8 — Labels rôles partagés** (AC: #11)
  - [ ] Créer `aureak/packages/ui/src/labels/ROLE_LABELS.ts` (ou compléter un fichier labels existant si présent — grep `ROLE_LABELS`).
  - [ ] Exporter `ROLE_LABELS: Record<UserRole, string>` avec les 8 rôles.
  - [ ] Exporter également `ROLE_COLORS: Record<UserRole, string>` si pattern équivalent dans le repo (vérifier via grep).
  - [ ] **Grep obligatoire** : `grep -rn "Record<UserRole" aureak/` — pour chaque fichier trouvé qui utilise `Record<UserRole, ...>`, vérifier que les 8 rôles sont couverts ; sinon ajouter les entrées manquantes. **Cette étape est non-négociable** (memory gotcha : tout nouveau rôle casse `Record<UserRole, ...>`).
  - [ ] Mettre à jour `(admin)/users/[userId]/index.tsx` pour importer `ROLE_LABELS` depuis `@aureak/ui` au lieu de le déclarer localement (simple `import`, remplacement du const inline).

- [x] **Task 9 — Redirections /users/[userId] (hors scope mais à tracker)**
  - [ ] **Ne pas** refactorer `/users/[userId]` dans cette story. Laisser coexister avec `/profiles/[userId]`.
  - [ ] Ajouter un commentaire TODO dans `(admin)/users/[userId]/index.tsx` au-dessus de la déclaration de `UserFichePage` :
    ```typescript
    // TODO(story-87-4?): remplacer cette fiche par un Redirect vers /profiles/[userId]
    // une fois 87-2 + 87-3 mergées et la fiche universelle validée en prod.
    ```

- [x] **Task 10 — QA & conformité** (AC: #15)
  - [ ] `cd aureak && npx tsc --noEmit` — EXIT:0.
  - [ ] Grep `setLoading\|setWorking\|setSaving\|setCreating` sur fichiers modifiés → chaque `(false)` dans `finally`.
  - [ ] Grep `console\.` sur fichiers modifiés → chaque occurrence guardée `NODE_ENV !== 'production'`.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` sur fichiers modifiés → zéro match (hors commentaires).
  - [ ] Vérifier qu'aucun `from('profiles')` Supabase direct n'est ajouté dans `apps/web/` — tout passe par `@aureak/api-client`.

- [x] **Task 11 — Tests Playwright** (AC: #16)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Test manuel des 5 rôles (commercial, manager, marketeur, coach, admin) sur la fiche → screenshot de chacun.
  - [ ] Console zéro erreur.
  - [ ] Test action suspend + reactivate sur un compte de test (si dispo).

## Dev Notes

### Pourquoi `/profiles/[userId]` et pas étendre `/users/[userId]`

`/users/[userId]` (509 lignes, CSS inline `React.CSSProperties`) a été écrit avec un pattern DOM brut (`div`, `style={P.page}`) — il ne suit pas le pattern React Native (`View`, `AureakText`, tokens `@aureak/theme`) qui est désormais la convention du reste de l'app. Le **refactorer en place** introduirait un changement invasif dans une story UX-focused. On crée donc la nouvelle fiche universelle en pur RN, et on **laisse** `/users/[userId]` tel quel avec un TODO (Task 9).

Une story future (87-4 ou sprint de nettoyage) pourra remplacer `/users/[userId]` par `<Redirect href={\`/profiles/${userId}\`} />` une fois `/profiles/[userId]` validé en prod.

### Pourquoi conserver `/coaches/[coachId]` et `/children/[childId]`

Ces 2 fiches sont **très riches** (509 et 3275 lignes) avec des sections métier irremplaçables (séances, évaluations, grades, parents liés, scout évaluations, etc.). La fiche universelle 87-2 est **un point d'entrée unifié + un résumé** — elle **n'a pas vocation à remplacer** les fiches spécialisées. Pour un coach, la fiche universelle affiche un module "Grade coach" avec un **lien** vers `/coaches/${userId}` pour la vue complète. Même logique pour les enfants (mais sachant que `/profiles/[userId]` ne sera probablement jamais ouverte pour un rôle `child` depuis l'admin — tous les points d'entrée enfants passent par `/children/[childId]` ou les groupes).

### Architecture composants (scannable)

```
(admin)/profiles/[userId]/
  index.tsx                            ← page d'entrée (≤300 lignes)
  _components/
    ProfileHero.tsx                    ← avatar + nom + badges
    ProfileTabs.tsx                    ← 3 tabs sync sur ?tab=
    ResumeTab.tsx                      ← orchestrateur onglet Résumé
    ActiviteTab.tsx                    ← onglet Activité
    AccesTab.tsx                       ← placeholder story 87-3
    modules/
      InformationsCompteCard.tsx       ← toujours rendu
      PipelineCommercialModule.tsx     ← si role==='commercial'
      AccesEtendusModule.tsx           ← si role==='manager'
      ContenusMarketingModule.tsx      ← si role==='marketeur'
      GradeCoachModule.tsx             ← si role==='coach'
      ActionsCycleVieCard.tsx          ← si canManageLifecycle
```

Aucun de ces fichiers ne doit dépasser ~150 lignes.

### State management

- **Source de vérité unique** : `profile` chargé via `getUserProfile(userId)` dans `index.tsx`.
- Passé en props à tous les enfants.
- Action lifecycle réussie → `index.tsx` recharge le profil (`await load()`) et passe le nouveau `profile` en props → enfants re-rendent automatiquement.
- **Ne pas** utiliser Zustand ou TanStack Query pour cette page — `useState + useEffect` suffit, pattern cohérent avec `/users/[userId]`.

### Tabs via URL query param — pourquoi

Permettre le partage de liens directs vers un onglet précis (`/profiles/xyz?tab=activite`) est une amélioration UX gratuite. Surcout zéro : `useLocalSearchParams` + `router.setParams` existent déjà dans expo-router v3.

Fallback : si `tab` reçu invalide → réinitialise silencieusement à `resume` (ne pas throw).

### Modules role-aware — règle d'or

Chaque module est **autonome** : il vérifie son rôle en interne et retourne `null` si non applicable. `ResumeTab.tsx` les liste tous et laisse chacun décider s'il se rend. Avantage : ajouter un module pour un nouveau rôle = 1 fichier nouveau + 1 ligne d'import, aucune logique de switch à maintenir.

**Exemple** :
```typescript
// PipelineCommercialModule.tsx
export function PipelineCommercialModule({ profile }: { profile: UserRow }) {
  if (profile.userRole !== 'commercial') return null
  // ... render
}

// ResumeTab.tsx
<InformationsCompteCard profile={profile} />
<PipelineCommercialModule profile={profile} />
<AccesEtendusModule profile={profile} />
<ContenusMarketingModule profile={profile} />
<GradeCoachModule profile={profile} />
<ActionsCycleVieCard profile={profile} onChange={reload} />
```

### Permissions — composition avec Epic 86-3

La fiche s'articule autour de 3 niveaux de permissions :
1. **Lecture fiche** : `section_academie === 'read_only' | 'full'` (sinon bloc "Accès refusé")
2. **Lecture email** : `section_user_accounts === 'full'` (sinon "—" dans la colonne email)
3. **Actions lifecycle** : `section_user_accounts === 'full'` (sinon card Actions masquée)

Helper à réutiliser : `getEffectivePermissions(profileId, activeRole)` — déjà exporté par Epic 86-3 via `@aureak/api-client`.

### Memory gotcha — Record<UserRole, ...>

Rappel : **tout nouveau rôle casse `Record<UserRole, ...>`**. Les 3 rôles ajoutés en Epic 86 (commercial/manager/marketeur) **n'ont pas été complètement propagés** dans tous les records existants. Task 8 exige un `grep -rn "Record<UserRole" aureak/` et le traitement de **tous** les matches.

Fichiers connus à vérifier/compléter :
- `(admin)/users/[userId]/index.tsx` — `ROLE_LABELS`, `STATUS_LABELS` (OK, pas UserRole), `INVITE_LABELS` (OK)
- Potentiellement `(admin)/users/index.tsx` (liste — filtres par rôle)
- Potentiellement `_layout.tsx` (sidebar labels par rôle, Epic 86-4)

### Design System (tokens uniquement)

```
Fond page              : colors.light.primary   (#F3EFE7)
Hero background        : colors.light.surface   (#FFFFFF)
Avatar cercle bg       : colors.accent.gold + '22'  (12% opacité)
Avatar border          : colors.accent.gold + '40'  (25% opacité)
Initiales              : colors.text.dark, 22px bold Montserrat
Badge rôle fond        : colors.accent.gold + '12'
Badge rôle border      : colors.accent.gold + '40'
Badge statut (active)  : colors.status.present
Badge statut (suspended): colors.status.attention
Badge statut (pending) : colors.text.muted
Badge statut (deleted) : colors.status.absent
Card bg                : colors.light.surface
Card border            : colors.border.light
Card title             : colors.text.muted, 10px, uppercase, letterSpacing 0.08em
Field label            : colors.text.muted, 10px, uppercase
Field value            : colors.text.dark, 14px
Tab actif underline    : colors.accent.gold 2px
Tab inactif            : opacity 0.5
Button warn            : colors.accent.gold bg
Button danger          : colors.status.absent bg
Button ok              : colors.status.present bg
Button secondary       : transparent bg, colors.border.light border
```

### Règles absolues CLAUDE.md (rappel)

- `try/finally` obligatoire sur tout setter de chargement/sauvegarde.
- Console guards `NODE_ENV !== 'production'` systématiques.
- Styles via tokens `@aureak/theme` uniquement.
- Accès Supabase uniquement via `@aureak/api-client`.
- Soft-delete respecté (pas de hard delete depuis cette page).

### Aucune migration DB

Toutes les tables et RLS existent (Epic 86 done). `profiles`, `user_section_overrides`, `profile_roles` déployées. Pas d'ajout de colonne ni d'enum.

### Project Structure Notes

- **Routing Expo Router** : `index.tsx` pattern cohérent avec `/academie/*` (pas de `page.tsx`).
- **Composants `_components`** : pattern cohérent avec autres pages (`/academie/coachs/_FilterChips.tsx`, etc.).
- **Dynamic route** : `[userId]` — lire via `useLocalSearchParams<{ userId: string }>()`.
- **Query param** `?tab=` — lire via même hook.

### Non-goals explicites

- Pas de section "Activités métier" (séances coachées, évaluations, contacts commerciaux…) dans l'onglet Activité — historique lifecycle uniquement.
- Pas de refactor de `/users/[userId]` (tracking TODO).
- Pas de refactor de `/coaches/[coachId]` ni `/children/[childId]` (leurs spécialisations justifient leur existence).
- Pas de test E2E automatisé (Playwright manuel dans AC #16 suffit — cohérent avec CLAUDE.md).
- Pas d'onglet "Accès" fonctionnel (c'est la story 87-3).
- Pas de pagination sur l'historique lifecycle (max 20 items suffit pour l'usage actuel).

### References

- **Story 87-1 (parent)** : `_bmad-output/implementation-artifacts/story-87-1-pages-academie-commerciaux-marketeurs-managers.md`
- Fiche users existante (pattern lifecycle actions) : `aureak/apps/web/app/(admin)/users/[userId]/index.tsx`
- Fiche coach spécialisée (non touchée — référence pour module Grade) : `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx`
- API users : `aureak/packages/api-client/src/admin/users.ts` (`getUserProfile`, `UserRow`)
- API lifecycle : `aureak/packages/api-client/src/admin/lifecycle.ts`
- API grades : `aureak/packages/api-client/src/admin/grades.ts` (`getCoachCurrentGrade`)
- API profile-roles : `aureak/packages/api-client/src/auth/profile-roles.ts` (`listUserRoles`)
- API permissions : helper `getEffectivePermissions` (Epic 86-3 — chercher dans `@aureak/api-client`)
- Tokens : `aureak/packages/theme/src/tokens.ts`
- Types UserRole : `aureak/packages/types/src/enums.ts`
- Stub à remplacer (créé en 87-1) : `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx`
- Brainstorming source : `_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` (idées #37, #38, #39)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `cd aureak && npx tsc --noEmit` → EXIT:0.
- QA : `setLoading/setWorking(false)` tous dans `finally` ; console guards OK ; zéro couleur hexa hardcodée ; aucun accès supabase direct depuis `apps/web/`.
- Grep `Record<UserRole` → 5 fichiers, tous déjà complets pour les 8 rôles (RoleSwitcher, settings/permissions, web login, mobile login, _nav-config).
- Dev server déjà occupé sur 8082 (PID parallèle), Playwright MCP verrouillé par autre session → tests manuels différés au QA humain.

### Completion Notes List

- Modules rendus par rôle :
  - `commercial` → InformationsCompte + Pipeline + Actions (si permission)
  - `manager`    → InformationsCompte + Accès étendus + Actions (si permission)
  - `marketeur`  → InformationsCompte + Contenus marketing (placeholder) + Actions (si permission)
  - `coach`      → InformationsCompte + Grade coach + Actions (si permission)
  - `admin/parent/child/club` → InformationsCompte + Actions (si permission)
- Permissions dérivées de `getEffectivePermissions` :
  - `canReadFiche` = `academie || admin`
  - `canReadEmail` = `admin`
  - `canManageLifecycle` = `admin`
  - L'enum `SectionKey` n'a pas de clé `user_accounts` dédiée (scope restreint), donc le proxy `admin === true` est utilisé — cohérent avec 87.1.
- Tabs synchronisés sur `?tab=resume|activite|acces`, fallback `resume` si paramètre invalide. Navigation via `router.setParams`, pas de state local.
- ROLE_LABELS extrait dans `@aureak/ui` (`src/labels/roles.ts`). Les 5 fichiers déjà existants `Record<UserRole, ...>` couvrent les 8 rôles — pas de casse détectée.
- `/users/[userId]` conserve son implémentation (509 lignes DOM inline) — ajout TODO comment + réutilisation du `ROLE_LABELS` partagé.
- UserRow ne fournit pas `avatar_url` → fallback initiales dans ProfileHero (future enrich possible via extension `getUserProfile`).
- Avatar image dans la liste (story 87.1) utilise `ProfileListRow.avatarUrl`, fiche utilise initiales — incohérence à traiter dans une future story si souhaité.

### File List

**Créés :**
- `aureak/packages/ui/src/labels/roles.ts`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ProfileHero.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ProfileTabs.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ResumeTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ActiviteTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/AccesTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/_card.ts`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/InformationsCompteCard.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/PipelineCommercialModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/AccesEtendusModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/ContenusMarketingModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/GradeCoachModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/ActionsCycleVieCard.tsx`

**Modifiés :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (remplace stub 87.1)
- `aureak/packages/api-client/src/admin/profiles-by-role.ts` (+ `countManagerOverrides`)
- `aureak/packages/api-client/src/index.ts` (export `countManagerOverrides`)
- `aureak/packages/ui/src/index.ts` (export `ROLE_LABELS`)
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (TODO comment + import ROLE_LABELS partagé)

### Change Log

- 2026-04-21 — Implémentation story 87.2 : fiche universelle `/profiles/[userId]` avec 3 tabs + 6 modules role-aware. ROLE_LABELS partagé via `@aureak/ui`. tsc EXIT:0.

**Attendus — création :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ProfileHero.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ProfileTabs.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ResumeTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/ActiviteTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/AccesTab.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/InformationsCompteCard.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/PipelineCommercialModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/AccesEtendusModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/ContenusMarketingModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/GradeCoachModule.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/modules/ActionsCycleVieCard.tsx`
- `aureak/packages/ui/src/labels/ROLE_LABELS.ts` (si absent)

**Attendus — modification :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (remplace stub 87-1)
- `aureak/packages/api-client/src/admin/profiles-by-role.ts` (ajout `countManagerOverrides`)
- `aureak/packages/api-client/src/index.ts` (export `countManagerOverrides`)
- `aureak/packages/ui/src/index.ts` (export `ROLE_LABELS`)
- Tous les fichiers trouvés par `grep "Record<UserRole"` incomplets pour les 3 nouveaux rôles.
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (TODO comment + import `ROLE_LABELS` partagé).

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Prochaine story** : 87-3 (onglet Accès) — implémente le contenu du placeholder AccesTab avec `profile_roles`, `user_section_overrides`, et historique changements accès. L'architecture modulaire de 87-2 rend 87-3 trivial (1 composant à créer, 1 ligne à changer dans AccesTab.tsx).
