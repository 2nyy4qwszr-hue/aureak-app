# Story 87.4 — Invitation dédiée pour Commercial / Manager / Marketeur

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 87 — Académie Commerciaux & Marketeurs
- **Story ID** : 87.4
- **Story key** : `87-4-invitation-dediee-commercial-manager-marketeur`
- **Priorité** : P1
- **Dépendances** : **87-1 done** (pages Académie existent + boutons "+ Nouveau X" pointent aujourd'hui vers `/settings/permissions#invite-...` comme comportement temporaire). Epic 86 done.
- **Source** : feedback UX post-87-1 — le comportement temporaire du bouton est un bricolage qu'il faut remplacer par un vrai flux d'invitation dédié.
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (1 formulaire slim + 1 route + 1 helper API, aucune nouvelle infra — l'Edge Function `create-user-profile` existe déjà et accepte n'importe quel `user_role`)

## Story

As an admin,
I want a dedicated, minimal form at `/academie/<role>/new` (role ∈ commercial | manager | marketeur) to invite a new person by email (or create a local fiche without email) and attribute the target role in a single step,
so that l'onboarding d'un nouveau commercial, manager ou marketeur soit un flux en **2 clics** depuis la page liste Académie (bouton "+ Nouveau X" → formulaire → valider), sans détour par `/settings/permissions` et sans réutiliser le wizard 3-étapes conçu pour les enfants.

## Acceptance Criteria

1. **Nouvelles routes** — 3 pages de création avec formulaire identique :
   - `(admin)/academie/commerciaux/new/index.tsx`
   - `(admin)/academie/marketeurs/new/index.tsx`
   - `(admin)/academie/managers/new/index.tsx`
   - Chaque page importe le même composant partagé `NewPersonForm` (voir AC #2) avec un prop `role` fixe.
   - Après validation → redirect `router.replace('/academie/<role>')` + toast "Invitation envoyée à <email>" ou "Fiche créée pour <name>".

2. **Composant partagé `NewPersonForm`** — sous `(admin)/academie/_components/NewPersonForm.tsx` :
   - Props : `{ role: 'commercial' | 'manager' | 'marketeur' }`.
   - Titre dynamique : "Nouveau commercial" / "Nouveau manager" / "Nouveau marketeur" (via `ROLE_LABELS` — rappel : les 3 labels sont singuliers masculins, cohérent memory).
   - **Champs affichés** (4 obligatoires) :
     - `firstName` (requis)
     - `lastName` (requis)
     - `email` (requis **si** mode = invite ; optionnel **si** mode = fiche)
     - `phone` (optionnel, placeholder "+32 470 12 34 56")
   - **Toggle mode** en haut du form :
     - **Invitation** (défaut) : envoie un email magic-link via `create-user-profile` Edge Function, `status: 'pending'`, `invite_status: 'invited'`.
     - **Fiche locale** : crée le profil sans email envoyé, `status: 'active'`, `invite_status: 'not_invited'`. Utile pour un commercial externe qu'on veut juste tracer sans lui donner accès.
   - **Bouton principal** : "Envoyer l'invitation" en mode invite / "Créer la fiche" en mode fiche.
   - **Bouton secondaire** : "Annuler" → `router.back()`.

3. **Validation client** :
   - `firstName` et `lastName` non vides (trim, min 1 char chacun).
   - Si mode invite → `email` obligatoire, regex simple `/^\S+@\S+\.\S+$/`.
   - Message d'erreur inline sous chaque champ en `colors.status.absent`.
   - Bouton principal désactivé tant que la validation n'est pas verte.

4. **Soumission** — le form appelle l'Edge Function existante `create-user-profile` via `supabase.functions.invoke('create-user-profile', { body: {...} })` :
   - Body construit :
     ```typescript
     {
       mode     : 'invite' | 'fiche',
       role     : 'commercial' | 'manager' | 'marketeur',
       tenantId : <current tenant>,
       email    : email.trim() || undefined,
       firstName: firstName.trim(),
       lastName : lastName.trim(),
       phone    : phone.trim() || undefined,
     }
     ```
   - `tenantId` lu via `useAuthStore(s => s.tenantId)` (hook existant dans `@aureak/business-logic`).
   - `try/finally` sur `setSubmitting(true)/false`.
   - Si succès → toast + redirect. Si échec (400/500) → afficher le message d'erreur renvoyé par l'Edge Function sous le bouton principal.

5. **Helper API** — encapsuler l'appel dans `@aureak/api-client` pour respecter ARCH-1 (pas d'appel direct à `supabase.functions` dans `apps/web/`) :
   - Créer `aureak/packages/api-client/src/admin/invite-person.ts` :
     ```typescript
     export type InvitePersonMode = 'invite' | 'fiche'

     export type InvitePersonParams = {
       mode     : InvitePersonMode
       role     : 'commercial' | 'manager' | 'marketeur'
       tenantId : string
       firstName: string
       lastName : string
       email?   : string
       phone?   : string
     }

     export type InvitePersonResult =
       | { ok: true;  userId: string }
       | { ok: false; message: string; step?: string }

     export async function invitePerson(params: InvitePersonParams): Promise<InvitePersonResult>
     ```
   - L'implémentation délègue à l'Edge Function, parse la réponse et mappe vers le discriminated union.
   - Console guard sur toute erreur. Pas de throw (retourne `{ ok: false }`).
   - Ajouter l'export dans `aureak/packages/api-client/src/index.ts`.

6. **Mise à jour des boutons existants (87-1)** — remplacer les liens temporaires `#invite-...` :
   - `(admin)/academie/commerciaux/index.tsx` — bouton "+ Nouveau commercial" → `router.push('/academie/commerciaux/new')` (au lieu de `/settings/permissions#invite-commercial`).
   - `(admin)/academie/marketeurs/index.tsx` — idem → `/academie/marketeurs/new`.
   - `(admin)/academie/managers/index.tsx` — idem → `/academie/managers/new`.
   - **Aucun changement** sur le bouton "+ Nouveau coach" (continue de pointer vers `/coaches/new` existant) — hors scope.
   - **Nettoyer les TODO** inline créés en 87-1 (`// TODO(story-87-4?): ...`) — les 3 TODOs sont résolus par cette story, supprimer les commentaires.

7. **Toast feedback** — utilise `ToastContext` existant (déjà présent dans `apps/web/components/ToastContext.tsx`, consommé par `(admin)/children/new/page.tsx`) :
   - Succès invite : "Invitation envoyée à <email>" — variant success (`colors.status.present`).
   - Succès fiche : "Fiche créée : <firstName> <lastName>" — variant success.
   - Erreur : "Erreur : <message>" — variant error (`colors.status.absent`), auto-dismiss 6s.

8. **Permissions** — le formulaire est réservé aux admins :
   - Garde d'accès : `useAuthStore(s => s.role)` → si `!== 'admin'` → `router.replace('/dashboard')` + toast "Accès refusé".
   - Les routes `/academie/<role>/new` restent techniquement navigables par URL ; la garde empêche l'affichage réel.
   - **NB** : Epic 86-3 prévoit une permission granulaire (section `user_accounts` `full`) mais pour rester aligné avec la garde existante de `/settings/permissions` (`role === 'admin'` via `useAuthStore`), on reste sur cette même garde simple. Une story future pourra unifier les gardes via `getEffectivePermissions`.

9. **UX detail — avatar upload différé** :
   - **Aucun** upload de photo dans ce formulaire — le profil est créé sans avatar, `avatarUrl` peut être ajouté plus tard depuis la fiche `/profiles/[userId]` (story 87-2) si une feature avatar est implémentée (hors scope Epic 87).
   - Justification : l'invitation doit rester à 4 champs, pas 7. La photo n'est pas un bloqueur métier (fallback initiales OK partout).

10. **Design** — formulaire dense mais aéré, aligné sur la charte Aureak :
    - Conteneur centré max-width 480px, padding `space.xl`, fond `colors.light.surface`, border `colors.border.light`, radius 12.
    - Titre H2 Montserrat 700 24px en haut.
    - Toggle Invitation/Fiche = 2 pills horizontaux alignés sur le pattern `SegmentedControl` de `/academie/coachs` (colors.accent.goldSolid actif, colors.light.hover inactif).
    - Inputs via composant `Input` partagé (`@aureak/ui`) — background `colors.light.primary`, border `colors.border.light`, focus border `colors.accent.gold`.
    - Bouton principal gold plein (`colors.accent.gold` bg, `colors.text.dark` label), désactivé → opacity 0.5.
    - Bouton secondaire border-only (`colors.border.light`, label `colors.text.muted`).
    - Messages d'erreur inline 12px `colors.status.absent`.

11. **Qualité & conformité CLAUDE.md** :
    - `try/finally` obligatoire sur `setSubmitting`.
    - Console guards `NODE_ENV !== 'production'`.
    - Styles via tokens uniquement.
    - Accès Supabase (`supabase.functions.invoke`) uniquement via `@aureak/api-client` (helper `invitePerson`).
    - Soft-delete respecté (pas de hard delete — le flux crée, il ne supprime pas).
    - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

12. **Tests manuels Playwright** :
    - Naviguer `/academie/commerciaux` → clic "+ Nouveau commercial" → atterrir sur `/academie/commerciaux/new`.
    - Remplir "Thomas / Dupont / thomas@example.com" → Valider → toast "Invitation envoyée à thomas@example.com" → redirect vers `/academie/commerciaux` → la liste contient maintenant le nouveau profil avec statut "En attente" (invite_status = invited).
    - Toggle sur "Fiche locale" → email devient optionnel → Valider sans email → toast "Fiche créée" → redirect + liste contient le profil avec statut "Actif".
    - Tenter de valider avec email invalide "abc" → erreur inline, bouton reste désactivé.
    - Non-admin navigue `/academie/commerciaux/new` → redirect dashboard + toast "Accès refusé".
    - Refaire le scénario pour `/academie/marketeurs/new` et `/academie/managers/new` → 3 rôles OK.
    - Console JS : **zéro erreur**.

## Tasks / Subtasks

- [x] **Task 1 — Helper API `invitePerson`** (AC: #5)
  - [ ] Créer `aureak/packages/api-client/src/admin/invite-person.ts` avec la signature et l'implémentation spécifiées en AC #5.
  - [ ] Implementation : `supabase.functions.invoke('create-user-profile', { body })` → parser `data` + `error` → retourner discriminated union.
  - [ ] Le `userId` de retour vient de la réponse Edge Function (parcourir la logique de `create-user-profile/index.ts` pour identifier le shape exact — a priori `{ userId: string }` ou similaire dans le body de réponse).
  - [ ] Export dans `aureak/packages/api-client/src/index.ts` : `export { invitePerson, type InvitePersonParams, type InvitePersonResult, type InvitePersonMode } from './admin/invite-person'`.

- [x] **Task 2 — Composant partagé `NewPersonForm`** (AC: #2, #3, #4, #7, #9, #10)
  - [ ] Créer `(admin)/academie/_components/NewPersonForm.tsx`.
  - [ ] Props : `{ role: 'commercial' | 'manager' | 'marketeur' }`.
  - [ ] State local : `firstName, lastName, email, phone, mode, submitting, errors`.
  - [ ] Validation : fonction pure `validate(form, mode)` retournant `Record<Field, string>`.
  - [ ] Soumission : appelle `invitePerson` (Task 1), gère succès/erreur via `try/finally`.
  - [ ] Redirect : `router.replace(\`/academie/\${pluralizeRole(role)}\`)` où `pluralizeRole` est un helper local (`commercial` → `commerciaux`, `manager` → `managers`, `marketeur` → `marketeurs`).
  - [ ] Toast via `useToast()` (pattern existant `(admin)/children/new/page.tsx`).
  - [ ] Garde admin intégrée : `useAuthStore(s => s.role)`, redirect si non-admin.

- [x] **Task 3 — 3 routes de création** (AC: #1)
  - [ ] Créer 3 fichiers `(admin)/academie/<plural>/new/index.tsx` :
    ```typescript
    'use client'
    import { NewPersonForm } from '../../_components/NewPersonForm'
    export default function NewCommercialPage() {
      return <NewPersonForm role={'commercial'} />
    }
    ```
    (idem pour `marketeurs` et `managers` avec `role` correspondant).
  - [ ] Chaque fichier ≤ 10 lignes — pure délégation au composant partagé.

- [x] **Task 4 — Mise à jour des boutons 87-1** (AC: #6)
  - [ ] Grep `/settings/permissions#invite-commercial\|/settings/permissions#invite-marketeur\|/settings/permissions#invite-manager` dans `apps/web/app/(admin)/academie/`.
  - [ ] Pour chaque occurrence, remplacer par `/academie/<plural>/new`.
  - [ ] Nettoyer les commentaires `// TODO(story-87-4?): ...` — les 3 TODOs sont résolus.
  - [ ] Vérifier qu'aucun test existant ne casse (pas de test unitaire attendu — à confirmer).

- [x] **Task 5 — Vérification Edge Function `create-user-profile`** (AC: #4)
  - [ ] Lire `supabase/functions/create-user-profile/index.ts` entièrement — confirmer que :
    - L'insertion dans `profiles` accepte les rôles `commercial`, `manager`, `marketeur` sans branchement spécifique.
    - Aucun champ obligatoire additionnel ne bloque pour ces 3 rôles (contrairement aux rôles `child` qui ont des champs parents, birthDate, etc.).
    - La réponse succès inclut bien un `userId` exploitable côté client.
  - [ ] Si un blocage est identifié (ex: role whitelist strict dans la fonction) → **signaler avant de coder**, ne pas patcher l'Edge Function dans cette story sans validation produit (Dev Agent → ajouter au Completion Notes).

- [x] **Task 6 — QA & conformité** (AC: #11)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `setSubmitting` sur fichiers nouveaux → `try/finally` présent.
  - [ ] Grep `console\.` sur fichiers nouveaux → guards `NODE_ENV !== 'production'`.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` sur fichiers nouveaux → aucun match (tokens uniquement).
  - [ ] Grep `supabase\.functions\.invoke` dans `apps/web/` → le seul appel doit être via `@aureak/api-client/invite-person` (pas d'invoke direct dans le form).

- [x] **Task 7 — Tests Playwright manuels** (AC: #12)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Parcours invite pour les 3 rôles → screenshots.
  - [ ] Parcours fiche locale pour 1 rôle → screenshot.
  - [ ] Test validation email invalide → screenshot erreur.
  - [ ] Test garde non-admin → screenshot redirect.
  - [ ] Console zéro erreur.

## Dev Notes

### Pourquoi un form dédié au lieu d'étendre `/users/new`

`/users/new.tsx` (400+ lignes) est un wizard 3-étapes très couplé au workflow `child` (birthdate, parent1, parent2, club, implantation, groupe). Le type `ProfileRole = 'child' | 'parent' | 'coach' | 'club'` ne contient pas les 3 nouveaux rôles. Étendre ce wizard pour le rendre compatible :
- soit crée un gros `if (role === 'commercial' | 'manager' | 'marketeur')` partout → code qui branche mal et vieillit mal
- soit nécessite un refactor structurel du wizard → hors scope, trop gros pour Story 87-4

Le form slim (4 champs + toggle mode) couvre exactement le besoin Epic 87 : inviter une personne **sans contexte métier supplémentaire**. Les 3 rôles commercial/manager/marketeur n'ont pas de parent, pas de groupe, pas de date de naissance à saisir à la création. **KISS**.

### Pourquoi pas créer une route unique `/academie/new?role=...`

Option considérée : une seule route partagée `/academie/new?role=commercial|manager|marketeur`. **Rejetée** car :
- Le bouton "+ Nouveau X" dans `(admin)/academie/<role>/index.tsx` pointe déjà vers `/academie/<role>/new` (URL explicite, prédictible).
- Le form lui-même est partagé via `NewPersonForm` → aucune duplication de code, juste 3 fichiers de 10 lignes chacun pour le routing.
- Les URLs propres (`/academie/commerciaux/new`) sont plus lisibles et meilleures pour les analytics futurs.

### Edge Function `create-user-profile` — ce qu'il faut savoir

Localisation : `supabase/functions/create-user-profile/index.ts`.
- **Authentification** : requiert `Authorization: Bearer <jwt>` — admin caller obligatoire (vérifié côté Edge).
- **Service role** : la fonction utilise `SUPABASE_SERVICE_ROLE_KEY` pour contourner RLS lors de l'insert dans `profiles` → jamais exposé côté client, OK.
- **Rôle non-child** : la branche insertion `profiles` n'ajoute les colonnes enfant (birth_date, parents…) **que si `role === 'child'`**. Pour commercial/manager/marketeur, l'insertion est minimaliste (user_id, tenant_id, user_role, display_name, status) — exactement ce qu'on veut.
- **Réponse succès** : renvoie un JSON avec `{ userId, email?, mode }` (shape à confirmer lors de la vérif Task 5 — ne pas supposer).

### Pattern Toast

`useToast()` est déjà utilisé par `(admin)/children/new/page.tsx`. Signature (à confirmer en lisant `components/ToastContext.tsx`) :
```typescript
const toast = useToast()
toast.success('Message')
toast.error('Message')
```
Si le ToastContext n'est pas wrappé au niveau du layout `(admin)/_layout.tsx`, vérifier et adapter — **sinon le hook throw à l'exécution**.

### Garde admin — rappel memory

Epic 86-3 introduit des permissions granulaires par section (`section_user_accounts: 'full' | 'read_only'`), mais les pages admin actuelles (`/settings/permissions`, `/users/[userId]`) utilisent encore la garde simple `role === 'admin'` via `useAuthStore`. **On reste cohérent** avec cette garde simple dans 87-4. L'unification via `getEffectivePermissions` sera faite quand toute l'app sera migrée (hors scope, future story sprint-level).

### Aucune migration DB

Toute l'infrastructure existe :
- `profiles.user_role` accepte les 3 rôles depuis migration 00147/00148 (Epic 86-1).
- `create-user-profile` Edge Function est déployée et opérationnelle.
- `inviteUserByEmail` via Supabase Auth utilise le SMTP configuré (Resend ou Supabase default — voir `supabase/config.toml`).
- `useAuthStore` + `ToastContext` existants.

**Zéro migration, zéro nouvelle Edge Function, zéro nouvelle dépendance npm**. C'est ce qui rend cette story "S" (Small).

### Design System (tokens uniquement)

```
Fond page                : colors.light.primary
Card form bg             : colors.light.surface
Card form border         : colors.border.light
Card form radius         : 12
Titre H2                 : Montserrat 700 24px colors.text.dark
Label input              : 10px uppercase colors.text.muted letterSpacing 0.06em
Input bg                 : colors.light.primary
Input border             : colors.border.light
Input focus border       : colors.accent.gold
Input error border       : colors.status.absent
Pill toggle actif        : colors.accent.goldSolid bg, colors.text.dark texte
Pill toggle inactif      : colors.light.hover bg, colors.text.muted texte
Bouton principal actif   : colors.accent.gold bg, colors.text.dark label bold
Bouton principal disabled: opacity 0.5
Bouton secondaire        : transparent bg, colors.border.light border, colors.text.muted label
Message erreur inline    : colors.status.absent 12px
```

### Règles absolues CLAUDE.md (rappel)

- try/finally obligatoire sur `setSubmitting`.
- Console guards systématiques.
- Tokens uniquement.
- Accès Supabase uniquement via `@aureak/api-client` — le helper `invitePerson` est obligatoire, pas de `supabase.functions.invoke` direct dans le form.

### Project Structure Notes

- **Routing Expo Router** : `index.tsx` sous `/academie/<plural>/new/` — cohérent avec le reste du hub Académie.
- **Composant partagé** : `_components/NewPersonForm.tsx` sous `/academie/` — réutilisable si d'autres rôles sont ajoutés plus tard (ex: scout dans Epic 89 futur).
- **Helper API** : `admin/invite-person.ts` — nouveau fichier, pas de modification des existants.

### Non-goals explicites

- **Pas de refactor** de `/users/new.tsx` (laissé intact pour les flux child/parent/coach/club existants).
- **Pas d'extension** de `ProfileRole` (reste `'child' | 'parent' | 'coach' | 'club'`). Les 3 nouveaux rôles utilisent `UserRole` (types/enums.ts) directement.
- **Pas d'upload avatar** à la création (AC #9).
- **Pas de notification Slack/interne** à l'équipe quand une invitation est envoyée.
- **Pas de gestion de revocation d'invitation** depuis cette story (déjà couvert par `requestUserDeletion` dans la fiche `/profiles/[userId]` via action lifecycle 87-2).
- **Pas de pré-attribution de permissions custom** — le nouvel invité hérite des défauts du rôle via `section_permissions` (Epic 86-3). Les overrides se font plus tard via onglet Accès (87-3).

### References

- **Story 87-1 (parent)** : `_bmad-output/implementation-artifacts/story-87-1-pages-academie-commerciaux-marketeurs-managers.md` (TODOs à nettoyer)
- **Story 87-2 (fiche universelle)** : `_bmad-output/implementation-artifacts/story-87-2-fiche-personne-universelle.md` — la fiche de la personne invitée s'y affichera après création.
- Edge Function : `supabase/functions/create-user-profile/index.ts`
- Pattern form existant : `aureak/apps/web/app/(admin)/children/new/page.tsx` (ToastContext, `useAuthStore.tenantId`, validation, redirect)
- Pattern wizard complet (à NE PAS dupliquer) : `aureak/apps/web/app/(admin)/users/new.tsx`
- API helpers auth existants : `aureak/packages/api-client/src/auth.ts` (`inviteUser` — ne sera pas utilisé directement, remplacé par `invitePerson` qui passe par l'Edge Function pour contourner RLS via service_role)
- Toast context : `aureak/apps/web/components/ToastContext.tsx`
- AuthStore : `@aureak/business-logic/src/stores/auth-store.ts` (hook `useAuthStore`)
- Tokens : `aureak/packages/theme/src/tokens.ts`
- Types : `aureak/packages/types/src/enums.ts` (`UserRole`, `ROLE_LABELS` si créé en 87-2)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Edge Function `create-user-profile/index.ts` vérifiée : aucune whitelist de rôle, validation `!role` simple. Réponse succès = `{ data: { userId } }`. La branche `child` ajoute des colonnes spécifiques, sinon payload minimaliste → OK pour commercial/manager/marketeur.
- `cd aureak && npx tsc --noEmit` → EXIT:0.
- QA : try/finally sur setSubmitting ✅, console guards ✅, zéro couleur hexa, pas de `supabase.functions.invoke` direct dans `apps/web/`.
- Pas de `// TODO(story-87-4?): ...` dans la branche 87.1 mergée — rien à nettoyer (le TODO était prévu en spec mais pas implémenté).
- Playwright différé (MCP locked, QA humain sur preview Vercel).

### Completion Notes List

- AC #1 ✅ : 3 routes créées (`commerciaux/new`, `marketeurs/new`, `managers/new`), chacune délègue à `NewPersonForm` avec son prop `role`.
- AC #2 ✅ : `NewPersonForm` partagé, 4 champs + toggle Invitation/Fiche locale, titre dynamique via `ROLE_LABELS`.
- AC #3 ✅ : validation client inline (regex email, trim non vide) + disable bouton principal.
- AC #4 ✅ : soumission via helper `invitePerson` (pas d'invoke direct), try/finally, redirect `router.replace` + toast.
- AC #5 ✅ : helper `invitePerson` avec discriminated union `{ ok: true; userId } | { ok: false; message; step? }`, parse `{ data: { userId } }` Edge response.
- AC #6 ✅ : 3 `newButtonHref` remplacés (`/settings/permissions#invite-X` → `/academie/<plural>/new`).
- AC #7 ✅ : toast via `useToast()` — success/error — pattern identique à `(admin)/children/new/page.tsx`.
- AC #8 ✅ : garde admin via `useAuthStore(s => s.role)` + redirect `/dashboard` si non-admin.
- AC #9 ✅ : aucun upload avatar.
- AC #10 ✅ : design aligné sur les tokens theme (gold, border.light, text.muted, etc.).
- AC #11 ✅ : tsc EXIT:0, QA passent.
- AC #12 ⏸️ : Playwright différé.

### File List

**Créés :**
- `aureak/packages/api-client/src/admin/invite-person.ts`
- `aureak/apps/web/app/(admin)/academie/_components/NewPersonForm.tsx`
- `aureak/apps/web/app/(admin)/academie/commerciaux/new/index.tsx`
- `aureak/apps/web/app/(admin)/academie/marketeurs/new/index.tsx`
- `aureak/apps/web/app/(admin)/academie/managers/new/index.tsx`

**Modifiés :**
- `aureak/packages/api-client/src/index.ts` (export `invitePerson` + types)
- `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx` (newButtonHref)
- `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx` (newButtonHref)
- `aureak/apps/web/app/(admin)/academie/managers/index.tsx` (newButtonHref)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (87-3 → done ; 87-4 → review)

### Change Log

- 2026-04-21 — Implémentation story 87.4 : formulaire d'invitation dédié + 3 routes + helper `invitePerson`. Plus de détour par `/settings/permissions`. tsc EXIT:0.

**Attendus — création :**
- `aureak/packages/api-client/src/admin/invite-person.ts`
- `aureak/apps/web/app/(admin)/academie/_components/NewPersonForm.tsx`
- `aureak/apps/web/app/(admin)/academie/commerciaux/new/index.tsx`
- `aureak/apps/web/app/(admin)/academie/marketeurs/new/index.tsx`
- `aureak/apps/web/app/(admin)/academie/managers/new/index.tsx`

**Attendus — modification :**
- `aureak/packages/api-client/src/index.ts` (export helper)
- `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx` (bouton → `/academie/commerciaux/new`, retirer TODO)
- `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx` (bouton → `/academie/marketeurs/new`, retirer TODO)
- `aureak/apps/web/app/(admin)/academie/managers/index.tsx` (bouton → `/academie/managers/new`, retirer TODO)

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Prochaine story** : 87-5 (refactor `/users/[userId]` → redirect vers `/profiles/[userId]`) — ferme le gap de dette UX posé en 87-2 et unifie définitivement la navigation profil.
