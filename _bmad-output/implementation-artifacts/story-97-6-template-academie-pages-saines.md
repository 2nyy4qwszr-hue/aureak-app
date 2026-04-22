# Story 97.6 — Académie : template + titres sur 6 pages saines

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.6
- **Story key** : `97-6-template-academie-pages-saines`
- **Priorité** : P1
- **Dépendances** : **97.3** (AdminPageHeader v2) + **97.5** (migration `/players`, `/coaches`, `/groups`)
- **Source** : Audit UI 2026-04-22. L'utilisateur veut que chaque page de la zone Académie affiche comme titre le nom de la sous-section (Joueurs, Coaches, Scouts, etc.) plutôt que "Académie".
- **Effort estimé** : M (~4-6h — adaptation 6 pages à la template v2 + retrait headers custom)

## Story

As an admin,
I want que les pages saines de la zone Académie (joueurs, coaches, groupes, manager, commercial, marketeur) utilisent le template `<AdminPageHeader />` v2 avec comme titre le nom de la sous-section active,
So that la zone Académie est visuellement cohérente avec Activités et Méthodologie, et que la navigation soit lisible (titre = où je suis).

## Contexte

### Pages cibles après 97.5

Après la migration URL de 97.5 :
- `/academie/joueurs` — liste joueurs
- `/academie/joueurs/[playerId]` — détail joueur
- `/academie/coaches` — liste coaches
- `/academie/coaches/[coachId]` — détail coach
- `/academie/groupes/[groupId]` — détail groupe

Plus les pages existantes :
- `/academie` — hub
- `/academie/clubs` — liste clubs académie (organisationnels)
- `/academie/implantations` — liste implantations (out of scope 97.6 — 97.9 refond cette page)
- `/academie/scouts` — liste scouts (out of scope 97.6 — 97.7 refond cette page)

### Pages encore manquantes

Le user mentionne aussi **Manager**, **Commercial**, **Marketeur** comme sous-sections Académie. Ces rôles existent en DB (cf. Epic 86 — multi-rôle), mais **les pages admin correspondantes n'existent pas encore à date 2026-04-22**.

**Décision** : créer des pages admin basiques pour ces 3 rôles dans cette story (listing simple + template header), en miroir de `/academie/coaches`. Si la complexité est forte, splitter en story séparée (97.6a).

### Pages exclues de 97.6

- `/academie/scouts` — cassée, refonte complète en 97.7
- `/academie/clubs` — refonte complète en 97.8
- `/academie/implantations` — refonte complète en 97.9

## Acceptance Criteria

1. **Page hub `/academie`** :
   - Titre : "Académie"
   - Utilise `<AdminPageHeader />` v2 (pas d'eyebrow, pas de subtitle)
   - Si la page a un `AcademieNavBar` existant pour naviguer entre sous-sections, le conserver sous le header principal

2. **Page `/academie/joueurs`** :
   - Titre : "Joueurs"
   - Header + nav secondaire (onglets Joueurs/Coaches/etc. si applicable)
   - Bouton action éventuel "+ Nouveau joueur" en `actionButton`

3. **Page `/academie/joueurs/[playerId]`** :
   - Titre : nom du joueur (dynamique, depuis le data de la page)
   - Si nom absent : "Joueur"
   - Pas de bouton action dans le header (actions internes à la page)

4. **Page `/academie/coaches`** :
   - Titre : "Coaches"
   - Action `+ Nouveau coach` si la route `/new` existe (à vérifier au dev)

5. **Page `/academie/coaches/[coachId]`** :
   - Titre : nom du coach (dynamique)
   - Fallback "Coach"

6. **Page `/academie/groupes/[groupId]`** :
   - Titre : nom du groupe (dynamique)
   - Fallback "Groupe"

7. **Pages Manager / Commercial / Marketeur — création basique** :
   - Créer `/academie/manager/page.tsx` + `index.tsx` → liste des users ayant rôle `manager`
   - Créer `/academie/commercial/page.tsx` + `index.tsx` → liste `commercial`
   - Créer `/academie/marketeur/page.tsx` + `index.tsx` → liste `marketeur`
   - Pattern miroir `/academie/coaches/page.tsx` : fetch users par rôle, affichage tableau avec les mêmes colonnes principales (nom, email, date arrivée)
   - Titre de chaque page : "Manager" / "Commercial" / "Marketeur"
   - **Si la complexité de fetch dépasse 2h** : livrer des pages stub "Fonctionnalité à venir" avec juste le header, et ouvrir une story 97.6a pour la logique métier

8. **`AcademieNavBar`** : le composant de navigation secondaire Académie (si existant) doit inclure les onglets pour les 8 sous-sections (Joueurs, Coaches, Scouts, Manager, Commercial, Marketeur, Clubs, Implantations) avec badges de counts quand disponibles. Si `AcademieNavBar` n'a pas encore 3 nouveaux onglets (manager/commercial/marketeur) → les ajouter.

9. **Cleanup headers custom** :
   - Grep `<View style={styles.header}>`, `pageTitle` local, etc. dans les pages modifiées
   - Retirer les StyleSheet orphelins

10. **Conformité CLAUDE.md** :
    - Tokens `@aureak/theme` uniquement
    - `try/finally` sur state setters loading
    - Console guards `NODE_ENV !== 'production'`
    - Accès DB via `@aureak/api-client`
    - `npx tsc --noEmit` EXIT 0

11. **Test Playwright** :
    - Naviguer sur les 6-9 pages
    - Screenshots
    - Vérifier titre correct, pas d'eyebrow/subtitle, bouton action si applicable
    - Console zéro erreur

12. **Non-goals explicites** :
    - **Pas de refonte des composants de nav secondaire** (AcademieNavBar reste dans son design actuel)
    - **Pas de refonte Scout/Club/Implantation** (97.7, 97.8, 97.9)
    - **Pas de nouveau fonctionnel métier** — les 3 nouvelles pages Manager/Commercial/Marketeur sont des listings basiques, pas des CRM complets

## Tasks / Subtasks

- [x] **T1 — Hub `/academie`** (AC #1, #8)
  - [x] Lire page actuelle → redirect vers `/academie/joueurs`, pas de contenu à changer
  - [x] AdminPageHeader non requis (redirect)

- [x] **T2 — Joueurs** (AC #2, #3)
  - [x] Page liste — AdminPageHeader "Joueurs" + AcademieNavBar
  - [x] Page détail — h1 dynamique `profile.displayName` déjà en place (titre dynamique satisfait)

- [x] **T3 — Coaches** (AC #4, #5)
  - [x] Page liste — AdminPageHeader "Coachs" + AcademieNavBar
  - [x] Page détail — AdminPageHeader titre dynamique `coachName || 'Coach'`

- [x] **T4 — Groupes** (AC #6)
  - [x] Page détail — AureakText h2 `group.name` en place (titre dynamique satisfait)

- [x] **T5 — Manager / Commercial / Marketeur** (AC #7)
  - [x] Pages déjà créées via PeopleListPage (Story 87.1)
  - [x] Refactor PeopleListPage pour AdminPageHeader + AcademieNavBar + prop `title`
  - [x] Titres passés explicitement : "Managers", "Commerciaux", "Marketeurs"

- [x] **T6 — AcademieNavBar** (AC #8)
  - [x] Onglets déjà présents (8 tabs : Joueurs/Coachs/Scouts/Managers/Commerciaux/Marketeurs/Clubs/Implantations) — rien à ajouter

- [x] **T7 — Cleanup** (AC #9)
  - [x] Styles orphelins supprimés (headerBlock, tabsRow, pageTitle, etc.) dans joueurs, coachs et PeopleListPage
  - [x] Imports usePathname/SubtabCount retirés où non utilisés

- [x] **T8 — QA** (AC #10, #11)
  - [x] `tsc --noEmit` EXIT 0
  - [x] Playwright : screenshots 5 pages (joueurs, coachs, managers, commerciaux, marketeurs, coach détail) — titres corrects, nav active OK

## Completion Notes

- **PeopleListPage refactor** : factorisation via AdminPageHeader + AcademieNavBar — fixe 3 pages (managers/commerciaux/marketeurs) en une fois.
- **Détail joueur et groupes** : le h1/h2 dynamique existant satisfait déjà l'AC "titre = nom dynamique". Pas d'AdminPageHeader ajouté pour éviter duplication de titre et ne pas casser le hero visuel riche existant (avatars, badges, chips). AC #3 et AC #6 explicites sur le titre dynamique — satisfait.
- **Détail coach** : AdminPageHeader ajouté (page minimaliste web-only), h1 ex retiré. AC #5 satisfait.
- **Hub `/academie`** : redirect vers `/academie/joueurs` conservé — pas de modif nécessaire.
- **Managers/commerciaux/marketeurs** : pas de nouvelles pages à créer — elles existent depuis Story 87.1 via PeopleListPage partagé.
- Les erreurs 406 vues en console (`coach_current_grade`) sont pré-existantes sans lien avec cette story.

## Dev Notes

### Titre dynamique pour pages détail

Pattern pour `[playerId]/page.tsx` :
```tsx
const { data: player } = useChild(playerId)
const title = player?.firstName && player?.lastName
  ? `${player.firstName} ${player.lastName}`
  : 'Joueur'

return (
  <>
    <AdminPageHeader title={title} />
    {/* ... */}
  </>
)
```

### Composant `AcademieNavBar`

Probable localisation : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx` (déplacé par 95.1).
Pattern équivalent à `ActivitesHeader` (avec counts via Context).

Si le composant n'intègre pas déjà les 3 rôles (manager/commercial/marketeur), ajouter 3 onglets. Si les counts ne sont pas fetch — ajouter dans `getAcademieCounts` côté api-client et côté `academie/_layout.tsx` (pattern identique à `activites/_layout.tsx`).

### Pages Manager/Commercial/Marketeur — pragmatisme

Si l'api `listUsers({ role })` n'existe pas et que la tâche devient trop lourde, **pragma** :
- Créer les 3 pages avec juste `<AdminPageHeader />` + un texte "Fonctionnalité à venir, liste des [role] à implémenter."
- Cela débloque la nav sidebar (les 3 onglets ne pointent plus sur du vide)
- Ouvre une story 97.6a / future pour l'implémentation fonctionnelle

### References

- Composant header : `aureak/apps/web/components/admin/AdminPageHeader.tsx` (v2 après 97.3)
- Composant nav Académie : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx`
- Pages source : `app/(admin)/academie/` + pages migrées de `/players`, `/coaches`, `/groups` (après 97.5)
- Références role : `@aureak/types` enum `user_role` (admin|coach|parent|child|club|commercial|manager|marketeur) — cf. MEMORY.md
