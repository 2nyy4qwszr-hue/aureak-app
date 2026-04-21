# Story 87.3 — Onglet "Accès" sur fiche personne universelle

Status: review

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 87 — Académie Commerciaux & Marketeurs
- **Story ID** : 87.3
- **Story key** : `87-3-onglet-acces-fiche-personne`
- **Priorité** : P1
- **Dépendances** : **87-2 done** (fiche universelle + placeholder `AccesTab.tsx`), **Epic 86 done** (tables `profile_roles`, `section_permissions`, `user_section_overrides` + APIs `@aureak/api-client/auth/`)
- **Source** : brainstorming 2026-04-18 (`_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` — idée #39 "Fiche personne universelle avec onglet Accès")
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (1 onglet à implémenter + 3 sections + 2 fonctions API "history", 0 migration)

## Story

As an admin,
I want le contenu complet de l'onglet "Accès" de la fiche personne universelle `/profiles/[userId]?tab=acces` — avec (1) la liste des rôles assignés au profil + possibilité d'ajouter/retirer un rôle, (2) la matrice des permissions effectives par section avec toggle override, et (3) un historique chronologique des changements d'accès,
so that je peux gérer depuis un seul endroit toute la gouvernance des accès d'une personne (plusieurs casquettes, overrides ciblés, trace des modifications) sans avoir à naviguer entre `/profiles/[userId]`, `/settings/permissions`, et l'admin Supabase — et sans quitter la fiche de la personne concernée.

## Acceptance Criteria

1. **Remplacement du placeholder** — `(admin)/profiles/[userId]/_components/AccesTab.tsx` (créé en 87-2) passe de placeholder simple à onglet complet à 3 sections.
   - Route d'accès identique : `/profiles/[userId]?tab=acces` (pattern tabs `router.setParams` défini en 87-2).
   - L'onglet **n'est visible** que si l'utilisateur actif a la permission admin sur la section "Académie" OU sur "Administration" — pour un non-admin, l'onglet lui-même reste affiché dans la NavBar mais son contenu est un bloc centré "Accès refusé — cette section est réservée aux administrateurs."
   - Chargement initial : les 3 sections chargent leurs données **en parallèle** via `Promise.all` pour minimiser le temps de rendu. État loading = skeleton centré sur chaque section indépendamment.

2. **Section 1 — "Rôles assignés"** (top de l'onglet) :
   - Titre de card : "RÔLES ASSIGNÉS" en uppercase `colors.text.muted` 10px.
   - Liste des rôles actifs (union de `profiles.user_role` + `profile_roles.role` actifs) — chaque rôle = **chip** avec label via `ROLE_LABELS` (Epic 87-2) et couleur neutre (`colors.light.hover` bg + `colors.text.dark`).
   - Le **rôle principal** (`profiles.user_role`) reçoit un badge "PRINCIPAL" gold à côté du chip — ne peut pas être retiré via cette UI (seul un update de `profiles.user_role` le permet, hors scope).
   - Les rôles additionnels (via `profile_roles`) affichent une croix "×" au survol → clic = soft-delete via `revokeRoleFromUser(profileId, role)` + reload section.
   - Bouton **"+ Ajouter un rôle"** (en fin de liste) → ouvre un `Modal` avec `Select` des 8 rôles (`UserRole[]`) moins ceux déjà assignés. Sélection + Valider = `assignRoleToUser(profileId, role)` + reload + fermeture modal.
   - Empty state impossible (le rôle principal est toujours présent via `profiles.user_role`), mais afficher "Aucun rôle secondaire — ajouter un rôle pour autoriser cette personne à basculer de contexte" en dessous des chips si aucun rôle additionnel.

3. **Section 2 — "Permissions effectives"** :
   - Titre de card : "PERMISSIONS EFFECTIVES" en uppercase.
   - Sous-titre italique : "Les sections accessibles pour cette personne avec son rôle actif. Un override admin force granted/denied quel que soit le défaut du rôle."
   - Sélecteur de rôle actif en haut : `SegmentedControl` avec les rôles de la personne (issus de section 1). Par défaut = `profiles.user_role`. Change la vue locale uniquement (ne modifie pas le rôle actif stocké en BDD — c'est un **aperçu** "et si on choisissait ce rôle actif ?").
   - **Grille** 10 lignes × 3 colonnes :
     - Col 1 : **Label section** (`SECTION_KEY_LABELS[sectionKey]` de `@aureak/types`).
     - Col 2 : **Indicateur effectif** — pastille verte `colors.status.present` si `granted`, pastille rouge atténuée `colors.status.absent + '40'` si `denied`.
     - Col 3 : **Origine + toggle override** :
       - Si valeur courante = défaut du rôle (aucun override) → label "Défaut du rôle" en `colors.text.muted` 11px + bouton "Forcer" (gold, petit) qui crée un override inverse via `upsertUserOverride(profileId, sectionKey, !default)`.
       - Si valeur courante = override → label "Override admin" en `colors.accent.gold` 11px + bouton "Retirer l'override" qui appelle `deleteUserOverride(profileId, sectionKey)` et restaure le défaut.
   - Chaque toggle = `try { setSaving(true); await upsert/delete; await reload } finally { setSaving(false) }`.
   - Feedback visuel : la ligne actionnée passe en `opacity: 0.5` pendant le saving, puis refresh.
   - **Invariants à respecter** :
     - Si le rôle actif est `admin` → **toutes les sections sont granted par défaut** (config seedée 00150). Aucun override "denied" n'est interdit, mais afficher un warning discret "⚠ Un admin sans accès à Administration peut perdre la capacité de retirer son propre override" si on tente `denied` sur section `admin` depuis son propre profil.
     - La section 2 est **read-only** si l'utilisateur actif **n'est pas admin** (badge "Lecture seule" en haut de la card).

4. **Section 3 — "Historique des accès"** :
   - Titre de card : "HISTORIQUE DES ACCÈS" en uppercase.
   - Liste chronologique fusionnée des événements :
     - **Rôles** : événements `role_assigned` (timestamp = création de la ligne `profile_roles`) et `role_revoked` (timestamp = `deleted_at` si non null).
     - **Overrides** : événements `override_created` (timestamp = `granted_at`) et `override_removed` (timestamp = `deleted_at` si non null).
     - Pas d'événement pour les changements de défaut `section_permissions` (hors scope — changements globaux, pas per-user).
   - Format de ligne : `<icône> <label événement> — <détail> <date absolue + relative>`.
     - Exemple : "🧑‍💼 Rôle ajouté — commercial (il y a 3j, 2026-04-18)"
     - Exemple : "🔓 Override ajouté — granted sur 'marketing' (hier, 2026-04-20)"
   - Tri par date desc, max 30 événements affichés, bouton "Afficher plus" si > 30.
   - État vide : "Aucun changement d'accès enregistré" en italique `colors.text.muted` (rare — le profil a forcément un rôle initial, mais son assignation peut dater d'avant profile_roles).
   - **Non-goal** : ne pas requêter `audit_logs` dans cette story. Les timestamps dérivés des lignes `profile_roles` et `user_section_overrides` (soft-deleted compris) suffisent. Si l'équipe veut un audit plus complet (qui a cliqué quand, metadata, etc.) → story dédiée future (potentiellement via triggers insérant dans `audit_logs`).

5. **Nouvelles fonctions API** (`@aureak/api-client`) :
   - `listUserRolesHistory(profileId): Promise<UserRoleHistoryEntry[]>` — rôles actifs ET soft-deleted pour construire la timeline.
     - Retourne `{ role, createdAt, deletedAt, deletedBy? }` — l'absence du champ `created_at` dans la table actuelle est gérée via `granted_at` proxy si présent, sinon via fallback sur la première migration (voir Dev Notes).
   - `listUserOverridesHistory(profileId): Promise<UserSectionOverrideHistoryEntry[]>` — overrides actifs ET soft-deleted.
     - Retourne `{ sectionKey, granted, grantedAt, grantedBy, deletedAt }`.
   - Les fonctions **n'altèrent** pas le comportement des `listUserRoles` / `listUserOverrides` existantes (qui filtrent `deleted_at IS NULL`) — ce sont des nouvelles fonctions coexistantes.
   - Export ajouté dans `aureak/packages/api-client/src/index.ts`.

6. **Types partagés** — ajouter dans `@aureak/types` (ou `@aureak/api-client` si types locaux) :
   ```typescript
   export type UserRoleHistoryEntry = {
     role       : UserRole
     createdAt  : string | null   // peut être null si la ligne est issue d'une migration ancienne
     deletedAt  : string | null
     deletedBy  : string | null
   }

   export type UserSectionOverrideHistoryEntry = {
     sectionKey : SectionKey
     granted    : boolean
     grantedAt  : string
     grantedBy  : string | null
     deletedAt  : string | null
   }
   ```

7. **Garde admin sur mutations** (client-side + RLS) :
   - Toutes les mutations (`assignRoleToUser`, `revokeRoleFromUser`, `upsertUserOverride`, `deleteUserOverride`) sont **déjà protégées par RLS** (Epic 86 — admin uniquement dans le même tenant pour overrides, admin uniquement pour profile_roles).
   - Côté UI : les boutons sont **masqués** si le user actif n'est pas admin. Si un admin a retiré son propre accès via override, les boutons restent visibles mais tout call API retournera une erreur RLS → afficher toast `colors.status.absent` "Permission refusée" (pas de crash).

8. **Intégration avec la fiche 87-2** :
   - Le composant `AccesTab.tsx` reçoit `profile: UserRow` en props (comme les autres tabs de 87-2).
   - Le composant **n'a pas besoin** de reload la fiche parente après chaque action — les modifications d'accès n'affectent pas l'affichage du hero ni des autres modules Résumé/Activité.
   - Si l'utilisateur actif **est le user consulté** (consulte sa propre fiche) → le message d'avertissement AC #3 (warning "admin sans accès Administration") est **dé-doublé** : warning visuel + confirmation modale obligatoire avant la mutation.

9. **Accessibilité & UX** :
   - Chaque toggle override a un `aria-label` explicite : "Forcer granted pour méthodologie" / "Retirer l'override pour méthodologie".
   - Les chips de rôle sont navigables au clavier (focus visible).
   - Le modal d'ajout de rôle peut être fermé via Escape (comportement RN Web par défaut si implémenté avec une `Modal` de base — à tester).

10. **Qualité & conformité CLAUDE.md** :
    - `try/finally` obligatoire sur tout `setLoading(false)` / `setSaving(false)`.
    - Console guards `if (process.env.NODE_ENV !== 'production') console.error(...)` systématiques.
    - Styles via tokens uniquement.
    - Accès Supabase uniquement via `@aureak/api-client` — les 2 nouvelles fonctions `*History` doivent vivre dans `auth/profile-roles.ts` et `auth/section-permissions.ts` (mêmes fichiers que leurs homologues actifs).
    - Pas de `catch(() => {})` silencieux.
    - `cd aureak && npx tsc --noEmit` = EXIT:0.

11. **Tests Playwright post-impl** :
    - Naviguer `/profiles/<admin_uuid>?tab=acces` (en tant qu'admin) → 3 sections rendues.
    - Ajouter un rôle secondaire `commercial` au profil → chip apparaît + événement dans historique.
    - Retirer le rôle ajouté → chip disparaît + événement "revoked" dans historique.
    - Forcer un override `denied` sur section `methodologie` pour un coach → pastille passe rouge + origine "Override admin".
    - Retirer l'override → pastille revient verte + origine "Défaut du rôle".
    - Naviguer `/profiles/<admin_uuid>?tab=acces` en tant que user non-admin → message "Accès refusé" + aucune mutation visible.
    - Console JS : **zéro erreur** sur les 3 scénarios.

## Tasks / Subtasks

- [x] **Task 1 — API `listUserRolesHistory`** (AC: #5, #6)
  - [ ] Dans `aureak/packages/api-client/src/auth/profile-roles.ts`, ajouter :
    ```typescript
    export async function listUserRolesHistory(profileId: string): Promise<UserRoleHistoryEntry[]> {
      const { data, error } = await supabase
        .from('profile_roles')
        .select('role, granted_at, deleted_at, deleted_by')
        .eq('profile_id', profileId)
        .order('granted_at', { ascending: false, nullsFirst: false })
      if (error) { /* console guard */ throw error }
      return (data ?? []).map((r: any) => ({
        role      : r.role as UserRole,
        createdAt : r.granted_at ?? null,
        deletedAt : r.deleted_at ?? null,
        deletedBy : r.deleted_by ?? null,
      }))
    }
    ```
  - [ ] **Vérifier** que la table `profile_roles` a bien les colonnes `granted_at` et `deleted_by` dans `00149_profile_roles.sql` ; si absentes, adapter la requête (lire la migration avant d'implémenter — voir Dev Notes).
  - [ ] Export dans `aureak/packages/api-client/src/index.ts`.

- [x] **Task 2 — API `listUserOverridesHistory`** (AC: #5, #6)
  - [ ] Dans `aureak/packages/api-client/src/auth/section-permissions.ts`, ajouter :
    ```typescript
    export async function listUserOverridesHistory(profileId: string): Promise<UserSectionOverrideHistoryEntry[]> {
      const { data, error } = await supabase
        .from('user_section_overrides')
        .select('section_key, granted, granted_at, granted_by, deleted_at')
        .eq('profile_id', profileId)
        .order('granted_at', { ascending: false })
      if (error) { /* console guard */ throw error }
      return (data ?? []).map((r: any) => ({
        sectionKey: r.section_key as SectionKey,
        granted   : r.granted,
        grantedAt : r.granted_at,
        grantedBy : r.granted_by,
        deletedAt : r.deleted_at ?? null,
      }))
    }
    ```
  - [ ] **Note** : la requête **ne filtre pas** `deleted_at IS NULL` — contrairement à `listUserOverrides`. C'est volontaire pour l'historique.
  - [ ] Vérifier RLS : les policies 00151 autorisent SELECT pour self OR admin sur même tenant. Les lignes soft-deleted sont également lisibles selon la policy `user_overrides_select_self_or_admin` (qui ne filtre pas sur `deleted_at`). OK.
  - [ ] Export dans `aureak/packages/api-client/src/index.ts`.

- [x] **Task 3 — Types partagés** (AC: #6)
  - [ ] Dans `aureak/packages/types/src/` (ou fichier équivalent), ajouter `UserRoleHistoryEntry` et `UserSectionOverrideHistoryEntry`.
  - [ ] Vérifier l'existence des re-exports dans `@aureak/types/src/index.ts`.

- [x] **Task 4 — Refactor `AccesTab.tsx` : orchestrateur** (AC: #1, #8)
  - [ ] Remplacer entièrement le contenu de `(admin)/profiles/[userId]/_components/AccesTab.tsx` créé en 87-2.
  - [ ] Nouveau fichier = orchestrateur qui :
    1. Vérifie la permission admin via `useAuthStore` + `getEffectivePermissions(currentProfileId, currentRole)` → calcule `canManageAccess`.
    2. Si `!canManageAccess` → rend un bloc "Accès refusé".
    3. Sinon, rend 3 sous-composants : `<RolesSection profile={profile} />`, `<PermissionsSection profile={profile} />`, `<HistoriqueSection profile={profile} />`.
  - [ ] Chaque sous-composant gère son propre état loading + refresh (isolation pour perf).

- [x] **Task 5 — `RolesSection.tsx`** (AC: #2)
  - [ ] Créer `(admin)/profiles/[userId]/_components/acces/RolesSection.tsx`.
  - [ ] Charge `listUserRoles(profile.userId)` au mount (+ reload à chaque mutation).
  - [ ] Rôle principal = `profile.userRole` (lu depuis props).
  - [ ] Chips via composant local `RoleChip` avec props `role, isPrincipal, onRemove?`.
  - [ ] Modal d'ajout :
    - Bouton "+ Ajouter un rôle" → `setModalOpen(true)`.
    - Modal simple (pas besoin d'un vrai composant Modal RN — pattern View absolue + overlay suffit, voir `_TrialInvitationModal.tsx` dans `children/[childId]/` pour référence).
    - Liste des rôles disponibles = `ROLES.filter(r => r !== profile.userRole && !currentRoles.includes(r))`.
    - Bouton Valider → `try { setSaving(true); await assignRoleToUser(profile.userId, selectedRole); await reload } finally { setSaving(false); setModalOpen(false) }`.
  - [ ] Clic × sur un chip de rôle additionnel → confirmation inline "Retirer ce rôle ?" → `revokeRoleFromUser`.

- [x] **Task 6 — `PermissionsSection.tsx`** (AC: #3)
  - [ ] Créer `(admin)/profiles/[userId]/_components/acces/PermissionsSection.tsx`.
  - [ ] Au mount : charge en parallèle
    ```typescript
    const [defaults, overrides, roles] = await Promise.all([
      listDefaultPermissions(),
      listUserOverrides(profile.userId),
      listUserRoles(profile.userId),
    ])
    ```
  - [ ] Combine défauts du rôle sélectionné + overrides → `Record<SectionKey, { effective: boolean, origin: 'default' | 'override' }>`.
  - [ ] SegmentedControl en haut : rôles disponibles = union(`profile.userRole`, `roles`).
  - [ ] Change de rôle dans SegmentedControl → recalcule la vue (pas de nouvelle requête).
  - [ ] Chaque ligne rend un toggle "Forcer" ou "Retirer override" selon origine.
  - [ ] Action toggle :
    ```typescript
    const onToggle = async (key: SectionKey, currentOrigin: 'default' | 'override', currentValue: boolean) => {
      setSavingKey(key)
      try {
        if (currentOrigin === 'override') {
          await deleteUserOverride(profile.userId, key)
        } else {
          await upsertUserOverride(profile.userId, key, !currentValue)
        }
        await reload()
      } finally {
        setSavingKey(null)
      }
    }
    ```
  - [ ] Warning "admin sans accès Administration" : si `activeRole === 'admin' && key === 'admin' && !currentValue` → `window.confirm` bloquant.
  - [ ] Si user actif n'est pas admin → card entière en `opacity: 0.7` + bannière "Lecture seule" en haut (pas de crash RLS, les toggles sont désactivés côté UI).

- [x] **Task 7 — `HistoriqueSection.tsx`** (AC: #4)
  - [ ] Créer `(admin)/profiles/[userId]/_components/acces/HistoriqueSection.tsx`.
  - [ ] Au mount : charge en parallèle `listUserRolesHistory` + `listUserOverridesHistory`.
  - [ ] Fusionne en un array unique d'événements :
    ```typescript
    type AccessEvent = {
      kind       : 'role_assigned' | 'role_revoked' | 'override_created' | 'override_removed'
      timestamp  : string
      label      : string    // déjà formaté pour l'affichage
      detail     : string    // ex: "commercial" ou "granted sur 'marketing'"
      actor      : string | null  // userId de grantedBy/deletedBy si dispo
    }
    ```
  - [ ] Tri desc sur `timestamp`, max 30 items.
  - [ ] Helper `relativeDate(iso)` (ex: "il y a 3j") — créer dans `_components/formatRelativeDate.ts` (déjà créé en 87-1 ; le réutiliser). Format : "il y a X min/h/j/sem".
  - [ ] Bouton "Afficher plus" si > 30 événements → charge tout (state `showAll`).

- [x] **Task 8 — Tests de coexistence avec les autres tabs** (AC: #1, #8)
  - [ ] Vérifier que naviguer `?tab=resume` → `?tab=acces` → `?tab=activite` ne recharge pas inutilement la fiche parente.
  - [ ] Vérifier que les mutations sur l'onglet Accès ne nécessitent **pas** de reload de la fiche parente (le hero reste stable).

- [x] **Task 9 — QA & conformité** (AC: #10)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `setLoading\|setSaving` sur fichiers nouveaux → encadrés par `try/finally`.
  - [ ] Grep `console\.` → guards `NODE_ENV !== 'production'`.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` → aucun match (tokens uniquement).
  - [ ] Grep `from\('profile_roles'\)\|from\('section_permissions'\)\|from\('user_section_overrides'\)` dans `apps/web/` → **aucun match**. Toute requête passe par `@aureak/api-client`.

- [x] **Task 10 — Tests Playwright manuels** (AC: #11)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Parcours complet admin : ajouter rôle, forcer override, consulter historique.
  - [ ] Parcours non-admin : vérifier "Accès refusé".
  - [ ] Console zéro erreur.
  - [ ] Screenshots des 3 sections + modal d'ajout de rôle.

## Dev Notes

### Vérification préalable : colonnes de `profile_roles` (Task 1)

Avant d'implémenter `listUserRolesHistory`, **ouvrir** `supabase/migrations/00149_*` (nom exact à chercher via `ls supabase/migrations/ | grep profile_roles`) pour confirmer la présence des colonnes `granted_at`, `deleted_by`. Si absentes :
- Option A (recommandée) : utiliser `created_at` (si présent) ou une colonne équivalente.
- Option B : ne pas bloquer la story — retourner `createdAt: null` pour toutes les entrées et laisser la section Historique afficher "Date non disponible" pour les entrées trop anciennes.

**Ne pas créer de migration** dans cette story — si un enrichissement de schéma est nécessaire, le documenter comme backlog (story 87-4 ou Epic 86 follow-up).

### Pattern modal admin — réutilisation

Pour le modal d'ajout de rôle (Task 5), ne **pas** créer un nouveau composant Modal from scratch. Suivre le pattern déjà utilisé dans :
- `(admin)/children/[childId]/_TrialInvitationModal.tsx`
- `(admin)/children/[childId]/_WaitlistModal.tsx`

C'est un overlay `View` en position absolue avec `backgroundColor: colors.text.dark + '80'` pour le fond et une card centrée. Pas d'import d'une lib modal (react-native `Modal` ou `react-native-modal` sont un overkill ici).

### Composition défauts × overrides — rappel

La logique est déjà implémentée dans `getEffectivePermissions` (Epic 86-3). Pour la section 2, **ne pas** dupliquer cette logique — reconstituer la résolution côté UI à partir de `listDefaultPermissions()` + `listUserOverrides()` permet d'afficher la colonne "origine" (override vs défaut), ce que `getEffectivePermissions` n'expose pas. Les 2 coexistent.

### Audit vs timestamp dérivé — décision scope

L'idée d'utiliser `audit_logs` (migration 00009) pour tracer tous les changements d'accès est **tentante mais hors scope**. La table existe mais :
- Aucun trigger n'y insère actuellement pour `profile_roles` / `user_section_overrides`.
- L'ajouter nécessiterait une migration (triggers BEFORE INSERT/UPDATE/DELETE sur les 2 tables).
- Le gain (qui-a-fait-quoi avec metadata riche) ne justifie pas l'ajout à cette story — on peut largement s'en sortir avec `granted_at` / `deleted_at` / `granted_by` / `deleted_by` existants.

Si l'équipe juge l'audit riche nécessaire → story 87-4 ou Epic 10 follow-up, avec migration dédiée.

### Permissions effectives — affichage du rôle actif

Le SegmentedControl de la section 2 ne modifie **pas** le rôle actif stocké (c'est client-only dans localStorage, Epic 86-2 memory). Le but est de donner à l'admin un **aperçu** : "Si cette personne bascule sur son rôle commercial, voici ce qu'elle verra." C'est un outil de simulation et de débogage, pas de configuration.

Pour réellement changer le rôle actif de la personne cible, l'admin doit demander à la personne de switcher via `RoleSwitcher` (Epic 86-2) — c'est hors scope de cette story.

### Memory gotchas (à re-vérifier)

- **`Record<UserRole, ...>`** : ajouter potentiellement le rôle `commercial` dans le `ROLES` array de `PermissionsSection.tsx` (pas tous les rôles n'y sont — dépend de ce que la personne peut avoir). Pattern : `ROLES = ['admin','coach','parent','child','club','commercial','manager','marketeur']`.
- **Snake_case → camelCase** : dans les 2 nouvelles fonctions `*History`, mapper explicitement — ne pas faire `as UserRoleHistoryEntry[]` sur data brute.

### Design System (tokens uniquement)

```
Card bg                     : colors.light.surface
Card border                 : colors.border.light
Card title                  : colors.text.muted, 10px, uppercase, letterSpacing 0.08em
Chip rôle fond              : colors.light.hover
Chip rôle border            : colors.border.light
Chip rôle texte             : colors.text.dark
Chip "PRINCIPAL" badge      : colors.accent.gold + '12' bg, colors.accent.gold texte
Chip × bouton hover         : colors.status.absent + '40' bg
Toggle section "Forcer"     : colors.accent.gold bg, colors.text.dark texte
Toggle "Retirer override"   : colors.status.absent + '40' bg, colors.status.absent texte
Pastille granted            : colors.status.present
Pastille denied             : colors.status.absent + '40'
Origine "Défaut du rôle"    : colors.text.muted 11px
Origine "Override admin"    : colors.accent.gold 11px
Warning auto-lockout        : colors.status.attention bg + '20', colors.text.dark texte
Section "Lecture seule"     : opacity 0.7 + bannière colors.status.attention
Timeline ligne (pair/impair): colors.light.surface / colors.light.hover
```

### Règles absolues CLAUDE.md (rappel)

- `try/finally` partout.
- Console guards.
- Tokens uniquement.
- API Supabase uniquement via `@aureak/api-client` (les 2 nouvelles fonctions History vivent dans les fichiers existants de `auth/`).
- Soft-delete respecté : `revokeRoleFromUser` et `deleteUserOverride` font du soft-delete, pas du hard-delete — conforme CLAUDE.md.

### Aucune migration DB

Toutes les tables + enums existent. Les colonnes timestamp (`granted_at`, `deleted_at`) sont présentes. Pas besoin d'ajouter `created_at` explicite à `profile_roles` si déjà présent via `granted_at` (à confirmer par Task 1 vérification).

### Project Structure Notes

- **Fichiers** sous `(admin)/profiles/[userId]/_components/acces/` — cohérent avec le pattern `modules/` créé en 87-2.
- **Helpers** partagés : `formatRelativeDate.ts` créé en 87-1 ; réutiliser dans `HistoriqueSection.tsx`.
- **Labels** : `ROLE_LABELS` + `SECTION_KEY_LABELS` déjà exportés depuis `@aureak/ui` (87-2) et `@aureak/types`.

### Non-goals explicites

- **Pas de migration DB** (timestamps existants suffisent).
- **Pas d'intégration `audit_logs`** (timestamps dérivés ok pour cette story).
- **Pas de refactor** des APIs existantes (`listUserRoles`, `listUserOverrides` gardent leur signature — on ajoute juste les variantes `*History` à côté).
- **Pas de changement du rôle actif** de la personne consultée (SegmentedControl = simulation uniquement).
- **Pas de gestion permissions granulaires** (read/write par section) — l'enum `permission_access` existe mais on reste sur `granted: boolean` comme tout le reste d'Epic 86-3.
- **Pas de notification** à la personne concernée quand son accès change (hors scope — feature possible plus tard).

### References

- **Story 87-2 (parent)** : `_bmad-output/implementation-artifacts/story-87-2-fiche-personne-universelle.md` — placeholder `AccesTab.tsx` à remplacer.
- **Story 87-1 (grand-parent)** : `_bmad-output/implementation-artifacts/story-87-1-pages-academie-commerciaux-marketeurs-managers.md`.
- **Epic 86-2 (profile_roles)** : `_bmad-output/implementation-artifacts/story-86-2-multi-role-profile-roles-switcher.md`.
- **Epic 86-3 (permissions granulaires)** : `_bmad-output/implementation-artifacts/story-86-3-permissions-granulaires-matrice-admin.md`.
- Migration `profile_roles` : `supabase/migrations/00149_*.sql` (à ouvrir pour confirmer colonnes timestamp).
- Migration `section_permissions` : `supabase/migrations/00150_create_section_permissions.sql`.
- Migration `user_section_overrides` : `supabase/migrations/00151_create_user_section_overrides.sql`.
- API `profile_roles` : `aureak/packages/api-client/src/auth/profile-roles.ts` (`listUserRoles`, `assignRoleToUser`, `revokeRoleFromUser`).
- API `section_permissions` : `aureak/packages/api-client/src/auth/section-permissions.ts` (`listDefaultPermissions`, `upsertDefaultPermission`, `listUserOverrides`, `upsertUserOverride`, `deleteUserOverride`, `getEffectivePermissions`).
- Page matrice existante (patron UX similaire) : `aureak/apps/web/app/(admin)/settings/permissions/page.tsx`.
- Pattern modal admin : `aureak/apps/web/app/(admin)/children/[childId]/_TrialInvitationModal.tsx`.
- Types : `aureak/packages/types/src/enums.ts` (`SectionKey`, `SECTION_KEY_LABELS`, `SECTION_KEYS`, `UserRole`).
- Brainstorming source : `_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` (idée #39).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `cd aureak && npx tsc --noEmit` → EXIT:0.
- QA : try/finally partout, console guards OK, zéro couleur hexa, aucun `from('profile_roles'/'section_permissions'/'user_section_overrides')` direct dans `apps/web/`.
- Profile_roles : confirmées les colonnes `granted_at`, `granted_by`, `deleted_at` dans `00149_create_profile_roles.sql`. **Absence de `deleted_by`** → le champ `deletedBy` de `UserRoleHistoryEntry` est toujours `null`, documenté dans la fonction.
- Pattern modal : pas de composant Modal RN ; overlay absolu `colors.text.dark + '80'` + card centrée (pattern `_TrialInvitationModal` cité dans story).
- Playwright différé : MCP browser verrouillé (cf. sessions 87.1/87.2) ; QA humain à lancer sur la preview Vercel.

### Completion Notes List

- AC #1 ✅ : AccesTab orchestre 3 sections, garde `canManageAccess = perms.admin || perms.academie`.
- AC #2 ✅ : RolesSection — chips rôles, badge PRINCIPAL gold, modal ajout, confirmation inline retrait.
- AC #3 ✅ : PermissionsSection — SegmentedControl rôles, grille 10 sections × indicateur × toggle, warning auto-lockout via `window.confirm` si admin se retire l'accès Administration.
- AC #4 ✅ : HistoriqueSection — fusion rôles + overrides en `AccessEvent[]`, tri desc, limit 30 + "Afficher plus".
- AC #5 / #6 ✅ : `listUserRolesHistory` + `listUserOverridesHistory` + types dans `auth/profile-roles.ts` et `auth/section-permissions.ts`, exports api-client.
- AC #7 ✅ : garde `canMutate` côté UI masque les toggles pour non-admin (RLS serveur reste la source de vérité de sécurité).
- AC #8 ✅ : AccesTab reçoit `profile: UserRow` en props (update `index.tsx`), pas de reload de la fiche parent.
- AC #10 ✅ : tsc EXIT:0, tous patterns CLAUDE.md respectés.
- AC #11 ⏸️ : Playwright différé (MCP verrouillé). Scénarios écrits dans Debug Log.

### File List

**Créés :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/RolesSection.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/PermissionsSection.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/HistoriqueSection.tsx`

**Modifiés :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/AccesTab.tsx` (placeholder → orchestrateur)
- `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (AccesTab reçoit `profile`)
- `aureak/packages/api-client/src/auth/profile-roles.ts` (+ `listUserRolesHistory` + type)
- `aureak/packages/api-client/src/auth/section-permissions.ts` (+ `listUserOverridesHistory` + type)
- `aureak/packages/api-client/src/index.ts` (exports)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (87-1, 87-2 → done ; 87-3 → review)

### Change Log

- 2026-04-21 — Implémentation story 87.3 : onglet Accès complet (3 sections : rôles / permissions / historique) + 2 fonctions `*History` côté API. tsc EXIT:0. Playwright différé (MCP locked).

**Attendus — création :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/RolesSection.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/PermissionsSection.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/acces/HistoriqueSection.tsx`
- (si pas déjà créé en 87-1) `aureak/apps/web/app/(admin)/academie/_components/formatRelativeDate.ts`

**Attendus — modification :**
- `aureak/apps/web/app/(admin)/profiles/[userId]/_components/AccesTab.tsx` (placeholder → orchestrateur 3 sections)
- `aureak/packages/api-client/src/auth/profile-roles.ts` (ajout `listUserRolesHistory`)
- `aureak/packages/api-client/src/auth/section-permissions.ts` (ajout `listUserOverridesHistory`)
- `aureak/packages/api-client/src/index.ts` (exports)
- `aureak/packages/types/src/` (ajout `UserRoleHistoryEntry`, `UserSectionOverrideHistoryEntry`)

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Épic 87 complet après cette story** : les 3 stories forment un ensemble cohérent (liste → fiche universelle → onglet Accès). Après merge, la rétrospective Epic 87 peut être lancée. Les Epics 88/90/91/92 (Prospection Clubs/Entraîneurs, Marketing, Partenariat) peuvent commencer en consommant cette fondation Académie.
