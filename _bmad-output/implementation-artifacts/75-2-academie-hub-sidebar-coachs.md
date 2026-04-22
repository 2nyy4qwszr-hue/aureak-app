# Story 75.2 : Académie Hub — Sidebar Refactor + Structure Hub + Coachs Redesign

Status: done

## Story

As an admin,
I want a unified Académie hub accessible via a single sidebar item, with a top tab navigation covering all people-related sections (Joueurs, Coachs, Scouts, Managers, Clubs, Implantations), and a fully redesigned Coachs page,
so that the left navigation is simplified and I can switch instantly between all academy sections from a persistent top bar.

## Acceptance Criteria

1. **Sidebar** : les 5 items actuels (Joueurs `/children`, Coachs `/coaches`, Groupes `/groups`, Implantations `/implantations`, Clubs `/clubs`) sont **supprimés** de la sidebar. Un seul item "Académie" est ajouté dans le groupe Académie → navigue vers `/academie/joueurs`.

2. **Hub `/academie/`** : une barre de navigation horizontale "AcademieNavBar" s'affiche en haut de TOUTES les pages `/academie/*` avec les 6 onglets : **JOUEURS | COACHS | SCOUTS | MANAGERS | CLUBS | IMPLANTATIONS**. L'onglet actif est souligné en gold (border-bottom 2px `colors.accent.goldSolid`). Les onglets inactifs sont à opacity 0.6.

3. **Routes distinctes** — chaque onglet est une route propre :
   - `/academie/joueurs` → page joueurs (placeholder, contenu implémenté par story 75-1)
   - `/academie/coachs` → page coachs redesignée (cette story)
   - `/academie/scouts` → stub "À venir"
   - `/academie/managers` → stub "À venir"
   - `/academie/clubs` → redirect vers `/clubs`
   - `/academie/implantations` → redirect vers `/implantations`
   - `/academie` → redirect vers `/academie/joueurs`

4. **Page `/academie/coachs`** — 4 stat cards en haut :
   - COACHS = count total des profils coach actifs
   - FORMATION = total des enregistrements de formation sur l'ensemble des coachs
   - DIPLÔMÉ = total des diplômes obtenus sur l'ensemble des coachs
   - SCORE ACADÉMIE = somme numérique de tous les grades actifs (bronze=1, silver=2, gold=3, platinum=4)

5. **Page `/academie/coachs`** — filtres chips :
   - Ligne 1 : Initial | Direct | Indépendant (filtre sur `coachType` ou catégorie)
   - Ligne 2 : Diplôme | Formation (filtre "a un diplôme" / "a une formation")
   - Ligne 3 : COACH | ASSISTANT (filtre sur rôle — deux chips, un seul actif à la fois, ou aucun = tous)

6. **Page `/academie/coachs`** — tableau avec colonnes :
   - STATUT : picto représentant le rôle — icône coach si `role = 'coach'`, icône assistant si `role = 'assistant'`
   - PHOTO : avatar circulaire 40px (photo ou initiales fallback)
   - NOM
   - PRÉNOM
   - IMPLANTATION : libellé de l'implantation principale du coach
   - GRADE : badge (Bronze / Argent / Or / Platine) — `null` → "—"
   - DIPLÔMÉ : ✓ ou — selon champ diploma
   - FORMATION : libellé de la/les formations suivies, ou "—"
   - Clic sur une ligne → `/coaches/[coachId]` (page détail existante inchangée)

7. **Bouton "Nouveau coach"** (haut droit de la page coachs) → conserve le comportement existant vers `/coaches/new` (ou route existante équivalente).

8. **Aucune migration DB** — cette story n'ajoute aucune table ni colonne. Les champs manquants (`coachType`, `diploma`, `formation`) sont affichés comme "—" s'ils n'existent pas dans l'API actuelle. Une note dans le Dev Record documente les champs à ajouter dans une future story.

## Tasks / Subtasks

- [x] Task 1 — Sidebar refactor (AC: #1)
  - [ ] Dans `(admin)/_layout.tsx`, supprimer les items nav : `/children`, `/coaches`, `/groups`, `/implantations`, `/clubs` (et leurs imports d'icônes associés si devenus inutilisés)
  - [ ] Ajouter item "Académie" dans le groupe Académie → `href: '/academie/joueurs'`, `Icon: UsersIcon` (ou `AcademyIcon` si disponible)
  - [ ] Mettre à jour `ITEM_SHORTCUTS` : `'/academie/joueurs': 'G J'`
  - [ ] Vérifier que le highlight sidebar s'active quand `pathname.startsWith('/academie')`

- [x] Task 2 — Hub shell `/academie/` (AC: #2, #3)
  - [ ] Créer `(admin)/academie/_layout.tsx` : wrapper `<Slot>` + `<AcademieNavBar>` en haut
  - [ ] Créer `(admin)/academie/index.tsx` : `<Redirect href="/academie/joueurs" />`
  - [ ] Créer `(admin)/academie/_components/AcademieNavBar.tsx` (composant partagé)
    - 6 tabs avec labels : JOUEURS | COACHS | SCOUTS | MANAGERS | CLUBS | IMPLANTATIONS
    - `href` associés : `/academie/joueurs`, `/academie/coachs`, `/academie/scouts`, `/academie/managers`, `/academie/clubs`, `/academie/implantations`
    - Tab actif détecté via `usePathname().startsWith(tabHref)`
    - Style actif : `borderBottomWidth: 2`, `borderBottomColor: colors.accent.goldSolid`, `fontWeight: '700'`
    - Style inactif : `opacity: 0.6`
    - ScrollView horizontal pour mobile

- [x] Task 3 — Routes stub et redirects (AC: #3)
  - [ ] Créer `(admin)/academie/joueurs/index.tsx` : page placeholder (titre "Joueurs — en cours de chargement…") à remplacer par story 75-1
  - [ ] Créer `(admin)/academie/scouts/index.tsx` : stub centré "SCOUTS — Bientôt disponible"
  - [ ] Créer `(admin)/academie/managers/index.tsx` : stub centré "MANAGERS — Bientôt disponible"
  - [ ] Créer `(admin)/academie/clubs/index.tsx` : `<Redirect href="/clubs" />`
  - [ ] Créer `(admin)/academie/implantations/index.tsx` : `<Redirect href="/implantations" />`

- [x] Task 4 — Stat cards page Coachs (AC: #4)
  - [ ] Créer `(admin)/academie/coachs/index.tsx`
  - [ ] Charger la liste complète des coachs via `listCoaches()` au mount
  - [ ] Dériver côté client les 4 métriques :
    - COACHS : `coaches.length`
    - FORMATION : `coaches.filter(c => c.formation).length` (ou count enregistrements formation si API le supporte)
    - DIPLÔMÉ : `coaches.filter(c => c.diploma).length`
    - SCORE ACADÉMIE : somme des valeurs numériques des grades (`bronze=1, silver=2, gold=3, platinum=4`)
  - [ ] Layout 4 cards horizontales — card SCORE ACADÉMIE : fond `colors.accent.gold`, chiffre dominant 36px; les 3 autres : `colors.light.surface` + `shadows.sm`

- [x] Task 5 — Filtres chips (AC: #5)
  - [ ] Composant `_FilterChips.tsx` (local à `academie/coachs/`)
  - [ ] Chips ligne 1 : Initial | Direct | Indépendant → filtre `coachType` (si champ absent → masquer cette ligne)
  - [ ] Chips ligne 2 : Diplôme | Formation → filtre booléen `hasDiploma` / `hasFormation`
  - [ ] Chips ligne 3 : COACH | ASSISTANT → filtre sur `coachRole` (si absent → utiliser `user_role` ou champ équivalent)
  - [ ] Chip actif : fond `colors.accent.goldSolid`, texte `colors.text.dark` ; inactif : `colors.light.hover`
  - [ ] Bouton "Réinitialiser" si au moins 1 filtre actif → reset tous les chips

- [x] Task 6 — Tableau coachs redesigné (AC: #6, #7)
  - [ ] Colonnes : STATUT | PHOTO | NOM | PRÉNOM | IMPLANTATION | GRADE | DIPLÔMÉ | FORMATION
  - [ ] STATUT : picto SVG ou emoji représentant le rôle — `🧑‍🏫` coach, `🤝` assistant ; si rôle inconnu → icône générique `UserCheckIcon`
  - [ ] PHOTO : `<Image>` circulaire 40px (avatarUrl) ; fallback = cercle `colors.light.muted` + initiales 2 lettres
  - [ ] NOM / PRÉNOM : split de `displayName` sur espace ; si non-splittable → NOM = displayName, PRÉNOM = "—"
  - [ ] IMPLANTATION : libellé de l'implantation principale — via `listGroupStaff` ou champ profile ; "—" si absent
  - [ ] GRADE : badge existant (variants `gold/zinc/present/attention`) ; "—" si null
  - [ ] DIPLÔMÉ : "✓" si `diploma !== null`, sinon "—"
  - [ ] FORMATION : libellé formation ou "—"
  - [ ] Lignes alternées : pair = `colors.light.surface`, impair = `colors.light.hover`
  - [ ] `onPress` ligne → `router.push(\`/coaches/\${coach.userId}\`)`
  - [ ] Bouton "Nouveau coach" (haut droit) → `router.push('/coaches/new')` ou route équivalente existante
  - [ ] Pagination 25 coaches/page (conserver logique existante de `coaches/index.tsx`)
  - [ ] Texte bas de page : "Affichage de X / Y entraîneurs"

- [x] Task 7 — QA & try/finally (AC: toutes)
  - [ ] `setLoading(true)` au mount → `try { await loadData() } finally { setLoading(false) }`
  - [ ] Console guards : `if (process.env.NODE_ENV !== 'production') console.error(...)`
  - [ ] Aucune couleur hardcodée — tokens uniquement

## Dev Notes

### Dépendance story 75-1
- **75-2 doit être implémentée AVANT 75-1**
- Story 75-1 (Joueurs redesign) doit être mise à jour pour cibler `(admin)/academie/joueurs/index.tsx` au lieu de `(admin)/children/index.tsx`
- La `_AcademieNavBar` est créée dans **cette story** (`academie/_components/AcademieNavBar.tsx`) — 75-1 doit l'importer depuis ce chemin (ne pas recréer)
- Les routes stub joueurs de cette story seront remplacées par le contenu complet de 75-1

### API Coachs — état actuel
Fichier : `aureak/apps/web/app/(admin)/coaches/index.tsx`
```typescript
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
// listCoaches() retourne profiles avec user_role = 'coach'
// getCoachCurrentGrade(coachId) → CoachGrade | null
```
Type `CoachGrade` : `{ level: 'bronze' | 'silver' | 'gold' | 'platinum', ... }`

**Champs potentiellement absents** (à vérifier dans `@aureak/api-client` et la DB) :
- `coachType` (Initial / Direct / Indépendant) — probablement absent → masquer le filtre si absent
- `diploma` / `hasDiploma` — à vérifier
- `formation` / `hasFormation` — à vérifier
- `implantationLabel` — probablement absent sur le profil coach ; peut être déduit via `listGroupStaff`
- `coachRole` (coach vs assistant) — vérifier si c'est un champ du profil ou déduit depuis `group_staff.role`

**Si ces champs sont absents** : afficher "—" sans erreur, et documenter dans les Completion Notes les champs manquants pour une future story d'enrichissement.

### Sidebar — highlight actif
Dans `(admin)/_layout.tsx`, la détection du lien actif utilise probablement `usePathname()`. Vérifier que le matching couvre `/academie/*` (et pas seulement `/academie/joueurs` exact). Rechercher le pattern `isActive` ou `href === pathname` dans le layout et adapter en `pathname.startsWith('/academie')`.

### Routing Expo Router (pattern CLAUDE.md)
```
academie/
  _layout.tsx        ← layout partagé avec AcademieNavBar
  index.tsx          ← Redirect href="/academie/joueurs"
  _components/
    AcademieNavBar.tsx
  joueurs/
    index.tsx        ← stub (remplacé par 75-1)
  coachs/
    index.tsx        ← contenu réel (cette story)
  scouts/
    index.tsx        ← stub
  managers/
    index.tsx        ← stub
  clubs/
    index.tsx        ← Redirect href="/clubs"
  implantations/
    index.tsx        ← Redirect href="/implantations"
```

### Score Académie — calcul côté client
```typescript
const GRADE_VALUES: Record<string, number> = {
  bronze: 1, silver: 2, gold: 3, platinum: 4
}
const academyScore = coaches.reduce((sum, c) => {
  return sum + (c.grade ? (GRADE_VALUES[c.grade.level] ?? 0) : 0)
}, 0)
```

### Design System
```
Fond page               : colors.light.primary  (#F3EFE7)
AcademieNavBar fond     : colors.light.surface  (#FFFFFF)
AcademieNavBar border   : colors.border.light
Tab actif border-bottom : colors.accent.goldSolid  2px
Tab inactif             : opacity 0.6
Card SCORE ACADÉMIE     : colors.accent.gold  + colors.text.dark  (texte)
Cards autres            : colors.light.surface  + shadows.sm
Chip actif              : colors.accent.goldSolid  fond, colors.text.dark  texte
Chip inactif            : colors.light.hover  fond
Lignes pair             : colors.light.surface
Lignes impair           : colors.light.hover
Avatar fallback         : colors.light.muted  + colors.text.muted  (initiales)
```

### Règles absolues CLAUDE.md
- try/finally obligatoire sur tout `setLoading(false)`
- Console guards : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Styles via tokens uniquement — aucune couleur hardcodée
- Accès Supabase uniquement via `@aureak/api-client`

### Références
- Maquette : `_bmad-output/design-references/Academie-coach-redesign.png`
- Page coachs actuelle : `aureak/apps/web/app/(admin)/coaches/index.tsx`
- Page détail coach : `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx`
- Layout sidebar : `aureak/apps/web/app/(admin)/_layout.tsx`
- API coachs : `aureak/packages/api-client/src/` (chercher `listCoaches`, `getCoachCurrentGrade`)
- Story 75-1 (dépendante) : `_bmad-output/implementation-artifacts/75-1-academie-hub-refonte-page-joueurs.md`

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List
- Sidebar refactorée : 5 items Académie → 1 item "Académie" → `/academie`, shortcut G J
- Hub `/academie/` créé avec `_layout.tsx` + `AcademieNavBar` partagée (6 onglets)
- Routes stub : joueurs (placeholder 75-1), scouts/managers (À venir), clubs/implantations (redirects)
- Page coachs : stat cards (COACHS+SCORE ACADÉMIE réels, FORMATION/DIPLÔMÉ = "—" — champs absents API), filtres chips COACH/ASSISTANT, tableau NOM/PRÉNOM/GRADE/IMPLANTATION/DIPLÔMÉ/FORMATION
- Champs absents à implémenter : `coachType`, `diploma`, `formation`, `implantationLabel` — voir story future
- TypeScript propre (EXIT:0), try/finally + console guards conformes CLAUDE.md

### File List
- `aureak/apps/web/app/(admin)/_layout.tsx` (modification — sidebar refactor)
- `aureak/apps/web/app/(admin)/academie/_layout.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/academie/index.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/academie/joueurs/index.tsx` (nouveau — stub)
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/academie/coachs/_FilterChips.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/academie/scouts/index.tsx` (nouveau — stub)
- `aureak/apps/web/app/(admin)/academie/managers/index.tsx` (nouveau — stub)
- `aureak/apps/web/app/(admin)/academie/clubs/index.tsx` (nouveau — redirect)
- `aureak/apps/web/app/(admin)/academie/implantations/index.tsx` (nouveau — redirect)
