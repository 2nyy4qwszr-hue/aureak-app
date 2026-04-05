# Story 50.1 : Dashboard — Hero Band salle de commandement

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un bandeau d'en-tête immersif en haut du dashboard qui identifie clairement l'académie et affiche la date du jour,
Afin de ressentir que je pilote une salle de commandement plutôt qu'un tableau de bord générique.

## Acceptance Criteria

**AC1 — Bandeau Hero présent**
- **Given** l'admin navigue vers `/dashboard`
- **When** la page se charge
- **Then** un bandeau Hero de 160px de hauteur s'affiche en haut de la zone de contenu, avant les KPIs, avec fond `#2A2827` (brun-noir premium)

**AC2 — Logo académie à gauche**
- **And** le logo AUREAK (texte "AUREAK" en Montserrat Black 900, taille 28, couleur `colors.accent.gold`) est positionné à gauche du bandeau, avec un sous-titre "Académie des Gardiens" en taille 13, couleur `colors.accent.goldLight`, letter-spacing 2

**AC3 — Date dynamique à droite**
- **And** la date du jour est affichée à droite du bandeau en format long français : ex. "Vendredi 4 avril 2026", Montserrat 600 taille 15, couleur `colors.accent.ivory`
- **And** en dessous de la date, l'heure actuelle est affichée et se met à jour chaque minute (format HH:MM), Geist Mono taille 22, couleur `colors.accent.gold`

**AC4 — Texture terrain subtile**
- **And** un SVG de lignes de terrain de football (pattern hexagonal ou grille) est rendu en position absolute, couvrant tout le bandeau, avec `opacity: 0.06`, non interactif (`pointerEvents: 'none'`)

**AC5 — Stripe gold en haut**
- **And** une bande horizontale de 3px `colors.accent.gold` est visible tout en haut du bandeau (bordure top)

**AC6 — Responsive**
- **And** sur mobile (< 768px) : le logo et la date s'empilent verticalement, hauteur du bandeau réduite à 120px

**AC7 — Remplacement du `<h1>` plat**
- **And** le `<h1 style={S.pageTitle}>Tableau de bord</h1>` et son `pageSubtitle` existants sont remplacés par le composant `HeroBand` — le reste du layout (KPIs, implantations) est inchangé

## Tasks / Subtasks

- [x] Task 1 — Créer le composant `HeroBand` dans `dashboard/page.tsx` (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Ajouter state `currentTime` avec `useEffect` + `setInterval` 60s pour l'horloge
  - [x] 1.2 Formatter la date en français via `toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })`
  - [x] 1.3 Créer le SVG terrain inline (pattern grilles `<line>` ou `<rect>` opacité 0.06)
  - [x] 1.4 Appliquer `borderTop: '3px solid ' + colors.accent.gold` + `backgroundColor: '#2A2827'`

- [x] Task 2 — Intégrer `HeroBand` dans la page (AC: #7)
  - [x] 2.1 Supprimer le bloc `pageHeader` avec `<h1>` et `pageSubtitle`
  - [x] 2.2 Placer `<HeroBand />` en premier dans le return de `DashboardPage`, avant le sélecteur d'implantation
  - [x] 2.3 Adapter `S.container` si le padding top doit être ajusté (le bandeau prend son propre espace)

- [x] Task 3 — Responsive mobile (AC: #6)
  - [x] 3.1 Ajouter une `@media (max-width: 768px)` dans le bloc `<style>` pour réduire la hauteur et empiler les éléments

- [x] Task 4 — Skeleton (AC: #1)
  - [x] 4.1 Ajouter un `SkeletonBlock h={160}` dans `DashboardSkeleton` pour le Hero avant les KPIs

- [x] Task 5 — QA scan
  - [x] 5.1 Vérifier absence de couleurs hardcodées (sauf `#2A2827` qui sera extrait en constante locale `HERO_BG`)
  - [x] 5.2 Vérifier que le `setInterval` est nettoyé dans le `return` du `useEffect`

## Dev Notes

### Constante locale à déclarer en haut du fichier

```typescript
// Couleur signature du Hero Band — non incluse dans tokens car très spécifique à ce composant
const HERO_BG = '#2A2827'
```

### Composant HeroBand

```typescript
function HeroBand({ implantationCount }: { implantationCount: number }) {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const dateLabel = currentTime.toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const timeLabel = currentTime.toLocaleTimeString('fr-BE', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{
      position       : 'relative',
      height         : 160,
      backgroundColor: HERO_BG,
      borderTop      : `3px solid ${colors.accent.gold}`,
      borderRadius   : radius.card,
      overflow       : 'hidden',
      display        : 'flex',
      alignItems     : 'center',
      justifyContent : 'space-between',
      paddingLeft    : 32,
      paddingRight   : 32,
      marginBottom   : 24,
    }}>
      {/* Texture terrain SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="terrain" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#terrain)" />
        {/* Cercle central */}
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="0.8" />
      </svg>

      {/* Logo gauche */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily   : 'Montserrat',
          fontWeight   : '900',
          fontSize     : 28,
          color        : colors.accent.gold,
          letterSpacing: 3,
          lineHeight   : 1.1,
        }}>
          AUREAK
        </div>
        <div style={{
          fontFamily   : 'Montserrat',
          fontWeight   : '400',
          fontSize     : 13,
          color        : colors.accent.goldLight,
          letterSpacing: 2,
          marginTop    : 4,
          textTransform: 'uppercase',
        }}>
          Académie des Gardiens
        </div>
        <div style={{
          fontFamily: 'Montserrat',
          fontSize  : 12,
          color     : colors.text.muted,
          marginTop : 8,
        }}>
          {implantationCount} implantation{implantationCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Date & heure droite */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
        <div style={{
          fontFamily   : 'Geist Mono, monospace',
          fontWeight   : '600',
          fontSize     : 26,
          color        : colors.accent.gold,
          lineHeight   : 1,
        }}>
          {timeLabel}
        </div>
        <div style={{
          fontFamily  : 'Montserrat',
          fontWeight  : '600',
          fontSize    : 15,
          color       : colors.accent.ivory,
          marginTop   : 8,
          letterSpacing: 0.3,
        }}>
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        </div>
      </div>
    </div>
  )
}
```

### Intégration dans DashboardPage

Dans le `return` de `DashboardPage`, remplacer :
```typescript
{/* ── Page Header ── */}
<div style={S.pageHeader}>
  <div>
    <h1 style={S.pageTitle}>Tableau de bord</h1>
    <div style={S.pageSubtitle}>...</div>
  </div>
  ...
</div>
```

Par :
```typescript
<HeroBand implantationCount={stats.length} />
```

Le sélecteur d'implantation + date range peuvent rester juste en dessous.

### Style responsive à ajouter dans le bloc `<style>`

```css
@media (max-width: 768px) {
  .hero-band { height: 120px !important; flex-direction: column !important; gap: 12px; }
  .hero-date { text-align: left !important; }
}
```

### Notes QA
- `#2A2827` déclaré comme constante `HERO_BG` — non hardcodé inline
- `clearInterval` dans le return du useEffect — pas de memory leak
- Aucun accès Supabase dans ce composant — purement présentationnelle

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ajout `HeroBand`, suppression `pageHeader` block
