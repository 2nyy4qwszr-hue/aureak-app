# Story 18.1 : Fiche Joueur 360° — Vue Admin Complète

Status: done

## Story

En tant qu'Admin,
Je veux accéder à une fiche complète d'un joueur auth (profiles) depuis la page Présences,
afin d'avoir une vision 360° de son suivi : présences, évaluations coach, progression pédagogique, gamification, et informations administratives que lui ne voit pas.

## Acceptance Criteria

**AC1 — Toggle "Vue par joueur" dans la page Présences**
- **When** l'Admin clique sur un bouton "Par joueur" dans la page `/attendance`
- **Then** la page bascule d'une liste de séances vers une liste de joueurs
- **And** chaque joueur affiche : nom, implantation/groupe, taux de présence, nombre de séances (présent / total), dernier statut connu
- **And** les filtres période + implantation + groupe restent actifs et filtrent la liste
- **And** un bouton "Par séance" permet de revenir à la vue actuelle

**AC2 — Navigation vers la fiche 360°**
- **When** l'Admin clique sur un joueur dans la vue par joueur
- **Then** il navigue vers `/players/[playerId]`
- **And** un bouton retour ← permet de revenir à la page Présences

**AC3 — Fiche 360° — En-tête & Identité**
- **When** l'Admin charge `/players/[playerId]`
- **Then** il voit : prénom, nom, rôle (child), statut du compte (pending / active / suspended), groupe actuel, implantation
- **And** si `child_metadata` existe : date de naissance, genre, pied fort, catégorie (Foot 5/8/11/Senior), club actuel
- **And** un badge de statut académie est affiché si disponible via `getChildAcademyStatus`

**AC4 — Fiche 360° — Présences (vue admin complète)**
- **And** une section "Présences" affiche :
  - KPIs : total séances, présent, absent, taux, retards
  - Mini-chart des 20 dernières présences (barres colorées comme dans vue parent)
  - Liste des 30 dernières séances avec : date, groupe, statut présence (pill coloré), évaluation globale si disponible
- **And** l'Admin peut étendre la période avec un filtre date local à cette section

**AC5 — Fiche 360° — Évaluations coach (données admin only)**
- **And** une section "Évaluations" affiche ce que le joueur ne voit PAS :
  - Moyenne des signaux coach sur la période : Réceptivité, Goût d'effort, Attitude (via `session_evaluations_merged`)
  - Indicateur "Top Séance" : nombre de fois sélectionné / nombre de séances évaluées
  - Timeline des dernières évaluations avec le détail des 4 signaux par séance
  - Notes de séance coach si disponibles (via `session_notes` table)

**AC6 — Fiche 360° — Progression pédagogique**
- **And** une section "Progression" affiche (via `getChildThemeProgression`) :
  - Barre de maîtrise globale : % thèmes acquis / en cours / non commencés
  - Liste des thèmes avec leur statut (acquis ✓ / en cours ~ / non commencé ○)
  - Nombre de skill cards collectées (via `getSkillCardCollection`)
  - Quêtes actives actuelles (via `listActiveQuests`)

**AC7 — Fiche 360° — Gamification**
- **And** une section "Univers" affiche (via `getPlayerProgress`) :
  - Niveau actuel (Recrue → Immortel) + XP courant/suivant
  - Streak actuel (jours consécutifs)
  - Nombre total de badges débloqués
  - Aperçu avatar (si disponible via `getPlayerAvatar`)

**AC8 — Fiche 360° — Données administratives (admin uniquement)**
- **And** une section "Administratif" visible uniquement pour le rôle admin affiche :
  - Email compte (depuis `profiles`)
  - Téléphone
  - Notes internes (`internal_notes` dans `profiles`)
  - Statut invitation (`invite_status` : not_invited / invited / active)
  - Si `child_metadata` : contacts parents (prénom, nom, email, tél — parent 1 & 2)
  - Date de création du profil, dernier login

**AC9 — RLS : Admin uniquement**
- **And** la route `/players/[playerId]` est protégée dans le layout admin
- **And** toutes les requêtes de données utilisent le client Supabase avec le JWT de l'admin (RLS policies existantes couvrent déjà les accès admin sur toutes les tables concernées)
- **And** aucun appel direct Supabase — tout passe par `@aureak/api-client`

## Tasks / Subtasks

- [ ] Task 1 — Nouvelle API `getAdminPlayerProfile` (AC: #3, #4, #5, #8)
  - [ ] 1.1 Créer `packages/api-client/src/admin/playerProfile.ts`
  - [ ] 1.2 Fonction `getAdminPlayerProfile(playerId)` : query `profiles` + `child_metadata` JOIN (left) en une requête
  - [ ] 1.3 Fonction `getPlayerAttendanceHistory(playerId, { from?, to?, limit? })` : query `attendances` JOIN `sessions` + `groups` + `session_evaluations_merged` pour le joueur
  - [ ] 1.4 Exporter depuis `packages/api-client/src/index.ts`

- [ ] Task 2 — Vue "Par joueur" dans la page Présences (AC: #1)
  - [ ] 2.1 Ajouter toggle `viewMode: 'sessions' | 'players'` dans `attendance/index.tsx`
  - [ ] 2.2 Créer composant `PlayerRow` : nom, groupe/implantation, taux présence, dernière présence, flèche →
  - [ ] 2.3 Nouvelle API `listPlayersWithAttendance({ from, to, implantationId?, groupId? })` dans `api-client/src/sessions/attendances.ts` → GROUP BY child_id sur attendances JOIN profiles
  - [ ] 2.4 Connecter le clic sur `PlayerRow` → `router.push('/players/' + playerId)`

- [ ] Task 3 — Route `/players/[playerId]` (AC: #2)
  - [ ] 3.1 Créer `apps/web/app/(admin)/players/[playerId]/page.tsx` (composant principal)
  - [ ] 3.2 Créer `apps/web/app/(admin)/players/[playerId]/index.tsx` → re-export `./page`
  - [ ] 3.3 Ajouter `{ label: 'Joueurs', href: '/players' }` éventuellement dans le layout (optionnel — accessible via Présences suffit pour cette story)

- [ ] Task 4 — Section En-tête & Identité (AC: #3)
  - [ ] 4.1 Hero card : avatar initiales, nom complet, groupe + implantation badge, statut compte
  - [ ] 4.2 Chips infos : âge, pied fort, catégorie, club actuel (depuis `child_metadata`)
  - [ ] 4.3 Badge statut académie via `getChildAcademyStatus(playerId)`

- [ ] Task 5 — Section Présences (AC: #4)
  - [ ] 5.1 KPI row : total / présent / absent / retards / taux
  - [ ] 5.2 Mini-chart 20 dernières présences (barres colorées — réutiliser le pattern de `parent/children/[childId]/index.tsx`)
  - [ ] 5.3 Liste paginée des 30 dernières séances avec pill statut + signal éval global si dispo

- [ ] Task 6 — Section Évaluations (AC: #5)
  - [ ] 6.1 Moyennes des 4 signaux (receptivite, gout_effort, attitude, top_seance) via `getChildProfile(playerId)` ou query directe `session_evaluations_merged`
  - [ ] 6.2 Indicateur Top Séance : nb fois / nb séances évaluées
  - [ ] 6.3 Timeline dernières évaluations (10 dernières) avec 4 dots colorés par signal

- [ ] Task 7 — Section Progression & Gamification (AC: #6, #7)
  - [ ] 7.1 Barre maîtrise globale + liste thèmes (réutiliser `getChildThemeProgression`)
  - [ ] 7.2 XP bar + niveau via `getPlayerProgress`
  - [ ] 7.3 Streak + badges count
  - [ ] 7.4 Quêtes actives via `listActiveQuests`

- [ ] Task 8 — Section Administratif (AC: #8)
  - [ ] 8.1 Afficher email, téléphone, notes internes, invite_status depuis `profiles`
  - [ ] 8.2 Afficher contacts parents (parent1 + parent2) depuis `child_metadata`
  - [ ] 8.3 Dates de création et dernière connexion

## Dev Notes

### Architecture à respecter IMPÉRATIVEMENT

- **Accès Supabase** : UNIQUEMENT via `@aureak/api-client` — jamais d'import `supabase` direct dans les pages (règle ESLint du projet)
- **Styles** : UNIQUEMENT `colors.*`, `shadows.*`, `radius.*`, `transitions.*` depuis `@aureak/theme/tokens` — ZÉRO valeur hexadécimale hardcodée dans les composants
- **Thème** : Light Premium DA — fond `colors.light.primary` (#F3EFE7), cards `colors.light.surface` (#FFFFFF), accent `colors.accent.gold` (#C1AC5C), texte `colors.text.dark`
- **Composants** : utiliser `AureakText`, `AureakButton`, `Badge` depuis `@aureak/ui` quand disponible pour les éléments atomiques
- **Routing** : pattern obligatoire = `page.tsx` (logique) + `index.tsx` (re-export `./page`) pour les routes dynamiques

### Routing pattern

```
apps/web/app/(admin)/
├── players/
│   └── [playerId]/
│       ├── page.tsx     ← composant principal
│       └── index.tsx    ← export { default } from './page'
```

### Structure API recommandée

```typescript
// packages/api-client/src/admin/playerProfile.ts

export type AdminPlayerProfile = {
  // depuis profiles
  userId        : string
  tenantId      : string
  displayName   : string
  firstName     : string | null
  lastName      : string | null
  email?        : string    // auth.users — requiert service_role ou RPC
  phone         : string | null
  status        : 'pending' | 'active' | 'suspended' | 'deleted'
  inviteStatus  : 'not_invited' | 'invited' | 'active'
  internalNotes : string | null
  createdAt     : string
  // depuis child_metadata (nullable si non renseigné)
  birthDate     : string | null
  gender        : 'male' | 'female' | 'other' | null
  strongFoot    : 'right' | 'left' | 'both' | null
  ageCategory   : string | null
  currentClub   : string | null
  groupId       : string | null
  groupName?    : string
  implantationName?: string
  // contacts parents
  parentFirstName : string | null
  parentLastName  : string | null
  parentEmail     : string | null
  parentPhone     : string | null
  parent2FirstName: string | null
  parent2LastName : string | null
  parent2Email    : string | null
  parent2Phone    : string | null
}

export async function getAdminPlayerProfile(playerId: string): Promise<{
  data: AdminPlayerProfile | null; error: unknown
}>

export type PlayerAttendanceRecord = {
  attendanceId  : string
  sessionId     : string
  scheduledAt   : string
  groupName     : string | null
  status        : AttendanceStatus
  receptivite   : EvaluationSignal | null
  goutEffort    : EvaluationSignal | null
  attitude      : EvaluationSignal | null
  topSeance     : TopSeance | null
}

export async function getPlayerAttendanceHistory(
  playerId: string,
  opts?: { from?: string; to?: string; limit?: number }
): Promise<{ data: PlayerAttendanceRecord[]; error: unknown }>
```

### API pour la vue par joueur (Task 2.3)

```typescript
// dans packages/api-client/src/sessions/attendances.ts — AJOUTER

export type PlayerAttendanceSummary = {
  childId         : string
  displayName     : string
  groupId         : string | null
  groupName       : string | null
  implantationName: string | null
  totalSessions   : number
  presentCount    : number
  absentCount     : number
  lateCount       : number
  attendanceRate  : number   // 0-100
  lastAttendanceAt: string | null
  lastStatus      : AttendanceStatus | null
}

export async function listPlayersWithAttendance(params: {
  from           : string
  to             : string
  implantationId?: string
  groupId?       : string
}): Promise<PlayerAttendanceSummary[]>
```

La requête agrège `attendances` JOIN `profiles` JOIN `sessions` JOIN `groups` groupé par `child_id`.

### Données email auth (sensible)

L'email de connexion du joueur est dans `auth.users` (non accessible via RLS anon). Options :
1. **Option A (recommandée)** : créer une fonction RPC `get_user_email(p_user_id UUID)` SECURITY DEFINER accessible admin uniquement → retourne `email` depuis `auth.users`
2. **Option B** : afficher uniquement l'email depuis `profiles.email` si on décide d'y stocker une copie

Pour cette story, implémenter **Option B** (utiliser `profiles.email` si disponible, sinon masquer). Ne PAS créer de RPC pour l'email dans cette story (hors scope MVP de la fiche).

### Signaux d'évaluation — affichage

Les signaux `EvaluationSignal` = `'green' | 'orange' | 'red'`. Mapping couleur :
- `green` → `colors.status.present` (#66BB6A)
- `orange` → `colors.status.attention` (#FFA726)
- `red` → `colors.status.absent` (#EF5350)
- `null` → `colors.text.muted`

### Composants réutilisables déjà existants à copier/adapter

- **Mini-chart présences** : pattern de `apps/web/app/(parent)/parent/children/[childId]/index.tsx` (barres colorées 20 dernières séances)
- **Barre de maîtrise thèmes** : pattern de `apps/web/app/(parent)/parent/children/[childId]/progress/index.tsx`
- **ProgressBar %** : dans `apps/web/app/(admin)/dashboard/page.tsx`
- **KpiCard** : dans `apps/web/app/(admin)/dashboard/page.tsx`
- **AttendancePill** : dans `apps/web/app/(admin)/attendance/index.tsx`

### Sections de la page — ordre recommandé

```
[Hero : nom + statut + groupe/implantation]
[Tabs : Présences | Évaluations | Progression | Administratif]
```

Utiliser des onglets (tabs) plutôt qu'un défilement infini pour éviter de charger toutes les données d'un coup. Chaque tab charge ses données à la demande (lazy).

### Tests à écrire

- Unit : `listPlayersWithAttendance` — vérifier le calcul `attendanceRate`
- Unit : `getAdminPlayerProfile` — cas joueur sans `child_metadata`
- Pas de test E2E pour cette story (hors scope)

### Project Structure Notes

- Nouveau fichier API : `packages/api-client/src/admin/playerProfile.ts`
- Export à ajouter dans : `packages/api-client/src/index.ts`
- Nouvelles pages : `apps/web/app/(admin)/players/[playerId]/page.tsx` + `index.tsx`
- Modifier : `apps/web/app/(admin)/attendance/index.tsx` (ajout toggle + `PlayerRow`)
- Modifier : `packages/api-client/src/sessions/attendances.ts` (ajout `listPlayersWithAttendance`)

### References

- Routing pattern : [Source: MEMORY.md — "Routing pattern (Expo Router web/SPA)"]
- Design tokens : [Source: aureak/packages/theme/src/tokens.ts]
- Règle ESLint api-client : [Source: _bmad-output/planning-artifacts/architecture.md — "Règles d'enforcement"]
- Pattern mini-chart : [Source: apps/web/app/(parent)/parent/children/[childId]/index.tsx]
- Pattern tab lazy : [Source: apps/web/app/(admin)/coaches/[coachId]/grade.tsx et contact.tsx]
- API existante `getChildProfile` : [Source: packages/api-client/src/parent/childProfile.ts]
- API existante gamification : [Source: packages/api-client/src/gamification/progression.ts]
- Types `EvaluationSignal`, `TopSeance` : [Source: packages/types/src/entities.ts]
- Types `AttendanceStatus` : [Source: packages/types/src/enums.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented all 8 tasks (Tasks 1-8) in one session
- `EvaluationSignal` uses `'positive'|'attention'|'none'` (not green/orange/red as in Dev Notes)
- `PlayerProgress` type fields: `totalPoints`, `currentStreak`, `maxStreak`, `themesAcquiredCount` (no level/xp fields)
- Attendance page toggle uses RN `Pressable` + `useRouter` from expo-router for navigation
- Player page uses HTML `<div>` pattern (consistent with parent pages) not RN View

### File List

**À créer :**
- `packages/api-client/src/admin/playerProfile.ts`
- `apps/web/app/(admin)/players/[playerId]/page.tsx`
- `apps/web/app/(admin)/players/[playerId]/index.tsx`

**À modifier :**
- `packages/api-client/src/sessions/attendances.ts` (ajout `listPlayersWithAttendance` + type `PlayerAttendanceSummary`)
- `packages/api-client/src/index.ts` (exports des nouvelles fonctions)
- `apps/web/app/(admin)/attendance/index.tsx` (toggle vue + PlayerRow + navigation)