# Story 70.1 : Design — Dashboard topbar bandeau plat + prochaine séance du soir

Status: done

## Story

En tant qu'admin,
je veux que la topbar du dashboard soit un bandeau plat intégré (sans card flottante) affichant date, heure, météo et la prochaine séance du soir,
afin que le haut de la page ressemble exactement à la référence `dashboard-redesign.png`.

## Acceptance Criteria

1. La `DashboardTopBar` n'a plus de `borderRadius`, `boxShadow`, ni `border` — c'est un bandeau plat avec juste un `borderBottom: 1px solid colors.border.divider`
2. La topbar a un fond `colors.light.primary` (beige — identique au fond de la page) pour s'y intégrer naturellement, sans se démarquer comme une card
3. Si une séance est prévue aujourd'hui (`upcomingSession !== null`), la topbar affiche après la météo : séparateur `|` + heure (`16h00`) + nom du groupe (`Elite U19`), en `colors.text.dark`
4. Si aucune séance n'est prévue, la topbar affiche seulement date | heure | météo | dot statut — pas de texte "Aucune séance"
5. Le dot de statut (vert/rouge) reste en place à droite du bloc météo+séance, avant les alertes
6. La section alertes droite (SÉANCES NON CLÔTURÉES + cloche) reste identique au comportement actuel
7. Le padding de la topbar est réduit à `'8px 0'` (pas de padding horizontal puisque intégré au `S.container` qui a déjà `padding: '28px 32px'`)
8. TypeScript compile sans erreur (`npx tsc --noEmit`)

## Tasks / Subtasks

- [x] T1 — Modifier le style wrapper de `DashboardTopBar` (AC: 1, 2, 7)
  - [x] T1.1 — Dans `DashboardTopBar` (ligne ~1288), remplacer le style du div wrapper : supprimer `borderRadius`, `boxShadow`, `border`. Remplacer `backgroundColor: colors.light.surface` par `colors.light.primary`. Changer `border` en `borderBottom: \`1px solid ${colors.border.divider}\``. Remplacer `padding: '10px 20px'` par `padding: '8px 0'`. Supprimer `marginBottom: 20` (laisser uniquement le gap du layout).

- [x] T2 — Intégrer les infos de la prochaine séance dans la topbar (AC: 3, 4, 5)
  - [x] T2.1 — Passer `upcomingSession` et `loadingUpcoming` en props de `DashboardTopBar` : `upcomingSession: UpcomingSessionRow | null`, `loadingUpcoming: boolean`
  - [x] T2.2 — Dans le bloc gauche de la topbar (après la météo), ajouter conditionnellement : si `!loadingUpcoming && upcomingSession !== null`, afficher `|` + heure (`HH:MM`) + `•` + `upcomingSession.groupName`. Fonction de formatage inline : `const fmtHM = (iso: string) => new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })`
  - [x] T2.3 — Dans le JSX principal (`DashboardPage`), passer les props : `<DashboardTopBar pendingSessions={pendingSessions} upcomingSession={upcomingSession} loadingUpcoming={loadingUpcoming} />`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [ ] T3.2 — Naviguer sur `/dashboard` : la topbar est visuellement fondue dans le fond beige (pas de card flottante visible)
  - [ ] T3.3 — Si une séance existe : vérifier que `16h00 • Elite U19` (ou équivalent) s'affiche dans la topbar

## Dev Notes

### ⚠️ Contraintes Stack

Ce fichier `dashboard/page.tsx` utilise **HTML/JSX natif** (div, style inline) — pas React Native View.

- **Tokens `@aureak/theme`** : `colors`, `shadows`, `radius`, `transitions`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

---

### T1 — Style topbar cible

```tsx
// Wrapper DashboardTopBar — AVANT
<div style={{
  display        : 'flex',
  alignItems     : 'center',
  justifyContent : 'space-between',
  backgroundColor: colors.light.surface,
  border         : `1px solid ${colors.border.divider}`,
  borderRadius   : radius.card,
  padding        : '10px 20px',
  marginBottom   : 20,
  boxShadow      : shadows.sm,
}}>

// Wrapper DashboardTopBar — APRÈS
<div style={{
  display        : 'flex',
  alignItems     : 'center',
  justifyContent : 'space-between',
  backgroundColor: colors.light.primary,
  borderBottom   : `1px solid ${colors.border.divider}`,
  padding        : '8px 0',
  marginBottom   : 20,
}}>
```

---

### T2 — Affichage prochaine séance

```tsx
// Après le bloc météo, dans le div gauche de DashboardTopBar
{!loadingUpcoming && upcomingSession && (
  <>
    <span style={{ color: colors.border.light, fontSize: 14 }}>|</span>
    <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, fontWeight: 700, color: colors.text.dark }}>
      {fmtHM(upcomingSession.scheduledAt)}
    </span>
    <span style={{ fontSize: 12, color: colors.text.muted, fontFamily: 'Geist, sans-serif' }}>
      {upcomingSession.groupName}
    </span>
  </>
)}
```

---

### Design

Principe 1 — Fond clair : `colors.light.primary` = `#F3EFE7`, identique au fond de page.
Référence : `_bmad-output/design-references/dashboard-redesign.png` — ligne du haut sans fond de card distinct.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Style topbar + props upcomingSession |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/` — aucun changement API
- `supabase/migrations/` — aucune migration
- `aureak/packages/theme/` — tokens inchangés

---

### Références

- `DashboardTopBar` : `dashboard/page.tsx` ligne ~1263
- `upcomingSession` state : `dashboard/page.tsx` ligne ~2017
- `UpcomingSessionRow` type : `@aureak/api-client`
- Design ref : `_bmad-output/design-references/dashboard-redesign.png`

---

### Multi-tenant

RLS gère l'isolation. Aucun paramètre `tenantId` à ajouter.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
