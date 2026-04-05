# Story 57-7 — Implantations : Score de santé académie vert/or/rouge

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Cette story introduit un score de santé calculé pour chaque implantation, combinant le taux de présence (60 %) et le taux de maîtrise (40 %). Le score est affiché comme un badge coloré (`vert` / `or` / `rouge`) sur `ImplantationCard` et dans `ImplantationDetail`.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir d'un coup d'œil un score de santé visuel sur chaque implantation,
**afin de** prioriser mon attention sur les sites qui nécessitent une intervention pédagogique.

---

## Acceptance Criteria

- [ ] AC1 — La fonction pure `computeImplantationHealth(attendanceRatePct, masteryRatePct): HealthScore` calcule `score = (attendanceRatePct * 0.6) + (masteryRatePct * 0.4)` et retourne `{ score: number, level: 'green' | 'gold' | 'red', label: string }`
- [ ] AC2 — Seuils : `score >= 75` → `green` ("Excellent"), `score >= 50` → `gold` ("Correct"), `score < 50` → `red` ("À surveiller")
- [ ] AC3 — Un badge `HealthBadge` est affiché en haut-gauche de `ImplantationCard` (en overlay sur la zone couverture) : fond couleur `colors.status.success` / `colors.accent.gold` / `colors.accent.red` selon le niveau, texte blanc, `fontSize: 11`, `fontWeight: '700'`, `borderRadius: radius.badge`
- [ ] AC4 — Le badge affiche uniquement l'emoji + le label : `🟢 Excellent` / `🟡 Correct` / `🔴 À surveiller` — ou sans emoji si préféré, le code couleur seul suffit
- [ ] AC5 — Le badge n'est affiché que si les données de hover stats sont déjà en cache pour cette implantation (pas de fetch supplémentaire au rendu de la card) — si les données ne sont pas disponibles, le badge n'est pas affiché
- [ ] AC6 — Dans `ImplantationDetail`, une section "Score de santé" affiche le score en grand (chiffre `XX %`) avec une barre circulaire ou linéaire colorée, et le détail des deux composantes (présence × 0,6 + maîtrise × 0,4)
- [ ] AC7 — La fonction `computeImplantationHealth` est placée dans `aureak/packages/business-logic/src/implantation-health.ts` (règle métier = business-logic, pas UI ni api-client)
- [ ] AC8 — Le type `HealthScore` est défini dans `aureak/packages/types/src/entities.ts`
- [ ] AC9 — Zéro hardcode — tokens `@aureak/theme` ; `console.error` guardé
- [ ] AC10 — Tests unitaires `computeImplantationHealth` dans `aureak/packages/business-logic/src/__tests__/implantation-health.test.ts` avec les cas limites (0/0, 100/100, seuils exacts 75 et 50)

---

## Tasks

### T1 — Type `HealthScore` dans `@aureak/types`

Fichier : `aureak/packages/types/src/entities.ts`

```typescript
export type HealthLevel = 'green' | 'gold' | 'red'

export type HealthScore = {
  score : number       // 0–100
  level : HealthLevel
  label : string       // 'Excellent' | 'Correct' | 'À surveiller'
}
```

- [x] Type ajouté

### T2 — Fonction `computeImplantationHealth` dans `business-logic`

Fichier : `aureak/packages/business-logic/src/implantation-health.ts` (nouveau)

```typescript
import type { HealthScore } from '@aureak/types'

/**
 * Story 57-7 — Score de santé d'une implantation
 * score = attendanceRatePct × 0.6 + masteryRatePct × 0.4
 */
export function computeImplantationHealth(
  attendanceRatePct: number,
  masteryRatePct   : number,
): HealthScore {
  const score = Math.round(attendanceRatePct * 0.6 + masteryRatePct * 0.4)
  if (score >= 75) return { score, level: 'green', label: 'Excellent' }
  if (score >= 50) return { score, level: 'gold',  label: 'Correct' }
  return { score, level: 'red', label: 'À surveiller' }
}
```

- [x] Fichier `implantation-health.ts` créé et exporté depuis `@aureak/business-logic`

### T3 — Tests unitaires

Fichier : `aureak/packages/business-logic/src/__tests__/implantation-health.test.ts`

```typescript
import { computeImplantationHealth } from '../implantation-health'

describe('computeImplantationHealth', () => {
  it('retourne green pour 100%/100%', () => {
    expect(computeImplantationHealth(100, 100).level).toBe('green')
  })
  it('retourne red pour 0%/0%', () => {
    expect(computeImplantationHealth(0, 0).level).toBe('red')
  })
  it('seuil exact 75 → green', () => {
    // 75×0.6 + 75×0.4 = 75
    expect(computeImplantationHealth(75, 75).level).toBe('green')
  })
  it('seuil exact 50 → gold', () => {
    expect(computeImplantationHealth(50, 50).level).toBe('gold')
  })
  it('score 49 → red', () => {
    expect(computeImplantationHealth(49, 49).level).toBe('red')
  })
})
```

- [x] Tests écrits et passants (5/5 — `npx vitest run`)

### T4 — Badge `HealthBadge` sur `ImplantationCard`

Fonction helper local dans `index.tsx` :
```typescript
function healthLevelColor(level: HealthLevel): string {
  if (level === 'green') return colors.status.success
  if (level === 'gold')  return colors.accent.gold
  return colors.accent.red
}
```

Badge en overlay haut-gauche (zIndex: 5) sur `ImplantationCard` :
```tsx
{health && (
  <View style={[styles.healthBadge, { backgroundColor: healthLevelColor(health.level) }]}>
    <AureakText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
      {health.label}
    </AureakText>
  </View>
)}
```

`health` = calculé en page principale depuis `hoverStats[impl.id]` si disponible.

- [x] `HealthBadge` ajouté dans `ImplantationCard`
- [x] `computeImplantationHealth` importé depuis `@aureak/business-logic`

### T5 — Section score dans `ImplantationDetail`

Sous le header, ajouter une card score de santé :
- Chiffre en grand : `{health.score} %`
- Barre linéaire colorée (largeur `${health.score}%`)
- Détail : `Présence × 60% + Maîtrise × 40%`

- [x] Section score intégrée dans `ImplantationDetail`

---

## Dépendances

- Story 57-5 `done` — `hoverStats` state + `masteryRatePct` dans `ImplantationHoverStats`
- Story 49-6 `done` — `ImplantationCard` + `ImplantationDetail`

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/types/src/entities.ts` | Modifier — `HealthLevel`, `HealthScore` |
| `aureak/packages/business-logic/src/implantation-health.ts` | Créer |
| `aureak/packages/business-logic/src/__tests__/implantation-health.test.ts` | Créer |
| `aureak/packages/business-logic/src/index.ts` | Modifier — export `computeImplantationHealth` |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — badge + section détail |

---

## QA post-story

```bash
cd aureak && npx vitest run packages/business-logic/src/__tests__/implantation-health.test.ts
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-57): story 57-7 — implantations score santé vert/or/rouge + tests unitaires
```
