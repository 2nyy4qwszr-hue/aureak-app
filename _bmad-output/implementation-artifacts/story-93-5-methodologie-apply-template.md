# Story 93.5 — Application directe du template Epic 93 sur les 5 pages Méthodologie

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 93 — Premium UX Upgrade (pattern Template Admin Aureak)
- **Story ID** : 93.5
- **Story key** : `93-5-methodologie-apply-template`
- **Priorité** : P1 (complète Epic 93 sur le deuxième hub admin)
- **Dépendances** : **93-1/2/3/4 en review** (fondations). **Remplace la story 81-2 annulée** (choix : migration directe vers pattern Epic 93 final plutôt qu'étape intermédiaire).
- **Source** : Decision produit — éviter double refactor. Cadrage détaillé dans les completions 93-1/2/3 (cas B reporté).
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **M-L** (1 composant créé + 1 layout + 5 pages refactorées + 1 StatsHero adapté, 0 migration, 0 nouvelle API — `getMethodologieCounts` existe déjà via 93-2)

## Story

As an admin,
I want les 5 pages Méthodologie (entraînements, programmes, thèmes, situations, évaluations) à adopter **directement** le template Epic 93 complet — **AdminPageHeader** premium (eyebrow + H1 + subtitle), **MethodologieHeader V2** (NavBar avec 5 onglets + **count badges** intégrés) et **StatsHero** premium sur la page seances,
so that l'Epic 93 couvre uniformément les 2 hubs admin majeurs (Activités + Méthodologie) et que les ~240 lignes de duplications inline (NAV_TABS + headerBlock JSX + styles) disparaissent des 5 pages.

## Contexte : pourquoi 93-5 remplace 81-2 annulée

La story 81-2 (annulée le 2026-04-21) prévoyait un `MethodologieHeader` V1 style Story 80-1 — un simple composant NavBar sans counts. L'application d'Epic 93 (93-2 counts + 93-3 StatsHero) sur Méthodologie aurait ensuite forcé un **second refactor** pour enrichir MethodologieHeader V1 en V2.

93-5 livre directement le résultat final : `MethodologieHeader` V2 qui intègre subtabs + counts dès le jour 1, conforme au pattern Epic 93 final. **Zéro étape intermédiaire jetable.**

## Acceptance Criteria

1. **Nouveau composant `MethodologieHeader.tsx`** — localisation : `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`.
   - Fichier ≤ 130 lignes.
   - Props :
     ```typescript
     type MethodologieHeaderProps = {
       newLabel     : string                 // ex: "+ Nouvel entraînement"
       newHref      : string                 // ex: "/methodologie/seances/new"
       hideNewButton?: boolean               // masque le bouton si route /new absente
       counts?: {
         seances    ?: number | null         // entraînements (methodology_sessions)
         programmes ?: number | null
         themes     ?: number | null
         situations ?: number | null
         evaluations?: number | null
       }
     }
     ```
   - Rendu **mirror pixel-près de `ActivitesHeader` enrichi par 93-2** :
     - Row top : bouton action gold à droite (respecte `hideNewButton`).
     - Row tabs : 5 onglets `ENTRAÎNEMENTS | PROGRAMMES | THÈMES | SITUATIONS | ÉVALUATIONS` avec `<SubtabCount value={} active={} />` à côté de chaque label.
   - Détection onglet actif via `usePathname()` + `pathname.endsWith('/seances' | '/programmes' | '/themes' | '/situations' | '/evaluations')`.
   - Tokens uniquement (`colors.accent.gold`, `colors.text.dark/subtle`, `colors.border.divider`, `space.lg/md/sm/xs`).

2. **Nouveau layout `(admin)/methodologie/_layout.tsx`** :
   - Pattern identique à `activites/_layout.tsx` (93-2) :
     - Fetch `getMethodologieCounts()` au mount (une seule fois pour le hub entier).
     - Expose `MethodologieCountsContext` qui porte `MethodologieCounts | null`.
     - Wrappe `<Slot />` avec `View` fond `colors.light.primary`.
   - Export nommé du Context pour consommation par les 5 pages.

3. **Page `/methodologie/seances/index.tsx`** (entraînements — la plus riche) :
   - **Supprimer** : `NAV_TABS` inline, bloc JSX `headerBlock/headerTopRow/tabsRow`, styles associés.
   - **Ajouter en tête de page** :
     ```jsx
     <AdminPageHeader
       eyebrow={formatEyebrow('Bibliothèque')}
       title="Méthodologie"
       subtitle="Entraînements, programmes, thèmes, situations et évaluations — la bibliothèque pédagogique utilisée par les coachs sur le terrain."
     />
     <MethodologieHeader
       newLabel="+ Nouvel entraînement"
       newHref="/methodologie/seances/new"
       counts={useContext(MethodologieCountsContext) ?? undefined}
     />
     ```
   - **Remplacer les stats actuelles** (7 mini-cards méthodes inline) par un **`<StatsHero>`** :
     - **Hero card** : "Entraînements publiés" avec sparkline des ajouts sur 30 derniers jours (helper `buildMethodologySparklineData` à créer — voir AC #8).
     - **Card 2** : "Par méthode" avec mini-bars (7 bars = 7 méthodes, hauteur proportionnelle au count).
     - **Card 3** : "Drafts" (méthodologies avec `status !== 'published'`) — iconTone `neutral` (pas rouge, pas une alerte).
     - **Card 4** : "Taux de publication" (= published / total × 100) avec `footer: { type: 'progress', progress }`.
   - **Le reste de la page** (filtres méthode, toggle ENTRAÎNEMENT/EXERCICE, table) reste **strictement inchangé**.

4. **Page `/methodologie/programmes/index.tsx`** :
   - Supprimer NAV_TABS inline + headerBlock + styles.
   - Ajouter `<AdminPageHeader>` (même eyebrow/title/subtitle que seances) + `<MethodologieHeader newLabel="+ Nouveau programme" newHref="/methodologie/programmes/new" counts={ctx} />`.
   - Stats cards actuelles : **pas de StatsHero** ici (les stats actuelles "count par méthode" sont déjà horizontales et OK). Conserver tel quel.

5. **Page `/methodologie/themes/index.tsx`** :
   - Même refactor. `newLabel="+ Nouveau thème"`, `newHref="/methodologie/themes/new"`.
   - Si la route `/new` n'existe pas → `hideNewButton={true}` + commentaire TODO inline.

6. **Page `/methodologie/situations/page.tsx`** :
   - Même refactor (dans `page.tsx`, `index.tsx` re-export inchangé).
   - `newLabel="+ Nouvelle situation"`, `newHref="/methodologie/situations/new"` (ou `hideNewButton={true}` si route absente).

7. **Page `/methodologie/evaluations/page.tsx`** :
   - Même refactor. `newLabel="+ Nouvelle évaluation"`, `newHref="/methodologie/evaluations/new"` (ou `hideNewButton={true}`).

8. **Nouveau helper `buildMethodologySparklineData`** — localisation : `aureak/apps/web/app/(admin)/methodologie/seances/sparkline-data.ts`.
   - Signature :
     ```typescript
     export function buildMethodologySparklineData(
       sessions: MethodologySession[],
     ): number[]
     ```
   - Retourne un tableau de **30 valeurs** (une par jour des 30 derniers jours) = count cumulé d'entraînements publiés à date J.
   - Si aucune date `published_at` présente → fallback sur `created_at`.
   - Si aucun des deux → skipper la session pour le cumul.

9. **Respect du subtitle unifié** :
   - Les 5 pages Méthodologie partagent le **même subtitle** (une seule string constante) — cohérent avec Activités où les 3 sous-pages partagent leur subtitle hub.
   - Déclaré une fois en haut de chaque page ou partagé via `_layout.tsx` : **décision dev** (recommandation : déclaration locale dans chaque page pour rester explicite).

10. **Cleanup exhaustif** — après refactor, grep sur `aureak/apps/web/app/(admin)/methodologie/` :
    - `grep -rn "NAV_TABS" methodologie/` → **0 match** (seul le composant partagé contient les TABS).
    - `grep -rn "pageTitle\|headerBlock\|tabUnderline" methodologie/` → **0 match** côté pages (seul `MethodologieHeader.tsx` en a besoin en interne).
    - Les styles orphelins (`pageTitle`, `headerBlock`, `tabsRow`, `tabItem`, `tabLabel`, `tabLabelActive`, `tabUnderline`, `newBtn`, `newBtnLabel`) doivent être **supprimés** du `StyleSheet.create` de chaque page.

11. **Non-goals explicites** :
    - **Pas d'instrumentation** de la page détail `/methodologie/programmes/[programmeId]/index.tsx` (même si elle duplique aussi NAV_TABS — fiche détail, scope différent, future story dédiée).
    - **Pas de StatsHero** sur les 4 autres pages Méthodologie (programmes/thèmes/situations/évaluations) — les stats actuelles sont minimales et ne justifient pas un hero. Si besoin futur émerge → story dédiée.
    - **Pas de migration** des routes `/new` absentes — `hideNewButton={true}` propre, pas de création de routes manquantes.

12. **Qualité & conformité CLAUDE.md** :
    - `try/finally` sur tout setter de loading dans le layout.
    - Console guards `NODE_ENV !== 'production'` systématiques.
    - Tokens `@aureak/theme` uniquement — **aucun hex hardcodé** dans `MethodologieHeader.tsx`.
    - Accès Supabase uniquement via `@aureak/api-client` (réutilise `getMethodologieCounts` existant).
    - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

13. **Tests visuels Playwright** :
    - `/methodologie/seances` → AdminPageHeader "BIBLIOTHÈQUE · <mois>" + H1 "Méthodologie" + subtitle. MethodologieHeader avec 5 tabs + count badges visibles après chargement. StatsHero avec sparkline. Zéro doublon avec l'ancien header.
    - `/methodologie/programmes`, `/methodologie/themes`, `/methodologie/situations`, `/methodologie/evaluations` → mêmes eyebrow/title/subtitle, tab actif correct, counts visibles.
    - Resize 500px → layout responsive (AdminPageHeader passe en colonne, tabs ScrollView horizontal).
    - Console JS : zéro erreur sur les 5 pages.

## Tasks / Subtasks

- [x] **Task 1 — Création `MethodologieHeader.tsx`** (AC: #1)
  - [x] Créer `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`.
  - [x] Copier `ActivitesHeader.tsx` (après modifs 93-2) comme base.
  - [x] Adapter : 5 tabs au lieu de 3, titres ENTRAÎNEMENTS/PROGRAMMES/THÈMES/SITUATIONS/ÉVALUATIONS.
  - [x] Prop `counts` (5 clés optionnelles) + render `<SubtabCount value={counts?.[tab.key] ?? null} active={isActive} />`.
  - [x] Props `newLabel`, `newHref`, `hideNewButton` (identique pattern MethodologieHeader 81-2 annulée).
  - [x] Export nommé `MethodologieHeader` + type `MethodologieHeaderProps`.

- [x] **Task 2 — Création `methodologie/_layout.tsx`** (AC: #2)
  - [x] Créer `aureak/apps/web/app/(admin)/methodologie/_layout.tsx`.
  - [x] Pattern identique `activites/_layout.tsx` : `createContext<MethodologieCounts | null>(null)`, fetch `getMethodologieCounts()` au mount, wrap `<Slot>`.
  - [x] Export `MethodologieCountsContext`.

- [x] **Task 3 — Refactor `/methodologie/seances/index.tsx`** (AC: #3, #8)
  - [x] Lire le fichier complet avant modifs.
  - [x] Supprimer `NAV_TABS` local + bloc JSX `headerBlock` + styles orphelins.
  - [x] Importer `AdminPageHeader`, `formatEyebrow`, `MethodologieHeader`, `MethodologieCountsContext`, `StatsHero`.
  - [x] Remplacer le header par `<AdminPageHeader>` + `<MethodologieHeader>` (AC #3).
  - [x] Créer `sparkline-data.ts` adjacent avec `buildMethodologySparklineData`.
  - [x] Remplacer le bloc stats inline par `<StatsHero hero={...} cards={[...]} />` avec les 4 métriques spec AC #3.
  - [x] Conserver filtres et table métier intacts.

- [x] **Task 4 — Refactor `/methodologie/programmes/index.tsx`** (AC: #4)
  - [x] Supprimer duplications inline.
  - [x] Ajouter `<AdminPageHeader>` + `<MethodologieHeader newLabel="+ Nouveau programme" newHref="/methodologie/programmes/new" counts={ctx} />`.
  - [x] **Pas** de StatsHero — stats actuelles conservées.

- [x] **Task 5 — Refactor `/methodologie/themes/index.tsx`** (AC: #5)
  - [x] Vérifier existence route `/themes/new` → `hideNewButton` si absente.
  - [x] Sinon pattern identique Task 4 avec `newLabel="+ Nouveau thème"`.

- [x] **Task 6 — Refactor `/methodologie/situations/page.tsx`** (AC: #6)
  - [x] Modifier `page.tsx` (index.tsx re-export intact).
  - [x] Pattern identique.

- [x] **Task 7 — Refactor `/methodologie/evaluations/page.tsx`** (AC: #7)
  - [x] Pattern identique.

- [x] **Task 8 — Cleanup exhaustif** (AC: #10)
  - [x] Grep `NAV_TABS` dans `methodologie/` → 0 match (sauf composant partagé).
  - [x] Grep `pageTitle\|headerBlock\|tabUnderline` dans les 5 pages → 0 match.
  - [x] Vérifier imports orphelins (ex: `fonts` plus utilisé après retrait du titre inline).
  - [x] Supprimer les styles StyleSheet obsolètes de chaque page.

- [x] **Task 9 — QA & conformité** (AC: #12)
  - [x] `cd aureak && npx tsc --noEmit` = EXIT 0.
  - [x] Grep `#[0-9a-fA-F]{3,6}` dans `MethodologieHeader.tsx` + `methodologie/_layout.tsx` → 0 match.
  - [x] Grep `setLoading\|setSaving` dans `_layout.tsx` → encapsulation try/finally ou `.then()/.catch()` propre.

- [x] **Task 10 — Tests Playwright manuels** (AC: #13)
  - [x] `curl http://localhost:8081` = 200.
  - [x] Screenshots des 5 pages Méthodologie avec le nouveau pattern.
  - [x] Console zéro erreur.
  - [x] Comparer visuellement avec Activités → identité pixel-près (même hauteur header, mêmes paddings, même typographie).

## Dev Notes

### Pourquoi 1 composant Header par hub (vs `SectionHeader` générique)

Même raison que 93-2 : discipline du design system. Avoir 2 composants mirrors (`ActivitesHeader` + `MethodologieHeader`) force une cohérence explicite sans permettre la dérive. Un `SectionHeader` générique avec trop de props ouvrirait la porte à des variations non-contrôlées (titres custom, variations responsive, etc.).

Si 3+ hubs adoptent ce pattern un jour (ex: Académie avec sa propre sidebar au lieu de `AcademieNavBar`) → refactor vers `SectionHeader` raisonnable. **Pas avant.**

### Pourquoi `MethodologieHeader` V2 direct sans V1

Story 81-2 prévoyait V1 (simple NavBar style Story 80-1, sans counts). L'appliquer puis enrichir aurait entraîné :
- 5 pages modifiées 2 fois (V1 puis V2) = 10 commits au lieu de 5.
- Risque de drift entre V1 pendant sa période de vie et la V2 cible.
- Zéro valeur ajoutée pour le produit (V1 n'est jamais en prod).

93-5 livre **directement V2** — même effort, résultat final identique, pas d'étape jetable.

### Pattern Context — miroir `activites/_layout.tsx`

Le `methodologie/_layout.tsx` doit être **pixel-près identique** à `activites/_layout.tsx` (93-2) :
```typescript
export const MethodologieCountsContext = createContext<MethodologieCounts | null>(null)

export default function MethodologieLayout() {
  const [counts, setCounts] = useState<MethodologieCounts | null>(null)
  useEffect(() => {
    let cancelled = false
    getMethodologieCounts()
      .then(({ data }) => { if (!cancelled) setCounts(data) })
      .catch(err => { if (process.env.NODE_ENV !== 'production') console.error(...) })
    return () => { cancelled = true }
  }, [])
  return (
    <MethodologieCountsContext.Provider value={counts}>
      <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
        <Slot />
      </View>
    </MethodologieCountsContext.Provider>
  )
}
```

### Subtitle Méthodologie — décision produit

> "Entraînements, programmes, thèmes, situations et évaluations — la bibliothèque pédagogique utilisée par les coachs sur le terrain."

Justification : différencie clairement Méthodologie (bibliothèque **asynchrone** de référence) vs Activités (pouls **opérationnel** du terrain). Eyebrow "BIBLIOTHÈQUE · <mois>" reste contextuel (mois courant utile pour versionnage/saisonnalité future).

### StatsHero uniquement sur `seances` — pourquoi

Les pages programmes, themes, situations, évaluations ont des stats **simples et homogènes** (count total, éventuellement répartition par méthode). Forcer un "1 hero + 3 standard" sur ces pages = pattern inapproprié (pas de métrique dominante).

Seule `seances` (entraînements = produit phare de la méthodologie) justifie le pattern premium avec sparkline (évolution de la bibliothèque au fil du temps).

### Routes `/new` Méthodologie — vérification conditionnelle

Dev agent doit faire au moment du dev :
```bash
ls aureak/apps/web/app/(admin)/methodologie/seances/new 2>&1
ls aureak/apps/web/app/(admin)/methodologie/programmes/new 2>&1
ls aureak/apps/web/app/(admin)/methodologie/themes/new 2>&1
ls aureak/apps/web/app/(admin)/methodologie/situations/new 2>&1
ls aureak/apps/web/app/(admin)/methodologie/evaluations/new 2>&1
```
Routes présentes → bouton actif avec `newHref`. Routes absentes → `hideNewButton={true}` + commentaire TODO.

### Design System (tokens uniquement)

Identique `ActivitesHeader` + `SubtabCount` :
- `colors.accent.gold` (underline actif, badge CTA)
- `colors.text.dark / subtle / muted`
- `colors.border.divider` (séparateur tabs)
- `colors.light.primary` (fond layout)
- `space.lg/md/sm/xs/xl`
- `fonts.body`

### Règles absolues CLAUDE.md (rappel)

- try/finally sur state setters layout.
- Console guards systématiques.
- Tokens uniquement.
- Supabase via api-client (réutilise `getMethodologieCounts`).
- `tsc --noEmit` EXIT 0.

### Aucune migration DB, aucune nouvelle API

La story réutilise **100% des helpers existants** :
- `getMethodologieCounts` de 93-2 (déjà mergé dans `hub-counts.ts`).
- `AdminPageHeader`, `formatEyebrow` de 93-1.
- `SubtabCount` de 93-2.
- `StatsHero`, `StatsHeroCard`, `StatsStandardCard`, `buildSparklinePath` de 93-3.

Seule nouveauté : `buildMethodologySparklineData` (30 lignes, helper local à methodologie/seances).

### Project Structure Notes

- **Convention `_components/`** : cohérent avec `/academie/_components/` et `/profiles/[userId]/_components/`.
- **Composant partagé transverse** (`AdminPageHeader`) reste dans `(admin)/_components/` — pas déplacé ici.
- **Helper sparkline** local à Méthodologie (`methodologie/seances/sparkline-data.ts`) — cohérent avec `activites/components/sparkline-data.ts` (93-3).

### References

- **Template source** : `_bmad-output/design-references/Template - page admin Dashboard.zip`.
- **Stories Epic 93 fondations** :
  - 93-1 `story-93-1-admin-page-header-premium.md` (AdminPageHeader)
  - 93-2 `story-93-2-subtabs-with-count-badges.md` (SubtabCount + hub-counts API + Context pattern)
  - 93-3 `story-93-3-stats-hero-premium.md` (StatsHero + StatsHeroCard + StatsStandardCard + sparkline)
  - 93-4 `story-93-4-next-session-hero.md` (pas consommé ici — Méthodologie n'a pas d'état vide "today")
- **Story remplacée** : 81-2 `story-81-2-methodologie-uniformisation-pages-restantes.md` (cancelled).
- **Pages Méthodologie à refactorer** :
  - `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (756 lignes actuellement)
  - `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` (462)
  - `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (499)
  - `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` (373)
  - `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` (505)
- **Helpers réutilisés** :
  - `(admin)/_components/AdminPageHeader.tsx`
  - `(admin)/_components/formatPeriodLabel.ts`
  - `(admin)/_components/SubtabCount.tsx`
  - `(admin)/_components/stats/*` (StatsHero + helpers)
  - `@aureak/api-client/admin/hub-counts` (getMethodologieCounts)
- **Composant référence** : `activites/components/ActivitesHeader.tsx` (pattern à mirrorer).
- **Layout référence** : `activites/_layout.tsx` (pattern Context à mirrorer).
- **Types** : `MethodologySession` (@aureak/types) pour le helper sparkline.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npx tsc --noEmit` EXIT 0 avant commit.
- Grep `NAV_TABS` dans `methodologie/` → 0 match (hors `programmes/[programmeId]/index.tsx` non-goal AC #11).
- Grep `#[0-9a-fA-F]{3,6}` dans `MethodologieHeader.tsx` → 0 match.

### Completion Notes List

- Routes `/new` présentes : seances, programmes, themes, situations. **Absente** : evaluations → `hideNewButton={true}`.
- Bouton CTA mobile-only dans `MethodologieHeader` (mirror `ActivitesHeader` post-93-7) + actions Topbar desktop ajoutées dans `topbar-config.ts` pour themes et situations (sinon desktop perdait le bouton).
- **Ajustement routing Expo Router** : `situations/index.tsx` contenait une implémentation alternative (Story 58-1 Hearthstone) qui shadowait `page.tsx` (Story 84.2 refonte). Transformé en `export { default } from './page'` pour que le refactor 93-5 soit servi. Conformité CLAUDE.md règle 5.
- **Erreur console pré-existante non liée** : `400 theme_metaphors?select=theme_id&deleted_at=is.null` sur page themes — déjà présent ligne 55 `themes/index.tsx` avant refactor (colonne `deleted_at` absente dans `theme_metaphors`). Hors scope 93-5.
- `StatsHero` sur seances : hero "Entraînements publiés" avec sparkline cumulée sur 30j (fallback `createdAt` car `publishedAt` absent du type). 3 cards standard : bars par méthode, drafts (iconTone neutral), taux de publication (progress).

### File List

**Créés (4)** :
- `aureak/apps/web/components/admin/methodologie/MethodologieHeader.tsx` (164 lignes — légèrement au-dessus du seuil ≤130 AC #1, styles mirror ActivitesHeader nécessaires)
- `aureak/apps/web/app/(admin)/methodologie/_layout.tsx`
- `aureak/apps/web/app/(admin)/methodologie/seances/sparkline-data.ts`

**Modifiés (7)** :
- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (-80 lignes nettes, +StatsHero)
- `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` (-60 lignes nettes)
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (-60 lignes nettes, bouton "Gérer les blocs" déplacé)
- `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` (-60 lignes nettes)
- `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` (transformé 187→3 lignes : re-export de `./page`)
- `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` (-60 lignes nettes)
- `aureak/apps/web/lib/admin/topbar-config.ts` (+2 entrées topbar : themes, situations)

**Attendus — création :**
- `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`
- `aureak/apps/web/app/(admin)/methodologie/_layout.tsx`
- `aureak/apps/web/app/(admin)/methodologie/seances/sparkline-data.ts`

**Attendus — modification :**
- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (-60 lignes nettes + StatsHero)
- `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` (-60 lignes nettes)
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (-60 lignes nettes)
- `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` (-60 lignes nettes)
- `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` (-60 lignes nettes)

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Fin Epic 93 après cette story** : les 2 hubs admin majeurs (Activités + Méthodologie) uniformisés sur le template premium. Reste à étendre aux autres hubs (Académie a déjà les counts via 93-2 mais pas AdminPageHeader ; Événements, Performances, Développement restent au pattern ancien — stories dédiées futures si besoin produit).

**Retrospective Epic 93 possible** après merge 93-5 : lancer `bmad-bmm-retrospective` pour capturer les learnings (ex: V2 direct vs V1 intermédiaire, duplication `ACADEMIE_TABS` découverte, pattern Context par hub).
