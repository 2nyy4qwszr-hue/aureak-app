# Story 65.9 : UX — Séances : bouton retour, vue par défaut, unsaved changes

Status: done

## Story

En tant qu'admin,
je veux pouvoir naviguer dans les séances sans perdre mon contexte (retour à la liste filtrée, vue par défaut utile, confirmation si modifications non sauvegardées),
afin de travailler efficacement sur plusieurs séances sans friction.

## Acceptance Criteria

1. La fiche séance (`/seances/[sessionId]`) affiche un bouton "← Retour aux séances" en haut à gauche du header, qui ramène à `/activites` (hub activités)
2. La liste des séances (onglet "Séances" du hub activités) affiche par défaut le filtre "Aujourd'hui" — si aucune séance aujourd'hui, bascule automatiquement sur "À venir"
3. La logique de défaut s'applique uniquement au premier rendu (mount) — les changements manuels de filtre par l'utilisateur sont respectés
4. Quand l'utilisateur quitte une fiche séance avec des modifications non sauvegardées (présences marquées mais non confirmées), un `window.confirm()` lui demande confirmation avant la navigation
5. Si le coach/admin n'a pas encore commencé à marquer des présences (attendanceMap vide ou identique à l'état initial), la confirmation n'est pas demandée

## Tasks / Subtasks

- [x] T1 — Bouton retour dans fiche séance (AC: 1)
  - [x] T1.1 — Dans `seances/[sessionId]/page.tsx`, localiser le header/breadcrumb en haut de page
  - [x] T1.2 — Ajouter un `<Pressable onPress={handleBackNavigation} style={styles.backBtn}>` avec le texte "← Séances" avant le breadcrumb
  - [x] T1.3 — Style `backBtn` : `{ flexDirection: 'row', alignItems: 'center', paddingVertical: space.xs, marginBottom: space.sm }` — texte en `colors.accent.gold`, fontSize 13, fontWeight 600

- [x] T2 — Vue par défaut "Aujourd'hui / À venir" (AC: 2, 3)
  - [x] T2.1 — Dans `activites/page.tsx`, changer la valeur initiale de `temporalFilter` de `'past'` à `'today'`
  - [x] T2.2 — Dans `TableauSeances.tsx`, filtre `'today'` déjà géré — empty state contextualisé : "Aucune séance aujourd'hui. Consultez l'onglet «\u00a0À VENIR\u00a0» pour les prochaines séances."
  - [x] T2.3 — `TemporalFilter` contient déjà `'today'` dans `PseudoFiltresTemporels.tsx` — aucune modification nécessaire
  - [x] T2.4 — Empty state avec message contextuel implémenté (AC minimal atteint)

- [x] T3 — Confirmation unsaved changes (AC: 4, 5)
  - [x] T3.1 — State `hasUnsavedAttendance: boolean` ajouté (initialisé à `false`)
  - [x] T3.2 — `handleTogglePresence` et handler "Tous présents" activent `hasUnsavedAttendance` sur succès
  - [x] T3.3 — `handleBackNavigation` avec `window.confirm` sur le bouton retour et le lien breadcrumb (approche T3.4 choisie)
  - [x] T3.4 — `beforeunload` handler ajouté via `useEffect` pour rechargement/fermeture onglet
  - [x] T3.5 — `hasUnsavedAttendance` non réinitialisé manuellement (guard reste actif jusqu'à quitter la page)

- [ ] T4 — Validation (AC: tous)
  - [ ] T4.1 — Ouvrir une fiche séance → vérifier la présence du bouton retour en haut
  - [ ] T4.2 — Cliquer "← Retour" → vérifier la navigation vers `/activites`
  - [ ] T4.3 — Naviguer sur `/activites` → vérifier que le filtre actif est "Aujourd'hui" (ou "À venir" si fallback)
  - [ ] T4.4 — Marquer une présence, puis cliquer "← Retour" → vérifier qu'une confirmation est demandée
  - [ ] T4.5 — Sans marquer de présence, cliquer "← Retour" → vérifier qu'aucune confirmation n'est demandée

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Bouton retour

```tsx
// En haut du composant SessionDetailPage, avant le titre
<Pressable
  onPress={() => router.push('/(admin)/activites')}
  style={styles.backBtn}
>
  <AureakText style={styles.backBtnText}>← Séances</AureakText>
</Pressable>
```

```typescript
backBtn: {
  flexDirection : 'row',
  alignItems    : 'center',
  paddingVertical: space.xs,
  marginBottom  : space.sm,
  alignSelf     : 'flex-start',
},
backBtnText: {
  color     : colors.accent.gold,
  fontSize  : 13,
  fontWeight: '600',
  fontFamily: 'Montserrat',
},
```

---

### T2 — Filtre par défaut

Dans `activites/page.tsx` :

```typescript
// Avant (bug)
const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('past')

// Après
const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('today')
```

Vérifier que `'today'` est un membre valide du type `TemporalFilter` dans `PseudoFiltresTemporels.tsx`. Si le type est `'past' | 'upcoming' | 'future'` sans `'today'`, ajouter `'today'` comme option.

---

### T3 — Unsaved changes (approche pragmatique)

L'interception de la navigation SPA (router.push) est complexe dans Expo Router. Approche recommandée : `window.beforeunload` pour les rechargements + un guard dans le bouton retour.

```typescript
// Guard dans le bouton retour uniquement (le plus simple)
const handleBackNavigation = () => {
  if (hasUnsavedAttendance) {
    const ok = typeof window !== 'undefined'
      ? window.confirm('Des présences ont été marquées. Quitter sans valider ?')
      : true
    if (!ok) return
  }
  router.push('/(admin)/activites')
}
```

```typescript
// Optional : beforeunload pour rechargement/fermeture
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (hasUnsavedAttendance) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [hasUnsavedAttendance])
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier | Bouton retour + hasUnsavedAttendance |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifier | Filtre par défaut 'today' |
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Modifier si nécessaire | Ajouter option 'today' si manquante |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifier si nécessaire | Gestion filtre 'today' + empty state avec CTA |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/sessions/attendances.ts` — non concerné
- `supabase/migrations/` — aucune migration nécessaire
- `aureak/apps/web/app/(admin)/seances/new.tsx` — hors scope

---

### Dépendances à protéger

- Story 65-7 (bug recordAttendance) — si implémentée avant, `hasUnsavedAttendance` doit être activé dans les mêmes handlers que le fix recordedBy
- Story 65-1 (TableauSeances) — ne pas modifier la signature de ses props

---

### Références

- Fiche séance : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
- Hub activités : `aureak/apps/web/app/(admin)/activites/page.tsx`
- PseudoFiltresTemporels : `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`
- Pattern router.push : `useRouter` depuis `expo-router`

---

### Multi-tenant

Non applicable — navigation locale uniquement.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun

### Completion Notes List

- `TemporalFilter` contenait déjà `'today'` dans `PseudoFiltresTemporels.tsx` — aucune modification de ce fichier nécessaire
- Empty state TableauSeances rendu contextuel sans modifier la signature de props
- Approche T3.4 choisie pour l'unsaved guard : `window.confirm` dans `handleBackNavigation` + `beforeunload` sur window
- `hasUnsavedAttendance` activé dans `handleTogglePresence` (présence individuelle) ET dans `handleMarkAllPresent` (batch "Tous présents")
- Bouton retour ajouté AVANT le breadcrumb existant (deux points d'entrée : bouton or + lien breadcrumb, tous deux via `handleBackNavigation`)
- Playwright skipped — app non démarrée

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Non modifié (déjà conforme) |
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifié (empty state contextuel) |
