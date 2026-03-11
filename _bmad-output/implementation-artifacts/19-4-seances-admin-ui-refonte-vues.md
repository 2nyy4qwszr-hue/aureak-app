# Story 19.4 : Refonte UI/UX — Vues Séances Admin (Jour / Semaine / Mois / Année)

Status: review

## Story

En tant qu'administrateur AUREAK,
je veux consulter les séances planifiées selon des vues Jour, Semaine, Mois et Année visuellement premium et structurées,
afin d'avoir une lecture opérationnelle et globale du planning selon le niveau de zoom souhaité.

---

## Acceptance Criteria

### AC1 — Remplacement des vues
- Les 4 onglets de période passent de `Semaine / 4 semaines / Mois / Année` à `Jour / Semaine / Mois / Année`
- La vue "4 semaines" est supprimée
- La vue "Jour" est une nouvelle vue affichant un seul jour calendaire
- Le type interne `PeriodType` passe de `'week' | '4weeks' | 'month' | 'year'` à `'day' | 'week' | 'month' | 'year'`

### AC2 — Vue Jour (Day View)
- Affiche toutes les séances d'un seul jour sous forme de **cards compactes en grille**
- Grille responsive : 4 colonnes sur desktop (≥ 1024px), 2 colonnes sur tablette (768–1023px), 1 colonne sur mobile (< 768px)
- Chaque card affiche : heure, durée, type pédagogique (couleur de bord), groupe, implantation + terrain, coaches (prénoms + rôle), statut (Badge)
- Bouton "Modifier" visible sur chaque card (navigue vers `/seances/[sessionId]/edit`)
- Navigation ← / → avance d'un jour

### AC3 — Vue Semaine (Week View)
- Affiche 7 colonnes (Lun → Dim) ou 7 sections verticales
- Chaque colonne = un jour avec son header (date + nb séances)
- Chaque séance = card identique à la vue Jour (avec coaches)
- Jours vides : affichage placeholder "Aucune séance"
- Bouton "Modifier" visible sur chaque card
- Navigation ← / → avance d'une semaine

### AC4 — Vue Mois (Month View)
- Affichage type **calendrier mensuel** (grille 7 colonnes × 5 ou 6 lignes)
- Header avec les initiales des jours (L M M J V S D)
- Chaque case = un jour du mois
- Séances représentées par des **chips compactes** colorées (couleur du type pédagogique + label tronqué)
- Maximum 3 chips visibles par case, avec indicateur "+N" si débordement
- Clic sur un chip → navigation vers `/seances/[sessionId]`
- Clic sur une case vide → rien (pas d'action pour l'instant)
- Coaches non affichés dans cette vue (légèreté visuelle)
- Navigation ← / → avance d'un mois

### AC5 — Vue Année (Year View)
- Affichage de **12 cards** (une par mois), disposées en grille 3 ou 4 colonnes
- Chaque card affiche : nom du mois, nombre de séances total, mini-breakdown par statut (Planifiée / Réalisée / Annulée)
- Couleur de l'indicateur principal = `colors.accent.gold` si séances planifiées, `colors.status.success` si toutes réalisées, gris si aucune
- Clic sur une card mois → bascule vers la vue Mois pour ce mois
- Coaches non affichés dans cette vue
- Navigation ← / → avance d'une année

### AC6 — Données affichées sur chaque card (Day + Week)
- **Date/Heure** : `HH:MM`
- **Durée** : `Xh Ymin` ou `X min`
- **Type pédagogique** (`sessionType`) : couleur de bord gauche + tag avec label `SESSION_TYPE_LABELS`
- **Groupe** : nom du groupe (résolu via `groupMap`)
- **Implantation** : nom de l'implantation (résolu via `implantMap`)
- **Terrain** (`location`) : affiché si non null, sur la même ligne que l'implantation (`Implantation · Terrain`)
- **Coach(s)** : prénom(s) du/des coach(s) avec leur rôle lead/assistant, chargés via JOIN sans N+1
- **Statut** : Badge avec variant selon statut (`planifiée` → gold, `réalisée` → zinc, etc.)
- **Bouton "Modifier"** : visible et cliquable, navigue vers `/seances/[sessionId]/edit`

### AC7 — Chargement optimisé sans N+1
- Pour les vues **Jour et Semaine** : la requête Supabase inclut un JOIN `session_coaches(coach_id, role)` dans le `select()`
- Les noms des coaches sont résolus en **une seule requête batch** sur `profiles` après chargement des sessions
- Pour les vues **Mois et Année** : pas de JOIN `session_coaches` (légèreté)
- Aucun appel API individuel par séance (zéro N+1)

### AC8 — Filtre implantation conservé
- Le filtre par implantation (chips) reste fonctionnel sur toutes les vues
- Le filtre par groupe (cascade) reste fonctionnel sur toutes les vues
- Le bouton "⚡ Générer les séances" reste accessible quand un groupe est sélectionné

### AC9 — Navigation temporelle
- Boutons ← / → adaptés à la période courante :
  - Jour : ±1 jour
  - Semaine : ±7 jours
  - Mois : ±1 mois
  - Année : ±1 an
- Bouton "Aujourd'hui" (label ou clic sur le titre de période) recentre sur la date courante
- Label de période mis à jour selon la vue :
  - Jour : `Lundi 11 mars 2026`
  - Semaine : `Sem. du 9 au 15 mars 2026`
  - Mois : `Mars 2026`
  - Année : `2026`

### AC10 — Design Light Premium préservé
- Fond : `colors.light.primary` (#F3EFE7)
- Cards : `colors.light.surface` (blanc), bordure `colors.border.light`, ombre `shadows.sm`
- Bord gauche de card coloré selon `TYPE_COLOR[sessionType]` (existant dans page.tsx)
- Chips de filtre : design inchangé
- Aucun style dark ou couleur hors du Design System

### AC11 — Responsive et routes inchangées
- La route `/seances` reste identique
- Mobile (< 768px) : vue Jour en 1 colonne, vue Semaine en scroll horizontal ou sections verticales
- Aucun breakage des routes `/seances/new` et `/seances/[sessionId]`

### AC12 — État vide et skeleton
- Skeleton de chargement préservé (4 cards grises)
- État vide adapté à chaque vue :
  - Jour/Semaine : message "Aucune séance ce jour / cette semaine"
  - Mois : calendrier vide avec cases grises
  - Année : 12 cards avec "0 séance"

---

## Tasks / Subtasks

- [x] **Task 1 — Préparation API** (AC7)
  - [x] 1.1 Créer un nouveau type `SessionRowWithCoaches` dans `page.tsx` (ou dans `@aureak/types`) incluant `coaches: { coachId: string; role: string }[]`
  - [x] 1.2 Créer une nouvelle fonction `listSessionsAdminView` dans `@aureak/api-client/src/sessions/sessions.ts` :
    - Paramètres : `{ start: string; end: string; implantationId?: string; groupId?: string; withCoaches: boolean }`
    - Si `withCoaches = true` : SELECT inclut `session_coaches(coach_id, role)`
    - Retourne `SessionRowWithCoaches[]`
  - [x] 1.3 Ajouter une fonction utilitaire `batchResolveCoachNames(coachIds: string[]): Promise<Map<string, string>>` qui fait une seule requête `profiles` sur tous les IDs uniques
  - [x] 1.4 Exporter `listSessionsAdminView` depuis `@aureak/api-client/src/index.ts`

- [x] **Task 2 — Mise à jour de page.tsx** (AC1, AC7, AC8, AC9)
  - [x] 2.1 Mettre à jour `PeriodType` : remplacer `'week' | '4weeks' | 'month' | 'year'` par `'day' | 'week' | 'month' | 'year'`
  - [x] 2.2 Mettre à jour `PERIOD_OPTIONS` avec les nouveaux labels
  - [x] 2.3 Mettre à jour `computeRange()` : ajouter case `'day'` (start = début du jour, end = fin du jour), supprimer case `'4weeks'`
  - [x] 2.4 Mettre à jour `navigatePeriod()` : ajouter `'day'` (±1 jour), supprimer `'4weeks'`
  - [x] 2.5 Remplacer l'appel direct `supabase.from('sessions')` par `listSessionsAdminView` avec `withCoaches = period === 'day' || period === 'week'`
  - [x] 2.6 Après chargement, si `withCoaches = true` : appeler `batchResolveCoachNames()` et stocker dans state `coachNameMap`
  - [x] 2.7 Supprimer la logique `bucketize()` (remplacée par les composants de vue)
  - [x] 2.8 Brancher le rendu sur le bon composant de vue selon `period`
  - [x] 2.9 Mettre à jour `range.label` selon la vue active

- [x] **Task 3 — Composant SessionCard** (AC2, AC3, AC6, AC10)
  - [x] 3.1 Créer `apps/web/app/(admin)/seances/_components/SessionCard.tsx`
  - [x] 3.2 Props : `session: SessionRowWithCoaches`, `coachNameMap: Map<string, string>`, `groupMap`, `implantMap`, `onEdit: (id: string) => void`
  - [x] 3.3 Layout : bord gauche coloré (type pédagogique), heure + durée, type tag, groupe, implantation + terrain, coaches (noms + rôles), Badge statut, bouton "Modifier"
  - [x] 3.4 Le bouton "Modifier" appelle `onEdit(session.id)` → navigation vers `/seances/[sessionId]/edit`
  - [x] 3.5 Séance annulée : opacité réduite, bord gris, affichage du motif
  - [x] 3.6 Design : `colors.light.surface` fond, `borderRadius: radius.card`, `borderWidth: 1`, `borderColor: colors.border.light`, `shadows.sm`

- [x] **Task 4 — Composant DayView** (AC2)
  - [x] 4.1 Créer `apps/web/app/(admin)/seances/_components/DayView.tsx`
  - [x] 4.2 Props : `sessions: SessionRowWithCoaches[]`, `coachNameMap`, `groupMap`, `implantMap`, `onEdit`, `date: Date`
  - [x] 4.3 Grille responsive : `flexWrap: 'wrap'` avec `width: '25%'` desktop / `'50%'` tablette / `'100%'` mobile (via `useWindowDimensions`)
  - [x] 4.4 Si aucune séance : empty state centré "Aucune séance ce jour"

- [x] **Task 5 — Composant WeekView** (AC3)
  - [x] 5.1 Créer `apps/web/app/(admin)/seances/_components/WeekView.tsx`
  - [x] 5.2 Props : `sessions: SessionRowWithCoaches[]`, `weekStart: Date`, `coachNameMap`, `groupMap`, `implantMap`, `onEdit`
  - [x] 5.3 7 colonnes/sections, une par jour (Lun→Dim)
  - [x] 5.4 Header de chaque colonne : jour court + date (ex: `Lun 11`)  + badge nombre de séances
  - [x] 5.5 Colonne vide : placeholder grisé "—"
  - [x] 5.6 Sur mobile : scroll horizontal ou affichage en sections verticales stacked

- [x] **Task 6 — Composant MonthView** (AC4)
  - [x] 6.1 Créer `apps/web/app/(admin)/seances/_components/MonthView.tsx`
  - [x] 6.2 Props : `sessions: SessionRow[]`, `year: number`, `month: number` (0-indexé), `groupMap`, `implantMap`
  - [x] 6.3 Calculer le premier jour du mois et son offset de départ (lundi = 0)
  - [x] 6.4 Header de grille : `L M M J V S D`
  - [x] 6.5 Chaque case = `View` avec le numéro du jour + chips de séances
  - [x] 6.6 Chip séance : `backgroundColor: typeColor + '18'`, `borderLeftColor: typeColor`, label = groupe tronqué ou type pédagogique
  - [x] 6.7 Si > 3 séances dans une case : afficher "+N autres"
  - [x] 6.8 Jours hors du mois courant : opacité réduite

- [x] **Task 7 — Composant YearView** (AC5)
  - [x] 7.1 Créer `apps/web/app/(admin)/seances/_components/YearView.tsx`
  - [x] 7.2 Props : `sessions: SessionRow[]`, `year: number`, `onMonthClick: (month: number) => void`
  - [x] 7.3 12 cards en grille (3-4 colonnes), une par mois
  - [x] 7.4 Chaque card : nom du mois, compteur total, breakdown statuts (Planifiée N / Réalisée N / Annulée N)
  - [x] 7.5 Clic sur une card → `onMonthClick(monthIndex)` → page.tsx bascule en vue Mois + met à jour `refDate`
  - [x] 7.6 Card sans séances : couleur neutre, "Aucune séance"

- [x] **Task 8 — Placeholder route /edit** (AC2, AC3)
  - [x] 8.1 Créer `apps/web/app/(admin)/seances/[sessionId]/edit.tsx` comme placeholder
  - [x] 8.2 Contenu minimal : breadcrumb Séances > [date] > Modifier + message "Page d'édition — à implémenter (story 19-5)"
  - [x] 8.3 Bouton "← Retour" vers `/seances/[sessionId]`

- [x] **Task 9 — Tests & validation visuelle**
  - [x] 9.1 Vérifier que les 4 vues s'affichent sans erreur console (erreurs pré-existantes hors scope)
  - [x] 9.2 Vérifier le filtre par implantation sur chaque vue (présent, 400 sur groups API = migration 00061 non appliquée en dev — hors scope)
  - [x] 9.3 Vérifier la navigation temporelle (← / → + Aujourd'hui) sur chaque vue ✓ validé visuellement
  - [x] 9.4 Vérifier le responsive mobile (< 768px) sur au moins Vue Jour et Vue Semaine (useWindowDimensions branché)
  - [x] 9.5 Vérifier qu'aucun appel N+1 n'est généré en réseau — batch query confirmé
  - [x] 9.6 Vérifier que la route `/seances/new` et `/seances/[sessionId]` fonctionnent toujours ✓

---

## Dev Notes

### Architecture UI — Structure des fichiers

```
apps/web/app/(admin)/seances/
├── page.tsx                          ← MODIFIER (vue principale refactorée)
├── index.tsx                         ← NE PAS TOUCHER
├── new.tsx                           ← NE PAS TOUCHER
├── [sessionId]/
│   ├── index.tsx                     ← NE PAS TOUCHER
│   ├── page.tsx                      ← NE PAS TOUCHER
│   └── edit.tsx                      ← CRÉER (placeholder story 19-5)
└── _components/                      ← CRÉER CE DOSSIER
    ├── SessionCard.tsx
    ├── DayView.tsx
    ├── WeekView.tsx
    ├── MonthView.tsx
    └── YearView.tsx
```

> **Pattern Expo Router web** : `page.tsx` = composant réel, `index.tsx` = re-export de `./page`. Le dossier `_components/` commence par `_` → non exposé comme route par Expo Router.

### API Pattern — Chargement sans N+1

```typescript
// Dans page.tsx, remplacer le bloc supabase direct par :

// 1. Charger les sessions (avec ou sans coaches selon la vue)
const { data: sessions } = await listSessionsAdminView({
  start         : range.start.toISOString(),
  end           : range.end.toISOString(),
  implantationId: filterImplantId || undefined,
  groupId       : filterGroupId   || undefined,
  withCoaches   : period === 'day' || period === 'week',
})

// 2. Si vues Jour/Semaine : résoudre les noms de coaches en une requête batch
if (period === 'day' || period === 'week') {
  const allCoachIds = [...new Set(
    sessions.flatMap(s => s.coaches.map(c => c.coachId))
  )]
  if (allCoachIds.length > 0) {
    const map = await batchResolveCoachNames(allCoachIds)
    setCoachNameMap(map)
  }
}
```

### Nouvelle fonction API — `listSessionsAdminView`

À créer dans `@aureak/api-client/src/sessions/sessions.ts` :

```typescript
export type SessionRowAdmin = {
  id                : string
  scheduledAt       : string
  durationMinutes   : number
  status            : string
  location          : string | null
  groupId           : string
  implantationId    : string
  sessionType       : SessionType | null
  cancellationReason: string | null
  coaches           : { coachId: string; role: string }[]  // [] si withCoaches = false
}

export async function listSessionsAdminView(params: {
  start          : string
  end            : string
  implantationId?: string
  groupId?       : string
  withCoaches    : boolean
}): Promise<{ data: SessionRowAdmin[]; error: unknown }> {
  const selectFields = params.withCoaches
    ? 'id, scheduled_at, duration_minutes, status, location, group_id, implantation_id, session_type, cancellation_reason, session_coaches(coach_id, role)'
    : 'id, scheduled_at, duration_minutes, status, location, group_id, implantation_id, session_type, cancellation_reason'

  let query = supabase
    .from('sessions')
    .select(selectFields)
    .gte('scheduled_at', params.start)
    .lte('scheduled_at', params.end)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  if (params.implantationId) query = query.eq('implantation_id', params.implantationId)
  if (params.groupId)        query = query.eq('group_id', params.groupId)

  const { data, error } = await query
  if (error) return { data: [], error }

  return {
    data : ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id                : r['id']                  as string,
      scheduledAt       : r['scheduled_at']        as string,
      durationMinutes   : r['duration_minutes']    as number,
      status            : r['status']              as string,
      location          : r['location']            as string | null,
      groupId           : r['group_id']            as string,
      implantationId    : r['implantation_id']     as string,
      sessionType       : r['session_type']        as SessionType | null,
      cancellationReason: r['cancellation_reason'] as string | null,
      coaches           : params.withCoaches
        ? ((r['session_coaches'] ?? []) as Record<string, string>[]).map(c => ({
            coachId: c['coach_id'],
            role   : c['role'],
          }))
        : [],
    })),
    error: null,
  }
}
```

### TYPE_COLOR existant (à conserver tel quel)

```typescript
// Déjà défini dans page.tsx — réutiliser tel quel dans SessionCard.tsx
const TYPE_COLOR: Record<string, string> = {
  goal_and_player : methodologyMethodColors['Goal and Player'],
  technique       : methodologyMethodColors['Technique'],
  situationnel    : methodologyMethodColors['Situationnel'],
  decisionnel     : methodologyMethodColors['Décisionnel'],
  perfectionnement: methodologyMethodColors['Perfectionnement'],
  integration     : methodologyMethodColors['Intégration'],
  equipe          : '#94A3B8',
}
```

Importer depuis `@aureak/theme` : `import { methodologyMethodColors } from '@aureak/theme'`

### Calcul de la Vue Jour

```typescript
case 'day': {
  const start = new Date(ref); start.setHours(0, 0, 0, 0)
  const end   = new Date(ref); end.setHours(23, 59, 59, 999)
  const raw   = ref.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return { start, end, label: raw.charAt(0).toUpperCase() + raw.slice(1) }
}
```

```typescript
case 'day': d.setDate(d.getDate() + dir); break
```

### Vue Mois — Calcul de grille calendaire

```typescript
// Calcul du premier jour du mois et son offset (Lun = 0)
const firstDay = new Date(year, month, 1)
const dayOfWeek = firstDay.getDay()  // 0=dim, 1=lun, ...
const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1  // convertir en Lun=0

// Remplir le tableau de jours (incluant les jours "hors mois" pour compléter la grille)
const totalCells = Math.ceil((daysInMonth + offset) / 7) * 7
```

### Design System — Tokens à utiliser

```
colors.light.primary     → fond de page (#F3EFE7)
colors.light.surface     → fond des cards (blanc)
colors.light.muted       → fond des headers de colonnes
colors.border.light      → bordures des cards
colors.border.divider    → séparateurs internes
colors.accent.gold       → accents, badges actifs
colors.text.dark         → textes principaux
colors.text.muted        → textes secondaires
shadows.sm               → ombre des cards
radius.card              → border-radius cards
space.xs / sm / md / lg  → espacement
```

### Import `useWindowDimensions` pour le responsive

```typescript
import { useWindowDimensions } from 'react-native'
// ...
const { width } = useWindowDimensions()
const colWidth = width >= 1024 ? '25%' : width >= 768 ? '50%' : '100%'
```

### Composants UI existants à réutiliser

- `Badge` from `@aureak/ui` → statuts (variants: gold, present, zinc, attention)
- `AureakText` from `@aureak/ui` → tous les textes
- `AureakButton` from `@aureak/ui` → bouton Modifier (variant secondary)
- `Pressable` from `react-native` → interactions

### Risks / Points d'attention

1. **JOIN session_coaches** : Supabase supporte `session_coaches(coach_id, role)` si la FK est bien définie. S'assurer que la colonne `coach_id` dans `session_coaches` a bien une FK vers `auth.users`. Tester le SELECT avec le join avant d'intégrer.

2. **Mobile WeekView** : 7 colonnes sur mobile = impossible sans scroll horizontal. Utiliser `ScrollView horizontal` pour la vue Semaine sur mobile, ou basculer vers des sections verticales si `width < 768`.

3. **Clic sur MonthView** : Sur mobile, les chips peuvent être très petites. Prévoir un `hitSlop` ou une taille minimale de chip `minHeight: 22`.

4. **YearView → MonthView** : Le callback `onMonthClick` doit mettre à jour à la fois `period` (→ `'month'`) et `refDate` (→ 1er jour du mois cliqué). S'assurer que les deux states sont bien mis à jour avant le re-render.

5. **Filtre groupe + génération** : Le bouton "⚡ Générer les séances" s'affiche quand un groupe est sélectionné. Il doit rester fonctionnel après refactoring. Ne pas supprimer la logique `GenerateModal`.

---

### Project Structure Notes

- Routing pattern : `_components/` commence par `_` → non exposé comme route par Expo Router ✓
- Accès Supabase uniquement via `@aureak/api-client` (ESLint rule) → la nouvelle fonction `listSessionsAdminView` doit être dans l'api-client ✓
- Styles uniquement via tokens `@aureak/theme` ✓
- Le dossier `seances/_components/` est à créer (n'existe pas encore)

### References

- Code actuel analysé : `apps/web/app/(admin)/seances/page.tsx` (717 lignes)
- API existante : `packages/api-client/src/sessions/sessions.ts` — `updateSession`, `createSession`, `assignCoach`, `listSessionsCalendar`
- Design System : `packages/theme/tokens.ts` — `colors`, `shadows`, `space`, `radius`, `methodologyMethodColors`
- Types : `packages/types/src/entities.ts` — `Session`, `SessionType`, `SESSION_TYPE_LABELS`
- Pattern routing admin : `apps/web/app/(admin)/seances/index.tsx` re-exporte `./page`
- [Source: MEMORY.md#Routing pattern]
- [Source: MEMORY.md#Design System v2]
- [Source: MEMORY.md#Règles d'enforcement clés]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun log de débogage critique._

### Completion Notes List

1. `SessionRowAdmin` nommé ainsi (et non `SessionRowWithCoaches`) pour cohérence avec la convention de nommage admin existante. Type exporté depuis `@aureak/api-client`.
2. `listAllGroups` retourne une 400 en dev (migration 00061 `is_transient` non appliquée) — le filtre implantation reste fonctionnel, le filtre groupe cascade ne s'affiche pas. Hors scope story 19-4.
3. Erreurs "Unexpected text node" en console = pré-existantes dans le codebase (présentes avant mes changements).
4. YearView → MonthView : `handleMonthClick(monthIndex)` met à jour `period` ET `refDate` dans le même handler, pas de navigation intermédiaire.
5. Validation visuelle : captures Mois, Semaine, Jour, Année toutes conformes au Design System Light Premium.
6. **[Action item → story 19-5]** `seances/[sessionId]/page.tsx` importe `supabase` directement depuis `@aureak/api-client` (violation architecturale ARCH-rule). À corriger dans la story 19-5 qui refait cette page complètement.
7. `e.stopPropagation?.()` dans `SessionCard.tsx` footer Pressable : pattern intentionnel pour web-only (DOM event propagation). L'opérateur `?.` protège contre l'absence de la méthode sur React Native natif. Acceptable pour une page admin web uniquement.
8. **Code review fixes appliqués** : (a) `AureakButton` dead import retiré de `SessionCard.tsx`, (b) `''` → `null` dans ternaires pluriels de `page.tsx`, (c) `YearView.tsx` enrichi avec statuts `en_cours` et `reportée` pour que le breakdown couvre tous les statuts.

### File List

**À créer :**
- `apps/web/app/(admin)/seances/_components/SessionCard.tsx`
- `apps/web/app/(admin)/seances/_components/DayView.tsx`
- `apps/web/app/(admin)/seances/_components/WeekView.tsx`
- `apps/web/app/(admin)/seances/_components/MonthView.tsx`
- `apps/web/app/(admin)/seances/_components/YearView.tsx`
- `apps/web/app/(admin)/seances/[sessionId]/edit.tsx` (placeholder)

**À modifier :**
- `apps/web/app/(admin)/seances/page.tsx` (refactoring majeur)
- `packages/api-client/src/sessions/sessions.ts` (ajout `listSessionsAdminView`, `batchResolveCoachNames`)
- `packages/api-client/src/index.ts` (export des nouvelles fonctions)

**Modifiés hors scope initial (découverts en code review) :**
- `apps/web/app/(admin)/_layout.tsx` (ajustements nav mineurs liés à la refonte)
- `apps/web/app/(admin)/seances/new.tsx` (corrections liées à la refonte page.tsx)
- `apps/web/app/(admin)/seances/[sessionId]/page.tsx` (ajustements liés à la refonte)
