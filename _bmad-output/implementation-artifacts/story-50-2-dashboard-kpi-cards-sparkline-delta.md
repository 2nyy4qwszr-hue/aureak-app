# Story 50.2 : Dashboard — KPI cards sparkline + delta

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un micro-graphique sparkline et une pill delta colorée sous chaque valeur KPI du dashboard,
Afin de percevoir la tendance des indicateurs clés sans avoir à naviguer vers des rapports séparés.

## Acceptance Criteria

**AC1 — Composant SparklineSVG présent**
- **Given** l'admin charge le dashboard
- **When** les KPI cards se rendent
- **Then** chaque card affiche un graphique sparkline SVG inline sous la valeur principale, représentant 6 points de données simulés en polyline

**AC2 — Données sparkline simulées localement**
- **And** les valeurs sparkline sont générées localement (pas de requête API) : un tableau de 6 nombres représentant les 6 dernières semaines, avec variations aléatoires déterministes basées sur la valeur actuelle (seed fixe pour éviter hydration mismatch)
- **And** la note "Données simulées — Story 50.x connectera les vraies séries historiques" est documentée dans le code (commentaire `// TODO(50.x)`)

**AC3 — Pill delta colorée**
- **And** sous la sparkline, une pill `DeltaPill` affiche le delta entre la première et la dernière valeur des 6 semaines : `▲+5%` en vert (`colors.status.present`) si positif, `▼-3%` en rouge (`colors.status.absent`) si négatif, `–` en gris si nul
- **And** la pill a un fond semi-transparent adapté à la couleur (vert 10% ou rouge 10% d'opacité)

**AC4 — Intégration dans KpiCard**
- **And** le composant `KpiCard` accepte une nouvelle prop optionnelle `sparkline?: number[]`
- **And** si `sparkline` est fourni, `SparklineSVG` et `DeltaPill` s'affichent sous `kpiSub`
- **And** si `sparkline` est absent (undefined), les composants ne s'affichent pas (pas de régression)

**AC5 — Style sparkline premium**
- **And** la polyline sparkline est rendue en couleur `accent` de la card (prop existante), épaisseur 1.5px, sans fill
- **And** le dernier point est marqué d'un cercle rempli de 3px radius, même couleur

**AC6 — Dimensions cohérentes**
- **And** le SVG sparkline a une hauteur fixe de 36px et s'étire sur 100% de la largeur de la card
- **And** la card maintient sa hauteur (pas de layout shift) — prévoir la hauteur supplémentaire dans les dimensions card

**AC7 — Aucune lib externe**
- **And** `SparklineSVG` est implémenté en SVG natif (`<polyline>`, `<circle>`) sans dépendance recharts/victory/d3

## Tasks / Subtasks

- [x] Task 1 — Créer `SparklineSVG` dans `dashboard/page.tsx` (AC: #1, #5, #6, #7)
  - [x] 1.1 Normaliser les valeurs (min/max → 0..1) pour mapper sur la hauteur SVG (0..32px)
  - [x] 1.2 Calculer les coordonnées des 6 points répartis en width%/5 * index
  - [x] 1.3 Générer `points` string pour `<polyline>`
  - [x] 1.4 Ajouter `<circle>` sur le dernier point

- [x] Task 2 — Créer `DeltaPill` dans `dashboard/page.tsx` (AC: #3)
  - [x] 2.1 Calculer delta = (last - first) / first * 100, arrondi à 1 décimale
  - [x] 2.2 Choisir couleur et symbole selon signe
  - [x] 2.3 Appliquer fond semi-transparent via `rgba` calculé depuis la couleur text

- [x] Task 3 — Ajouter prop `sparkline` à `KpiCard` (AC: #4)
  - [x] 3.1 Ajouter `sparkline?: number[]` dans `KpiCardProps`
  - [x] 3.2 Rendre `<SparklineSVG>` + `<DeltaPill>` conditionnellement sous `kpiSub`

- [x] Task 4 — Générer données simulées dans `DashboardPage` (AC: #2)
  - [x] 4.1 Créer fonction `simulateSpark(currentValue: number, seed: number): number[]` retournant 6 valeurs
  - [x] 4.2 Appeler dans le render pour `totalSessions`, `avgAttendance`, `avgMastery`, `childrenTotal`, `coachesTotal`, `groupsTotal`
  - [x] 4.3 Ajouter commentaire `// TODO(50.x): remplacer par données historiques réelles`

- [x] Task 5 — QA scan (AC: #7)
  - [x] 5.1 Vérifier aucune dépendance externe ajoutée (pas de `package.json` modifié)
  - [x] 5.2 Vérifier que les KPI cards sans sparkline (si `sparkline` undefined) restent identiques

## Dev Notes

### Composant SparklineSVG

```typescript
type SparklineProps = {
  data   : number[]
  color  : string
  height ?: number
}

function SparklineSVG({ data, color, height = 36 }: SparklineProps) {
  if (!data || data.length < 2) return null

  const w      = 100  // viewBox width (%)
  const pad    = 4
  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range  = maxVal - minVal || 1

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = (height - pad) - ((v - minVal) / range) * (height - pad * 2)
    return { x, y }
  })

  const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block', marginTop: 8 }}
      aria-hidden="true"
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      <circle cx={last.x} cy={last.y} r={3} fill={color} />
    </svg>
  )
}
```

### Composant DeltaPill

```typescript
function DeltaPill({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null

  const first = data[0]
  const last  = data[data.length - 1]
  const delta = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100
  const abs   = Math.abs(delta)

  if (abs < 0.1) {
    return (
      <span style={{ fontSize: 10, color: colors.text.muted, fontFamily: 'Geist Mono, monospace' }}>
        — stable
      </span>
    )
  }

  const positive = delta > 0
  const color    = positive ? colors.status.present : colors.status.absent
  const symbol   = positive ? '▲' : '▼'
  const sign     = positive ? '+' : ''
  const bg       = positive ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)'

  return (
    <span style={{
      display        : 'inline-flex',
      alignItems     : 'center',
      gap            : 2,
      backgroundColor: bg,
      color,
      borderRadius   : radius.badge,
      paddingLeft    : 6,
      paddingRight   : 6,
      paddingTop     : 2,
      paddingBottom  : 2,
      fontSize       : 10,
      fontWeight     : 700,
      fontFamily     : 'Geist Mono, monospace',
      marginTop      : 4,
    }}>
      {symbol}{sign}{abs.toFixed(1)}%
    </span>
  )
}
```

### Fonction simulateSpark (données déterministes)

```typescript
// TODO(50.x): remplacer par données historiques réelles depuis l'API
function simulateSpark(current: number, seed: number): number[] {
  // Génère 6 points pseudo-aléatoires déterministes (pas de Math.random() pour éviter
  // les hydration mismatches SSR/client)
  const base = current || 1
  const offsets = [0.82, 0.88, 0.91, 0.87, 0.95, 1.0]
  const jitter  = [seed % 7, seed % 5, seed % 11, seed % 3, seed % 9, 0].map(j => j / 100)
  return offsets.map((o, i) => Math.round(base * (o + jitter[i])))
}
```

### Appel dans DashboardPage

```typescript
// Dans le bloc de rendu, après le calcul des KPIs dérivés :
const sparkSessions   = totalSessions  > 0 ? simulateSpark(totalSessions, 7)  : undefined
const sparkAttendance = avgAttendance  != null ? simulateSpark(avgAttendance, 3) : undefined
const sparkMastery    = avgMastery     != null ? simulateSpark(avgMastery, 11)   : undefined
const sparkChildren   = childrenTotal  != null ? simulateSpark(childrenTotal, 5) : undefined
```

Puis passer `sparkline={sparkSessions}` à chaque `KpiCard` concernée.

### Modification de KpiCardProps

```typescript
type KpiCardProps = {
  // ... props existantes ...
  sparkline?: number[]  // 6 valeurs pour mini-graphique tendance
}
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ajout `SparklineSVG`, `DeltaPill`, prop `sparkline` dans `KpiCard`, fonction `simulateSpark`
