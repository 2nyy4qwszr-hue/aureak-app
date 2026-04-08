# Story 74.2 : Bug — StatCards Badges Fictifs (trend +2.4% hardcodé + Record sans condition)

Status: done

## Story

En tant qu'admin,
je veux que les badges affichés sur les StatCards Séances reflètent des données réelles calculées,
afin de ne pas être induit en erreur par des indicateurs fictifs qui affichent des valeurs inventées.

## Acceptance Criteria

1. Le badge "+2.4%" de la card Présence Moyenne est remplacé par une valeur réellement calculée : delta entre la moyenne de présence des 30 derniers jours et celle des 30 jours précédents (exemple : "+3%" ou "−1%"). Si les données sont insuffisantes (moins de 2 sessions dans l'une ou l'autre période), le badge est masqué.
2. Le badge "Record" de la card Annulées est affiché UNIQUEMENT si `cancelled > 0` ET si le nombre de séances annulées du mois courant est supérieur ou égal au record mensuel observé sur les 6 derniers mois. Si ces conditions ne sont pas remplies, le badge est masqué.
3. Aucune valeur hardcodée fictive ne subsiste dans `StatCards.tsx` : ni `"+2.4%"`, ni `"Record"` affiché inconditionnellement.
4. Tous les setState de chargement (`setLoading`) sont encadrés par un `try/finally` — pattern déjà respecté dans le fichier, à maintenir lors des ajouts.
5. Aucune couleur hardcodée dans `StatCards.tsx` : tous les styles utilisent les tokens `@aureak/theme` (`colors.*`, `space.*`, `radius.*`, `shadows.*`).

## Tasks / Subtasks

- [x] T1 — Calcul du delta trend (AC: 1, 3)
  - [x] T1.1 — Dans `calcStats()`, segmenter les sessions reçues en 3 fenêtres : `last30` (scheduledAt dans les 30 derniers jours), `prev30` (scheduledAt entre J-60 et J-31), et laisser `sessions` complet pour les autres stats
  - [x] T1.2 — Calculer `avgPresLast30` et `avgPresPrev30` avec la même formule que `avgPres` actuelle, restreinte à chaque fenêtre
  - [x] T1.3 — Calculer `trend`: si `last30.length >= 2 && prev30.length >= 2` → `Math.round(avgPresLast30 - avgPresPrev30)` ; sinon `null`
  - [x] T1.4 — Retourner `trend` (number | null) depuis `calcStats()` avec les autres stats

- [x] T2 — Calcul du record mensuel annulations (AC: 2, 3)
  - [x] T2.1 — Dans `calcStats()`, grouper les sessions par mois (`YYYY-MM` depuis `scheduledAt`) et compter les annulées par mois
  - [x] T2.2 — Calculer `maxCancelledPast6Months` : max des cancellations mensuelles sur les 6 mois précédents (hors mois courant)
  - [x] T2.3 — Calculer `cancelledThisMonth` : nombre d'annulations du mois courant
  - [x] T2.4 — Calculer `isRecord: boolean` = `cancelledThisMonth > 0 && cancelledThisMonth >= maxCancelledPast6Months && maxCancelledPast6Months > 0`
  - [x] T2.5 — Retourner `isRecord` depuis `calcStats()`

- [x] T3 — Mise à jour du JSX StatCards (AC: 1, 2, 3, 5)
  - [x] T3.1 — Card 1 (Présence Moyenne) : remplacer le badge `<View style={styles.badgeTrend}>` par un rendu conditionnel — afficher uniquement si `stats.trend !== null`. Texte : `stats.trend >= 0 ? \`+${stats.trend}%\` : \`${stats.trend}%\``
  - [x] T3.2 — Card 3 (Annulées) : remplacer le badge `<View style={styles.badgeViolet}>` par un rendu conditionnel — afficher uniquement si `stats.isRecord === true`
  - [x] T3.3 — Vérifier qu'aucune couleur hardcodée n'est présente dans les styles impactés (token check)

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer sur `/activites` avec des données suffisantes : vérifier que le badge trend affiche une valeur calculée réelle (positive ou négative)
  - [x] T4.2 — Simuler un scope sans sessions récentes (groupe vide ou implantation sans séances) : vérifier que le badge trend est masqué
  - [x] T4.3 — Vérifier que le badge "Record" n'apparaît pas quand `cancelled === 0`
  - [x] T4.4 — Grep `"+2.4%"` et `"Record"` dans `StatCards.tsx` → zéro occurrence hardcodée (seuls commentaires)
  - [x] T4.5 — Grep `console\.` dans `StatCards.tsx` → guardé par `process.env.NODE_ENV !== 'production'`

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1-T2 — Logique calcStats() enrichie

La fonction `calcStats` reçoit l'ensemble des sessions déjà chargées par l'`useEffect` existant. Il n'est **pas nécessaire de faire un nouvel appel API** — les calculs se font sur le tableau `sessions` déjà disponible en mémoire.

```tsx
function calcStats(sessions: SessionAttendanceSummary[]) {
  const now        = new Date()
  const total      = sessions.length
  const cancelled  = sessions.filter(s => s.status === 'annulée' || s.status === 'cancelled').length
  const upcoming   = sessions.filter(s => new Date(s.scheduledAt) > now).length
  const withPres   = sessions.filter(s => s.totalAttendance > 0)
  const avgPres    = withPres.length > 0
    ? Math.round(withPres.reduce((acc, s) => acc + (s.presentCount / s.totalAttendance) * 100, 0) / withPres.length)
    : 0
  const complete   = sessions.filter(s => s.completionStatus === 'complete').length
  const evalPct    = total > 0 ? Math.round((complete / total) * 100) : 0

  // — Trend présence (AC1) —
  const msDay    = 86_400_000
  const cutLast  = new Date(now.getTime() - 30 * msDay)
  const cutPrev  = new Date(now.getTime() - 60 * msDay)
  const last30   = sessions.filter(s => new Date(s.scheduledAt) >= cutLast && new Date(s.scheduledAt) <= now)
  const prev30   = sessions.filter(s => new Date(s.scheduledAt) >= cutPrev && new Date(s.scheduledAt) < cutLast)

  const avgOf = (arr: SessionAttendanceSummary[]) => {
    const wp = arr.filter(s => s.totalAttendance > 0)
    return wp.length > 0
      ? wp.reduce((acc, s) => acc + (s.presentCount / s.totalAttendance) * 100, 0) / wp.length
      : null
  }
  const a1 = avgOf(last30)
  const a2 = avgOf(prev30)
  const trend = (last30.length >= 2 && prev30.length >= 2 && a1 !== null && a2 !== null)
    ? Math.round(a1 - a2)
    : null

  // — Record annulations (AC2) —
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = ym(now)
  const monthMap: Record<string, number> = {}
  for (const s of sessions) {
    const m = ym(new Date(s.scheduledAt))
    if (s.status === 'annulée' || s.status === 'cancelled') {
      monthMap[m] = (monthMap[m] ?? 0) + 1
    }
  }
  const cancelledThisMonth = monthMap[currentMonth] ?? 0
  const past6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1)
    return ym(d)
  })
  const maxCancelledPast6 = past6Months.reduce((max, m) => Math.max(max, monthMap[m] ?? 0), 0)
  const isRecord = cancelledThisMonth > 0 && maxCancelledPast6 > 0 && cancelledThisMonth >= maxCancelledPast6

  return { total, cancelled, upcoming, avgPres, evalPct, trend, isRecord }
}
```

---

### T3 — JSX conditionnel (badges)

**Card 1 — badge trend conditionnel :**
```tsx
{stats.trend !== null && (
  <View style={styles.badgeTrend as object}>
    <AureakText style={styles.badgeTrendText}>
      {stats.trend >= 0 ? `+${stats.trend}%` : `${stats.trend}%`}
    </AureakText>
  </View>
)}
```

**Card 3 — badge Record conditionnel :**
```tsx
{stats.isRecord && (
  <View style={styles.badgeViolet as object}>
    <AureakText style={styles.badgeVioletText}>Record</AureakText>
  </View>
)}
```

---

### Design

**Type design** : `polish`

Tokens déjà utilisés dans le fichier :
```tsx
import { colors, space, radius, shadows } from '@aureak/theme'

// Badge trend (card 1) — déjà en place
backgroundColor : colors.border.gold
color           : colors.accent.gold

// Badge Record (card 3) — déjà en place
backgroundColor : colors.status.warningBg
color           : colors.status.warning
```

Aucune modification de style nécessaire — uniquement la logique de rendu conditionnel.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | Enrichir `calcStats()` + rendre conditionnels les 2 badges |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — non impacté
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — non impacté
- `aureak/packages/api-client/src/` — aucun nouvel appel API nécessaire
- `aureak/packages/types/src/` — aucun nouveau type nécessaire

---

### Dépendances à protéger

- Story 72-2 a créé le layout bento de `StatCards.tsx` — ne pas modifier la structure visuelle des 4 cards ni les styles existants
- `calcStats()` retourne déjà `{ total, cancelled, upcoming, avgPres, evalPct }` — ajouter `trend` et `isRecord` sans supprimer les existants

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
- Story à l'origine du composant : `_bmad-output/implementation-artifacts/story-72-2-design-statcards-seances-bento-figma.md`
- Pattern try/finally : `StatCards.tsx` lignes 36–51 (déjà conforme)
- Pattern console guard : `StatCards.tsx` ligne 47 (déjà conforme)

---

### Multi-tenant

RLS gère l'isolation. `listSessionsWithAttendance` filtre déjà par tenant via RLS Supabase — aucun paramètre tenantId supplémentaire nécessaire.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun — implémentation directe sans erreur.

### Completion Notes List
- `calcStats()` enrichie avec `trend` (number | null) et `isRecord` (boolean) — zéro appel API supplémentaire
- Badge "+2.4%" rendu conditionnel : affiché uniquement si `last30.length >= 2 && prev30.length >= 2`
- Badge "Record" rendu conditionnel : affiché uniquement si `cancelledThisMonth > 0 && maxCancelledPast6 > 0 && cancelledThisMonth >= maxCancelledPast6`
- QA grep couleurs hardcodées → 0 résultat (hors commentaires)
- QA grep GeistMono → 0 résultat
- QA grep "+2.4%" et "Record" hardcodés → 0 résultat (seuls commentaires)
- Console guard déjà en place ligne 90 — conforme
- TypeScript noEmit → 0 erreur

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifié |
