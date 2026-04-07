# Story 72.2 : Design — StatCards Séances : layout bento Figma (badge trend, picto 41×41, hauteur 174px, 4ème card gold solid)

Status: done

## Story

En tant qu'admin,
je veux que les 4 stat cards de l'onglet Séances correspondent exactement au layout bento Figma (picto 41×41 en haut à gauche, badge trend en haut à droite, label uppercase Montserrat 14px, valeur Space Grotesk 30px, hauteur min 174px, 4ème card fond `#6e5d14`),
afin que le design soit fidèle à la maquette Figma validée.

## Acceptance Criteria

1. Chaque card a `minHeight: 174`, `borderRadius: 24`, fond blanc `colors.light.surface`, `borderColor: 'rgba(206,198,180,0.1)'`, `boxShadow: shadows.sm`
2. Zone picto : emoji/icône 41×41px affiché en haut à gauche dans un conteneur `View` de taille fixe
3. Badge trend : en haut à droite dans une `View` positionnée en absolu (`position: 'absolute', top: 16, right: 16`), fond `rgba(220,198,115,0.2)`, texte `colors.accent.gold`, borderRadius 12, padding `4 8`
4. Card 1 "PRÉSENCE MOYENNE" : valeur `{avgPres}%`, badge `+2.4%` (tendance fictive fixe), picto 📈, sous-label vert si `avgPres >= 75` sinon or
5. Card 2 "TOTAL SÉANCES" : valeur `{total}`, pas de badge, picto 📅, sous-label `{upcoming} à venir`
6. Card 3 "ANNULÉES" : valeur `{cancelled}`, badge "Record" avec fond `rgba(197,192,253,0.2)` et texte `#8B5CF6` (violet), picto ⚠️, sous-label `sur {total} séances`
7. Label de chaque card : `fontFamily: 'Montserrat'`, `fontWeight: '500'`, `fontSize: 14`, `textTransform: 'uppercase'`, `letterSpacing: 1.2`, `color: colors.text.muted`
8. Valeur de chaque card : `fontSize: 30`, `fontWeight: '700'` (Space Grotesk si disponible, sinon Manrope ou Montserrat), `color: colors.text.dark`
9. Sous-label : `fontFamily: 'GeistMono'` (ou Geist Mono, sinon fallback `monospace`), `fontWeight: '700'`, `fontSize: 12`, couleur verte (`#10B981`) si positif, or (`colors.accent.gold`) si neutre/négatif
10. Card 4 "ÉVALS COMPLÉTÉES" : fond `#6e5d14`, `borderRadius: 24`, label `fontSize: 12`, `letterSpacing: 1.8`, `color: '#f9e28c'`, valeur `color: 'white'`, `fontSize: 20`, `fontWeight: '700'`, barre de progression `height: 8`, fond `colors.border.light`, remplissage gradient gold, icône `↑` positionnée en absolu en haut à droite (`width: 76, height: 44`)
11. Barre de progression card 4 : `backgroundColor: colors.border.light` pour le fond, `background: 'linear-gradient(90deg, #C1AC5C 0%, #f9e28c 100%)'` pour le remplissage (via `style` objet inline pour RN Web)
12. TypeScript compile sans erreur (`npx tsc --noEmit`)

## Tasks / Subtasks

- [x] T1 — Refonte structure commune cards 1–3 (AC: 1, 2, 3, 7, 8, 9)
  - [x] T1.1 — Dans `StatCards.tsx`, modifier le style `card` : `minHeight: 174`, `borderRadius: 24` (radius.cardLg), `borderColor: 'rgba(206,198,180,0.1)'`, `boxShadow: shadows.sm`, `position: 'relative'`, `padding: 16`
  - [x] T1.2 — Créer style `pictoBox` : `width: 41, height: 41, alignItems: 'center', justifyContent: 'center', marginBottom: 12`
  - [x] T1.3 — Créer style `badgeTrend` : `position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(220,198,115,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12`
  - [x] T1.4 — Créer style `badgeTrendText` : `fontSize: 11, fontWeight: '600', fontFamily: 'Montserrat', color: colors.accent.gold`
  - [x] T1.5 — Créer style `badgeViolet` : identique à `badgeTrend` mais `backgroundColor: 'rgba(197,192,253,0.2)'`
  - [x] T1.6 — Créer style `badgeVioletText` : identique à `badgeTrendText` mais `color: '#8B5CF6'`
  - [x] T1.7 — Mettre à jour style `statLabel` : `fontSize: 14, fontFamily: 'Montserrat', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1.2, color: colors.text.muted, marginBottom: 6`
  - [x] T1.8 — Mettre à jour style `statValue` : `fontSize: 30, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark, lineHeight: 38`
  - [x] T1.9 — Mettre à jour style `statSub` : `fontSize: 12, fontFamily: 'GeistMono', fontWeight: '700', color: colors.accent.gold, marginTop: 6`
  - [x] T1.10 — Créer style `statSubGreen` : identique à `statSub` mais `color: '#10B981'`

- [x] T2 — Refonte JSX card 1 "PRÉSENCE MOYENNE" (AC: 4)
  - [x] T2.1 — Restructurer JSX : `<View style={[styles.card, { position: 'relative' }]}>` avec badge `+2.4%` en absolu haut droite, picto 📈 dans `pictoBox`, label "PRÉSENCE MOYENNE", valeur `{stats.avgPres}%`, sous-label vert si `>= 75` sinon or

- [x] T3 — Refonte JSX card 2 "TOTAL SÉANCES" (AC: 5)
  - [x] T3.1 — Pas de badge, picto 📅 dans `pictoBox`, label "TOTAL SÉANCES", valeur `{stats.total}`, sous-label `{stats.upcoming} à venir` en or

- [x] T4 — Refonte JSX card 3 "ANNULÉES" (AC: 6)
  - [x] T4.1 — Badge "Record" avec style violet en absolu haut droite, picto ⚠️ dans `pictoBox`, label "ANNULÉES", valeur `{stats.cancelled}`, sous-label `sur {stats.total} séances` en or

- [x] T5 — Refonte JSX + styles card 4 "ÉVALS COMPLÉTÉES" (AC: 10, 11)
  - [x] T5.1 — Mettre à jour style `cardDark` : `backgroundColor: '#6e5d14', borderColor: '#6e5d14', borderRadius: 24`
  - [x] T5.2 — Créer style `cardDarkLabel` : `fontSize: 12, letterSpacing: 1.8, textTransform: 'uppercase', color: '#f9e28c', fontFamily: 'Montserrat', fontWeight: '500', marginBottom: 8`
  - [x] T5.3 — Créer style `cardDarkValue` : `fontSize: 20, fontWeight: '700', color: 'white', fontFamily: 'Montserrat'`
  - [x] T5.4 — Créer style `arrowIcon` : `position: 'absolute', top: 0, right: 0, width: 76, height: 44, alignItems: 'center', justifyContent: 'center'`
  - [x] T5.5 — Barre progression : `height: 8`, fond `colors.border.light`, remplissage en `style` objet inline `{ background: 'linear-gradient(90deg, #C1AC5C 0%, #f9e28c 100%)' }` (RN Web supporte les propriétés CSS inline)
  - [x] T5.6 — Remplacer le picto `↑` statique par un `<View style={styles.arrowIcon}><AureakText style={{ fontSize: 28, color: '#f9e28c' }}>↑</AureakText></View>` en position absolue

- [x] T6 — Validation (AC: 12)
  - [x] T6.1 — `npx tsc --noEmit` = 0 erreurs
  - [x] T6.2 — Vérifier visuellement les 4 cards sur `/activites`
  - [x] T6.3 — Vérifier qu'aucune couleur n'est hardcodée en dehors de `'#6e5d14'`, `'#f9e28c'`, `'rgba(206,198,180,0.1)'`, `'rgba(220,198,115,0.2)'`, `'rgba(197,192,253,0.2)'`, `'#8B5CF6'`, `'#10B981'` (toutes documentées dans la story, issues du Figma, pas encore en tokens)

## Dev Notes

### Tokens disponibles dans `@aureak/theme`

| Token | Valeur |
|-------|--------|
| `radius.cardLg` | `24` |
| `shadows.sm` | `'0 1px 2px rgba(0,0,0,0.06)'` |
| `colors.light.surface` | blanc |
| `colors.text.muted` | gris moyen |
| `colors.text.dark` | quasi-noir |
| `colors.accent.gold` | `'#C1AC5C'` |
| `colors.accent.goldLight` | `'#D6C98E'` |
| `colors.border.light` | bordure claire |
| `colors.status.success` | `'#10B981'` |

### Couleurs Figma hors tokens (à utiliser en valeur littérale)

| Valeur | Usage |
|--------|-------|
| `'#6e5d14'` | Fond card 4 — équivalent gold solid sombre (Figma). NOTE : `colors.accent.goldSolid` dans tokens.ts = `rgba(193,172,92,0.5)` (semitransparent), PAS `#6e5d14`. Utiliser la valeur littérale. |
| `'#f9e28c'` | Label et icône card 4 (or lumineux) |
| `'rgba(206,198,180,0.1)'` | Border des cards 1–3 |
| `'rgba(220,198,115,0.2)'` | Fond badge trend or |
| `'rgba(197,192,253,0.2)'` | Fond badge violet (card Annulées) |
| `'#8B5CF6'` | Texte badge violet |
| `'#10B981'` | Sous-label vert (bonne dynamique) |

### JSX complet cible — composant après refonte

```tsx
'use client'
// Story 72-2 — StatCards Séances : layout bento Figma
import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { listSessionsWithAttendance } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { ScopeState } from './FiltresScope'

type Props = { scope: ScopeState }

function calcStats(sessions: SessionAttendanceSummary[]) {
  const total     = sessions.length
  const cancelled = sessions.filter(s => s.status === 'annulée' || s.status === 'cancelled').length
  const now       = new Date()
  const upcoming  = sessions.filter(s => new Date(s.scheduledAt) > now).length
  const withPres  = sessions.filter(s => s.totalAttendance > 0)
  const avgPres   = withPres.length > 0
    ? Math.round(
        withPres.reduce((acc, s) => acc + (s.presentCount / s.totalAttendance) * 100, 0)
        / withPres.length
      )
    : 0
  const complete  = sessions.filter(s => s.completionStatus === 'complete').length
  const evalPct   = total > 0 ? Math.round((complete / total) * 100) : 0
  return { total, cancelled, upcoming, avgPres, evalPct }
}

export function StatCards({ scope }: Props) {
  const [sessions, setSessions] = useState<SessionAttendanceSummary[]>([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const params: { implantationId?: string; groupId?: string } = {}
        if (scope.scope === 'implantation' && scope.implantationId) {
          params.implantationId = scope.implantationId
        } else if (scope.scope === 'groupe' && scope.groupId) {
          params.groupId = scope.groupId
        }
        const data = await listSessionsWithAttendance(params)
        setSessions(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[StatCards] listSessionsWithAttendance error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [scope.scope, scope.implantationId, scope.groupId])

  const stats = useMemo(() => calcStats(sessions), [sessions])

  if (loading) {
    return (
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => <View key={i} style={styles.skeletonCard} />)}
      </View>
    )
  }

  return (
    <View style={styles.row}>

      {/* Card 1 — PRÉSENCE MOYENNE */}
      <View style={styles.card as object}>
        {/* Badge trend haut droite */}
        <View style={styles.badgeTrend as object}>
          <AureakText style={styles.badgeTrendText}>+2.4%</AureakText>
        </View>
        {/* Picto */}
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>📈</AureakText>
        </View>
        <AureakText style={styles.statLabel}>PRÉSENCE MOYENNE</AureakText>
        <AureakText style={styles.statValue}>{stats.avgPres}%</AureakText>
        <AureakText style={stats.avgPres >= 75 ? styles.statSubGreen : styles.statSub}>
          {stats.avgPres >= 75 ? '↑ Bonne dynamique' : '↓ À surveiller'}
        </AureakText>
      </View>

      {/* Card 2 — TOTAL SÉANCES */}
      <View style={styles.card as object}>
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>📅</AureakText>
        </View>
        <AureakText style={styles.statLabel}>TOTAL SÉANCES</AureakText>
        <AureakText style={styles.statValue}>{stats.total}</AureakText>
        <AureakText style={styles.statSub}>{stats.upcoming} à venir</AureakText>
      </View>

      {/* Card 3 — ANNULÉES */}
      <View style={styles.card as object}>
        {/* Badge "Record" violet haut droite */}
        <View style={styles.badgeViolet as object}>
          <AureakText style={styles.badgeVioletText}>Record</AureakText>
        </View>
        <View style={styles.pictoBox}>
          <AureakText style={styles.pictoText}>⚠️</AureakText>
        </View>
        <AureakText style={styles.statLabel}>ANNULÉES</AureakText>
        <AureakText style={styles.statValue}>{stats.cancelled}</AureakText>
        <AureakText style={styles.statSub}>sur {stats.total} séances</AureakText>
      </View>

      {/* Card 4 — ÉVALS COMPLÉTÉES — fond gold solid */}
      <View style={styles.cardGold as object}>
        {/* Icône flèche haut droite */}
        <View style={styles.arrowIcon as object}>
          <AureakText style={styles.arrowIconText}>↑</AureakText>
        </View>
        <AureakText style={styles.cardGoldLabel}>ÉVALS COMPLÉTÉES</AureakText>
        <AureakText style={styles.cardGoldValue}>{stats.evalPct}%</AureakText>
        {/* Barre de progression */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(stats.evalPct, 100)}%` as unknown as number,
                // RN Web supporte les propriétés CSS inline via style object
                background: 'linear-gradient(90deg, #C1AC5C 0%, #f9e28c 100%)',
              } as object,
            ]}
          />
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingBottom    : space.md,
    flexWrap         : 'wrap',
  },

  // ── Cards 1–3 (fond blanc)
  card: {
    flex            : 1,
    minWidth        : 160,
    minHeight       : 174,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.cardLg,  // 24
    padding         : 16,
    borderWidth     : 1,
    borderColor     : 'rgba(206,198,180,0.1)',
    boxShadow       : shadows.sm,
    position        : 'relative',
  },

  skeletonCard: {
    flex           : 1,
    minWidth       : 160,
    minHeight      : 174,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.cardLg,
    opacity        : 0.6,
  },

  // Zone picto 41×41px
  pictoBox: {
    width          : 41,
    height         : 41,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : 12,
  },
  pictoText: {
    fontSize: 26,
  },

  // Badge trend or (cards 1)
  badgeTrend: {
    position        : 'absolute',
    top             : 16,
    right           : 16,
    backgroundColor : 'rgba(220,198,115,0.2)',
    paddingHorizontal: 8,
    paddingVertical : 4,
    borderRadius    : 12,
  },
  badgeTrendText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color     : colors.accent.gold,
  },

  // Badge violet (card 3)
  badgeViolet: {
    position        : 'absolute',
    top             : 16,
    right           : 16,
    backgroundColor : 'rgba(197,192,253,0.2)',
    paddingHorizontal: 8,
    paddingVertical : 4,
    borderRadius    : 12,
  },
  badgeVioletText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color     : '#8B5CF6',
  },

  // Label commun (uppercase, Montserrat 14px)
  statLabel: {
    fontSize     : 14,
    fontFamily   : 'Montserrat',
    fontWeight   : '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color        : colors.text.muted,
    marginBottom : 6,
  },

  // Valeur commun (30px bold)
  statValue: {
    fontSize  : 30,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
    lineHeight : 38,
  },

  // Sous-label or (neutre/négatif)
  statSub: {
    fontSize  : 12,
    fontFamily: 'GeistMono',
    fontWeight: '700',
    color     : colors.accent.gold,
    marginTop : 6,
  },

  // Sous-label vert (positif)
  statSubGreen: {
    fontSize  : 12,
    fontFamily: 'GeistMono',
    fontWeight: '700',
    color     : '#10B981',
    marginTop : 6,
  },

  // ── Card 4 (fond gold solid #6e5d14)
  cardGold: {
    flex           : 1,
    minWidth       : 160,
    minHeight      : 174,
    backgroundColor: '#6e5d14',
    borderRadius   : 24,
    padding        : 16,
    borderWidth    : 0,
    position       : 'relative',
  },
  cardGoldLabel: {
    fontSize     : 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color        : '#f9e28c',
    fontFamily   : 'Montserrat',
    fontWeight   : '500',
    marginBottom : 8,
    marginTop    : 8,
  },
  cardGoldValue: {
    fontSize  : 20,
    fontWeight: '700',
    color     : 'white',
    fontFamily: 'Montserrat',
    lineHeight : 28,
  },

  // Icône flèche card 4 (position absolue haut droite, 76×44px)
  arrowIcon: {
    position      : 'absolute',
    top           : 0,
    right         : 0,
    width         : 76,
    height        : 44,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  arrowIconText: {
    fontSize  : 28,
    color     : '#f9e28c',
    fontWeight: '700',
  },

  // Barre de progression card 4
  progressBar: {
    marginTop      : space.sm,
    height         : 8,
    backgroundColor: colors.border.light,
    borderRadius   : 4,
    overflow       : 'hidden',
  },
  progressFill: {
    height        : 8,
    borderRadius  : 4,
    // gradient appliqué via style inline dans le JSX
  },
})
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | Modifier | Remplacer le composant complet par le code fourni dans Dev Notes |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — structure inchangée
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` — non concerné
- `aureak/packages/theme/src/tokens.ts` — pas de nouveau token requis (les couleurs Figma hors tokens sont documentées dans la story)
- `supabase/migrations/` — aucune migration

---

### Notes d'architecture

**`radius.cardLg`** : existe dans `tokens.ts` avec valeur `24`. Utiliser `radius.cardLg` plutôt que la valeur littérale `24`.

**`colors.accent.goldSolid`** : dans `tokens.ts`, cette valeur est `rgba(193,172,92,0.5)` (semi-transparent). La card 4 utilise `'#6e5d14'` (gold sombre opaque issu du Figma) — valeur littérale obligatoire car le token existant n'est pas équivalent.

**`boxShadow` / `position: 'absolute'`** : React Native Web supporte ces propriétés CSS via l'objet `style`. Le cast `as object` est nécessaire pour satisfaire TypeScript (pattern déjà utilisé dans le codebase).

**Gradient barre progression** : `linear-gradient(...)` n'est pas une valeur StyleSheet valide en RN natif, mais est supporté sur RN Web via style inline. Appliquer directement sur le `style` de la `View` progressFill (pattern `{ background: '...' } as object`).

**Police GeistMono** : si non chargée dans le projet web, le fallback sera `monospace` (acceptable). Vérifier si elle est déjà déclarée dans `fonts` tokens ou `_document.tsx`.

---

### Multi-tenant

Sans objet — UI pure, calcul sur données déjà filtrées par scope.

### Dépendances

- Story 71.1 : `done` — les 4 cards existent déjà avec le pattern picto→label→valeur
- Pas d'autre dépendance bloquante

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_aucun_

### Completion Notes List

- Composant StatCards.tsx remplacé intégralement par le JSX cible de la story
- 4 cards redessinées : 3 light (fond blanc, radius 24, badge trend/violet, pictoBox 41×41) + 1 gold solid (#6e5d14)
- Tous les styles migrés vers tokens @aureak/theme (colors, radius.cardLg, shadows, space) — exceptions Figma documentées (#6e5d14, #f9e28c, #8B5CF6, #10B981, rgba harcodés)
- Gradient barre progression card 4 via style inline CSS (background: linear-gradient) — pattern RN Web
- calcStats simplifié (cancelPct supprimé, non requis par cette story)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` | À modifier |
