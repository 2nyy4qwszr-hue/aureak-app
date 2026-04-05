# Story 50.7 : Dashboard — Anomalies inline compactes

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux que les anomalies du dashboard soient affichées sous forme de pills cliquables qui ouvrent une modale de résolution inline,
Afin de résoudre les problèmes sans quitter le dashboard et de réduire le bruit visuel de la liste actuelle.

## Acceptance Criteria

**AC1 — Section anomalies refactorée en pills**
- **Given** il y a des anomalies non résolues
- **When** l'admin charge le dashboard
- **Then** la section anomalies affiche chaque anomalie comme une pill `<type> · <entité>` colorée selon la sévérité (critique = rouge, warning = ambre, info = or)
- **And** les pills sont disposées en `flexWrap: 'wrap'` avec `gap: 8`

**AC2 — Pill cliquable → modale inline**
- **When** l'admin clique sur une pill
- **Then** une modale `position: fixed` s'affiche avec fond overlay semi-transparent `colors.overlay.dark`
- **And** la modale contient : titre de l'anomalie, description, sévérité badge, entité liée, bouton "Marquer résolu" et bouton "Fermer"

**AC3 — Résolution depuis la modale**
- **When** l'admin clique "Marquer résolu" dans la modale
- **Then** `resolveAnomaly(id)` est appelé, la modale se ferme, la pill disparaît de la liste sans rechargement complet de la page
- **And** un toast feedback "Anomalie résolue ✓" s'affiche brièvement (2s) en bas de l'écran

**AC4 — Compteur de sévérité**
- **And** en haut de la section, un résumé compact : `🔴 2 critiques · 🟡 3 avertissements · 🔵 1 info`
- **And** si aucune anomalie critique : résumé affiché en couleur neutre

**AC5 — Empty state**
- **And** quand toutes les anomalies sont résolues, la section affiche "Aucune anomalie ✓" avec fond vert léger

**AC6 — Dismiss sans résolution**
- **And** la modale peut être fermée avec la touche Escape ou en cliquant sur le bouton "Fermer" sans résoudre l'anomalie

**AC7 — Pas de navigation externe**
- **And** aucun bouton de la section anomalies ne navigue hors du dashboard (suppression du comportement actuel si existant)

## Tasks / Subtasks

- [x] Task 1 — Refactoriser la section anomalies en pills (AC: #1, #4, #5)
  - [x] 1.1 Localiser le bloc de rendu des anomalies dans `DashboardPage`
  - [x] 1.2 Remplacer la liste par un `flexWrap` de `AnomalyPill`
  - [x] 1.3 Ajouter le résumé de compteurs en haut
  - [x] 1.4 Ajouter l'empty state

- [x] Task 2 — Créer le composant `AnomalyPill` (AC: #1, #2)
  - [x] 2.1 Props : `anomaly: AnomalyEvent`, `onClick: () => void`
  - [x] 2.2 Couleur de fond semi-transparente selon sévérité (10% d'opacité)
  - [x] 2.3 Label : `anomalyLabel(anomaly.anomalyType)` (fonction existante — adapté au vrai type)

- [x] Task 3 — Créer le composant `AnomalyModal` (AC: #2, #3, #6)
  - [x] 3.1 Props : `anomaly: AnomalyEvent | null`, `onClose: () => void`, `onResolve: (id: string) => Promise<void>`
  - [x] 3.2 `position: fixed, inset: 0` overlay + carte centrée
  - [x] 3.3 `useEffect` pour écouter `keydown` Escape → `onClose()`
  - [x] 3.4 State `resolving: boolean` avec try/finally

- [x] Task 4 — Toast feedback (AC: #3)
  - [x] 4.1 Ajouter state `toastMessage: string | null`
  - [x] 4.2 Composant `Toast` : `position: fixed, bottom: 24, right: 24`, fond vert, auto-dismiss 2s
  - [x] 4.3 `setTimeout` via useEffect dans `Toast` pour auto-dismiss

- [x] Task 5 — Mise à jour optimiste des anomalies (AC: #3)
  - [x] 5.1 Dans `handleResolve`, après `resolveAnomaly(id)`, appeler `setAnomalies(prev => prev.filter(a => a.id !== id))` au lieu de recharger toute la page
  - [x] 5.2 En cas d'erreur, ne pas filtrer et afficher un message d'erreur dans la modale

- [x] Task 6 — QA scan
  - [x] 6.1 Vérifier cleanup de l'event listener Escape dans le return du useEffect
  - [x] 6.2 Vérifier try/finally sur resolving dans `AnomalyModal`
  - [x] 6.3 Vérifier guard console.error

## Dev Notes

### Composant AnomalyPill

```typescript
function AnomalyPill({ anomaly, onClick }: { anomaly: AnomalyEvent; onClick: () => void }) {
  const color  = SEV_COLOR[anomaly.severity] ?? colors.status.info
  const bgAlpha = anomaly.severity === 'critical' ? 'rgba(244,67,54,0.10)'
                : anomaly.severity === 'warning'  ? 'rgba(255,193,7,0.10)'
                :                                   'rgba(193,172,92,0.10)'

  return (
    <button
      onClick={onClick}
      style={{
        display        : 'inline-flex',
        alignItems     : 'center',
        gap            : 6,
        backgroundColor: bgAlpha,
        border         : `1px solid ${color}`,
        borderRadius   : radius.badge,
        paddingLeft    : 12,
        paddingRight   : 12,
        paddingTop     : 6,
        paddingBottom  : 6,
        cursor         : 'pointer',
        fontSize       : 12,
        fontWeight     : 600,
        color          : color,
        transition     : `opacity 0.15s ease`,
      } as React.CSSProperties}
      className="aureak-anomaly-pill"
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      {anomalyLabel(anomaly.type)}
      {anomaly.entity_name && (
        <span style={{ opacity: 0.7, fontSize: 11 }}>· {anomaly.entity_name}</span>
      )}
    </button>
  )
}
```

### CSS à ajouter

```css
.aureak-anomaly-pill:hover { opacity: 0.8; }
```

### Composant AnomalyModal

```typescript
function AnomalyModal({
  anomaly,
  onClose,
  onResolve,
}: {
  anomaly   : AnomalyEvent | null
  onClose   : () => void
  onResolve : (id: string) => Promise<void>
}) {
  const [resolving, setResolving] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!anomaly) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [anomaly, onClose])

  if (!anomaly) return null

  const handleResolve = async () => {
    setResolving(true)
    setError(null)
    try {
      await onResolve(anomaly.id)
    } catch (err) {
      setError('Erreur lors de la résolution')
      if (process.env.NODE_ENV !== 'production') console.error('[AnomalyModal] resolve error:', err)
    } finally {
      setResolving(false)
    }
  }

  const sevColor = SEV_COLOR[anomaly.severity] ?? colors.status.info

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: colors.overlay.dark, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        padding        : 28,
        width          : 440,
        maxWidth       : 'calc(100vw - 32px)',
        boxShadow      : shadows.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sevColor, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: colors.text.dark }}>
            {anomalyLabel(anomaly.type)}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: sevColor, backgroundColor: `${sevColor}1A`, borderRadius: radius.badge, padding: '3px 8px' }}>
            {SEV_LABEL[anomaly.severity] ?? anomaly.severity}
          </span>
        </div>

        {anomaly.description && (
          <div style={{ fontSize: 14, color: colors.text.muted, marginBottom: 16, lineHeight: 1.6 }}>
            {anomaly.description}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: colors.status.absent, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: radius.button, border: `1px solid ${colors.border.light}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: colors.text.muted }}
          >
            Fermer
          </button>
          <button
            onClick={handleResolve}
            disabled={resolving}
            style={{ padding: '8px 16px', borderRadius: radius.button, border: 'none', background: colors.status.present, cursor: resolving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#FFFFFF', opacity: resolving ? 0.6 : 1 }}
          >
            {resolving ? 'Résolution…' : 'Marquer résolu ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Toast

```typescript
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position       : 'fixed',
      bottom         : 24,
      right          : 24,
      backgroundColor: colors.status.success,
      color          : '#FFFFFF',
      borderRadius   : radius.button,
      padding        : '10px 18px',
      fontSize       : 13,
      fontWeight     : 600,
      boxShadow      : shadows.md,
      zIndex         : 2000,
      animation      : 'feed-slide-in 0.2s ease',
    }}>
      {message}
    </div>
  )
}
```

### Mise à jour optimiste dans DashboardPage

```typescript
const handleResolve = async (id: string) => {
  await resolveAnomaly(id)  // throws si erreur
  setAnomalies(prev => prev.filter(a => a.id !== id))
  setSelectedAnomaly(null)
  setToastMessage('Anomalie résolue ✓')
}
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — `AnomalyPill`, `AnomalyModal`, `Toast`, mise à jour optimiste anomalies
