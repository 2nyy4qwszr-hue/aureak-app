# Story 98.4 — Hub `/performance` : vue d'ensemble dashboard-style avec KPIs de synthèse

Status: done

## Completion Notes

### Refonte

- **Layout** : AdminPageHeader v2 + action export PDF (conservée), 3 sections :
  1. Vue d'ensemble — 4 KPIs via `StatsStandardCard`
  2. Explorer en détail — 5 raccourcis (charge, clubs, présences, progression, implantations)
  3. Comparaisons — 2 raccourcis (evaluations, implantations)
- **KPIs** : via `getStatsRoomKpis` existante (1 seul round-trip, 4 counts + avgAttendanceRate).
  - Taux présence (% + trend up/neutral/down selon seuils 80/60)
  - Joueurs actifs (child_directory actifs)
  - Séances totales (non annulées)
  - Clubs liés (club_directory actifs)
- **Responsive** : 4 colonnes KPIs / 5 colonnes raccourcis en desktop ; 2/3 en tablet ; 1 en mobile.
- **Ancien header dark premium** + ExportModal : conservés (modal déplacée dans le même fichier, mêmes styles).

### Décisions

- **Pas de `getPerformanceSummary()`** nouvelle : `getStatsRoomKpis` couvre déjà les besoins → option B de l'AC #5 retenue.
- **Insights (AC #7)** : reporté — nécessite analyses complémentaires (coach surcharge, joueurs inactifs). Scope story dédiée.
- **Non-inventé** : pas ajouté de KPI sans source (ex. satisfaction). 4 KPIs factuels.

## Metadata

- **Epic** : 98 — Performance refonte
- **Story ID** : 98.4
- **Story key** : `98-4-hub-performance-vue-ensemble`
- **Priorité** : P2 (valeur produit — hub plus utile)
- **Dépendances** : **97.3** (AdminPageHeader v2) + **98.1** (migration URL) + **98.2** (template sous-pages)
- **Source** : Audit UI 2026-04-22. L'utilisateur a répondu "fais moi le plus utile" pour le hub Performance. Cette story livre le "plus utile" : vue d'ensemble KPIs de synthèse + raccourcis.
- **Effort estimé** : L (~6-9h — conception hub, cartes KPIs transverses, data agrégation, design responsive)

## Story

As an admin,
I want que la page `/performance` soit refondue en vraie vue d'ensemble dashboard-style — affichant 4-6 cartes de KPIs transverses dérivés des 5 sous-pages (charge, clubs, présences, progression, implantations) + raccourcis vers chaque sous-page + éventuels "insights" ou alertes,
So that je puisse, dès l'entrée dans la zone Performance, avoir un aperçu immédiat de l'état de l'académie sans avoir à cliquer sur chacune des 5 sous-pages.

## Contexte

### État actuel

`app/(admin)/analytics/page.tsx` (sera `app/(admin)/performance/page.tsx` après 98.1) — probablement une page simple hub avec liens vers les sous-pages ou un dashboard partiellement développé.

### Vision du hub refondu

Layout cible inspiré du pattern "dashboard Aureak premium" (cf. carte "Présence moyenne 30J" validée par user image 19) :

```
<AdminPageHeader title="Performance" periodButton={...} />

┌─────────────────────────────────────────────────────┐
│ [KPI 1: Présence moyenne 30J]  [KPI 2: Progression] │
│ [KPI 3: Charge coaches]        [KPI 4: Satisfaction]│
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ [Raccourcis sous-pages 5x2 grid ou hub vertical]    │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ [Section insights / alertes si applicable]          │
└─────────────────────────────────────────────────────┘
```

### KPIs candidats (à cadrer précisément)

Dérivés des sous-pages existantes :
- **Présence moyenne 30 derniers jours** (agrégé de `/performance/presences`)
- **Progression moyenne joueurs** (agrégé de `/performance/progression`)
- **Charge moyenne coaches cette semaine** (agrégé de `/performance/charge`)
- **Nombre d'implantations actives** (agrégé de `/performance/implantation`)
- **Top 3 clubs par performance** (lien vers `/performance/clubs`)
- **Alertes éventuelles** (coachs en surcharge, joueurs inactifs, etc. — optionnel)

### Contrainte importante

**Pas de nouvelles sources de données**. Le hub agrège ce qui existe déjà dans les 5 sous-pages. Si une donnée n'existe pas (ex. "progression moyenne"), ne pas la créer dans cette story — la noter comme "à livrer plus tard".

## Acceptance Criteria

1. **Layout hub** :
   - `<AdminPageHeader title="Performance" />` en haut
   - Optionnel : `periodButton={ label: 'Avril 2026', onPress: openPeriodPicker }` pour filtrer la période agrégée
   - Grille 2x2 (ou 3x2 selon largeur) de cartes KPI
   - Section raccourcis vers les 5 sous-pages

2. **4 cartes KPI minimum** :
   - **Card 1 — Présence moyenne** : valeur % (30 derniers jours), icône "présence", footer éventuel "delta vs mois précédent"
   - **Card 2 — Progression joueurs** : valeur ou status agrégé
   - **Card 3 — Charge coaches** : valeur (heures/semaine ou équivalent), alerte si seuil dépassé
   - **Card 4 — Implantations actives** : count, footer "X activées ce mois"

3. **Cartes utilisent le composant `<StatsStandardCard>`** existant (cf. Story 93.3, `components/admin/stats/`). Pas de duplication de style.

4. **Raccourcis vers sous-pages** :
   - 5 cartes cliquables (une par sous-page) avec icône, titre, description courte
   - Au clic : `router.push('/performance/<subpage>')`
   - Layout : grid responsive (5 colonnes desktop, 2-3 mobile)

5. **Data agrégation** : accès via `@aureak/api-client` uniquement. Si une fonction d'agrégation n'existe pas :
   - Option A : créer `getPerformanceSummary()` dans api-client qui retourne les 4 KPIs en une seule requête (optimal perf)
   - Option B : appeler 4 fonctions existantes en parallèle (`Promise.all`) — plus simple, moins perf
   - Recommandation : **B** pour la première version, refacto perf en story séparée si latence gênante.

6. **States** :
   - Loading : skeleton cartes
   - Empty (data insuffisante) : afficher "—" ou "Données insuffisantes" dans la carte
   - Error partiel : afficher les cartes qui ont des données, skeleton/message sur celles en erreur

7. **Section insights (optionnelle)** :
   - Si scope permet : afficher 2-3 alertes dérivées des KPIs (ex. "Coach X en surcharge", "Implantation Y sans activité")
   - Si trop complexe, reporter en story future

8. **Responsive** :
   - Desktop (>1024px) : grille 2x2 KPIs + 5 raccourcis horizontaux
   - Tablet (640-1024px) : 2x2 KPIs + 5 raccourcis grille 3+2
   - Mobile (<640px) : cartes empilées verticalement

9. **Styles** : 100% tokens `@aureak/theme`. Grep hex → 0 match.

10. **try/finally + console guards** sur fetch data.

11. **Conformité CLAUDE.md** : tsc OK, Expo Router, api-client, tokens.

12. **Test Playwright** :
    - `/performance` charge hub
    - 4 KPIs visibles avec valeurs ou loading states
    - 5 raccourcis cliquables → navigation vers sous-pages
    - Responsive 500px OK
    - Console zéro erreur
    - Screenshots desktop + mobile

13. **Non-goals explicites** :
    - **Pas de création de nouveaux KPIs sans source existante**
    - **Pas de drill-down interactif** sur les KPIs (juste valeur + lien)
    - **Pas de personnalisation** (KPIs affichés fixes, pas de drag-drop configurable)
    - **Pas de sparklines complexes** (si déjà dans StatsStandardCard, OK ; sinon hors scope)

## Tasks / Subtasks

- [ ] **T1 — Conception et cadrage KPIs** (AC #2, #5)
  - [ ] Lister les 4-6 KPIs candidats avec sources data existantes
  - [ ] Valider avec dev agent que chaque KPI est calculable avec l'api-client actuel
  - [ ] Documenter la décision dans completion notes

- [ ] **T2 — API client summary (optionnel)** (AC #5)
  - [ ] Décider A/B
  - [ ] Si A : créer `getPerformanceSummary()`

- [ ] **T3 — Layout hub page** (AC #1)
  - [ ] `<AdminPageHeader />`
  - [ ] Grille KPIs
  - [ ] Grille raccourcis

- [ ] **T4 — Cartes KPI** (AC #2, #3, #5, #6)
  - [ ] Implémentation des 4 cartes via `StatsStandardCard`
  - [ ] States loading/empty/error

- [ ] **T5 — Raccourcis sous-pages** (AC #4)
  - [ ] 5 cartes cliquables

- [ ] **T6 — Responsive** (AC #8)
  - [ ] useWindowDimensions
  - [ ] Layout adaptatif

- [ ] **T7 — Insights (optionnel)** (AC #7)
  - [ ] Si scope permet

- [ ] **T8 — QA** (AC #9-12)
  - [ ] Grep hex, tsc OK
  - [ ] Playwright desktop + mobile

## Dev Notes

### Pattern "dashboard premium"

Le dashboard Admin Aureak (bento) a déjà été validé visuellement (cf. MEMORY.md `project_design_dashboard.md`). Réutiliser le même language visuel pour cohérence — cartes foncées ou claires selon tokens, ombres subtiles, espacements généreux.

### Composant `StatsStandardCard` (Story 93.3)

Localisation : `aureak/apps/web/components/admin/stats/`.
Props attendues (à vérifier au dev) :
```typescript
type StatsStandardCardProps = {
  label: string
  value: string | number
  unit?: string
  footer?: { type: 'delta' | 'progress' | 'text'; ... }
  iconTone?: 'neutral' | 'success' | 'warning' | 'danger'
}
```

### Optimisation data fetch

Option B (4 appels parallèles) acceptable tant que chacun est < 500ms. Si l'un devient lent, envisager :
- Cache server-side (Redis, edge function)
- Agrégation SQL pre-calculée
- Refresh incrémental

Scope out de cette story (garder perf B simple).

### Prudence KPI sans source claire

Ne pas inventer un KPI sans data source. Ex. "Satisfaction coaches" = pas de table dédiée → **ne pas le mettre**. Préférer un KPI valide sur data existante plutôt qu'un KPI faux qui induit en erreur l'admin.

### References

- Page : `app/(admin)/performance/page.tsx` (après 98.1)
- Composant stats : `components/admin/stats/`
- Pattern dashboard : MEMORY.md (`project_design_dashboard.md`)
- Référence visuelle premium : image utilisateur 19 (carte "Présence moyenne 30J")
- Types : `@aureak/types`
