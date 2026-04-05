# Story 58-4 — Méthodologie : Thème de la semaine — tile dashboard

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : medium
**Effort** : S (quelques heures)

---

## Contexte

Le hub méthodologie (`/methodologie`) est une page de navigation. Cette story y ajoute une tile "Thème de la semaine" qui recommande automatiquement un thème pédagogique selon la saison académique courante et la semaine de l'année, pour guider les coaches dans la planification.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** voir le thème pédagogique recommandé pour la semaine courante sur la page d'accueil méthodologie,
**afin de** préparer mes séances en cohérence avec la progression académique sans avoir à chercher manuellement.

---

## Acceptance Criteria

- [ ] AC1 — La page `/methodologie` (hub ou `index.tsx`) affiche une tile "🎯 Thème de la semaine" en position proéminente (première card de la grille ou section dédiée en haut de page)
- [ ] AC2 — La tile appelle `getThemeOfWeek()` depuis `@aureak/api-client` au montage et affiche : nom du thème, description courte (2 lignes max), badge méthode coloré, et lien "Voir les exercices →" qui filtre `/methodologie/situations` par ce thème
- [ ] AC3 — `getThemeOfWeek()` implémente la logique suivante : `weekNumber = ISO week of year` → `themeIndex = weekNumber % totalThemes` → retourne le thème à cet index, trié par ordre de création (ou `sort_order` si disponible) — logique sans DB supplémentaire, calculée en JS/TS à partir de la liste des thèmes actifs
- [ ] AC4 — Si aucun thème actif n'existe, la tile affiche "Aucun thème configuré — ajoutez des thèmes pour activer cette fonctionnalité" avec un lien vers `/methodologie/themes/new`
- [ ] AC5 — La tile a un fond premium : fond blanc `colors.light.surface`, bordure gauche 4px `colors.accent.gold`, `borderRadius: radius.card`, `boxShadow: shadows.gold`, padding `space.md`
- [ ] AC6 — Une section "Progression de la saison" sous la tile affiche une barre de progression `semaine X / Y` avec les semaines totales de la saison académique courante — Y = nombre de semaines entre `start_date` et `end_date` de la saison effective
- [ ] AC7 — La saison académique courante est récupérée depuis `listAcademySeasons()` avec filtre `is_current: true` (ou priorité `effective_season` comme défini en story 18-3)
- [ ] AC8 — `try/finally` sur `setLoadingTheme` ; `console.error` guardé
- [ ] AC9 — La tile est responsive : pleine largeur sur mobile, max-width 500px centré sur desktop
- [ ] AC10 — Zéro hardcode — tokens `@aureak/theme`

---

## Tasks

### T1 — Fonction API `getThemeOfWeek`

Fichier : `aureak/packages/api-client/src/methodology.ts`

```typescript
import { listMethodologyThemes } from './methodology'

/**
 * Story 58-4 — Thème recommandé pour la semaine ISO courante.
 * Rotation cyclique sur la liste des thèmes actifs.
 */
export async function getThemeOfWeek(): Promise<{
  data: MethodologyTheme | null
  weekNumber: number
  error: unknown
}> {
  const { data: themes, error } = await listMethodologyThemes({ activeOnly: true })
  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getThemeOfWeek] error:', error)
    return { data: null, weekNumber: 0, error }
  }
  if (!themes || themes.length === 0) return { data: null, weekNumber: 0, error: null }

  const weekNumber = getISOWeekNumber(new Date())
  const themeIndex = (weekNumber - 1) % themes.length
  return { data: themes[themeIndex], weekNumber, error: null }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
```

- [ ] Fonction `getThemeOfWeek` créée et exportée

### T2 — Tile dans `methodologie/index.tsx`

Fichier : `aureak/apps/web/app/(admin)/methodologie/index.tsx`

```typescript
const [themeOfWeek,  setThemeOfWeek]  = useState<MethodologyTheme | null>(null)
const [weekNumber,   setWeekNumber]   = useState(0)
const [loadingTheme, setLoadingTheme] = useState(false)
const [currentSeason, setCurrentSeason] = useState<AcademySeason | null>(null)

useEffect(() => {
  setLoadingTheme(true)
  Promise.all([
    getThemeOfWeek(),
    listAcademySeasons({ currentOnly: true }),
  ])
    .then(([themeRes, seasonRes]) => {
      setThemeOfWeek(themeRes.data)
      setWeekNumber(themeRes.weekNumber)
      setCurrentSeason(seasonRes.data?.[0] ?? null)
    })
    .catch(err => {
      if (process.env.NODE_ENV !== 'production')
        console.error('[MethoHub] loadTheme error:', err)
    })
    .finally(() => setLoadingTheme(false))
}, [])
```

Tile JSX dans le return :
```tsx
<View style={styles.themeCard}>
  <View style={styles.themeCardAccent} />
  <View style={styles.themeCardContent}>
    <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 1 }}>
      THÈME DE LA SEMAINE {weekNumber > 0 ? `— Semaine ${weekNumber}` : ''}
    </AureakText>
    {loadingTheme ? (
      <View style={{ height: 20, backgroundColor: colors.border.light, borderRadius: radius.xs, marginTop: space.sm }} />
    ) : themeOfWeek ? (
      <>
        <AureakText variant="h2" style={{ fontWeight: '700', marginTop: space.xs, color: colors.text.dark }}>
          {themeOfWeek.name}
        </AureakText>
        {themeOfWeek.description && (
          <AureakText variant="body" style={{ color: colors.text.muted, marginTop: space.xs }} numberOfLines={2}>
            {themeOfWeek.description}
          </AureakText>
        )}
        <Pressable
          style={{ marginTop: space.sm }}
          onPress={() => router.push(`/methodologie/situations?theme=${themeOfWeek.id}` as never)}
        >
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
            Voir les exercices →
          </AureakText>
        </Pressable>
      </>
    ) : (
      <AureakText variant="body" style={{ color: colors.text.muted, marginTop: space.xs }}>
        Aucun thème configuré —{' '}
        <AureakText
          variant="body"
          style={{ color: colors.accent.gold }}
          onPress={() => router.push('/methodologie/themes/new' as never)}
        >
          ajouter un thème
        </AureakText>
      </AureakText>
    )}
  </View>
</View>
```

- [ ] Tile implémentée avec try/finally
- [ ] Barre progression saison affichée

### T3 — Styles tile dans `methodologie/index.tsx`

```typescript
themeCard       : { flexDirection: 'row', backgroundColor: colors.light.surface, borderRadius: radius.card, boxShadow: shadows.gold, overflow: 'hidden', marginBottom: space.lg },
themeCardAccent : { width: 4, backgroundColor: colors.accent.gold },
themeCardContent: { flex: 1, padding: space.md },
```

- [ ] Styles ajoutés

---

## Dépendances

- Epic 20 `done` — `listMethodologyThemes` + `MethodologyTheme` existants
- Story 18-3 `done` — `listAcademySeasons` + saison effective

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/methodology.ts` | Modifier — `getThemeOfWeek` |
| `aureak/apps/web/app/(admin)/methodologie/index.tsx` | Modifier — tile thème de la semaine |

---

## QA post-story

```bash
grep -n "setLoadingTheme" aureak/apps/web/app/(admin)/methodologie/index.tsx
grep -n "console\." aureak/packages/api-client/src/methodology.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-4 — méthodologie tile thème de la semaine rotation cyclique
```
