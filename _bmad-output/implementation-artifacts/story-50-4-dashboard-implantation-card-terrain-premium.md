# Story 50.4 : Dashboard — ImplantationCard terrain premium

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux que les cards d'implantation du dashboard soient visuellement riches avec un dégradé vert terrain, un badge or pour le nombre de joueurs, et des chips de groupes scrollables,
Afin que chaque implantation soit immédiatement identifiable et que les informations clés soient accessibles d'un coup d'œil.

## Acceptance Criteria

**AC1 — Header visuel premium**
- **Given** l'admin charge le dashboard
- **When** les ImplantationCards se rendent
- **Then** chaque card a un header de 80px avec dégradé `linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)` (vert terrain de football riche)

**AC2 — Badge joueurs or**
- **And** dans le header, en haut à droite, un badge pill affiche le nombre de joueurs actifs de l'implantation avec fond `colors.accent.gold`, texte blanc/sombre, taille 11, fontWeight 700

**AC3 — Chips groupes scrollables**
- **And** sous le header, une rangée de chips horizontaux scrollables (overflow-x: auto) affiche chaque groupe de l'implantation avec son nom, fond `colors.light.muted`, texte `colors.text.dark`, radius `radius.badge`
- **And** si aucun groupe n'est disponible dans les données, la rangée affiche "Aucun groupe" en gris

**AC4 — Nom implantation dans le header**
- **And** le nom de l'implantation est affiché dans le header en Montserrat 700 taille 16, couleur blanche, avec une légère text-shadow pour lisibilité sur le dégradé vert

**AC5 — Progress bars préservées**
- **And** les `ProgressBar` existantes (Présence + Maîtrise) sont conservées sous la section groupes chips
- **And** le footer "Séances clôturées" est conservé

**AC6 — Hover premium**
- **And** au hover de la card, le header change de box-shadow → `0 4px 20px rgba(64,145,108,0.3)` (glow vert) via la classe `aureak-card:hover` existante

**AC7 — Données groupes depuis les props**
- **And** `ImplantationCard` accepte une nouvelle prop optionnelle `groups?: { id: string; name: string }[]`
- **And** si non fournie, les chips ne s'affichent pas (pas de régression)
- **And** les données groupes sont chargées en parallèle avec les autres stats dans `DashboardPage`

## Tasks / Subtasks

- [x] Task 1 — Enrichir `ImplantationCard` avec le header premium (AC: #1, #2, #4, #6)
  - [x] 1.1 Ajouter un `<div>` header de 80px en haut de la card avec le dégradé vert
  - [x] 1.2 Positionner le nom implantation en bas-gauche du header avec text-shadow
  - [x] 1.3 Ajouter le badge or (groups.length) en haut-droite du header
  - [x] 1.4 Ajouter la règle CSS hover glow vert dans le bloc `<style>` global de la page

- [x] Task 2 — Ajouter les chips groupes (AC: #3, #7)
  - [x] 2.1 Ajouter prop `groups?: { id: string; name: string }[]` à `ImplantationCard`
  - [x] 2.2 Rendre la rangée scroll horizontale entre le header et les ProgressBars
  - [x] 2.3 Style chip : padding 4/10, radius badge, fond muted, texte dark taille 11

- [x] Task 3 — Supprimer `stat.implantation_name` du corps de card (AC: #4)
  - [x] 3.1 Ancien `ImplantationCardHeader` supprimé, nom directement dans le header inline de `ImplantationCard`

- [x] Task 4 — Enrichir le type `ImplantationStats` ou l'appel API (AC: #7)
  - [x] 4.1 `getImplantationStats` ne retourne pas les groupes — appel parallèle nécessaire
  - [x] 4.2 `listGroupsByImplantation(id)` appelée en parallèle pour chaque stat → `implantationGroups` map
  - [x] 4.3 `groups={implantationGroups[s.implantation_id]}` passé à chaque `ImplantationCard`

- [x] Task 5 — QA scan
  - [x] 5.1 ProgressBars Présence + Maîtrise fonctionnellement inchangées
  - [x] 5.2 `overflow-x: auto` + `whiteSpace: nowrap` + `flexShrink: 0` — safe sur mobile

## Dev Notes

### CSS à ajouter dans le bloc `<style>` de la page

```css
.implant-card-header { transition: box-shadow 0.2s ease; }
.aureak-card:hover .implant-card-header { box-shadow: 0 4px 20px rgba(64,145,108,0.3); }
.groups-scroll::-webkit-scrollbar { display: none; }
.groups-scroll { scrollbar-width: none; }
```

### Nouveau ImplantationCard

```typescript
type ImplantationCardProps = {
  stat   : ImplantationStats
  groups?: { id: string; name: string }[]
}

function ImplantationCard({ stat, groups }: ImplantationCardProps) {
  const attendanceColor = rateColor(stat.attendance_rate_pct)
  const seancesRatio    = stat.sessions_total > 0
    ? `${stat.sessions_closed}/${stat.sessions_total}`
    : '—'
  const seancesPct = stat.sessions_total > 0
    ? Math.round((stat.sessions_closed / stat.sessions_total) * 100)
    : null

  return (
    <div className="aureak-card" style={{ ...S.implantCard, padding: 0, overflow: 'hidden', borderTop: `3px solid ${attendanceColor}` }}>
      {/* Header terrain premium */}
      <div
        className="implant-card-header"
        style={{
          height          : 80,
          background      : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)',
          position        : 'relative',
          display         : 'flex',
          alignItems      : 'flex-end',
          justifyContent  : 'space-between',
          padding         : '0 14px 12px 14px',
        }}
      >
        {/* Nom implantation */}
        <div style={{
          fontFamily : 'Montserrat',
          fontWeight : '700',
          fontSize   : 16,
          color      : '#FFFFFF',
          textShadow : '0 1px 3px rgba(0,0,0,0.5)',
        }}>
          {stat.implantation_name}
        </div>

        {/* Badge joueurs */}
        {stat.children_count != null && (
          <div style={{
            backgroundColor: colors.accent.gold,
            color          : '#1A1A1A',
            borderRadius   : radius.badge,
            paddingLeft    : 8,
            paddingRight   : 8,
            paddingTop     : 3,
            paddingBottom  : 3,
            fontSize       : 11,
            fontWeight     : 700,
            fontFamily     : 'Geist Mono, monospace',
            position       : 'absolute',
            top            : 10,
            right          : 14,
          }}>
            {stat.children_count} joueurs
          </div>
        )}
      </div>

      {/* Corps card */}
      <div style={{ padding: '12px 14px 14px 14px' }}>
        {/* Chips groupes */}
        {groups && groups.length > 0 ? (
          <div className="groups-scroll" style={{
            display   : 'flex',
            gap       : 6,
            overflowX : 'auto',
            marginBottom: 12,
          }}>
            {groups.map(g => (
              <span key={g.id} style={{
                backgroundColor: colors.light.muted,
                color          : colors.text.dark,
                borderRadius   : radius.badge,
                paddingLeft    : 10,
                paddingRight   : 10,
                paddingTop     : 4,
                paddingBottom  : 4,
                fontSize       : 11,
                fontWeight     : 500,
                whiteSpace     : 'nowrap',
                flexShrink     : 0,
              }}>
                {g.name}
              </span>
            ))}
          </div>
        ) : groups && groups.length === 0 ? (
          <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 12 }}>Aucun groupe</div>
        ) : null}

        <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
        <ProgressBar pct={stat.mastery_rate_pct}    label="Maîtrise" />

        <div style={S.implantFooter}>
          <span style={{ fontSize: 11, color: colors.text.muted }}>Séances clôturées</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={S.implantSeances}>{seancesRatio}</span>
            {seancesPct !== null && (
              <span style={{ fontSize: 10, color: colors.text.muted }}>({seancesPct}%)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Note sur children_count

Vérifier si `ImplantationStats` contient déjà `children_count`. Si non, adapter la requête dans l'API ou omettre le badge (afficher le nombre de groupes à la place).

### Données groupes en parallèle

Si `listGroupsByImplantation` est déjà exporté de `@aureak/api-client`, appeler en parallèle :

```typescript
// Dans load(), après avoir récupéré statsResult :
const groupsMap: Record<string, { id: string; name: string }[]> = {}
await Promise.all(
  (statsResult.data ?? []).map(async (s) => {
    const { data } = await listGroupsByImplantation(s.implantation_id)
    groupsMap[s.implantation_id] = (data ?? []).map(g => ({ id: g.id, name: g.name }))
  })
)
setImplantationGroups(groupsMap)
```

## File List

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — enrichissement `ImplantationCard`, état `implantationGroups`
