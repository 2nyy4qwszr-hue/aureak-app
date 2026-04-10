# Story 67.1 : Design — Dashboard refonte layout 3 colonnes (référence dashboard-redesign.png)

Status: done

## Story

En tant qu'admin,
je veux un dashboard organisé en 3 colonnes (La Journée / L'Académie / Performance) qui correspond à la référence visuelle `_bmad-output/design-references/dashboard-redesign.png`,
afin d'avoir un centre de commandement lisible et premium avec les vraies données de l'application.

## Acceptance Criteria

1. **Layout 3 colonnes** : le dashboard affiche 3 colonnes côte à côte (proportions ~1fr / 2fr / 1fr) remplaçant les 3 zones verticales actuelles (Briefing / KPIs / Gamification)
2. **Colonne gauche — LA JOURNÉE** : affiche les séances du jour sous forme de cards avec horaire, nom du groupe, avatar(s) coach, badge statut coloré — données depuis `listNextSessionForDashboard()`. Si aucune séance aujourd'hui : empty state "Aucune séance prévue aujourd'hui"
3. **Colonne milieu — L'ACADÉMIE** : 4 blocs empilés :
   - Ligne stats : Joueurs / Coachs / Groupes / Sites (nombres depuis `getDashboardKpiCounts()` + `listImplantations().length`)
   - "Activité 4 semaines" : 2 barres de progression (Présence + Maîtrise) depuis données KPI existantes
   - "Séances Clôturées" : ratio nombre/total avec barre gold depuis `getDashboardKpiCounts()`
   - "Performance Sites" : table légère Implantation / Séances / Présence% / Maîtrise% depuis `getImplantationStats()` pour chaque implantation
4. **Colonne droite — PERFORMANCE** : 3 blocs empilés :
   - "Classement XP Top 5" : liste avec avatar initiales + nom + score XP depuis `getXPLeaderboard()`
   - "SCORE ACADÉMIE" : jauge ronde avec score et niveau depuis `getAcademyScore()`
   - "Quêtes actives" (optionnel si API disponible) : sinon remplacé par le countdown prochaine séance
5. **Bloc Urgences & Anomalies** : section en bas de la colonne gauche avec les alertes critiques/warnings colorées depuis `listAnomalies()` — max 3 items, lien "Voir toutes les anomalies →"
6. **Suppression composants obsolètes** : `BriefingDuJour` (date card + implantations grid) n'est plus rendu dans ce layout — remplacé par La Journée. Les composants `PlayerOfWeekTile`, `SeasonTrophy`, gamification Zone 3 sont retirés du rendu principal (peuvent rester dans le code)
7. **Style tokens uniquement** : zéro couleur hardcodée, tout via `colors.*`, `shadows.*`, `radius.*`, `space.*`
8. **Données réelles** : les chiffres affichés viennent de l'application — ne pas mettre de valeurs mockées
9. **Skeleton mis à jour** : `DashboardSkeleton` adapté au nouveau layout 3 colonnes

## Tasks / Subtasks

- [x] T1 — Restructurer le layout page en 3 colonnes (AC: 1)
  - [x] T1.1 — Dans `dashboard/page.tsx`, remplacer le layout vertical 3 zones par un `div` flex-row avec 3 colonnes : `{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'flex-start' }`
  - [x] T1.2 — Colonne gauche : `{ width: 260, flexShrink: 0 }`
  - [x] T1.3 — Colonne milieu : `{ flex: 1 }`
  - [x] T1.4 — Colonne droite : `{ width: 240, flexShrink: 0 }`
  - [x] T1.5 — Responsive : en dessous de 1100px → 2 colonnes (gauche + milieu) ; en dessous de 768px → 1 colonne

- [x] T2 — Colonne gauche : LA JOURNÉE + Urgences (AC: 2, 5)
  - [x] T2.1 — Label section "LA JOURNÉE" en uppercase, 10px, `colors.text.subtle`, letter-spacing 1.5px
  - [x] T2.2 — Créer composant `JourneeCard` inline : horaire (HH:MM), nom groupe (fontWeight 600), badge statut coloré
  - [x] T2.3 — Mapper `listNextSessionForDashboard()` data → afficher la prochaine séance avec badge "Aujourd'hui" ou "À venir"
  - [x] T2.4 — Sous les cards séances : label "URGENCES & ANOMALIES" + max 3 anomalies depuis `listAnomalies()` avec badge coloré `SEV_COLOR` existant
  - [x] T2.5 — Lien "Voir toutes les anomalies →" en `colors.accent.gold`, fontSize 12

- [x] T3 — Colonne milieu : L'ACADÉMIE (AC: 3)
  - [x] T3.1 — Label section "L'ACADÉMIE"
  - [x] T3.2 — Ligne stats 4 chiffres : Joueurs / Coachs / Groupes / Sites — valeurs `getDashboardKpiCounts()` — layout flex-row 4 blocs égaux
  - [x] T3.3 — Card "Activité 4 semaines" : 2 barres label + % + barre colorée (présence: `rateColor()`, maîtrise: `colors.accent.gold`)
  - [x] T3.4 — Card "Séances Clôturées X / Y" : barre gold fill selon ratio
  - [x] T3.5 — Card "Performance Sites" : table 4 colonnes (Implantation | Séances | Présence | Maîtrise) — lignes depuis `getImplantationStats()` pour chaque implantation, colorées via `rateColor()`

- [x] T4 — Colonne droite : PERFORMANCE (AC: 4)
  - [x] T4.1 — Label section "PERFORMANCE"
  - [x] T4.2 — Card "Classement XP Top 5" : liste 5 entrées avec avatar initiales (cercle 28px), displayName, score XP — données `getXPLeaderboard()`
  - [x] T4.3 — Card "SCORE ACADÉMIE" : `AcademyScoreTile` existant réutilisé — données `getAcademyScore()`

- [x] T5 — Mise à jour skeleton + cleanup (AC: 6, 9)
  - [x] T5.1 — `DashboardSkeleton` : remplacer les 3 zones verticales par squelettes 3 colonnes
  - [x] T5.2 — Supprimer le rendu de `<BriefingDuJour />` du JSX principal (remplacé par La Journée). `PlayerOfWeekTile`, `SeasonTrophy`, `StreakTile` retirés du rendu principal
  - [x] T5.3 — Conserver toutes les fonctions API et hooks existants (états conservés)

- [x] T6 — Validation (AC: tous)
  - [x] T6.1 — TypeScript compile sans erreur (`npx tsc --noEmit` = 0 erreurs)
  - [x] T6.2 — "LA JOURNÉE" affiche prochaine séance avec horaire, lieu, badge statut
  - [x] T6.3 — "L'ACADÉMIE" affiche stats 4 chiffres, barres activité, séances clôturées, table sites
  - [x] T6.4 — "PERFORMANCE" affiche classement XP Top 5 + Score Académie
  - [x] T6.5 — Zéro couleur hardcodée dans les nouveaux styles (grep validé)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise **HTML/JSX natif** (pas React Native View) dans `dashboard/page.tsx` — le fichier utilise déjà des `<div>`, `<style>`, CSS grid/flex. Continuer dans ce même pattern.

- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T2 — Layout colonne gauche (pattern card séance)

```tsx
// Card séance du jour
<div style={{
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  padding        : '12px 14px',
  marginBottom   : 8,
  boxShadow      : shadows.sm,
  borderLeft     : `3px solid ${statusColor}`,
}}>
  <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent.gold }}>
    {formatTime(session.scheduledAt)}
  </div>
  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark, marginTop: 2 }}>
    {session.groupName}
  </div>
  {/* Coach avatars + status badge */}
</div>
```

---

### T3 — Ligne stats 4 chiffres (pattern)

```tsx
// Stat inline avec label
<div style={{ textAlign: 'center', flex: 1 }}>
  <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent.gold, fontFamily: 'Montserrat' }}>
    {count}
  </div>
  <div style={{ fontSize: 11, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
    {label}
  </div>
</div>
```

---

### T3.5 — Table Performance Sites (pattern)

```tsx
// Ligne table légère
<div style={{
  display: 'grid', gridTemplateColumns: '1fr 40px 52px 52px',
  padding: '8px 0', borderBottom: `1px solid ${colors.border.divider}`,
  alignItems: 'center',
}}>
  <span style={{ fontSize: 12, color: colors.text.dark }}>{impl.name}</span>
  <span style={{ fontSize: 12, color: colors.text.muted, textAlign: 'center' }}>{impl.sessionsCount}</span>
  <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(impl.presenceRate), textAlign: 'right' }}>
    {impl.presenceRate}%
  </span>
  <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(impl.masteryRate), textAlign: 'right' }}>
    {impl.masteryRate}%
  </span>
</div>
```

---

### APIs déjà disponibles dans le fichier

| Donnée | Fonction API |
|--------|-------------|
| Séances du jour | `listNextSessionForDashboard()` |
| Joueurs / Coachs / Groupes | `getDashboardKpiCounts()` |
| Stats implantations | `getImplantationStats(implId)` |
| Liste implantations | `listImplantations()` |
| Anomalies | `listAnomalies()` |
| Classement XP | `getXPLeaderboard()` |
| Score académie | `getAcademyScore()` |

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Restructuration layout — seul fichier concerné |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/` — aucune modification API nécessaire
- `supabase/migrations/` — aucune migration
- `aureak/packages/theme/` — tokens inchangés
- `aureak/apps/web/app/(admin)/activites/` — non concerné

---

### Référence visuelle

Fichier : `_bmad-output/design-references/dashboard-redesign.png`

Structure cible (gauche → droite) :
- Col 1 (260px) : label "LA JOURNÉE" + cards séances + label "URGENCES & ANOMALIES" + liste alertes
- Col 2 (flex 1) : label "L'ACADÉMIE" + ligne stats + card Activité 4sem + card Séances clôturées + table Performance Sites + section Prochains événements
- Col 3 (240px) : label "PERFORMANCE" + card Classement XP + card Score Académie

---

### Multi-tenant

RLS gère l'isolation. Aucun paramètre `tenantId` à ajouter — les fonctions API existantes le gèrent déjà.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `UpcomingSessionRow` n'a pas de champ `coachName` → supprimé de la JourneeCard (avatar coach non disponible côté API)

### Completion Notes List
- Layout 3 colonnes implémenté en HTML/div natif, tokens @aureak/theme uniquement
- Skeleton adapté aux 3 colonnes
- CSS responsive via classe `.dashboard-3col` : 1100px → col droite en bas, 768px → 1 colonne
- Anciens composants BriefingDuJour, StreakTile, SeasonTrophyTileInner, PlayerOfWeekTile retirés du rendu visible (code conservé)
- 0 erreurs TypeScript

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifié |
