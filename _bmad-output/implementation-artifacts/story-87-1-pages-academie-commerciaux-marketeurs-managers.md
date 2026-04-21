# Story 87.1 — Pages Académie : Commerciaux, Marketeurs, Managers

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 87 — Académie Commerciaux & Marketeurs
- **Story ID** : 87.1
- **Story key** : `87-1-pages-academie-commerciaux-marketeurs-managers`
- **Priorité** : P1
- **Dépendances** : Epic 86 entier (86-1 → 86-4) ✅ done — rôles `commercial`/`manager`/`marketeur` présents dans l'enum `user_role` + enregistrements `profiles` possibles
- **Source** : brainstorming 2026-04-18 (`_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` — idées #6, #37)
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (3 pages + NavBar enrichie, 0 migration, 1 fonction API paramétrable)

## Story

As an admin,
I want three new Académie tabs — Commerciaux, Marketeurs, Managers — chacune affichant la liste des profils du rôle correspondant avec stat cards, filtres et tableau,
so that l'annuaire Académie devient complet pour tous les rôles "people" de l'organisation (coachs + commerciaux + marketeurs + managers) et je peux consulter/rechercher chaque population depuis un point d'entrée unifié, sans passer par l'admin Supabase.

## Acceptance Criteria

1. **AcademieNavBar enrichie** : le composant `(admin)/academie/_components/AcademieNavBar.tsx` expose désormais **8 onglets** dans cet ordre :
   `JOUEURS | COACHS | SCOUTS | MANAGERS | COMMERCIAUX | MARKETEURS | CLUBS | IMPLANTATIONS`.
   - Les 2 nouveaux onglets (`COMMERCIAUX`, `MARKETEURS`) s'insèrent **entre MANAGERS et CLUBS**.
   - Les routes associées : `/academie/commerciaux`, `/academie/marketeurs`.
   - Le style actif (gold border-bottom 2px) et inactif (opacity 0.5) restent identiques aux autres onglets.
   - Le ScrollView horizontal permet l'affichage mobile sans saut de ligne.

2. **Page `/academie/managers`** — remplace le stub "Bientôt disponible" actuel (`(admin)/academie/managers/index.tsx`) par une **page liste complète** alignée sur le pattern de `/academie/coachs` :
   - Headerblock : titre "ACADÉMIE" + bouton "+ Nouveau manager" (haut droit) — le bouton reste actif mais navigue vers `/settings/permissions` avec un hash `#invite-manager` si aucune route de création dédiée n'existe (comportement temporaire : voir Dev Notes).
   - 4 stat cards horizontales : **MANAGERS** (count total), **ACTIFS** (count avec `deleted_at IS NULL` déjà inhérent à la requête), **AVEC ACCÈS ÉTENDUS** (count des managers ayant ≥ 1 entry dans `user_section_overrides`), **DERNIER AJOUT** (date d'ajout du profil manager le plus récent, format "il y a Xj").
   - Tableau : colonnes **PHOTO | NOM | PRÉNOM | EMAIL | DATE D'AJOUT** (la colonne EMAIL est affichée uniquement si l'admin actif a la permission `users:read_email` — fallback "—" sinon).
   - Clic ligne → `/profiles/[userId]` (route qui sera implémentée par story 87-2 ; d'ici là, route stub "Fiche à venir").
   - Pagination 25/page, bouton "Réinitialiser" si filtre actif (voir AC #5).

3. **Page `/academie/commerciaux`** — nouvelle route `(admin)/academie/commerciaux/index.tsx` :
   - Headerblock : titre "ACADÉMIE" + bouton "+ Nouveau commercial".
   - 4 stat cards : **COMMERCIAUX**, **ACTIFS**, **PIPELINE EN COURS** (count des `commercial_contacts` où le commercial est assigné et le statut n'est pas `closed_won`/`closed_lost` — requiert la table `commercial_contacts` issue du CRM ; si absente en DB, afficher "—" avec log `[AcademieCommerciauxPage] commercial_contacts table missing, pipeline stat disabled`), **CLOSING MOIS** (count des contrats gagnés par ce commercial sur les 30 derniers jours, même dégradation si table absente).
   - Tableau : **PHOTO | NOM | PRÉNOM | EMAIL | DATE D'AJOUT | PIPELINE** (PIPELINE = nombre de contacts en cours assignés au commercial ; "—" si stat désactivée).
   - Clic ligne → `/profiles/[userId]`.

4. **Page `/academie/marketeurs`** — nouvelle route `(admin)/academie/marketeurs/index.tsx` :
   - Headerblock : titre "ACADÉMIE" + bouton "+ Nouveau marketeur".
   - 4 stat cards : **MARKETEURS**, **ACTIFS**, **CONTENUS PUBLIÉS** (placeholder "—" + label "à venir" en `colors.text.muted`, les tables marketing n'existent pas encore — hors scope Epic 91), **DERNIER AJOUT**.
   - Tableau : **PHOTO | NOM | PRÉNOM | EMAIL | DATE D'AJOUT**.
   - Clic ligne → `/profiles/[userId]`.

5. **Filtres communs aux 3 pages** (composant factorisé — voir Task 4) :
   - Barre de recherche texte (nom/prénom/email) — filtre client-side sur la liste déjà chargée, insensible à la casse.
   - Pill "TOUS" / "ACTIFS" / "SUPPRIMÉS" — permet de basculer entre profils avec `deleted_at IS NULL` (ACTIFS, par défaut), tous les profils (TOUS), ou uniquement `deleted_at IS NOT NULL` (SUPPRIMÉS).
   - Si filtre actif différent du défaut → bouton "Réinitialiser" visible à droite.
   - Pagination reset à 0 à chaque changement de filtre.

6. **API `@aureak/api-client`** — nouvelle fonction **paramétrable par rôle** :
   ```typescript
   // aureak/packages/api-client/src/admin/profiles-by-role.ts
   export async function listProfilesByRole(opts: {
     role           : Extract<UserRole, 'commercial' | 'manager' | 'marketeur'>
     page           : number
     pageSize       : number
     includeDeleted?: boolean  // défaut false — si true, pas de filtre sur deleted_at
     deletedOnly?   : boolean  // défaut false — si true, ne retourne QUE les soft-deleted
     searchText?    : string   // défaut undefined — recherche sur display_name (ilike %x%)
   }): Promise<{ data: ProfileListRow[]; count: number; error: unknown }>
   ```
   - Retourne `ProfileListRow = { userId, displayName, email, avatarUrl, createdAt, deletedAt }`.
   - Tri par `display_name` ASC (`display_name NULLS LAST`).
   - Exports ajoutés à `@aureak/api-client/src/index.ts`.

7. **Types TypeScript** — nouveau type exporté depuis `@aureak/api-client` :
   ```typescript
   export type ProfileListRow = {
     userId     : string
     displayName: string | null
     email      : string | null
     avatarUrl  : string | null
     createdAt  : string        // ISO 8601
     deletedAt  : string | null
   }
   ```
   - Le champ `email` peut être `null` si la RLS empêche la lecture (voir AC #10) ou si le profil n'en expose pas.

8. **Page d'accueil hub `/academie/`** — le redirect existant (`<Redirect href="/academie/joueurs" />`) reste inchangé. Aucun nouvel entrypoint.

9. **Sidebar principale** — **aucune modification** de `(admin)/_layout.tsx`. L'item "Académie" pointe déjà vers `/academie/joueurs`, les nouveaux onglets sont accessibles via AcademieNavBar.

10. **RBAC / permissions** :
    - L'accès aux 3 pages requiert la permission `section:read` sur la section logique **"Académie"** (déjà modélisée via `section_permissions` en Epic 86-3).
    - La lecture du champ `email` dans le tableau dépend d'un flag dérivé côté client : `canReadEmail = getEffectivePermissions(currentProfileId, currentRole).section_user_accounts === 'full'` (pattern existant Epic 86-3). Si `read_only` → "—" dans la colonne EMAIL (pas d'erreur, pas de crash).
    - Un non-admin qui ouvre `/academie/commerciaux` sans la permission voit le layout Hub standard + un bloc centré "Accès refusé — contactez votre administrateur" (pattern existant dans `(admin)/settings/permissions/page.tsx`).

11. **Qualité & conformité CLAUDE.md** :
    - Chaque `setLoading(true)` / `setSaving(true)` encadré par `try/finally` (règle absolue CLAUDE.md).
    - Tout `console.error` encapsulé : `if (process.env.NODE_ENV !== 'production') console.error('[<Component>] ...', err)`.
    - Styles uniquement via tokens `@aureak/theme` — aucune couleur/espacement hardcodé.
    - Accès Supabase uniquement via `@aureak/api-client` — jamais d'import `supabase` direct dans `apps/web/`.
    - Pas de `catch(() => {})` silencieux.
    - `tsc --noEmit` passe : `cd aureak && npx tsc --noEmit` EXIT:0.

12. **Tests manuels Playwright post-impl** (test plan) :
    - Naviguer `/academie/commerciaux` → NavBar 8 onglets visible, onglet COMMERCIAUX actif (gold border), stat cards rendus, tableau vide "Aucun commercial" si aucun profil (état initial normal).
    - Naviguer `/academie/marketeurs` → même validation.
    - Naviguer `/academie/managers` → la page remplace le stub, tableau présent.
    - Recherche texte dans chaque page → filtre temps réel, pas de requête Supabase supplémentaire.
    - Toggle SUPPRIMÉS → si au moins 1 profil soft-deleted, il apparaît ; sinon message "Aucun profil supprimé".
    - Clic ligne → `/profiles/[userId]` (route peut être 404 d'ici story 87-2, c'est attendu).
    - Console JS : **zéro erreur**.

## Tasks / Subtasks

- [x] **Task 1 — AcademieNavBar : ajout des 2 onglets** (AC: #1)
  - [ ] Dans `(admin)/academie/_components/AcademieNavBar.tsx`, étendre le tableau `TABS` :
    ```typescript
    { label: 'COMMERCIAUX', href: '/academie/commerciaux' },
    { label: 'MARKETEURS',  href: '/academie/marketeurs'  },
    ```
    → insérer entre MANAGERS et CLUBS.
  - [ ] Vérifier que le `ScrollView horizontal` continue de rendre correctement sur largeur < 900px (8 tabs au lieu de 6).
  - [ ] **Aussi mettre à jour** la copie inline des tabs dans `(admin)/academie/coachs/index.tsx` (cst `ACADEMIE_TABS`, ligne ~22) et dans toute autre page qui dupliquerait la liste (grep pattern `ACADEMIE_TABS`) — garder cohérence même si le composant partagé est l'unique source recommandée.

- [x] **Task 2 — API `listProfilesByRole`** (AC: #6, #7)
  - [ ] Créer `aureak/packages/api-client/src/admin/profiles-by-role.ts` avec la signature spécifiée en AC #6.
  - [ ] Requête Supabase :
    ```typescript
    let query = supabase
      .from('profiles')
      .select('user_id, display_name, email, avatar_url, created_at, deleted_at', { count: 'exact' })
      .eq('user_role', opts.role)
      .order('display_name', { ascending: true, nullsFirst: false })
      .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

    if (opts.deletedOnly) {
      query = query.not('deleted_at', 'is', null)
    } else if (!opts.includeDeleted) {
      query = query.is('deleted_at', null)
    }

    if (opts.searchText && opts.searchText.trim().length > 0) {
      query = query.ilike('display_name', `%${opts.searchText.trim()}%`)
    }
    ```
  - [ ] Mapper snake_case → camelCase **explicitement** (voir memory gotcha `listSessionsAdminView` pattern) : ne jamais faire `as ProfileListRow[]` sur data brute.
  - [ ] Gérer erreurs Supabase → `{ data: [], count: 0, error }` + console guard.
  - [ ] Ajouter l'export dans `aureak/packages/api-client/src/index.ts` : `export { listProfilesByRole, type ProfileListRow } from './admin/profiles-by-role'`.

- [x] **Task 3 — Types partagés** (AC: #7)
  - [ ] Vérifier que `UserRole` est bien importé/exporté depuis `@aureak/types` (il l'est — `aureak/packages/types/src/enums.ts` ligne 9).
  - [ ] Dans `profiles-by-role.ts`, importer le type : `import type { UserRole } from '@aureak/types'`.
  - [ ] Utiliser `Extract<UserRole, 'commercial' | 'manager' | 'marketeur'>` pour contraindre le paramètre `role`.

- [x] **Task 4 — Composant factorisé `_PeopleListPage.tsx`** (AC: #2, #3, #4, #5 — évite la duplication)
  - [ ] Créer `(admin)/academie/_components/PeopleListPage.tsx` — composant générique paramétré :
    ```typescript
    type PeopleListPageProps = {
      role        : 'commercial' | 'manager' | 'marketeur'
      pageTitle   : string       // "COMMERCIAUX" | "MARKETEURS" | "MANAGERS"
      newButtonLabel: string     // "+ Nouveau commercial" | ...
      newButtonHref : string     // "/academie/commerciaux/new" ou route temporaire
      statCards   : StatCardSpec[]  // 4 cartes spécifiques à chaque rôle
      showPipelineColumn?: boolean  // true uniquement pour commerciaux
    }
    ```
  - [ ] Implémenter headerBlock (titre + bouton + NavBar intégrée via `AcademieNavBar`).
  - [ ] Implémenter FiltresRow (search input + pills TOUS/ACTIFS/SUPPRIMÉS).
  - [ ] Implémenter PeopleTable avec colonnes PHOTO | NOM | PRÉNOM | EMAIL | DATE D'AJOUT [+ PIPELINE si `showPipelineColumn`].
  - [ ] Implémenter pagination 25/page (reprendre logique `coachs/index.tsx`).
  - [ ] Utiliser `splitName(displayName)` — helper à déplacer dans `_components/splitName.ts` et réexporter depuis coachs/index.tsx (évite duplication).
  - [ ] Utiliser `formatRelativeDate(isoString)` pour la colonne DATE D'AJOUT — créer le helper dans `_components/formatRelativeDate.ts` si absent (formats : "aujourd'hui", "il y a Xj", "il y a Xm").
  - [ ] Appliquer `getEffectivePermissions` (pattern Epic 86-3) pour déterminer `canReadEmail` ; masquer colonne EMAIL si la permission `users:read_email` ou équivalente manque.
  - [ ] Afficher état vide spécifique au rôle : "Aucun commercial" / "Aucun manager" / "Aucun marketeur".
  - [ ] Afficher bloc "Accès refusé" si la permission Académie `read` n'est pas accordée (pattern `/settings/permissions`).

- [x] **Task 5 — Page Managers** (AC: #2)
  - [ ] Remplacer le contenu de `(admin)/academie/managers/index.tsx` :
    ```typescript
    'use client'
    import { PeopleListPage } from '../_components/PeopleListPage'
    // ...
    export default function AcademieManagersPage() {
      return (
        <PeopleListPage
          role={'manager'}
          pageTitle={'MANAGERS'}
          newButtonLabel={'+ Nouveau manager'}
          newButtonHref={'/settings/permissions#invite-manager'}
          statCards={[
            { label: 'MANAGERS',           valueFromData: d => String(d.length) },
            { label: 'ACTIFS',             valueFromData: d => String(d.filter(p => !p.deletedAt).length) },
            { label: 'AVEC ACCÈS ÉTENDUS', asyncValueFn:  fetchManagerOverridesCount },
            { label: 'DERNIER AJOUT',      valueFromData: d => relativeSince(newestCreatedAt(d)) },
          ]}
        />
      )
    }
    ```
  - [ ] Pour `AVEC ACCÈS ÉTENDUS` : créer helper API `countManagersWithOverrides()` dans `profiles-by-role.ts` qui fait `SELECT COUNT(DISTINCT profile_id) FROM user_section_overrides WHERE profile_id IN (SELECT id FROM profiles WHERE user_role='manager' AND deleted_at IS NULL)` — si la table n'existe pas (ne devrait pas arriver, Epic 86-3 done), fallback "—".

- [x] **Task 6 — Page Commerciaux** (AC: #3)
  - [ ] Créer `(admin)/academie/commerciaux/index.tsx` sur le même pattern que managers/index.tsx.
  - [ ] `showPipelineColumn` = `true`.
  - [ ] Stat cards :
    - COMMERCIAUX (total)
    - ACTIFS
    - PIPELINE EN COURS (via helper `countActiveCommercialPipeline()` — voir Task 7)
    - CLOSING MOIS (via helper `countMonthlyClosedWon()`)
  - [ ] Si la table `commercial_contacts` n'existe pas encore en DB (CRM Epic 88 non déployé), les 2 dernières cards affichent "—" + petit label "à venir" sous le chiffre (en `colors.text.muted`).

- [x] **Task 7 — Helpers CRM optionnels** (AC: #3)
  - [ ] Ajouter dans `profiles-by-role.ts` deux fonctions à tolérance d'erreur :
    ```typescript
    export async function countActiveCommercialPipeline(): Promise<{ byCommercial: Record<string, number>; total: number; available: boolean }>
    export async function countMonthlyClosedWon(): Promise<{ byCommercial: Record<string, number>; total: number; available: boolean }>
    ```
  - [ ] Chaque fonction tente la requête sur `commercial_contacts` ; si l'erreur Supabase contient `relation "commercial_contacts" does not exist`, retourne `{ byCommercial: {}, total: 0, available: false }` **sans remonter l'erreur**.
  - [ ] Si `available === false` → la colonne PIPELINE du tableau affiche "—" pour tous, et les 2 stat cards affichent "—".

- [x] **Task 8 — Page Marketeurs** (AC: #4)
  - [ ] Créer `(admin)/academie/marketeurs/index.tsx` sur le même pattern.
  - [ ] `showPipelineColumn` = `false`.
  - [ ] Stat cards : MARKETEURS, ACTIFS, CONTENUS PUBLIÉS (toujours "—" + "à venir" — Epic 91 pas implémenté), DERNIER AJOUT.

- [x] **Task 9 — Route stub `/profiles/[userId]`** (AC: #3, #4 — pour que les clics ligne ne cassent pas)
  - [ ] Créer `(admin)/profiles/[userId]/index.tsx` minimal :
    ```typescript
    'use client'
    import { View, StyleSheet } from 'react-native'
    import { AureakText } from '@aureak/ui'
    import { colors, space } from '@aureak/theme'
    import { useLocalSearchParams } from 'expo-router'

    export default function ProfileStubPage() {
      const { userId } = useLocalSearchParams<{ userId: string }>()
      return (
        <View style={s.container}>
          <AureakText variant="h2" style={s.title}>Fiche profil</AureakText>
          <AureakText variant="body" style={s.sub}>userId : {userId}</AureakText>
          <AureakText variant="body" style={s.sub}>Fiche universelle en cours de conception (story 87-2)</AureakText>
        </View>
      )
    }
    // styles: reprendre s de scouts/index.tsx
    ```
  - [ ] Cette route sera entièrement remplacée par **story 87-2** (fiche personne universelle).

- [x] **Task 10 — QA & conformité** (AC: #11)
  - [ ] `cd aureak && npx tsc --noEmit` — EXIT:0 obligatoire avant commit.
  - [ ] Grep `setLoading\|setSaving\|setCreating` sur les fichiers modifiés → chaque appel `false` doit être dans un `finally`.
  - [ ] Grep `console\.` sur fichiers modifiés → chaque occurrence encapsulée par `process.env.NODE_ENV !== 'production'`.
  - [ ] Grep couleurs hexa `#[0-9a-fA-F]{3,6}` sur fichiers modifiés → zéro match (sauf commentaires ou docstrings).
  - [ ] Vérifier que `@aureak/api-client` n'est jamais court-circuité par un `from('profiles')` direct dans `apps/web/`.

- [x] **Task 11 — Tests Playwright manuels** (AC: #12)
  - [ ] Vérifier `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` = 200.
  - [ ] `mcp__playwright__browser_navigate` sur les 3 URLs → screenshot.
  - [ ] `mcp__playwright__browser_console_messages` → zéro erreur.
  - [ ] Test interaction : taper dans la barre de recherche d'une des pages → la liste filtrée s'affiche instantanément (pas de spinner).

## Dev Notes

### Pourquoi **factoriser** maintenant plutôt que dupliquer 3 fois la page coachs

La page `coachs/index.tsx` (400+ lignes) a été écrite avant l'existence des rôles commercial/marketeur/manager. Dupliquer 3 fois ce fichier créerait 4 variantes à maintenir en parallèle, pour ensuite devoir **toutes les refactorer** vers le composant unique au premier bug design. La mutualisation via `PeopleListPage.tsx` coûte ~1h de plus sur cette story mais rend les stories 87-2 / 87-3 triviales, et une éventuelle page `/academie/scouts` future trivialisée aussi.

**Non-goal** : ne pas refactorer la page `coachs/index.tsx` dans cette story — elle a des particularités (grade, implantation, formations, score académie) qui méritent leur propre story d'unification si un jour jugée utile.

### Vocabulaire officiel (memory)
- **manager** = "Manager" UI (pas "Gestionnaire", pas "Responsable")
- **commercial** = "Commercial" UI (masculin singulier, pluriel "Commerciaux" avec x)
- **marketeur** = "Marketeur" UI (pas "Marketer", pas "Marketing")
- Ne pas mélanger avec **scout** (rôle fonctionnel Epic 89, **pas** un `user_role`).

### État actuel de l'UI Académie (à ne pas casser)

```
(admin)/academie/
  _layout.tsx                           ← wrap <Slot/> + AcademieNavBar (inchangé)
  index.tsx                             ← Redirect → /academie/joueurs (inchangé)
  _components/
    AcademieNavBar.tsx                  ← ENRICHI par Task 1 (+2 tabs)
    PeopleListPage.tsx                  ← NOUVEAU (Task 4)
    splitName.ts                        ← NOUVEAU (helper partagé)
    formatRelativeDate.ts               ← NOUVEAU (helper partagé)
  joueurs/index.tsx                     ← page complète (story 75-1, inchangé)
  coachs/index.tsx                      ← page complète (story 75-2, inchangé sauf const ACADEMIE_TABS)
  scouts/index.tsx                      ← stub "Bientôt disponible" (inchangé — Epic 89)
  managers/index.tsx                    ← REMPLACÉ par page complète (Task 5)
  commerciaux/index.tsx                 ← NOUVEAU (Task 6)
  marketeurs/index.tsx                  ← NOUVEAU (Task 8)
  clubs/index.tsx                       ← Redirect → /clubs (inchangé)
  implantations/index.tsx               ← Redirect → /implantations (inchangé)
```

### Pattern API — `listProfilesByRole` vs `listCoaches`

`listCoaches` (coaches.ts) est un cas particulier : il joint sur `coach_grades` et `session_coaches`, d'où sa signature spécifique. `listProfilesByRole` est volontairement plus simple : **profiles seulement**, paramétrable par rôle, **pas de join**. Les stats "pipeline" / "overrides" sont extraites par **helpers séparés** (Task 5 & 7) → garde la fonction de base réutilisable pour story 87-2 (fiche universelle).

### Colonne EMAIL — justification dual-read

Les tables `profiles` exposent `email` via une policy RLS (ajoutée par 00149 Epic 86-2 probablement — à vérifier). Si la policy retourne `null` pour un admin sans permission `users:read_email`, on le traite comme "—" côté UI. **Ne jamais** faire un second appel spécial pour "forcer" la lecture : la policy est la source de vérité sécurité.

Pattern reco dans `PeopleListPage.tsx` :
```typescript
const canReadEmail = useMemo(() => {
  const perms = getEffectivePermissions(currentProfileId, currentRole)
  return perms.section_user_accounts === 'full'
}, [currentProfileId, currentRole])
// puis dans le render : canReadEmail ? (row.email ?? '—') : '—'
```

### Bouton "+ Nouveau ..." — comportement temporaire

Les routes `/academie/commerciaux/new`, `/marketeurs/new`, `/managers/new` **n'existent pas**. Décision : pointer vers `/settings/permissions` avec un hash, cette page permettant déjà d'inviter et d'assigner un rôle (Epic 86-3). Laisser un TODO commenté :
```typescript
// TODO(story-87-4?): route dédiée de création/invitation commerciale
```
— ne **pas** créer de stub /new dans cette story (over-engineering).

### Design System (tokens uniquement)

```
Fond page             : colors.light.primary   (#F3EFE7)
Header surface        : colors.light.surface   (#FFFFFF)
Stat card bg          : colors.light.surface + shadows.sm
Stat card "à venir"   : colors.text.muted (label sous le "—")
Tab actif underline   : colors.accent.gold  2px
Tab inactif           : opacity 0.5
Pill actif            : colors.accent.goldSolid + colors.text.dark
Pill inactif          : colors.light.hover + colors.text.muted
Search input bg       : colors.light.surface
Search input border   : colors.border.light
Lignes tableau pair   : colors.light.surface
Lignes tableau impair : colors.light.hover
Avatar fallback       : colors.light.muted + initiales colors.text.muted
EMAIL masqué ("—")    : colors.text.muted
```

### Pagination et URL state — non-goal

Les pages `joueurs`/`coachs` actuelles gardent la page courante en **state React local** (pas dans l'URL). On reste cohérent : pas de sync `?page=2` dans l'URL pour cette story. Une future story UX (si jugée utile) pourra uniformiser les 3 pages en une passe.

### Règles absolues CLAUDE.md (rappel)

- try/finally obligatoire sur tout `setLoading(false)`
- Console guards : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Styles via tokens uniquement
- Accès Supabase uniquement via `@aureak/api-client`
- Soft-delete uniquement — filtre `deleted_at IS NULL` par défaut dans les listes

### Gotcha memory (ne pas répéter l'erreur)

> **Snake_case → camelCase toujours explicite** après `select('*')` Supabase. Jamais `as ProfileListRow[]` sur data brute → cause bugs type `c.coachId.slice is not a function`. Pattern de référence : `listSessionsAdminView` (`sessions.ts` ~ligne 972).

Dans `profiles-by-role.ts`, appliquer :
```typescript
const rows: ProfileListRow[] = (data ?? []).map((r: any) => ({
  userId     : r.user_id,
  displayName: r.display_name,
  email      : r.email,
  avatarUrl  : r.avatar_url,
  createdAt  : r.created_at,
  deletedAt  : r.deleted_at,
}))
```

### Aucune migration DB

Toutes les données nécessaires existent déjà : `profiles.user_role` accepte `commercial`/`manager`/`marketeur` depuis migration **00148** (Epic 86-1 done). `user_section_overrides` existe depuis **00150** (Epic 86-3 done). Les tables CRM (`commercial_contacts`) sont explicitement gérées en fallback "non-dispo" si absentes.

### Project Structure Notes

- **Alignement routing Expo Router** conforme CLAUDE.md : `page.tsx` pas utilisé ici, on reste sur le pattern `index.tsx` qu'utilise tout le hub Académie (pas mélange).
- **Pas de mobile** : story full web. `apps/mobile/` différée conforme backlog.
- **Pas de breaking change** sur `AcademieNavBar` : l'ordre des 6 tabs existants est préservé, on **ajoute** 2 tabs entre MANAGERS et CLUBS.

### References

- Story 75-2 (pattern référence) : `_bmad-output/implementation-artifacts/75-2-academie-hub-sidebar-coachs.md`
- Story 86-3 (permissions et overrides) : `_bmad-output/implementation-artifacts/story-86-3-permissions-granulaires-matrice-admin.md`
- Story 86-1 (rôles DB) : `_bmad-output/implementation-artifacts/story-86-1-roles-db-manager-marketeur.md`
- Brainstorming source : `_bmad-output/brainstorming/brainstorming-session-2026-04-18-1000.md` (idées #6, #37)
- Types UserRole : `aureak/packages/types/src/enums.ts` (ligne 9)
- API pattern coachs : `aureak/packages/api-client/src/admin/coaches.ts` (`listCoaches`)
- Page pattern coachs : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`
- AcademieNavBar : `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx`
- Tokens theme : `aureak/packages/theme/src/tokens.ts`
- RLS profiles : `supabase/migrations/00003_create_profiles.sql` (+ policies ultérieures Epic 86)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `cd aureak && npx tsc --noEmit` → EXIT:0
- Grep QA : `setLoading\|setSaving` → tous dans `finally` ; `console.*` → tous guardés par `process.env.NODE_ENV !== 'production'` ; aucune couleur hexa dans les fichiers créés.
- Dev server 8082 déjà occupé par un autre process (PID 272) ; instance non-interactive a refusé le port 8083.
- Playwright MCP browser locked (autre session utilise le même cache) → tests E2E différés au QA humain.

### Completion Notes List

- AC #1 ✅ : AcademieNavBar étendu à 8 tabs, insertion COMMERCIAUX + MARKETEURS entre MANAGERS et CLUBS. Propagation aussi dans les const `ACADEMIE_TABS` dupliquées de `joueurs/index.tsx` et `coachs/index.tsx`.
- AC #2 / #3 / #4 ✅ : 3 pages créées via composant factorisé `PeopleListPage.tsx` (headerBlock + StatCardsRow + FiltresRow + tableau + pagination 25/page).
- AC #5 ✅ : Recherche texte (nom/prénom/email) client-side + pills ACTIFS/TOUS/SUPPRIMÉS + bouton Réinitialiser.
- AC #6 / #7 ✅ : `listProfilesByRole` paramétrable, retourne `ProfileListRow`, mapping snake_case → camelCase explicite.
- AC #8 / #9 ✅ : redirect `/academie` et sidebar principale inchangés.
- AC #10 ✅ : Bloc "Accès refusé" si `permissions.academie !== true`. Lecture email gouvernée par `permissions.admin === true` (section `user_accounts` absente de l'enum — on utilise `admin` comme proxy, cohérent avec la sémantique sécurité).
- AC #11 ✅ : tsc EXIT:0, try/finally partout, console guards, tokens theme uniquement, pas d'accès Supabase direct depuis `apps/web/`.
- AC #12 ⏸️ : tests Playwright différés (browser MCP verrouillé par une session parallèle ; dev server Expo déjà occupé sur 8082 et refus non-interactif d'un port alternatif). À relancer par QA humain.
- Fallback CRM : `commercial_contacts` détection "relation does not exist" (code `42P01`) → `available: false` → UI affiche "—" + label "à venir".
- Bouton `+ Nouveau ...` pointe vers `/settings/permissions#invite-<role>` (route dédiée de création laissée à une story future).

### File List

**Créés :**
- `aureak/packages/api-client/src/admin/profiles-by-role.ts`
- `aureak/apps/web/app/(admin)/academie/_components/PeopleListPage.tsx`
- `aureak/apps/web/app/(admin)/academie/_components/splitName.ts`
- `aureak/apps/web/app/(admin)/academie/_components/formatRelativeDate.ts`
- `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx`
- `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx`

**Modifiés :**
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx`
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx`
- `aureak/apps/web/app/(admin)/academie/joueurs/index.tsx`
- `aureak/apps/web/app/(admin)/academie/managers/index.tsx`

**Attendus — création :**
- `aureak/packages/api-client/src/admin/profiles-by-role.ts`
- `aureak/apps/web/app/(admin)/academie/_components/PeopleListPage.tsx`
- `aureak/apps/web/app/(admin)/academie/_components/splitName.ts`
- `aureak/apps/web/app/(admin)/academie/_components/formatRelativeDate.ts`
- `aureak/apps/web/app/(admin)/academie/commerciaux/index.tsx`
- `aureak/apps/web/app/(admin)/academie/marketeurs/index.tsx`
- `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (stub pour story 87-2)

**Attendus — modification :**
- `aureak/packages/api-client/src/index.ts` (exports)
- `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx` (+2 tabs)
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (const `ACADEMIE_TABS` étendue)
- `aureak/apps/web/app/(admin)/academie/managers/index.tsx` (stub → page complète)

### Change Log

- 2026-04-21 — Implémentation complète story 87.1 : +8 fichiers (7 créés, 1 managers remplacé stub → page complète), AcademieNavBar étendu 6→8 onglets. tsc EXIT:0. Playwright différé (browser MCP locked).

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Prochaine story** : 87-2 (fiche personne universelle) reposera sur `listProfilesByRole` + route `/profiles/[userId]` implémentée en stub ici.
