# Story 50.8 : Dashboard — Widget météo terrain

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un widget météo compact sur le dashboard qui indique les conditions actuelles et recommande si l'entraînement en extérieur est possible,
Afin de prendre rapidement une décision sur le lieu de la prochaine séance sans quitter le dashboard.

## Acceptance Criteria

**AC1 — Widget météo visible**
- **Given** l'admin charge le dashboard
- **When** la page se rend
- **Then** un widget "Météo terrain" s'affiche dans la grille bento (taille `small`)
- **And** il affiche : température en °C, icône météo emoji, description courte (ex: "Nuageux"), vitesse du vent

**AC2 — Source API Open-Meteo**
- **And** les données sont fetched depuis `https://api.open-meteo.com/v1/forecast?latitude=50.85&longitude=4.35&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh` (coordonnées Bruxelles par défaut, sans clé API)
- **And** le fetch est client-side dans un `useEffect` au montage
- **And** le résultat est mis en cache 1h dans `localStorage` (clé `aureak_weather_cache`) avec timestamp

**AC3 — Recommandation extérieur**
- **And** sous les données météo, une ligne affiche "Extérieur ✓" en vert si température >= 5°C ET vitesse du vent < 40km/h ET pas de pluie (weather_code < 61)
- **And** sinon "Extérieur ✗" en rouge avec la raison principale (ex: "Vent fort", "Pluie", "Trop froid")

**AC4 — Cache localStorage 1h**
- **And** si le cache est valide (< 60 minutes), les données sont utilisées sans refetch réseau
- **And** un bouton "↻" permet de forcer le rafraîchissement en vidant le cache

**AC5 — Loading et error states**
- **And** pendant le fetch, un skeleton de 80px
- **And** si le fetch échoue (réseau, CORS, etc.), le widget affiche "Météo indisponible" sans crasher
- **And** les erreurs sont loguées avec guard `NODE_ENV !== 'production'`

**AC6 — Localisation configurable**
- **And** une constante `WEATHER_COORDS = { lat: 50.85, lon: 4.35, label: 'Bruxelles' }` est déclarée en haut du fichier pour faciliter la modification future
- **And** le nom de la ville est affiché sous le widget ("Bruxelles" par défaut)

**AC7 — Icône météo emoji**
- **And** les codes météo Open-Meteo (WMO) sont mappés vers des emojis : 0→☀️, 1-3→🌤️/⛅/🌥️, 45-48→🌫️, 51-67→🌧️, 71-77→🌨️, 80-82→🌦️, 95→⛈️, etc.

## Tasks / Subtasks

- [x] Task 1 — Déclarer constantes locales (AC: #6)
  - [x] 1.1 Ajouter `WEATHER_COORDS` et `WEATHER_CACHE_KEY` en haut de `dashboard/page.tsx`

- [x] Task 2 — Implémenter le fetch météo avec cache (AC: #2, #4)
  - [x] 2.1 Créer `fetchWeather()` : check cache localStorage → si valide retourner data → sinon fetch API → sauvegarder en cache avec timestamp
  - [x] 2.2 Créer `clearWeatherCache()` pour le bouton refresh
  - [x] 2.3 `useEffect` dans `WeatherWidget` qui appelle `fetchWeather()`

- [x] Task 3 — Créer le composant `WeatherWidget` (AC: #1, #3, #5, #6, #7)
  - [x] 3.1 State : `weather: WeatherData | null`, `loadingWeather: boolean`, `errorWeather: boolean`
  - [x] 3.2 Mapper `weather_code` vers emoji via objet constant `WMO_EMOJI`
  - [x] 3.3 Calculer recommandation extérieur
  - [x] 3.4 Bouton refresh `↻`

- [x] Task 4 — Intégrer dans `DashboardPage` (AC: #1)
  - [x] 4.1 Placer `<WeatherWidget />` dans la grille bento (taille `small`)

- [x] Task 5 — QA scan
  - [x] 5.1 Vérifier que le fetch API ne fuit pas en mémoire (AbortController ou cleanup flag)
  - [x] 5.2 Vérifier guard console.error sur les erreurs fetch
  - [x] 5.3 Vérifier que le cache localStorage est parsé avec try/catch (JSON.parse peut throw)

## Dev Notes

### Constantes locales

```typescript
const WEATHER_COORDS    = { lat: 50.85, lon: 4.35, label: 'Bruxelles' }
const WEATHER_CACHE_KEY = 'aureak_weather_cache'
const WEATHER_CACHE_TTL = 60 * 60 * 1000  // 1h en ms
```

### Type WeatherData

```typescript
type WeatherData = {
  temperature : number  // °C
  windSpeed   : number  // km/h
  weatherCode : number  // WMO code
  fetchedAt   : number  // Date.now()
}
```

### Cache helpers

```typescript
function loadWeatherCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as WeatherData
    if (Date.now() - data.fetchedAt > WEATHER_CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function saveWeatherCache(data: WeatherData) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded — ignore */ }
}

async function fetchWeatherData(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_COORDS.lat}&longitude=${WEATHER_COORDS.lon}&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`
  const res  = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return {
    temperature: json.current.temperature_2m,
    windSpeed  : json.current.wind_speed_10m,
    weatherCode: json.current.weather_code,
    fetchedAt  : Date.now(),
  }
}
```

### Mapping WMO → emoji

```typescript
const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '🌥️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡️'
}

function wmoLabel(code: number): string {
  if (code === 0)              return 'Dégagé'
  if (code <= 3)               return 'Partiellement nuageux'
  if (code <= 48)              return 'Brouillard'
  if (code <= 55)              return 'Bruine'
  if (code <= 65)              return 'Pluie'
  if (code <= 77)              return 'Neige'
  if (code <= 82)              return 'Averses'
  if (code <= 99)              return 'Orage'
  return 'Variable'
}
```

### Logique recommandation

```typescript
function outdoorRecommendation(w: WeatherData): { ok: boolean; label: string; reason?: string } {
  if (w.temperature < 5)  return { ok: false, label: 'Extérieur ✗', reason: 'Trop froid' }
  if (w.windSpeed > 40)   return { ok: false, label: 'Extérieur ✗', reason: 'Vent fort' }
  if (w.weatherCode >= 61 && w.weatherCode <= 82)
                          return { ok: false, label: 'Extérieur ✗', reason: 'Pluie' }
  if (w.weatherCode >= 95) return { ok: false, label: 'Extérieur ✗', reason: 'Orage' }
  return { ok: true, label: 'Extérieur ✓' }
}
```

### Composant WeatherWidget

```typescript
function WeatherWidget() {
  const [weather,       setWeather]       = useState<WeatherData | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [errorWeather,   setErrorWeather]   = useState(false)

  const load = async (force = false) => {
    setLoadingWeather(true)
    setErrorWeather(false)
    try {
      if (!force) {
        const cached = loadWeatherCache()
        if (cached) { setWeather(cached); return }
      }
      const data = await fetchWeatherData()
      saveWeatherCache(data)
      setWeather(data)
    } catch (err) {
      setErrorWeather(true)
      if (process.env.NODE_ENV !== 'production') console.error('[WeatherWidget] fetch error:', err)
    } finally {
      setLoadingWeather(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loadingWeather) return <SkeletonBlock h={80} r={radius.card} />

  if (errorWeather || !weather) {
    return (
      <div className="aureak-card" style={{ ...S.kpiCard, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: colors.text.muted }}>Météo indisponible</span>
      </div>
    )
  }

  const rec = outdoorRecommendation(weather)

  return (
    <div className="aureak-card" style={{ ...S.kpiCard, borderTop: `3px solid ${colors.status.info}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Météo terrain
        </div>
        <button onClick={() => load(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: colors.text.muted }}>
          ↻
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{wmoEmoji(weather.weatherCode)}</span>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, fontSize: 22, color: colors.text.dark, lineHeight: 1 }}>
            {Math.round(weather.temperature)}°C
          </div>
          <div style={{ fontSize: 11, color: colors.text.muted }}>
            {wmoLabel(weather.weatherCode)} · {Math.round(weather.windSpeed)} km/h
          </div>
        </div>
      </div>

      <div style={{
        marginTop  : 10,
        fontSize   : 12,
        fontWeight : 600,
        color      : rec.ok ? colors.status.present : colors.status.absent,
      }}>
        {rec.label}
        {rec.reason && <span style={{ fontWeight: 400, color: colors.text.muted }}> — {rec.reason}</span>}
      </div>

      <div style={{ fontSize: 10, color: colors.text.subtle, marginTop: 4 }}>
        {WEATHER_COORDS.label}
      </div>
    </div>
  )
}
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — `WeatherWidget`, `WMO_EMOJI`, `WEATHER_COORDS`, cache helpers, recommandation
