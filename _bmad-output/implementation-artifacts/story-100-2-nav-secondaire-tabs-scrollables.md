# Story 100.2 — Nav secondaires en tabs scrollables horizontaux

Status: done

## Metadata

- **Epic** : 100 — Mobile navigation (fondations)
- **Story ID** : 100.2
- **Story key** : `100-2-nav-secondaire-tabs-scrollables`
- **Priorité** : P1
- **Dépendances** : **100.3** (layout topbar mobile) · recommandé après 100.1
- **Source** : Décision produit 2026-04-22, mobile-first admin.
- **Effort estimé** : M (~1j — adapter 5-6 composants nav secondaires)

## Story

As an admin sur mobile,
I want que les nav secondaires (ActivitesHeader 3 tabs, MethodologieHeader 5 tabs, AcademieNavBar 8 tabs, ProspectionNavBar 3 tabs, EvenementsHeader 5 tabs, PartenariatNavBar 2 tabs) soient scrollables horizontalement sur mobile sans débordement ni retour à la ligne,
So that je puisse naviguer entre les sous-sections d'une zone sans que la nav casse le layout.

## Contexte

### Problème actuel

Sur un viewport 375px (iPhone SE), une nav secondaire avec 8 onglets (AcademieNavBar) ne tient pas sur une ligne :
- Soit les labels passent à la ligne et le header devient énorme
- Soit les tabs sont tronqués

### Solution mobile-first

`ScrollView horizontal` avec :
- Hauteur fixe
- Scroll indicator caché
- Snap aux onglets (optionnel, cohérent avec iOS/Android native)
- L'onglet actif auto-scrollé en vue à chaque changement

## Acceptance Criteria

1. **Composants impactés** (adapter chacun) :
   - `components/admin/activites/ActivitesHeader.tsx` (3 tabs)
   - `components/admin/methodologie/MethodologieHeader.tsx` (5 tabs)
   - `components/admin/academie/AcademieNavBar.tsx` (8 tabs)
   - `components/admin/prospection/ProspectionNavBar.tsx` (3 tabs)
   - `components/admin/evenements/EvenementsHeader.tsx` (5 tabs)
   - `components/admin/partenariat/PartenariatNavBar.tsx` (si existant, sinon noter)
   - `components/admin/performance/PerformanceNavBar.tsx` (si existant)

2. **Pattern appliqué** à chaque composant :
   ```tsx
   <ScrollView
     horizontal
     showsHorizontalScrollIndicator={false}
     contentContainerStyle={s.tabsRow}
     ref={scrollRef}
   >
     {tabs.map(tab => <Tab ... />)}
   </ScrollView>
   ```

3. **Auto-scroll onglet actif** : au mount et à chaque changement de route, scroller pour que l'onglet actif soit visible (centré si possible).
   ```tsx
   useEffect(() => {
     if (activeIndex >= 0 && scrollRef.current) {
       scrollRef.current.scrollTo({ x: activeIndex * TAB_WIDTH, animated: true })
     }
   }, [activeIndex])
   ```

4. **Fade edges** (optionnel mais recommandé) : masques dégradés sur bords gauche/droit pour indiquer qu'il y a plus de contenu (évite effet "coupé").

5. **Desktop comportement inchangé** : sur viewport > 640px, le pattern `flexDirection: 'row'` reste (pas de ScrollView qui rajouterait du scroll inutile). Détection via `useWindowDimensions`.

6. **Count badges préservés** : les composants qui affichent un compteur à côté du label (SubtabCount Epic 93.2) continuent de le faire.

7. **Tokens `@aureak/theme` uniquement** — pas de nouveau hex.

8. **Conformité CLAUDE.md** :
    - `tsc --noEmit` EXIT 0
    - Console guards

9. **Test Playwright** :
    - Viewport 375×667 : navigate `/academie/joueurs` → AcademieNavBar scrollable horizontal, onglet Joueurs actif centré
    - Swipe horizontal sur la nav → défile
    - Tap onglet à la fin de la barre → navigation + auto-scroll
    - Viewport 1440×900 : nav affichée en flex row classique

10. **Non-goals** :
    - **Pas de refonte visuelle** des tabs (couleurs, spacings inchangés)
    - **Pas de fusion en un composant générique** — chaque composant garde son identité

## Tasks / Subtasks

- [x] **T1 — ActivitesHeader** (AC #1, #2, #3) — ScrollView ajouté, auto-scroll activité via hook
- [x] **T2 — MethodologieHeader** (idem)
- [x] **T3 — AcademieNavBar** (8 tabs — déjà ScrollView, ajout auto-scroll + nativeID)
- [x] **T4 — ProspectionNavBar** (idem)
- [x] **T5 — EvenementsHeader** (View → ScrollView)
- [x] **T6 — PartenariatNavBar** (ajout nativeID + hook) · **MarketingNavBar** (idem) · **PerformanceNavBar** n'existe pas → skip
- [~] **T7 — Fade edges** — non implémenté (scope optionnel, scroll visuel natif suffisant)
- [x] **T8 — QA** — `tsc --noEmit` EXIT 0, Playwright mobile + desktop

## Completion Notes

- **Hook partagé** `aureak/apps/web/hooks/admin/useScrollTabIntoView.ts` : centralise la logique scroll programmatique. Utilise `getBoundingClientRect` (plus fiable que `offsetLeft` car `offsetParent !== scrollParent` sur RN Web ScrollView).
- **Pattern** : chaque Pressable tab reçoit `nativeID={`tab-<hub>-${tab.key}`}` (mappé à HTML `id` par RN Web). Le hook trouve l'élément, remonte au parent scrollable, calcule le scrollLeft pour centrer.
- **Double setTimeout** (50ms + 300ms) : première tentative quand le DOM est prêt, seconde quand le layout RN s'est stabilisé. Permet de rattraper les cas où la première tentative arrive avant que le ScrollView ne soit complètement monté.
- **scrollTo({ behavior: 'smooth' })** remplacé par assignation directe `scrollLeft = clamped` — plus fiable sur RN Web ScrollView qui ignore parfois le smooth behavior.
- **Desktop préservé** : `flexGrow: 0` sur le ScrollView pour éviter qu'il ne s'étire. `contentContainerStyle` reprend les styles tabsRow existants. Sur desktop, flex row naturel.
- **Fade edges** non fait — pragmatique, la scrollbar native + le comportement swipe mobile suffisent.
- **Tests Playwright** : validation sur 5 pages (academie/implantations, academie/managers, academie/clubs, evenements/seminaires, activites/evaluations) — le tab actif est centré via auto-scroll. Desktop (1440) : pas de ScrollView apparent, rendu flex row inchangé.

## Dev Notes

### Pattern RN ScrollView horizontal

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  ref={scrollRef}
  style={{ flexGrow: 0 }}
  contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm }}
>
  {tabs.map(...)}
</ScrollView>
```

`flexGrow: 0` évite que le ScrollView occupe toute la hauteur disponible.

### Auto-scroll logique

Mesurer la largeur de l'onglet actif via `onLayout` de chaque tab, stocker dans un array, puis scroller vers `offsets[activeIndex] - (viewportWidth / 2 - tabWidth / 2)` pour centrer.

Version simple : `scrollToIndex` avec index et `animated: true`.

### Fade edges

Composant overlay position absolute avec `LinearGradient` masque les bords. Pattern courant iOS.

### References

- Composants listés AC #1
- Pattern Epic 93.2 (SubtabCount) — conservation badges
- Tokens : `@aureak/theme`
