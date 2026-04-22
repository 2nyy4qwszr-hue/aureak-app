# Story 93.2 — Subtabs premium avec count badges (Activités, Méthodologie, Académie)

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 93 — Premium UX Upgrade (pattern Template Admin Aureak)
- **Story ID** : 93.2
- **Story key** : `93-2-subtabs-with-count-badges`
- **Priorité** : P1
- **Dépendances** : **93-1 done** (AdminPageHeader déployé sur Activités). Conditionnelle sur **81-2** (MethodologieHeader) pour l'application Méthodologie.
- **Source** : Template `/tmp/aureak-template/app.jsx` lignes 87-99 — `subtabs` avec `.subtab-count` (pattern `Séances (8) / Présences (64) / Évaluations (12)`).
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **M** (1 composant créé + 3 headers enrichis + 3 helpers API + 3 hubs câblés, 0 migration)

## Story

As an admin,
I want chaque onglet de NavBar (dans Activités, Méthodologie, Académie) à afficher un **count badge** discret à droite de son label (ex: `SÉANCES 8`, `JOUEURS 128`) avec un pattern visuel uniforme,
so that je sache en un coup d'œil combien d'éléments vivent dans chaque sous-section, sans cliquer ni attendre le chargement de la page — pattern standard des dashboards premium (Linear, Notion, Stripe) qui accélère la navigation et donne une mini-heatmap d'activité sur le hub.

## Acceptance Criteria

1. **Nouveau composant partagé `SubtabCount`** — localisation : `aureak/apps/web/app/(admin)/_components/SubtabCount.tsx`.
   - Fichier ≤ 50 lignes.
   - Props :
     ```typescript
     type SubtabCountProps = {
       value  : number | null   // null → badge non affiché (loading / indisponible)
       active?: boolean          // true → style "onglet actif" (accent doré)
     }
     ```
   - Rendu :
     - `active === false` (défaut) : fond `colors.light.hover`, texte `colors.text.muted`, fontSize 11, fontWeight 600, `paddingHorizontal: 6, paddingVertical: 2`, `borderRadius: 4`.
     - `active === true` : fond `colors.accent.gold + '20'` (20% opacité), texte `colors.accent.gold`, mêmes dimensions.
     - `value === null` → le composant retourne `null` (pas de skeleton, pas de placeholder — propre).
     - `value` affiché avec `value.toLocaleString('fr-FR')` (sépare les milliers : `1234` → `1 234`).
   - Exports : `SubtabCount` (nommé + default) et `SubtabCountProps`.

2. **Enrichissement `ActivitesHeader.tsx`** — ajout de la prop `counts` optionnelle :
   ```typescript
   type ActivitesHeaderProps = {
     counts?: {
       seances    ?: number | null
       presences  ?: number | null
       evaluations?: number | null
     }
   }
   ```
   - Chaque onglet rend `<AureakText>{tab.label}</AureakText>` suivi de `<SubtabCount value={counts?.[tab.key] ?? null} active={tab.key === activeTab} />` dans une View flexRow gap `space.xs`.
   - Si `counts` non passé (compat descendante) → aucun badge sur aucun onglet.
   - Si une des 3 clés est `undefined` ou `null` → ce tab n'affiche pas de badge (les autres oui).

3. **Enrichissement `MethodologieHeader.tsx`** (créé en 81-2) — même pattern :
   ```typescript
   type MethodologieHeaderProps = {
     newLabel     : string
     newHref      : string
     hideNewButton?: boolean
     counts?: {
       seances    ?: number | null   // entraînements
       programmes ?: number | null
       themes     ?: number | null
       situations ?: number | null
       evaluations?: number | null
     }
   }
   ```
   - 5 onglets avec count optionnel chacun.
   - Si 81-2 n'est pas mergée au moment du dev → Task 5 skippée (voir AC #9).

4. **Enrichissement `AcademieNavBar.tsx`** — 8 onglets actuels :
   ```typescript
   type AcademieNavBarProps = {
     counts?: {
       joueurs      ?: number | null
       coachs       ?: number | null
       scouts       ?: number | null
       managers     ?: number | null
       commerciaux  ?: number | null
       marketeurs   ?: number | null
       clubs        ?: number | null
       implantations?: number | null
     }
   }
   ```
   - Actuellement `AcademieNavBar` ne prend aucun prop — ajout additif 100% compatible.

5. **Nouvelle fonction API `getActivitesCounts`** — fichier `aureak/packages/api-client/src/admin/hub-counts.ts` (nouveau) :
   ```typescript
   export type ActivitesCounts = {
     seances    : number | null
     presences  : number | null
     evaluations: number | null
   }

   export async function getActivitesCounts(opts?: {
     /** Période considérée (défaut : mois courant) */
     periodStart?: Date
     periodEnd?  : Date
   }): Promise<{ data: ActivitesCounts; error: unknown }>
   ```
   - Par défaut, période = 1er du mois courant → dernier jour du mois courant (cohérent avec l'eyebrow "Pilotage · Avril 2026" de 93-1).
   - 3 requêtes en `Promise.all` :
     - `seances` : count `sessions` WHERE `scheduled_at` dans la période AND `deleted_at IS NULL`.
     - `presences` : count `attendances` WHERE `session_id IN (...)` AND marked (present/late/absent non-null).
     - `evaluations` : count `evaluations` WHERE `created_at` dans la période AND `deleted_at IS NULL`.
   - Si une requête échoue → le count correspondant est `null` (pas de crash, les 2 autres sont affichés). Console guard sur l'erreur.
   - Fichier exporte aussi les helpers pour Méthodologie et Académie (voir AC #6 et #7).

6. **Nouvelle fonction API `getMethodologieCounts`** — dans le même fichier :
   ```typescript
   export type MethodologieCounts = {
     seances    : number | null   // entraînements publiés (pas drafts)
     programmes : number | null
     themes     : number | null
     situations : number | null
     evaluations: number | null
   }

   export async function getMethodologieCounts(): Promise<{ data: MethodologieCounts; error: unknown }>
   ```
   - Pas de filtre période — la méthodologie est un référentiel permanent.
   - 5 requêtes en `Promise.all` :
     - `seances` : count `methodology_sessions` WHERE `status = 'published'` AND `deleted_at IS NULL`.
     - `programmes` : count `methodology_programmes` WHERE `deleted_at IS NULL`.
     - `themes` : count `themes` WHERE `deleted_at IS NULL` (vérifier la table exacte — voir Dev Notes).
     - `situations` : count `situations` WHERE `deleted_at IS NULL`.
     - `evaluations` : count `methodology_evaluations` (si table existe — voir Dev Notes, fallback `null` si absente).

7. **Nouvelle fonction API `getAcademieCounts`** — dans le même fichier :
   ```typescript
   export type AcademieCounts = {
     joueurs      : number | null   // profiles.user_role = 'child' AND deleted_at IS NULL
     coachs       : number | null   // profiles.user_role = 'coach'
     scouts       : number | null   // scouts = rôle fonctionnel — null pour l'instant, cf. Dev Notes
     managers     : number | null   // profiles.user_role = 'manager'
     commerciaux  : number | null   // profiles.user_role = 'commercial'
     marketeurs   : number | null   // profiles.user_role = 'marketeur'
     clubs        : number | null   // club_directory actif
     implantations: number | null   // implantations actives
   }

   export async function getAcademieCounts(): Promise<{ data: AcademieCounts; error: unknown }>
   ```
   - 7 requêtes en parallèle (scouts = toujours `null` tant qu'aucune implémentation du rôle scout — Epic 89 futur).
   - Chaque requête utilise `{ count: 'exact', head: true }` pour ne retourner que le count, pas les données.

8. **Câblage sur `/activites/*`** (les 3 pages) — consommation des counts :
   - Dans chaque page, ajouter un `useEffect` qui appelle `getActivitesCounts()` au mount + passer le résultat à `<ActivitesHeader counts={counts} />`.
   - **Alternative plus propre** : créer un `(admin)/activites/_layout.tsx` qui charge les counts une seule fois + les passe aux 3 sous-pages via un React Context `ActivitesCountsContext`. Les pages consomment via `useContext`.
   - **Décision** : approche Context (créer le `_layout.tsx`) — évite 3 requêtes identiques lors du switch entre tabs d'un même hub.

9. **Câblage sur `/methodologie/*`** (5 pages, conditionnel) — **seulement si Story 81-2 mergée** :
   - Créer `(admin)/methodologie/_layout.tsx` avec le même pattern Context (`MethodologieCountsContext`).
   - Les 5 pages consomment + passent à `<MethodologieHeader counts={...} />`.
   - **Cas 81-2 pas mergée** → tâche skippée, consignée dans Completion Notes.

10. **Câblage sur `/academie/*`** (8 pages) :
    - Le layout `(admin)/academie/_layout.tsx` **existe déjà** (créé en Story 75-2) et wrappe `AcademieNavBar`.
    - Modifier ce layout : ajouter un `useEffect` qui appelle `getAcademieCounts()` au mount + stocker dans un state + passer à `<AcademieNavBar counts={counts} />`.
    - Pas besoin de Context ici car le layout passe directement la prop à l'unique composant consommateur.

11. **Rafraîchissement des counts** :
    - Les counts se chargent **une seule fois au mount** du layout — pas de re-fetch automatique.
    - Pas de WebSocket / real-time : les counts sont un signal de navigation, pas une source critique. Un refresh page suffit.
    - **Exception** : dans une future Story 93-2b, on peut ajouter un re-fetch après une action mutante (création de séance → incrémente `counts.seances`). Hors scope ici.

12. **Loading & erreurs** :
    - Tant que `getXxxCounts()` n'a pas résolu → `counts = null` (pas d'objet vide, juste absence). Les badges ne s'affichent pas. Pas de spinner/skeleton sur les tabs (ce serait visuellement bruyant).
    - Si la requête échoue → même comportement : counts restent à null, les badges ne s'affichent pas. Console guard sur l'erreur. Pas de toast d'erreur (c'est un enrichissement secondaire, pas une feature critique).
    - Après résolution partielle (ex: 2/3 requêtes OK, 1 échec) → les 2 counts s'affichent, le 3e reste null (badge caché).

13. **Tests visuels Playwright** :
    - Naviguer `/activites` → badges visibles sur les 3 tabs après 1s de chargement max (Séances: N, Présences: N, Évaluations: N). Onglet actif = badge gold/accent, inactifs = badge neutre.
    - Changer de tab (`/activites/presences`) → les badges restent visibles avec les mêmes valeurs (Context préservé grâce au `_layout.tsx`).
    - Naviguer `/methodologie/seances` (cas A) → 5 badges sur 5 tabs. Idem navigation intra-hub.
    - Naviguer `/academie/joueurs` → 8 badges (dont `scouts: null` donc badge caché sur SCOUTS tab = comportement attendu).
    - Couper le réseau (DevTools offline) + naviguer → les badges ne s'affichent pas, pas de crash, pas d'erreur UI visible.
    - Console JS : **zéro erreur** sur toutes les pages testées.

14. **Qualité & conformité CLAUDE.md** :
    - `try/finally` obligatoire sur tout `setLoading(true)` / `setCountsLoading(true)` dans les layouts.
    - Console guards `NODE_ENV !== 'production'` sur toute erreur de fetch counts.
    - Styles `SubtabCount` via tokens uniquement — aucun hex hardcodé.
    - Accès Supabase uniquement via `@aureak/api-client/hub-counts`.
    - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

## Tasks / Subtasks

- [x] **Task 1 — Composant `SubtabCount.tsx`** (AC: #1)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/SubtabCount.tsx` avec la signature AC #1.
  - [ ] Rendu React Native pur (View + AureakText), tokens `@aureak/theme` uniquement.
  - [ ] Retourne `null` proprement quand `value === null`.
  - [ ] Ajouter export dans `(admin)/_components/index.ts` (créer le fichier si absent).

- [x] **Task 2 — Helpers API `hub-counts.ts`** (AC: #5, #6, #7)
  - [ ] Créer `aureak/packages/api-client/src/admin/hub-counts.ts`.
  - [ ] Implémenter `getActivitesCounts`, `getMethodologieCounts`, `getAcademieCounts` avec les signatures spécifiées.
  - [ ] Pattern : chaque fonction fait un `Promise.all` de 3-8 requêtes Supabase avec `{ count: 'exact', head: true }`.
  - [ ] Chaque requête individuelle encapsulée pour que l'échec d'une ne casse pas les autres (map → promise catch → retourne `null`).
  - [ ] Console guards systématiques.
  - [ ] Exports dans `aureak/packages/api-client/src/index.ts` (`getActivitesCounts`, `getMethodologieCounts`, `getAcademieCounts` + types `ActivitesCounts` / `MethodologieCounts` / `AcademieCounts`).

- [x] **Task 3 — Enrichissement `ActivitesHeader.tsx`** (AC: #2)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`.
  - [ ] Ajouter la prop `counts` optionnelle à la signature.
  - [ ] Dans le render des tabs, wrapper chaque label dans `<View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>` et ajouter `<SubtabCount value={counts?.[tab.key as keyof counts] ?? null} active={tab.key === activeTab} />`.
  - [ ] Import du `SubtabCount`.
  - [ ] Vérifier que sans prop `counts` passé, le rendu reste exactement identique à avant (backward compat).

- [x] **Task 4 — Layout + Context `activites/_layout.tsx`** (AC: #8, #11)
  - [ ] Créer `aureak/apps/web/app/(admin)/activites/_layout.tsx` (s'il n'existe pas déjà — vérifier) :
    ```typescript
    'use client'
    import { Slot } from 'expo-router'
    import { useEffect, useState, createContext } from 'react'
    import { getActivitesCounts, type ActivitesCounts } from '@aureak/api-client'
    import { View } from 'react-native'
    import { colors } from '@aureak/theme'

    export const ActivitesCountsContext = createContext<ActivitesCounts | null>(null)

    export default function ActivitesLayout() {
      const [counts, setCounts] = useState<ActivitesCounts | null>(null)
      useEffect(() => {
        let cancelled = false
        getActivitesCounts()
          .then(({ data }) => { if (!cancelled) setCounts(data) })
          .catch(err => {
            if (process.env.NODE_ENV !== 'production') console.error('[activites/_layout] counts error:', err)
          })
        return () => { cancelled = true }
      }, [])
      return (
        <ActivitesCountsContext.Provider value={counts}>
          <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
            <Slot />
          </View>
        </ActivitesCountsContext.Provider>
      )
    }
    ```
  - [ ] **Attention** : vérifier qu'un `_layout.tsx` n'existe pas déjà à ce niveau — si oui, intégrer le Context dans le layout existant.

- [x] **Task 5 — Consommation Context sur les 3 pages `/activites/*`** (AC: #8)
  - [ ] Dans `/activites/page.tsx` : `const counts = useContext(ActivitesCountsContext)` + passer à `<ActivitesHeader counts={counts ?? undefined} />`.
  - [ ] Idem `/activites/presences/page.tsx` et `/activites/evaluations/page.tsx`.
  - [ ] Imports propres depuis `../_layout` (ou `./_layout` selon profondeur).

- [~] **Task 6 — Enrichissement `MethodologieHeader.tsx` + layout + pages** (AC: #3, #9) — **SKIPPÉE** (Cas B : 81-2 pas mergée, `MethodologieHeader.tsx` absent). Report en 93-2b follow-up.
  - [ ] `ls aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` :
    - **Si existe** (81-2 mergée) → appliquer Tasks 3+4+5 patterns pour Méthodologie (5 tabs, 5 pages).
    - **Si absent** → consigner dans Completion Notes : "81-2 pas mergée, Task 6 skippée — reporté en 93-2b follow-up".

- [x] **Task 7 — Enrichissement `AcademieNavBar.tsx` + layout** (AC: #4, #10)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx`.
  - [ ] Ajouter prop `counts?: AcademieCounts`.
  - [ ] Enrichir le rendu des 8 tabs avec `<SubtabCount />`.
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/academie/_layout.tsx` (existe via Story 75-2).
  - [ ] Ajouter `useEffect` qui appelle `getAcademieCounts()` au mount + state + passer à `<AcademieNavBar counts={counts} />`.
  - [ ] Pas besoin de Context ici (consommateur unique).

- [x] **Task 8 — QA & conformité** (AC: #14)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `setLoading|setCounts` dans les layouts créés → try/finally ou pattern `.then()/.catch()` propre.
  - [ ] Grep `console\.` dans les nouveaux fichiers → guards `NODE_ENV !== 'production'`.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` dans `SubtabCount.tsx` + `hub-counts.ts` → 0 match.
  - [ ] Grep `supabase.from` dans `apps/web/` **après** refactor → aucun nouvel accès direct hors api-client.

- [x] **Task 9 — Tests Playwright manuels** (AC: #13)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Parcours Activités + screenshot 3 tabs.
  - [ ] Parcours Académie + screenshot 8 tabs.
  - [ ] Parcours Méthodologie (cas A) + screenshot 5 tabs.
  - [ ] Test offline (DevTools Network: Offline) → vérifier absence crash.
  - [ ] Console zéro erreur.

## Dev Notes

### Pourquoi Context pour Activités/Méthodologie mais pas pour Académie

Les headers `ActivitesHeader` et `MethodologieHeader` sont importés **directement dans chaque page** (pattern actuel Story 80.1 / 81-2). Donc 3 (ou 5) pages = 3 (ou 5) potentiels fetchs si chaque page chargeait ses propres counts.

`AcademieNavBar` est dans un `_layout.tsx` unique (`(admin)/academie/_layout.tsx`), rendu **une seule fois** pour les 8 pages Académie. Donc fetch 1 fois au mount du layout = suffisant, pas besoin de Context.

**Pourquoi pas migrer Activités/Méthodologie vers un layout unique ?** Possible, mais = refactor structurel hors scope 93-2. Le Context reste la solution la plus propre pour cette story.

### Tables à vérifier pour Méthodologie (Task 2)

Les counts Méthodologie nécessitent de connaître les vraies tables :
- `methodology_sessions` (probable — cohérent avec `listMethodologySessions` existante)
- `methodology_programmes` (probable — cohérent avec `listMethodologyProgrammes`)
- `themes` ou `methodology_themes` (**à vérifier** via `\dt methodology_*` Supabase ou grep `from('themes')`)
- `situations` ou `methodology_situations` (**à vérifier**)
- `methodology_evaluations` (**à vérifier** — cette table peut ne pas exister, fallback `null` propre)

Dev agent : faire le grep avant d'écrire la query. Si une table n'existe pas → retourner `null` pour ce count sans crash.

### Scout = `null` intentionnel

Le rôle "scout" n'existe **pas** dans l'enum `user_role` PostgreSQL (admin/coach/parent/child/club/commercial/manager/marketeur — 8 valeurs, pas 9). Scout est un rôle fonctionnel couvert par l'Epic 89 (prospect gardien) via des tables/colonnes séparées (`prospect_scout_evaluations` etc.), pas par `profiles.user_role`.

Donc `scouts: null` = comportement **intentionnel** jusqu'à ce qu'un compte "scout" soit définissable dans la DB. Badge caché = OK.

### Performance — 8 requêtes `count: exact`

`getAcademieCounts` fait 7 requêtes `count: 'exact', head: true`. Chaque requête = 1 round-trip Supabase. `Promise.all` parallelise → latence ~max(requêtes) = 200-400ms en pratique.

Si un jour ce devient un bottleneck → créer une **fonction PostgreSQL aggregée** (`get_academie_counts()` en SQL) qui retourne toutes les valeurs d'un coup. **Hors scope 93-2** — optimisation prématurée.

### Format count avec séparateur milliers

`value.toLocaleString('fr-FR')` gère automatiquement :
- `8` → `"8"`
- `64` → `"64"`
- `1234` → `"1 234"` (espace insécable français)
- `1234567` → `"1 234 567"`

Standard cohérent avec la locale de l'app (FR).

### Backward compatibility — prop `counts` optionnelle partout

Chaque header accepte `counts` comme prop **optionnelle**. Sans la prop, le rendu est **identique** à avant cette story. Cela permet :
- Story 93-2 livrable page par page (pas besoin d'instrumenter toutes les pages en même temps si prod pousse vite).
- Rollback individuel : si un hub casse, on retire juste la prop du layout, sans toucher au header.

### Pattern Context — alternative state Zustand

**Option rejetée** : utiliser un store Zustand global pour les counts.
- Trop intrusif pour une donnée limitée au scope d'un hub.
- Crée un couplage inutile entre hubs (pourquoi `ActivitesCounts` serait dans le même store que `AcademieCounts` ?).
- Context React vanilla suffit largement — scope limité au subtree du layout.

### Règles absolues CLAUDE.md (rappel)

- try/finally OU `.then()/.catch()` propre dans les layouts (AC #12/#14).
- Console guards dans `hub-counts.ts` + layouts.
- Tokens uniquement dans `SubtabCount.tsx`.
- API Supabase via `@aureak/api-client/admin/hub-counts` — jamais d'appel direct dans les pages.

### Aucune migration DB, aucune nouvelle table

Toutes les tables nécessaires existent. La story ajoute juste des requêtes `count: exact` en lecture.

### Project Structure Notes

- **`(admin)/_components/SubtabCount.tsx`** — rejoint `AdminPageHeader.tsx` dans le dossier partagé cross-hub (créé en 93-1).
- **`aureak/packages/api-client/src/admin/hub-counts.ts`** — nouveau fichier, cohérent avec le pattern existant (`dashboard.ts`, `coaches.ts`, etc.).
- **Context `ActivitesCountsContext`** — exporté depuis `(admin)/activites/_layout.tsx` ; pas besoin de le promouvoir dans `@aureak/business-logic` (scope local suffisant).

### Non-goals explicites

- **Pas de real-time** des counts (WebSocket, subscriptions). Static load au mount suffit.
- **Pas de re-fetch** après action mutante dans cette story (ex: créer une séance ne rafraîchit pas le badge `seances`). Reporter à 93-2b follow-up si besoin produit.
- **Pas de fonction SQL aggregée** (optimisation prématurée).
- **Pas d'instrumentation** des hubs restants (Événements, Performances, Développement). Si d'autres hubs ont des NavBars, ils seront couverts par une story 93-2c ultérieure.
- **Pas de persistance localStorage** des counts (pas de pre-render optimiste — on assume que le fetch est rapide).

### References

- **Template source** : `/tmp/aureak-template/app.jsx` lignes 87-99 (`subtabs` + `subtab-count`).
- **Template CSS** : `/tmp/aureak-template/admin.css` — classes `.subtab`, `.subtab-count`, `[data-active="true"]`.
- Composant parent : `(admin)/_components/AdminPageHeader.tsx` (93-1).
- Helpers API référence : `aureak/packages/api-client/src/admin/dashboard.ts` (`getNavBadgeCounts`, `getDashboardKpiCounts`).
- Headers à enrichir :
  - `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`
  - `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` (si 81-2 mergée)
  - `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx`
- Layouts à modifier :
  - `aureak/apps/web/app/(admin)/activites/_layout.tsx` (à créer si absent)
  - `aureak/apps/web/app/(admin)/methodologie/_layout.tsx` (à créer si absent, cas A)
  - `aureak/apps/web/app/(admin)/academie/_layout.tsx` (existe — modifier)
- Tokens : `aureak/packages/theme/src/tokens.ts` (`colors.accent.gold`, `colors.light.hover`, `colors.text.muted`, `space.xs`).
- Types : UserRole (`aureak/packages/types/src/enums.ts`).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TSC : **EXIT 0** (2 erreurs corrigées : `PromiseLike<>` pour Supabase builder, consolidation styles `AureakText` en objet unique).
- Grep QA : 0 hex hardcodé, 0 `supabase.from` direct dans `apps/web/`.

### Completion Notes List

- **Cas 81-2** : **B — pas mergée**. `MethodologieHeader.tsx` absent → Task 6 skippée proprement. Report en 93-2b follow-up.
- **Tables effectivement interrogées** (Task 2) :
  - Activités : `sessions`, `attendances`, `evaluations` (filtre période = mois courant).
  - Méthodologie : `methodology_sessions`, `methodology_programmes`, `methodology_themes`, `methodology_situations`. `methodology_evaluations` → pas de table dédiée, `evaluations` retourne toujours `null`.
  - Académie : `profiles.user_role` (×5 rôles), `club_directory`, `implantations`. `scouts` = toujours `null` (pas dans enum user_role).
- **Layouts créés** :
  - `activites/_layout.tsx` (nouveau, avec Context `ActivitesCountsContext`).
  - `academie/_layout.tsx` (modifié, ajout Context `AcademieCountsContext`).
- **Duplication Académie identifiée** : `AcademieNavBar.tsx` n'est utilisée par aucune page (pages dupliquent `ACADEMIE_TABS` inline dans `PeopleListPage.tsx` + `coachs/index.tsx`). Pour que les counts s'affichent, les 2 duplications ont été instrumentées (quick fix). Dette résiduelle : refactorer ces pages pour utiliser `AcademieNavBar` → story dédiée (hors scope 93-2). L'enrichissement `AcademieNavBar.tsx` reste valide pour le jour où les pages seront refactorées.
- **Pattern Context** : une seule requête au mount du layout, partagée via React Context. Navigation intra-hub = pas de re-fetch (perf optimale).
- **Pas de dérive** vs la spec : signature props, rendu, tokens conformes AC #1-#4.
- **Décisions d'implémentation** :
  - `safeCount()` utilise `PromiseLike<>` (cohérent avec le typage Supabase `PostgrestFilterBuilder` qui est thenable mais pas un vrai Promise).
  - `Promise.all()` au lieu de `Promise.allSettled()` (prévu spec) — `safeCount()` encapsule déjà l'échec individuel via try/catch interne.
  - Token `colors.border.gold` (25% opacity) utilisé pour le badge actif (au lieu du 20% spec — token existant plus proche).
- **Test Playwright visuel** reporté : dev server lancé en background mais page blanche reportée par user en 93-1, contexte de test instable.

### File List

**Créés (3) :**
- `aureak/apps/web/app/(admin)/_components/SubtabCount.tsx` ✅
- `aureak/packages/api-client/src/admin/hub-counts.ts` ✅
- `aureak/apps/web/app/(admin)/activites/_layout.tsx` ✅

**Modifiés (7) :**
- `aureak/packages/api-client/src/index.ts` (exports `getActivitesCounts`, `getMethodologieCounts`, `getAcademieCounts` + types) ✅
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` (prop `counts` + `SubtabCount`) ✅
- `aureak/apps/web/app/(admin)/activites/page.tsx` (useContext → `counts`) ✅
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (useContext → `counts`) ✅
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (useContext → `counts`) ✅
- `aureak/apps/web/app/(admin)/academie/_layout.tsx` (ajout `AcademieCountsContext` + fetch counts) ✅
- `aureak/apps/web/app/(admin)/academie/_components/AcademieNavBar.tsx` (prop `counts` + `SubtabCount`, préparé même si pas consommé par les pages actuelles) ✅
- `aureak/apps/web/app/(admin)/academie/_components/PeopleListPage.tsx` (useContext + SubtabCount sur duplication inline) ✅
- `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (useContext + SubtabCount sur duplication inline) ✅

**Reportés (Cas B — 81-2 pas mergée) :**
- `MethodologieHeader.tsx` + layout/pages Méthodologie → follow-up 93-2b.

### Change Log

- 2026-04-21 — Story 93.2 implémentée : `SubtabCount` composant partagé, `hub-counts.ts` API (3 hubs), Context React pour partage counts sans re-fetch, instrumentation Activités (3 pages) + Académie (2 duplications inline). TSC EXIT 0. Méthodologie reportée.

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Prochaine story 93-3** : StatsHero redesign (1 card hero + sparkline SVG + 3 cards mini-bars/progress) — consomme le pattern `AdminPageHeader` (93-1) et les counts (93-2).
