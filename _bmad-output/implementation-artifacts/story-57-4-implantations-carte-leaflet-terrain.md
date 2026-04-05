# Story 57-4 — Implantations : Carte interactive Leaflet dans le panneau détail

**Epic** : 57 — Implantations "Facilities Manager"
**Status** : done
**Priority** : low
**Effort** : M (demi-journée)

---

## Contexte

Chaque implantation stocke des coordonnées GPS (`gpsLat`, `gpsLon`). Cette story affiche une mini-carte Leaflet dans le panneau détail (`ImplantationDetail`) avec un marqueur positionné sur le site. Un tap sur la carte ouvre Google Maps dans un nouvel onglet.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** voir la localisation de chaque implantation sur une mini-carte dans la fiche,
**afin de** confirmer l'adresse visuellement et partager rapidement la direction avec les coaches ou parents.

---

## Acceptance Criteria

- [ ] AC1 — Une mini-carte est affichée dans `ImplantationDetail` (sous la section groupes) uniquement si `impl.gpsLat` et `impl.gpsLon` sont définis et non null
- [ ] AC2 — La carte utilise **Leaflet** (via `react-leaflet` + tiles OpenStreetMap) — pas de clé API requise ; importer conditionnellement (web only) pour éviter l'erreur SSR
- [ ] AC3 — La carte est centrée sur `[gpsLat, gpsLon]` avec un zoom fixe de 15 ; un marqueur (`CircleMarker` ou `Marker` avec icône custom or) indique le site
- [ ] AC4 — La carte a une hauteur fixe de 180px, `borderRadius: radius.card`, `overflow: 'hidden'`, `border: 1px solid colors.border.light`
- [ ] AC5 — Un `Pressable` overlay transparent couvre la carte ; son `onPress` ouvre `https://www.google.com/maps?q={gpsLat},{gpsLon}` dans un nouvel onglet (`window.open(url, '_blank')`) — sur mobile le lien s'ouvre dans l'app Maps native via `Linking.openURL`
- [ ] AC6 — Un badge "Ouvrir dans Maps ↗" est affiché en bas-droite de la carte pour indiquer l'interactivité
- [ ] AC7 — Si Leaflet n'est pas encore installé comme dépendance du projet web, ajouter `react-leaflet` et `leaflet` dans `aureak/apps/web/package.json` ; importer les styles CSS Leaflet dans le composant (web only)
- [ ] AC8 — La carte est lazy-loadée (`React.lazy` + `Suspense` avec un skeleton 180px gris) pour ne pas alourdir le bundle initial
- [ ] AC9 — Si `gpsLat`/`gpsLon` sont null, afficher un placeholder "📍 Aucune coordonnée GPS — éditer l'implantation pour en ajouter" avec un lien vers le mode édition
- [ ] AC10 — Aucun hardcode — tokens `@aureak/theme` ; `console.error` guardé `NODE_ENV`

---

## Tasks

### T1 — Installation dépendances (si absentes)

```bash
cd aureak/apps/web && npm install react-leaflet leaflet
cd aureak/apps/web && npm install --save-dev @types/leaflet
```

- [ ] `react-leaflet` et `leaflet` ajoutés dans `package.json` web

### T2 — Composant `ImplantationMap` (lazy)

Fichier : `aureak/apps/web/app/(admin)/implantations/_components/ImplantationMap.tsx` (nouveau)

```tsx
'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { colors } from '@aureak/theme'

type Props = {
  lat      : number
  lon      : number
  name     : string
}

export function ImplantationMap({ lat, lon, name }: Props) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={15}
      style={{ height: 180, width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker
        center={[lat, lon]}
        radius={10}
        pathOptions={{ color: colors.accent.gold, fillColor: colors.accent.gold, fillOpacity: 0.9 }}
      >
        <Popup>{name}</Popup>
      </CircleMarker>
    </MapContainer>
  )
}
```

- [ ] Composant `ImplantationMap` créé

### T3 — Intégration dans `ImplantationDetail`

Dans `ImplantationDetail`, après la section groupes, ajouter la section carte :

```tsx
{impl.gpsLat && impl.gpsLon ? (
  <View style={detailStyles.mapSection}>
    <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 1, marginBottom: space.sm }}>
      LOCALISATION
    </AureakText>
    <Pressable
      onPress={() => {
        const url = `https://www.google.com/maps?q=${impl.gpsLat},${impl.gpsLon}`
        if (typeof window !== 'undefined') window.open(url, '_blank')
      }}
      style={detailStyles.mapContainer}
    >
      <React.Suspense fallback={<View style={detailStyles.mapSkeleton} />}>
        <LazyImplantationMap lat={impl.gpsLat} lon={impl.gpsLon} name={impl.name} />
      </React.Suspense>
      <View style={detailStyles.mapBadge}>
        <AureakText variant="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>Ouvrir dans Maps ↗</AureakText>
      </View>
    </Pressable>
  </View>
) : (
  <View style={detailStyles.mapPlaceholder}>
    <AureakText variant="caption" style={{ color: colors.text.muted }}>
      📍 Aucune coordonnée GPS — modifier l'implantation pour en ajouter
    </AureakText>
  </View>
)}
```

Lazy import :
```typescript
const LazyImplantationMap = React.lazy(() =>
  import('./_components/ImplantationMap').then(m => ({ default: m.ImplantationMap }))
)
```

- [ ] Lazy import configuré
- [ ] Section carte intégrée dans `ImplantationDetail`
- [ ] Styles `mapSection`, `mapContainer`, `mapSkeleton`, `mapBadge`, `mapPlaceholder` ajoutés dans `detailStyles`

---

## Dépendances

- Story 49-6 `done` — `ImplantationDetail` existant + `gpsLat`/`gpsLon` sur le type `Implantation`

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/package.json` | Modifier — `react-leaflet`, `leaflet` |
| `aureak/apps/web/app/(admin)/implantations/_components/ImplantationMap.tsx` | Créer |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — lazy import + section carte dans `ImplantationDetail` |

---

## QA post-story

```bash
# Vérifier lazy import
grep -n "React.lazy\|Suspense" aureak/apps/web/app/(admin)/implantations/index.tsx
# Vérifier console guards
grep -n "console\." aureak/apps/web/app/(admin)/implantations/_components/ImplantationMap.tsx | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-57): story 57-4 — implantations mini-carte Leaflet + lien Google Maps
```
