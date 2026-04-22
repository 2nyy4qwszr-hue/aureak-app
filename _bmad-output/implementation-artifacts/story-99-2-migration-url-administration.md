# Story 99.2 — Migrations URL racines vers `/administration/*`

Status: done

## Completion Notes

### Migrations effectuées (15 `git mv`)

| Ancienne URL | Nouvelle URL |
|---|---|
| `/profile` | `/administration/utilisateurs/profile` |
| `/access-grants` | `/administration/utilisateurs/access-grants` |
| `/grade-permissions` | `/administration/utilisateurs/grade-permissions` |
| `/waitlist` | `/administration/utilisateurs/waitlist` |
| `/onboarding` | `/administration/utilisateurs/onboarding` |
| `/settings/permissions` | `/administration/parametres/permissions` |
| `/settings/school-calendar` | `/administration/parametres/calendrier-scolaire` |
| `/gdpr` | `/administration/conformite/rgpd` |
| `/audit` | `/administration/conformite/audit` |
| `/anomalies` | `/administration/conformite/anomalies` |
| `/admin/rgpd/prospect-access` | `/administration/conformite/rgpd-prospects` |
| `/tickets` | `/administration/communication/tickets` |
| `/messages` | `/administration/communication/messages` |
| `/exports` | `/administration/exports` |

### Redirects 301

15 fichiers `index.tsx` avec `<Redirect href="..." />` créés aux anciennes URLs pour compat bookmarks/liens externes (durée 1 mois).

### Liens internes mis à jour

- `app/(admin)/_layout.tsx` — sidebar ADMIN_ITEMS (9 liens) + profil menu 6 occurrences `pathname === '/profile'` / `router.push('/profile')` → `/administration/utilisateurs/profile`
- `app/(admin)/administration/page.tsx` — 4 cards hub (paramètres, conformité, communication, exports)
- `constants/navCommands.ts` — command palette audit

### Non-fait (reporté)

- Dossiers sources `/admin/` (contenait juste rgpd/prospect-access) supprimés complètement. `/settings/` et autres laissés avec juste le redirect index.tsx (pas de cleanup agressif à cette étape).
- Tickets détail `[ticketId]` — tout le dossier migré en bloc (pas de redirect dédié, l'ancien chemin `/tickets/[id]` sera 404 à date sauf fallback custom à ajouter si besoin).
- `tsc --noEmit` EXIT 0.

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.2
- **Story key** : `99-2-migration-url-administration`
- **Priorité** : P1 (prérequis d'application template par groupe)
- **Dépendances** : **99.1** (hub) ; **bloque 99.3, 99.4, 99.5, 99.6**
- **Source** : Audit UI 2026-04-22. Pages admin dispersées entre racine et sous-dossiers — réorganiser sous `/administration/<groupe>/<page>`.
- **Effort estimé** : L (~6-8h — 12+ migrations URL + imports + redirects + grep liens)

## Story

As an admin,
I want que toutes les pages administratives dispersées à la racine (anomalies, audit, exports, waitlist, onboarding, access-grants, grade-permissions, gdpr, admin/rgpd) ET sous des sous-dossiers (settings, tickets, messages, profile) soient regroupées sous `/administration/<groupe>/<page>`,
So that la zone Administration soit structurée et cohérente.

## Contexte

### Mapping de migration

| URL actuelle | Nouvelle URL |
|---|---|
| `/profile` | `/administration/utilisateurs/profile` |
| `/access-grants` | `/administration/utilisateurs/access-grants` |
| `/grade-permissions` | `/administration/utilisateurs/grade-permissions` |
| `/waitlist` | `/administration/utilisateurs/waitlist` |
| `/onboarding` | `/administration/utilisateurs/onboarding` |
| `/settings/permissions` | `/administration/parametres/permissions` |
| `/settings/school-calendar` | `/administration/parametres/calendrier-scolaire` |
| `/gdpr` | `/administration/conformite/rgpd` |
| `/audit` | `/administration/conformite/audit` |
| `/anomalies` | `/administration/conformite/anomalies` |
| `/admin/rgpd/prospect-access` | `/administration/conformite/rgpd-prospects` |
| `/tickets` | `/administration/communication/tickets` |
| `/tickets/[ticketId]` | `/administration/communication/tickets/[ticketId]` |
| `/messages` | `/administration/communication/messages` |
| `/exports` | `/administration/exports` |

### Dossiers à supprimer après migration

- `/profile/`, `/access-grants/`, `/grade-permissions/`, `/waitlist/`, `/onboarding/`
- `/settings/` (entier)
- `/gdpr/`, `/audit/`, `/anomalies/`
- `/admin/rgpd/` → voire `/admin/` entier si plus rien dedans
- `/tickets/`, `/messages/`
- `/exports/`

### Components et lib

Les composants associés (`components/admin/profiles/`, etc.) ne bougent pas — ils sont hors `app/` depuis 95.1.

## Acceptance Criteria

1. **15 migrations `git mv`** selon le tableau. Structure préservée (sous-dossiers, `_layout.tsx` éventuels, `[id]` params).

2. **Anciens dossiers supprimés** : 12+ dossiers racine vides après migration.

3. **Redirects 301** pour les URLs connues (notamment `/profile`, `/tickets`, `/tickets/[id]`, `/messages`, `/exports` qui ont potentiellement des liens externes ou bookmarks). Durée : 1 mois minimum.

4. **Renommages FR** :
   - `settings/school-calendar` → `parametres/calendrier-scolaire`
   - `gdpr` → `rgpd`
   - `admin/rgpd/prospect-access` → `conformite/rgpd-prospects`
   - Les autres restent en anglais (ex. `access-grants`, `grade-permissions`, `onboarding`, `exports`) — cohérent avec l'usage actuel

5. **Sous-hubs de groupe (optionnel)** : créer pages `/administration/<groupe>/page.tsx` qui listent les pages du groupe. Si hors scope 99.2, créer juste des redirects vers la première page du groupe (ex. `/administration/utilisateurs` → `/administration/utilisateurs/profile`).

6. **Imports relatifs corrigés** : `tsc --noEmit` EXIT 0.

7. **Grep liens internes** : 0 match sur les 15 URLs racines après migration. Vérifier :
   - `rg '"/profile"|"/settings|"/tickets|"/messages|"/exports|"/audit|"/anomalies|"/waitlist|"/onboarding|"/access-grants|"/grade-permissions|"/gdpr|"/admin/rgpd"' aureak/apps/web/`
   - Tous hrefs, router.push, breadcrumbs

8. **Sidebar topbar user menu** : le menu contextuel "Mon profil / Administration / Déconnexion" (cf. capture user 18) doit pointer sur les nouvelles URLs (`/administration/utilisateurs/profile`, `/administration`).

9. **Test Playwright** :
   - Les 15 nouvelles URLs chargent (même UI qu'avant)
   - Les 15 anciennes URLs redirigent
   - Menu profil fonctionne
   - Console zéro erreur

10. **Conformité CLAUDE.md** : tsc OK, patterns Expo Router.

11. **Non-goals explicites** :
    - **Pas de modification UI** (99.3-99.6 s'en chargent)
    - **Pas de refonte fonctionnelle**
    - **Pas de modif RBAC** profonde

## Tasks / Subtasks

- [ ] **T1 — Inventaire liens** (AC #7)
  - [ ] Grep sur les 15 patterns URL

- [ ] **T2 — Migrations git mv** (AC #1, #2, #4)
  - [ ] Utilisateurs & accès : 5 migrations
  - [ ] Paramètres : 2 migrations
  - [ ] Conformité : 4 migrations
  - [ ] Communication : 3 migrations (tickets liste + détail + messages)
  - [ ] Exports : 1 migration

- [ ] **T3 — Imports relatifs** (AC #6)
  - [ ] Tsc OK

- [ ] **T4 — Redirects 301** (AC #3)
  - [ ] 15 pages stub Redirect

- [ ] **T5 — Sous-hubs de groupe (léger)** (AC #5)
  - [ ] Minimum : redirect vers 1re page de chaque groupe

- [ ] **T6 — Liens internes** (AC #7, #8)
  - [ ] Mettre à jour tous les hrefs
  - [ ] Mettre à jour menu topbar/profil

- [ ] **T7 — QA** (AC #9, #10)
  - [ ] Playwright 15 URLs + 15 redirects
  - [ ] Menu profil

## Dev Notes

### Commits recommandés

4-5 commits pour faciliter revert :
1. `refactor(epic-99-2): migrer pages utilisateurs & accès → /administration/utilisateurs`
2. `refactor(epic-99-2): migrer pages paramètres → /administration/parametres`
3. `refactor(epic-99-2): migrer pages conformité → /administration/conformite`
4. `refactor(epic-99-2): migrer pages communication + exports → /administration/*`
5. `feat(epic-99-2): redirects 301 anciennes URLs admin`

### Cas RGPD `/admin/rgpd/prospect-access`

Path actuel bizarre : `(admin)/admin/rgpd/prospect-access/page.tsx` (double `admin` dans l'URL `/admin/rgpd/...`). À migrer en `/administration/conformite/rgpd-prospects`. Si `/admin/` (sous `app/(admin)/admin/`) contient d'autres pages → à vérifier et traiter au cas par cas.

### References

- Mapping complet : voir "Contexte" ci-dessus
- Epic 99 parent : `epic-99-administration-restructure.md`
- Story 99.1 (hub) : prérequis structurel
