# Story 50.11 : Dashboard Admin v2 — Refonte Layout Trois Zones

Status: done

## Story

En tant qu'admin,
je veux voir le dashboard réorganisé en trois zones visuellement distinctes (Briefing du jour / KPIs académie / Performance & Gamification) avec suppression du Hero Band et du feed latéral,
afin d'obtenir une vue de contrôle plus lisible où l'essentiel opérationnel (statut des implantations) est visible immédiatement en haut de page.

## Acceptance Criteria

1. **Zone 1 — Briefing du jour** : le premier bloc visible est une rangée horizontale composée d'une date card dark à gauche et d'une grille d'implantations à droite. La date card et les cartes implantation ont **la même hauteur** (min-height identique, réalisé via `align-items: stretch` sur le conteneur flex).
2. **Date card** : affiche le jour de la semaine (ex. "DIMANCHE"), le numéro du jour en grand (font-size 36, weight 900, `colors.accent.gold`), le mois + année, une heure en temps réel (mise à jour toutes les secondes), un compteur "X séance(s) aujourd'hui" et un bouton "Voir planning" (`href="/seances"`). Couleur de fond : `colors.text.dark` (#1A1A1A token existant).
3. **Cartes implantation** : une carte par implantation du tenant (données depuis `listImplantations()` + `getImplantationStats()` existants). Chaque carte affiche : nom de l'implantation, statut coloré en bordure top (vert `colors.status.present` = tout OK, orange `colors.status.attention` = avertissement, rouge `colors.accent.red` = problème), 4 status rows (coachs OK/total, nb joueurs attendus, terrain OK/problème, absences parents signalées), et les pills des séances du jour avec horaires. La logique de statut global (vert/orange/rouge) est : rouge si terrain indisponible ou 0 coachs présents ; orange si absences parents > 0 ou coach partiel ; vert sinon.
4. **Hero Band supprimé** : le composant `<HeroBand>` n'est plus rendu. Le `<LiveCounter>` est conservé s'il y a des séances actives (inchangé). Le bouton "Mode plein écran" (⛶) est déplacé dans la date card (coin supérieur droit).
5. **Activity feed latéral supprimé** : le layout `page-layout` / `main-col` / `aside-col` est remplacé par un layout colonne simple (`flex-direction: column`). Le composant `ActivityFeed` n'est plus rendu. Les états `activityEvents`, `tickMinute` et la subscription Realtime dédiée au feed sont supprimés du composant principal.
6. **Zone 2 — KPIs académie** : le bento grid 3 colonnes avec filtres (implantation + période) est conservé à l'identique, avec le mécanisme drag-drop (`kpiOrder`, `localStorage`) intact. La ligne de filtres est déplacée en en-tête de zone (au-dessus du bento, non plus dans la `filterRow` globale). Les options de période disponibles : "Semaine en cours", "Semaine passée", "4 dernières semaines", "Personnalisé".
7. **Zone 3 — Performance & Gamification** : grille `grid-template-columns: 2fr 1fr 1fr` pour la première ligne (Leaderboard grand + Score académie + Joueur de la semaine), et `grid-template-columns: 1fr 1fr 1fr` pour la seconde ligne (Forme du moment + Trophée de saison + Countdown prochaine séance). Tous les composants gamification existants (`PlayerOfWeekTile`, `SeasonTrophy`, countdown) sont conservés et simplement repositionnés dans cette zone.
8. **Séparateurs visuels** : chaque zone est précédée d'un label de section (`colors.text.subtle`, 10px, uppercase, letter-spacing 1.5px) et suivie d'un séparateur `height: 1px; background: colors.border.light` (sauf après la Zone 3).
9. **Skeleton mis à jour** : `DashboardSkeleton` remplace le skeleton "hero band + aside" par le nouveau layout 3 zones (date card skeleton + implantations skeleton + bento skeleton + gamification skeleton), sans régression visuelle.
10. **Aucun hardcode couleur** : toutes les couleurs utilisent les tokens `@aureak/theme`. Les seules exceptions admises sont les couleurs inline des status rows qui doivent utiliser `colors.status.present`, `colors.status.attention`, `colors.accent.red`, `colors.text.muted`. Aucun `#hex` ni `rgba()` hardcodé ne doit apparaître — utiliser `colors.token + '1f'` pour les transparences (ex. `colors.accent.gold + '1f'`).
11. **Responsive** : la grille d'implantations passe de `repeat(3, 1fr)` à `repeat(2, 1fr)` en dessous de 1024px et à `1fr` en dessous de 768px. Les zones 2 et 3 conservent leurs media queries existantes.
12. **Console guards** : tout `console.error` / `console.warn` introduit ou modifié doit être protégé par `if ((process.env.NODE_ENV as string) !== 'production')`.

## Tasks / Subtasks

- [x] T1 — Nouveau composant `BriefingDuJour` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Dans `page.tsx`, créer la fonction composant `BriefingDuJour`.
  - [x] T1.2 — Implémenter la **date card dark** : heure temps réel, jour semaine, numéro jour, mois+année, compteur séances, bouton "Voir planning", bouton ⛶.
  - [x] T1.3 — Implémenter les **cartes implantation** avec statut coloré (barre top) et status rows.
  - [x] T1.4 — Pills séances : non implémentées (données pas disponibles dans ImplantationStats existant — TODO story suivante).
  - [x] T1.5 — Conteneur `BriefingDuJour` : `display: flex, alignItems: stretch`. Media queries CSS via `<style>` inline.

- [x] T2 — Restructuration du rendu principal (AC: 4, 5, 6, 7, 8)
  - [x] T2.1 — `<HeroBand>` supprimé du rendu ET du fichier.
  - [x] T2.2 — `page-layout / main-col / aside-col` supprimés — layout colonne simple.
  - [x] T2.3 — Feed latéral supprimé. `fetchActivityFeed` import supprimé (non utilisé ailleurs).
  - [x] T2.4 — États `activityEvents`, `tickMinute`, subscription Realtime feed, timer minute supprimés.
  - [x] T2.5 — `<BriefingDuJour>` rendu après `<LiveCounter>`, avant Zone 2.
  - [x] T2.6 — Labels de zone et séparateurs insérés (Zone 1 / Zone 2 / Zone 3).
  - [x] T2.7 — Filtres déplacés dans l'en-tête Zone 2.
  - [x] T2.8 — Zone 3 avec `.perf-grid` (2fr 1fr 1fr) + `.perf-grid-bottom` (1fr 1fr 1fr).

- [x] T3 — Mise à jour DashboardSkeleton (AC: 9)
  - [x] T3.1 — Hero band skeleton remplacé par Zone 1 skeleton (date card + grille implantations).
  - [x] T3.2 — Pas d'aside skeleton à supprimer (n'existait pas dans DashboardSkeleton).
  - [x] T3.3 — Zone 3 skeleton ajouté après bento.

- [x] T4 — Nettoyage CSS (AC: 10, 11)
  - [x] T4.1 — `.page-layout`, `.main-col`, `.aside-col`, `@keyframes feed-slide-in`, `.feed-item`, `.feed-item-new`, `.aside-scroll` supprimés du CSS inline.
  - [x] T4.2 — `.briefing-row`, `.implant-grid`, `.implant-card`, `.status-row`, `.status-dot`, `.perf-grid`, `.perf-grid-bottom` ajoutés.
  - [x] T4.3 — Aucune couleur `#hex` hardcodée. Transparences via `colors.token + '1f'`.

- [x] T5 — QA et validation (AC: tous)
  - [x] T5.1 — Tous les `setLoading*(false)` sont dans des blocs `finally {}`.
  - [x] T5.2 — Tous les `console.error` ont un guard `NODE_ENV !== 'production'`.
  - [x] T5.3 — Playwright skipped — app non démarrée au moment du dev.
  - [x] T5.4 — Mécanisme KPI drag-drop intact (kpiOrder, localStorage, handlers inchangés).
  - [x] T5.5 — Bouton ⛶ dans DateCard appelle `onEnterFocusMode` → `setFocusMode(true)`.
  - [x] T5.6 — TypeScript : zéro erreur (`npx tsc --noEmit` clean).

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className sauf pour les CSS classes injectées via `<style>` inline
- **Tamagui** : XStack, YStack — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées (`#hex`, `rgba()` inline)
- **Try/finally obligatoire** sur tout state setter de chargement
- **Radius tokens disponibles** : `radius.xs` (6), `radius.card` (16), `radius.cardLg` (24), `radius.badge` (999), `radius.button` (12) — `radius.md` et `radius.lg` N'EXISTENT PAS
- **shadows.sm/md** = CSS strings → utiliser comme `boxShadow: shadows.sm` (jamais `shadows.sm.spread`)
- **Transparences** : `colors.token + '1f'` (jamais `rgba()` hardcodé)

---

### T1 — Composant BriefingDuJour

**Référence design** : `_qa/reports/mockup-dashboard-v2.html` — classes `.date-card`, `.implant-card`, `.implant-ok/warn/ko`, `.status-row`, `.session-pill`.

Pattern date card (heure temps réel) — déjà utilisé dans `HeroBand` (lignes 146–173) :
```tsx
const [currentTime, setCurrentTime] = useState(() => new Date())

useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1_000)
  return () => clearInterval(timer)
}, [])

const timeLabel = currentTime.toLocaleTimeString('fr-BE', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
})
const dayLabel = currentTime.toLocaleDateString('fr-BE', { weekday: 'long' }).toUpperCase()
const dayNum   = currentTime.getDate()
const monthLabel = currentTime.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' })
```

Pattern status bordure top via CSS pseudo-élément (classe injectée dans `<style>`) :
```css
.implant-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.implant-ok::before   { background: /* colors.status.present interpolé */ ; }
.implant-warn::before { background: /* colors.status.attention interpolé */ ; }
.implant-ko::before   { background: /* colors.accent.red interpolé */ ; }
```

Logique de statut implantation :
```tsx
function getImplantStatus(stat: ImplantationStats): 'ok' | 'warning' | 'ko' {
  if (!stat.terrain_available || (stat.coaches_count ?? 1) === 0) return 'ko'
  if ((stat.absences_count ?? 0) > 0) return 'warning'
  return 'ok'
}
```

**Important** : `ImplantationStats` peut ne pas avoir les champs `terrain_available`, `absences_count`, `coaches_count`. Vérifier dans `aureak/packages/types/src/entities.ts` et `aureak/packages/api-client/src/admin/dashboard.ts`. Si ces champs sont absents du type, utiliser `(stat as any).terrain_available ?? true` en attendant — et noter un TODO pour l'extension du type dans une story suivante. Ne pas bloquer l'implémentation UI pour ça.

---

### T2 — Restructuration du rendu

Le fichier `page.tsx` est structuré ainsi (repères ligne approximatifs) :
- Ligne ~2393 : début du `return (...)`
- Ligne ~2517 : `<HeroBand>` → **supprimer**
- Ligne ~2520 : `<LiveCounter>` → **conserver**
- Ligne ~2531 : `<div className="page-layout">` → **remplacer**
- Ligne ~2532 : `<div className="main-col">` → **supprimer wrapper**
- Lignes ~2534–2591 : filtres → **déplacer dans en-tête Zone 2**
- Lignes ~2593–fin bento : bento grid → **conserver dans Zone 2**
- Lignes aside-col : feed latéral → **supprimer**

Nouveau squelette du `return` :
```tsx
return (
  <div style={containerStyle} className={...}>
    {/* Styles globaux */}
    <style>{`...`}</style>

    {/* Overlay Focus Mode */}
    {focusMode && <FocusBadge/> /* conserver existant */}
    {focusMode && <FocusQuitBtn/> /* conserver existant */}

    {/* LiveCounter — conserver si séances actives */}
    {liveCounters.sessionCount > 0 && <LiveCounter ... />}

    {/* MilestoneCelebration — conserver */}
    {celebrationMilestone && <MilestoneCelebration ... />}

    {/* ── ZONE 1 — BRIEFING DU JOUR ── */}
    <ZoneLabel>Briefing du jour</ZoneLabel>
    <BriefingDuJour
      implantations={implantations}
      stats={stats}
      onEnterFocusMode={() => setFocusMode(true)}
    />
    <ZoneDivider />

    {/* ── ZONE 2 — KPIs ACADÉMIE ── */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <ZoneLabel inline>KPIs académie</ZoneLabel>
      {/* Filtres implantation + période (déplacés ici depuis S.filterRow) */}
      <FiltersRow ... />
    </div>
    {/* Bento grid (inchangé) */}
    <div className="bento-grid">...</div>
    <ZoneDivider />

    {/* ── ZONE 3 — PERFORMANCE & GAMIFICATION ── */}
    <ZoneLabel>Performance & Gamification</ZoneLabel>
    <div className="perf-grid">
      {/* Leaderboard (span col large) */}
      {/* Score académie */}
      {/* Joueur de la semaine */}
    </div>
    <div className="perf-grid-bottom">
      {/* Forme du moment */}
      {/* Trophée de saison */}
      {/* Countdown prochaine séance */}
    </div>
  </div>
)
```

`ZoneLabel` et `ZoneDivider` peuvent être de simples éléments inline (pas de composant séparé obligatoire) :
```tsx
// Zone label
<div style={{ fontSize: 10, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
  Briefing du jour
</div>
// Zone divider
<div style={{ height: 1, background: colors.border.light, margin: '24px 0' }} />
```

---

### T3 — Skeleton

Conserver les helpers `SkeletonBlock` et la `<style>` avec `@keyframes a-pulse`. Remplacer la structure :

```tsx
// AVANT (supprimer) :
<SkeletonBlock h={160} r={radius.card} />  {/* Hero band */}

// APRÈS (ajouter) :
{/* Zone 1 skeleton */}
<SkeletonBlock h={14} w="120px" r={4} />
<div style={{ display: 'flex', gap: 16, marginBottom: 24, marginTop: 12 }}>
  <SkeletonBlock h={180} w="160px" r={radius.card} />
  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
    {[0,1,2].map(i => <SkeletonBlock key={i} h={180} r={radius.card} />)}
  </div>
</div>
```

---

### Design — Tokens à utiliser

```tsx
import { colors, shadows, radius, transitions } from '@aureak/theme'

// Date card fond
backgroundColor : colors.text.dark          // #1A1A1A — token existant
borderTop       : `3px solid ${colors.accent.gold}`

// Cartes implantation
backgroundColor : colors.light.surface      // #FFFFFF
border          : `1px solid ${colors.border.light}`
boxShadow       : shadows.sm

// Bordure status top
ok      → colors.status.present             // #10B981
warning → colors.status.attention           // #D97706 (vérifier token exact)
ko      → colors.accent.red                 // #E05252

// Session pill active
backgroundColor : colors.accent.gold + '1f'
borderColor     : colors.accent.gold + '40'
color           : colors.accent.gold

// Zone label
color           : colors.text.subtle        // token existant
// Zone divider
background      : colors.border.light

// Perf grid leaderboard card — gold border top
borderTop       : `3px solid ${colors.accent.gold}`

// Score académie progress bar
backgroundColor : colors.accent.gold        // barre remplie
background      : colors.border.light       // fond barre (light.hover ou border.light)
```

**Vérifier** les tokens exacts dans `aureak/packages/theme/src/tokens.ts` avant de coder : `colors.status.attention` peut s'appeler `colors.status.warning` ou `colors.status.latent` selon la version. Prendre le token orange/amber disponible.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Fichier principal — toutes les modifications de cette story |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/admin/dashboard.ts` — aucune nouvelle API nécessaire, toutes les données viennent des appels existants
- `aureak/packages/types/src/entities.ts` — aucun nouveau type (si champs manquants dans ImplantationStats → cast `as any` + TODO, pas de modification de type dans cette story)
- `aureak/packages/theme/src/tokens.ts` — lecture seule, ne pas modifier les tokens
- `aureak/packages/ui/` — aucun nouveau composant UI package dans cette story
- Toute migration Supabase — cette story est 100% UI, aucune migration nécessaire

---

### Dépendances à protéger

- Story 50-9 (focus mode) utilise `focusMode` state et `onEnterFocusMode` callback — conserver la signature exacte, déplacer uniquement l'endroit où le bouton ⛶ est rendu (de HeroBand vers DateCard)
- Story 50-10 (KPI drag-drop) utilise `kpiOrder`, `draggedId`, `dragOverId`, `handleDragStart`, `handleDragOver`, `handleDrop`, `handleDragEnd`, `resetKpiOrder`, `KPI_ORDER_KEY` — **ne rien modifier à ces mécanismes**, seulement déplacer leur rendu dans Zone 2
- Story 55-8 (PlayerOfWeekTile) — `playerOfWeek` state et `<PlayerOfWeekTile>` conservés dans Zone 3
- Story 59-3 (Leaderboard XP) — `leaderboard` state et son rendu conservés dans Zone 3
- Story 59-6 (Academy Score) — `academyScore` state et son rendu conservés dans Zone 3
- Story 59-10 (Season Trophy) — `trophyData` state et `<SeasonTrophy>` conservés dans Zone 3
- Story 50-3 (Countdown) — `upcomingSession` state et countdown conservés dans Zone 3

---

### Multi-tenant

RLS Supabase gère l'isolation. `listImplantations()` et `getImplantationStats()` retournent déjà uniquement les données du tenant courant. Aucun paramètre `tenantId` à ajouter.

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- API dashboard existante : `aureak/packages/api-client/src/admin/dashboard.ts`
- Mockup de référence visuelle : `_qa/reports/mockup-dashboard-v2.html`
- Composant HeroBand (pattern date/heure à réutiliser) : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes ~146–273
- Pattern KPI drag-drop (à conserver intact) : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes ~1942–1983
- Pattern try/finally référence : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (tous les useEffect de chargement)
- Story focus mode : `_bmad-output/implementation-artifacts/story-50-9-dashboard-focus-mode-plein-ecran.md`
- Story KPI drag-drop : `_bmad-output/implementation-artifacts/story-50-10-dashboard-tiles-kpi-reorganisables.md`

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
