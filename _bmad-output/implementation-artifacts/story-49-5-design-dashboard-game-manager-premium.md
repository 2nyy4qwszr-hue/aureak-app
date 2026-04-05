# Story 49-5 — Design : Dashboard Admin — Game Manager Premium

**Epic** : 49 — Design batch avril 2026 #2
**Status** : done
**Priority** : P2 — Impact visuel (pas de régression fonctionnelle)
**Créée le** : 2026-04-04

---

## Contexte

Le dashboard admin actuel (`(admin)/dashboard/page.tsx`) fonctionne correctement sur le plan fonctionnel
(KPIs, filtres, anomalies, implantations) mais son identité visuelle reste trop sobre : header texte plat,
KPI cards sans profondeur temporelle, ImplantationCards sans identité visuelle.

L'objectif est de transformer ce tableau de bord en un **centre de commandement "Game Manager Premium"**
en appliquant les 12 principes design Aureak (fichier `_agents/design-vision.md`) et la structure
validée dans la section "Dashboard Admin — Design validé (2026-04-03)" du même fichier.

Toutes les données existantes sont préservées — seul l'habillage visuel évolue.

---

## User Story

**En tant qu'** admin Aureak,
**je veux** que le dashboard ressemble à un tableau de commandement premium (feel "Football Manager"),
**afin de** ressentir que je pilote une académie d'envergure et d'obtenir une lecture plus rapide
des indicateurs clés avec leurs tendances temporelles.

---

## Acceptance Criteria

### AC1 — Hero Band (bandeau supérieur)
- La page ne commence plus par un `<h1>Tableau de bord</h1>` plat
- Un bandeau hero remplace le header : fond `#2A2827` (dark premium), hauteur 140px minimum
- Le bandeau affiche :
  - Badge gold "ACADÉMIE" (uppercase, `colors.accent.gold`, border-radius badge)
  - Titre "Académie Aureak" — Montserrat Black 900, 28px, blanc
  - Sous-titre dynamique : nom de l'implantation sélectionnée ou "Vue globale · N implantations"
  - Date du jour (format "Samedi 4 avril 2026") — Montserrat Regular, 12px, `rgba(255,255,255,0.55)`
  - Icône terrain SVG ou emoji (🏟) en position absolue à droite — opacité 0.06, grande taille (120px)
- Le sélecteur implantation et le sélecteur période restent accessibles sous le hero (inchangés)
- Aucune régression sur les filtres ou la logique de sélection

### AC2 — KPI Cards avec Sparkline SVG + Delta
- Chaque `KpiCard` expose deux nouvelles props optionnelles :
  `sparkline?: number[]` (6 valeurs, de la plus ancienne à la plus récente)
  `delta?: { value: string; positive: boolean }` (ex: `{ value: '+5%', positive: true }`)
- Lorsque `sparkline` est fourni, un mini graphique SVG est rendu **sous** la valeur principale :
  - Dimensions : 100% de largeur, hauteur 32px
  - Tracé polyline calculé depuis le tableau de 6 valeurs normalisé sur [0, 32]
  - Couleur du trait : `colors.accent.gold`, stroke-width 1.5, pas de fill
  - Points extrêmes (min/max) marqués par un cercle radius 2 en blanc
- Lorsque `delta` est fourni, l'indicateur de tendance existant (flèche ↑/↓ + valeur) est remplacé par :
  - Pill arrondie (`border-radius: 999px`), hauteur 20px
  - Fond : `rgba(76,175,80,0.12)` si positif, `rgba(244,67,54,0.12)` si négatif
  - Texte : `▲ +5%` ou `▼ -3%` en 11px Montserrat SemiBold 600
  - Couleur texte : `colors.status.present` si positif, `colors.status.absent` si négatif
- Les 6 valeurs sparkline sont des données **statiques simulées** en attendant l'implémentation
  de l'API historique (Story future) — elles sont déclarées comme constante locale dans le composant
  avec des valeurs vraisemblables : ex. `[42, 45, 41, 48, 47, childrenTotal ?? 50]`
- Les cards "Joueurs actifs" et "Séances" reçoivent un sparkline + delta simulé
- Les cards "Taux de présence" et "Taux de maîtrise" reçoivent uniquement un delta simulé (pas de sparkline)
- Les cards Coachs, Groupes, Implantations, Anomalies : inchangées (pas de sparkline, pas de delta)

### AC3 — ImplantationCard enrichie (overlay badge + gradient)
- La `ImplantationCard` conserve toutes ses données (ProgressBar présence, maîtrise, ratio séances)
- La card reçoit un **header visuel** en haut :
  - Fond : `linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)` (vert terrain)
  - Hauteur du header : 72px
  - Texture optionnelle : repeating-linear-gradient à 45° blanc opacité 0.03 (lignes de terrain subtiles)
  - Le nom de l'implantation s'affiche en overlay : Montserrat Bold 700, 15px, blanc, padding 12px 16px en bas à gauche
  - Badge gold en haut à droite overlay : nombre de joueurs dans l'implantation (`stat.children_count`
    si disponible, sinon le champ `sessions_total` comme proxy) — format "42 joueurs", fond `colors.accent.gold`,
    texte `#18181B`, font 10px SemiBold, border-radius 999, padding 3px 8px
  - Si `stat.children_count` est absent du type `ImplantationStats`, utiliser `stat.sessions_total` comme
    indicateur (sans modifier l'API — uniquement l'affichage)
- La partie inférieure de la card (ProgressBars + footer séances) reste identique

### AC4 — Section "Prochaine séance" (countdown)
- Une nouvelle tile est insérée **entre** les KPI bento et le panneau anomalies
- Condition d'affichage : uniquement si une séance est planifiée dans les prochaines 24 heures
  (logique dérivée des `visibleStats` — si `sessions_total - sessions_closed > 0`, afficher la tile)
- La tile affiche :
  - Icône ⏱ ou ⚽ (16px) + label "Prochaine séance" (Montserrat SemiBold 600, 12px uppercase, `colors.text.muted`)
  - Valeur "Aujourd'hui" ou un message générique "Séance en attente de clôture" en Montserrat Bold 700, 18px, `colors.text.dark`
  - Pill statut "OUVERTE" (fond `rgba(76,175,80,0.12)`, texte `colors.status.present`) ou
    "EN RETARD" (fond `rgba(244,67,54,0.12)`, texte `colors.status.absent`)
  - Lien "Voir les séances →" (`colors.accent.gold`, cursor pointer) qui navigue vers `/seances`
- La tile a le même style que les `kpiCard` (fond blanc, border-radius 16, shadow sm, border-top gold)
- Si `sessions_total - sessions_closed === 0` (toutes clôturées) : la tile n'est pas rendue

### AC5 — Skeleton mis à jour
- Le skeleton de chargement (`DashboardSkeleton`) inclut :
  - Un bloc hero `h={140}` à la place du skeleton header actuel
  - Un bloc "prochaine séance" `h={72}` entre le bento et les implantations

### AC6 — Règles de code respectées
- `try/finally` obligatoire sur tous les state setters de chargement (inchangé — déjà conforme)
- `console.error` avec guard `NODE_ENV !== 'production'` sur toutes les erreurs catchées (inchangé)
- Accès Supabase uniquement via `@aureak/api-client` — aucun accès direct
- **Styles uniquement via tokens `@aureak/theme`** : aucune couleur, ombre ou radius hardcodée
  en dehors des tokens. Exception tolérée : les constantes locales de dégradé terrain
  (`#1a472a`/`#2d6a4f`) qui ne sont pas encore dans les tokens — les extraire en constante
  nommée `TERRAIN_GRADIENT` en haut du fichier
- Aucune régression sur les données : `childrenTotal`, `coachesTotal`, `groupsTotal`, `stats`,
  `anomalies`, filtres par implantation et par période — tous doivent rester fonctionnels

### AC7 — Responsive conservé
- Les media queries existantes (`@media (max-width: 1024px)` et `@media (max-width: 768px)`)
  sont préservées
- Le hero band passe à `minHeight: 100px` sous 768px
- Le header visuel des ImplantationCards (72px) reste à hauteur fixe quelle que soit la résolution

---

## Technical Notes

### Fichier unique à modifier

```
aureak/apps/web/app/(admin)/dashboard/page.tsx
```

Aucune migration, aucun changement d'API, aucune modification de types.

### Hero Band — snippet de référence

```tsx
// Constante locale (pas de token pour ces valeurs terrain)
const HERO_BG         = '#2A2827'
const TERRAIN_GRADIENT = 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)'

function HeroBand({
  selectedName,
  statsCount,
}: {
  selectedName: string | null
  statsCount: number
}) {
  const today = new Date().toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{
      background    : HERO_BG,
      borderRadius  : radius.card,
      padding       : '28px 32px',
      marginBottom  : 20,
      position      : 'relative',
      overflow      : 'hidden',
      minHeight     : 140,
      display       : 'flex',
      flexDirection : 'column',
      justifyContent: 'flex-end',
      boxShadow     : shadows.lg,
    }}>
      {/* Icône décorative fond */}
      <div style={{
        position  : 'absolute',
        right     : 24,
        top       : '50%',
        transform : 'translateY(-50%)',
        fontSize  : 120,
        opacity   : 0.06,
        lineHeight: 1,
        userSelect: 'none',
      }}>🏟</div>

      {/* Gradient overlay bas */}
      <div style={{
        position  : 'absolute',
        inset     : 0,
        background: 'linear-gradient(to top, rgba(10,10,12,0.7) 0%, transparent 60%)',
        borderRadius: radius.card,
      }} />

      {/* Contenu texte */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge académie */}
        <div style={{
          display        : 'inline-flex',
          alignItems     : 'center',
          padding        : '3px 10px',
          borderRadius   : radius.badge,
          backgroundColor: colors.accent.gold,
          color          : '#18181B',
          fontSize       : 9,
          fontWeight     : 700,
          fontFamily     : 'Montserrat, sans-serif',
          letterSpacing  : 1.4,
          textTransform  : 'uppercase',
          marginBottom   : 8,
        }}>
          ACADÉMIE
        </div>

        <h1 style={{
          fontSize      : 28,
          fontWeight    : 900,
          fontFamily    : 'Montserrat, sans-serif',
          color         : '#FFFFFF',
          margin        : 0,
          lineHeight    : 1.1,
          letterSpacing : 0.3,
        }}>
          Académie Aureak
        </h1>
        <div style={{
          fontSize    : 12,
          color       : 'rgba(255,255,255,0.55)',
          marginTop   : 6,
          fontFamily  : 'Montserrat, sans-serif',
        }}>
          {selectedName
            ? <>Vue filtrée · <span style={{ color: colors.accent.gold }}>{selectedName}</span></>
            : `Vue globale · ${statsCount} implantation${statsCount !== 1 ? 's' : ''}`
          }
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          {today}
        </div>
      </div>
    </div>
  )
}
```

### Sparkline SVG — fonction utilitaire

```tsx
function SparklineSVG({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null

  const W = 100  // viewBox width (percentage-based via preserveAspectRatio)
  const H = 32

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 6) - 3,  // padding 3px haut/bas
  }))

  const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')

  const minIdx = values.indexOf(min)
  const maxIdx = values.indexOf(max)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: H, display: 'block', marginTop: 8 }}
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Marqueur min */}
      <circle cx={pts[minIdx].x} cy={pts[minIdx].y} r="2" fill="#FFFFFF" />
      {/* Marqueur max */}
      <circle cx={pts[maxIdx].x} cy={pts[maxIdx].y} r="2" fill="#FFFFFF" />
    </svg>
  )
}
```

### Delta Pill — composant inline

```tsx
function DeltaPill({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span style={{
      display        : 'inline-flex',
      alignItems     : 'center',
      padding        : '2px 8px',
      borderRadius   : radius.badge,
      backgroundColor: positive
        ? 'rgba(76,175,80,0.12)'
        : 'rgba(244,67,54,0.12)',
      color          : positive ? colors.status.present : colors.status.absent,
      fontSize       : 11,
      fontWeight     : 600,
      fontFamily     : 'Montserrat, sans-serif',
      whiteSpace     : 'nowrap',
    }}>
      {positive ? '▲' : '▼'} {value}
    </span>
  )
}
```

### Intégration dans KpiCard

Le type `KpiCardProps` reçoit deux nouvelles props optionnelles :

```typescript
sparkline?: number[]
delta?    : { value: string; positive: boolean }
```

La prop `trend` existante est remplacée par `delta` (même sémantique, nouveau rendu).
Si `trend` est déjà utilisé en interne, le renommer en `delta` dans le type et tous les usages.

Dans le rendu de `KpiCard`, après la valeur principale et `sub`, ajouter :

```tsx
{/* Sparkline */}
{sparkline && sparkline.length >= 2 && (
  <SparklineSVG values={sparkline} color={accent} />
)}
```

Dans le `kpiCardTop` (à côté du label), remplacer le rendu `trend` par :

```tsx
{delta && <DeltaPill value={delta.value} positive={delta.positive} />}
```

### Données sparkline simulées (dans DashboardPage)

```typescript
// Constantes sparkline simulées — à remplacer par API historique (story future)
const SPARKLINE_JOUEURS   = [42, 45, 41, 48, 47, childrenTotal ?? 50]
const SPARKLINE_SEANCES   = [8, 10, 9, 12, 11, totalSessions]
```

Ces constantes sont déclarées dans le corps du composant `DashboardPage`, après les états dérivés
(`totalSessions`, `childrenTotal`), pour que les valeurs courantes soient incluses comme dernier point.

### ImplantationCard enrichie — snippet header

```tsx
// En tête de ImplantationCard, avant les ProgressBars existantes
<div style={{
  background   : TERRAIN_GRADIENT,
  borderRadius : `${radius.card}px ${radius.card}px 0 0`,
  height       : 72,
  position     : 'relative',
  overflow     : 'hidden',
  marginBottom : 16,
  // Texture lignes de terrain subtile
  backgroundImage: `
    ${TERRAIN_GRADIENT},
    repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.03) 0px,
      rgba(255,255,255,0.03) 1px,
      transparent 1px,
      transparent 8px
    )
  `,
}}>
  {/* Nom implantation en bas à gauche */}
  <div style={{
    position    : 'absolute',
    bottom      : 10,
    left        : 14,
    fontSize    : 15,
    fontWeight  : 700,
    fontFamily  : 'Montserrat, sans-serif',
    color       : '#FFFFFF',
    lineHeight  : 1.2,
    letterSpacing: 0.2,
  }}>
    {stat.implantation_name}
  </div>

  {/* Badge OR sessions en haut à droite */}
  <div style={{
    position       : 'absolute',
    top            : 10,
    right          : 12,
    backgroundColor: colors.accent.gold,
    color          : '#18181B',
    fontSize       : 10,
    fontWeight     : 600,
    fontFamily     : 'Montserrat, sans-serif',
    padding        : '3px 8px',
    borderRadius   : radius.badge,
    whiteSpace     : 'nowrap',
  }}>
    {stat.sessions_total} séance{stat.sessions_total !== 1 ? 's' : ''}
  </div>
</div>
```

La card existante doit retirer son `borderTop` (le header visuel remplace l'accent de couleur)
et ajuster son `padding` pour ne pas inclure le header (le header a son propre rendu,
les ProgressBars reprennent dans un `div` padded en dessous).

Structure révisée de `ImplantationCard` :

```tsx
<div className="aureak-card" style={{
  ...S.implantCard,
  padding  : 0,         // padding retiré du conteneur principal
  overflow : 'hidden',  // pour le border-radius du header
}}>
  {/* Header terrain */}
  <ImplantationCardHeader stat={stat} />

  {/* Corps avec padding */}
  <div style={{ padding: '0 16px 16px 16px' }}>
    <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
    <ProgressBar pct={stat.mastery_rate_pct}    label="Maîtrise" />
    <div style={S.implantFooter}>
      {/* footer séances inchangé */}
    </div>
  </div>
</div>
```

### Tile "Prochaine séance" — snippet

```tsx
function NextSessionTile({
  pendingSessions,
  onNavigate,
}: {
  pendingSessions: number
  onNavigate: () => void
}) {
  if (pendingSessions === 0) return null

  return (
    <div className="aureak-card" style={{
      ...S.kpiCard,
      borderTop  : `3px solid ${colors.accent.gold}`,
      flexDirection : 'row',
      alignItems : 'center',
      gap        : 16,
      padding    : '14px 20px',
      marginBottom: 20,
    }}>
      <span style={{ fontSize: 22 }}>⏱</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1,
          textTransform: 'uppercase', color: colors.text.muted, marginBottom: 4,
          fontFamily: 'Montserrat, sans-serif' }}>
          Séances en attente de clôture
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.text.dark,
          fontFamily: 'Montserrat, sans-serif' }}>
          {pendingSessions} séance{pendingSessions > 1 ? 's' : ''} ouvertes
        </div>
      </div>
      <span style={{
        display        : 'inline-flex',
        alignItems     : 'center',
        padding        : '3px 10px',
        borderRadius   : radius.badge,
        backgroundColor: 'rgba(244,67,54,0.12)',
        color          : colors.status.absent,
        fontSize       : 10,
        fontWeight     : 600,
        fontFamily     : 'Montserrat, sans-serif',
        letterSpacing  : 0.8,
        textTransform  : 'uppercase',
      }}>EN RETARD</span>
      <button
        onClick={onNavigate}
        style={{
          background  : 'none',
          border      : 'none',
          color       : colors.accent.gold,
          fontSize    : 13,
          fontWeight  : 600,
          fontFamily  : 'Montserrat, sans-serif',
          cursor      : 'pointer',
          whiteSpace  : 'nowrap',
          padding     : 0,
        }}
      >
        Voir →
      </button>
    </div>
  )
}
```

Valeur de `pendingSessions` calculée dans `DashboardPage` :

```typescript
const pendingSessions = visibleStats.reduce(
  (acc, s) => acc + Math.max(0, (s.sessions_total ?? 0) - (s.sessions_closed ?? 0)),
  0
)
```

Rendu dans le JSX entre le bento et le panneau anomalies :

```tsx
<NextSessionTile
  pendingSessions={pendingSessions}
  onNavigate={() => router.push('/seances' as never)}
/>
```

### Skeleton mis à jour

Remplacer le skeleton header actuel (deux `SkeletonBlock` empilés pour titre + sous-titre)
par :

```tsx
{/* Hero band skeleton */}
<SkeletonBlock h={140} r={radius.card} />
<div style={{ height: 20 }} />
```

Ajouter entre le bento et les implantations :

```tsx
{/* Next session tile skeleton */}
<SkeletonBlock h={72} r={radius.card} />
<div style={{ height: 20 }} />
```

---

## Tasks

- [x] 1. Ajouter constantes locales `HERO_BG` et `TERRAIN_GRADIENT` en haut du fichier
- [x] 2. Créer composant `HeroBand` — remplace le bloc `pageHeader` actuel
- [x] 3. Créer fonction `SparklineSVG` — mini graphique SVG 6 points
- [x] 4. Créer composant `DeltaPill` — pill tendance inline
- [x] 5. Étendre `KpiCardProps` avec `sparkline?` et `delta?` — renommer `trend` en `delta`
- [x] 6. Intégrer `SparklineSVG` et `DeltaPill` dans `KpiCard`
- [x] 7. Déclarer constantes sparkline simulées dans `DashboardPage`
- [x] 8. Câbler `sparkline` et `delta` sur les KPI cards "Joueurs actifs" et "Séances"
- [x] 9. Câbler `delta` uniquement sur "Taux de présence" et "Taux de maîtrise"
- [x] 10. Créer composant `ImplantationCardHeader` — header terrain avec badge
- [x] 11. Refactorer `ImplantationCard` — `padding: 0` + header + corps padded séparément
- [x] 12. Créer composant `NextSessionTile` — tile countdown séances en retard
- [x] 13. Calculer `pendingSessions` dans `DashboardPage` et câbler `NextSessionTile`
- [x] 14. Mettre à jour `DashboardSkeleton` — hero band + tile next session
- [x] 15. QA : vérifier try/finally et console guards sur les fichiers modifiés
- [x] 16. Test Playwright : skipped — app non démarrée (localhost:8081 non accessible)

---

## Dépendances

- Aucune migration nécessaire
- Aucune modification d'API
- Story 45-1 (design-system-montserrat-gamification-tokens) souhaitable mais pas bloquante :
  les tokens `gamification.*` et `fonts.display` sont déjà présents dans `tokens.ts`
  et la police Montserrat est déjà utilisée dans le dashboard actuel

---

## Anti-patterns à éviter

- Ne pas introduire de couleurs hardcodées en dehors des deux constantes locales `HERO_BG` / `TERRAIN_GRADIENT`
- Ne pas modifier l'API (`getDashboardKpiCounts`, `getImplantationStats`) — uniquement l'UI
- Ne pas casser le responsive (media queries existantes obligatoirement préservées)
- Ne pas ajouter de bibliothèque externe de charting — le sparkline est en SVG pur
- Ne pas supprimer les données existantes (taux de présence, maîtrise, séances clôturées)
- Ne pas rendre le hero band interactif (pas de clic, pas de navigation depuis le hero)

---

## File List (fichier modifié)

```
aureak/apps/web/app/(admin)/dashboard/page.tsx   [MODIFY]
```

---

## Notes QA post-implémentation

Après implémentation, grep sur `dashboard/page.tsx` :

```bash
# BLOCKER — state reset sans finally
grep -n "setLoading(false)\|setSaving(false)" aureak/apps/web/app/\(admin\)/dashboard/page.tsx

# WARNING — console non guardé
grep -n "console\." aureak/apps/web/app/\(admin\)/dashboard/page.tsx | grep -v "NODE_ENV"

# WARNING — couleur hardcodée hors constantes locales
grep -n "'#[0-9A-Fa-f]" aureak/apps/web/app/\(admin\)/dashboard/page.tsx | grep -v "HERO_BG\|TERRAIN\|2A2827\|1a472a\|2d6a4f\|18181B\|FFFFFF"
```

Le dernier grep doit retourner zéro ligne (toutes les valeurs hex passent via tokens ou les deux
constantes locales documentées).

---

## Dev Agent Record

**Implémenté le** : 2026-04-05
**Agent** : Claude Sonnet 4.6 (Amelia — Dev Agent BMAD)
**Commit** : feat(epic-49): story 49-5 — Dashboard Game Manager Premium

### Résumé d'implémentation

Fichier unique modifié : `aureak/apps/web/app/(admin)/dashboard/page.tsx`

**Composants créés** :
- `HeroBand` — bandeau hero 140px fond `#2A2827`, badge gold ACADÉMIE, titre Montserrat 900 28px, sous-titre dynamique implantation/global, date FR-BE, icône 🏟 décorative opacité 0.06
- `SparklineSVG` — mini graphique SVG pur 6 points, polyline gold, marqueurs min/max blancs, viewBox 100×32 preserveAspectRatio none
- `DeltaPill` — pill arrondie fond rgba positif/négatif, texte ▲/▼ Montserrat SemiBold 11px
- `ImplantationCardHeader` — header terrain 72px gradient vert, nom implantation overlay bas-gauche, badge gold sessions haut-droite, texture diagonale subtile
- `NextSessionTile` — tile séances en retard, pill "EN RETARD" rouge, lien "Voir →" gold, rendu conditionnel si `pendingSessions > 0`

**Modifications KpiCard** :
- Props `trend` renommée `delta: { value: string; positive: boolean }` (optionnel)
- Nouvelle prop `sparkline?: number[]` (optionnel)
- Rendu `DeltaPill` dans `kpiCardTop` si `delta` fourni
- Rendu `SparklineSVG` après `sub` si `sparkline` fourni

**Données simulées** :
- `SPARKLINE_JOUEURS = [42, 45, 41, 48, 47, childrenTotal ?? 50]` — "Joueurs actifs" (sparkline + delta)
- `SPARKLINE_SEANCES = [8, 10, 9, 12, 11, totalSessions]` — "Séances" (sparkline + delta)
- "Taux de présence" : delta `+3%` positif uniquement
- "Taux de maîtrise" : delta `-2%` négatif uniquement

**Skeleton mis à jour** :
- Bloc hero `h={140}` remplace le double SkeletonBlock titre+sous-titre
- Bloc next session `h={72}` entre bento et implantations

**QA résultats** :
- `setLoading(false)` : dans `finally` — conforme ✓
- `console.` sans guard : 0 occurrence ✓
- Couleurs hex hors constantes locales : 0 occurrence ✓
- `npx tsc --noEmit` : 0 erreur ✓
- Playwright : skipped — app non démarrée (localhost:8081 non accessible)
