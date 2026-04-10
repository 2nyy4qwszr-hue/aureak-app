# Story 47-8 — UX : Empty state + CTA contextuel pour types d'évènements non-stage dans evenements/page.tsx

**Epic** : 47 — Design/UX batch
**Status** : done
**Priority** : P1 — Dead-end UX bloquant
**Effort** : XS (1 fichier, logique de rendu)

---

## Contexte

Dans `evenements/page.tsx`, le flux actuel est cassé pour les types d'évènements non-stage (Tournoi, Fun Day, Detect Day, Séminaire) :

1. L'utilisateur clique **"+ Nouvel évènement"** → Modal `NewEventModal` s'ouvre
2. Il sélectionne **"Tournoi Goal à Goal"** et clique **"Continuer"**
3. `handleSelectEventType` appelle `setFilter('tournoi')` → route `/evenements?type=tournoi`
4. La page charge : `isStubType = true` → `stubBanner` affiché, **mais la liste est vide** et la condition `events.length === 0 && !isStubType` est `false` (bloquée par `!isStubType`)
5. **Résultat** : la liste vide n'est jamais rendue, le `stubBanner` seul occupe l'écran sans expliquer clairement l'état, et l'utilisateur est bloqué sans moyen évident de sortir ou de changer d'action

Le `stubBanner` actuel contient bien un bouton "Voir tous les évènements", mais :
- Son message "Création bientôt disponible" n'est pas suffisamment visible / actionnable
- Il n'existe pas d'empty state dédié sous le banner quand `events.length === 0 && isStubType`
- La logique du modal laisse croire que "sélectionner Tournoi" va créer un tournoi, alors que ça redirige juste vers un filtre vide

---

## Acceptance Criteria

### AC1 — Le `stubBanner` est renforcé avec un message et un CTA "Créer un Stage" comme alternative immédiate

Quand `isStubType` est true, le `stubBanner` existant est enrichi :
- Le texte d'explication devient : `"La création de « {cfg.label} » n'est pas encore disponible. En attendant, vous pouvez créer un Stage."`
- Un second bouton CTA est ajouté à côté de "Voir tous les évènements" : **"Créer un Stage"** qui navigue vers `/stages/new`
- Les deux boutons sont côte à côte (`flexDirection: 'row'`, gap `space.sm`)
- Le bouton "Créer un Stage" utilise `colors.accent.gold` (même style que `resetFilterBtn`)
- Le bouton "Voir tous les évènements" devient secondaire (`s.btnSecondary` : bordure, fond transparent)

### AC2 — Un empty state dédié est affiché sous le stubBanner quand `isStubType && events.length === 0`

Une nouvelle section `emptyStateStub` est rendue après `stubBanner` quand la liste filtrée est vide :
- Icône contextuelle : selon le type — `tournoi` → "🏆", `fun_day` → "🎉", `detect_day` → "🔍", `seminaire` → "📚" (fallback : "📋")
- Titre : `"Aucun évènement « {cfg.label} »"`
- Sous-titre : `"Aucun évènement de ce type n'a encore été créé."`
- Le composant est distinct du `emptyState` existant (qui reste pour le cas `!isStubType && events.length === 0`)
- Styles via tokens uniquement : `colors.light.surface`, `colors.border.light`, `radius.card`, `space.xl`, `colors.text.dark`, `colors.text.muted`

### AC3 — Le modal `NewEventModal` affiche une note contextuelle sur les types non-stage

Dans `NewEventModal`, chaque option de type non-stage (tout sauf `stage`) affiche un label secondaire `"Bientôt disponible"` en dessous du nom du type :
- Label `"Bientôt disponible"` en `fontSize: 10`, couleur `colors.text.muted`, affiché uniquement si `type !== 'stage'`
- L'option reste sélectionnable (pas de `disabled`) pour ne pas casser le flow
- La sélection d'un type non-stage dans le modal est toujours possible, le CTA "Continuer" reste actif
- Ce label empêche l'utilisateur de croire qu'il va réellement créer l'évènement

---

## Tasks

- [ ] **T1** — Lire `evenements/page.tsx` en entier pour cartographier exactement `isStubType`, `stubBanner`, `emptyState` et `NewEventModal` avant modification
- [ ] **T2** — Dans `NewEventModal`, ajouter un sous-label `"Bientôt disponible"` sous le nom des types non-stage (AC3)
- [ ] **T3** — Enrichir `stubBanner` : remplacer le texte existant, ajouter le bouton "Créer un Stage" en `flexDirection: 'row'` avec "Voir tous les évènements" (AC1)
- [ ] **T4** — Créer la constante `STUB_TYPE_ICONS: Partial<Record<EventType, string>>` avec les 4 icônes contextuelles (AC2)
- [ ] **T5** — Ajouter le rendu conditionnel `emptyStateStub` après le `stubBanner` : visible quand `isStubType && events.length === 0 && !loading` (AC2)
- [ ] **T6** — Ajouter les styles manquants dans `StyleSheet.create` : `emptyStateStub`, `stubActionsRow`, `btnStubSecondary` — tous via tokens `@aureak/theme`
- [ ] **T7** — QA scan : `grep -n "console\." evenements/page.tsx | grep -v NODE_ENV` → 0 résultat
- [ ] **T8** — QA scan : vérifier absence de couleurs hardcodées (`grep -n "#[0-9a-fA-F]" evenements/page.tsx` sans hex inline hors templates)
- [ ] **T9** — `cd aureak && npx tsc --noEmit` → 0 erreur TypeScript

---

## Fichiers modifiés

1. `aureak/apps/web/app/(admin)/evenements/page.tsx` — seul fichier modifié (logique de rendu + modal + styles)

---

## Dépendances

Aucune story en dépendance. Aucune migration Supabase requise. Modification purement frontend / UX.

---

## Notes techniques

### Logique de rendu clarifiée post-implémentation

```
isStubType = true                    → stubBanner (enrichi AC1)
isStubType && events.length === 0    → emptyStateStub (AC2) — rendu APRÈS stubBanner
isStubType && events.length > 0      → grid cards normales (cas futur quand types implémentés)
!isStubType && events.length === 0   → emptyState existant (inchangé)
!isStubType && events.length > 0     → grid cards normales
```

### Constante STUB_TYPE_ICONS

```typescript
const STUB_TYPE_ICONS: Partial<Record<EventType, string>> = {
  tournoi    : '🏆',
  fun_day    : '🎉',
  detect_day : '🔍',
  seminaire  : '📚',
}
```

### Structure stubActionsRow (AC1)

```tsx
<View style={s.stubActionsRow}>
  <Pressable style={s.btnStubSecondary} onPress={() => setFilter(null)}>
    <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>
      Voir tous les évènements
    </AureakText>
  </Pressable>
  <Pressable style={s.resetFilterBtn} onPress={() => router.push('/stages/new' as never)}>
    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
      Créer un Stage
    </AureakText>
  </Pressable>
</View>
```

### Styles à ajouter (AC2 + AC1)

```typescript
emptyStateStub: {
  backgroundColor : colors.light.surface,
  borderRadius    : radius.card,
  padding         : space.xl,
  alignItems      : 'center',
  borderWidth     : 1,
  borderColor     : colors.border.light,
  marginTop       : space.sm,
},
stubActionsRow: {
  flexDirection : 'row',
  gap           : space.sm,
  marginTop     : space.md,
  flexWrap      : 'wrap',
},
btnStubSecondary: {
  paddingHorizontal : space.md,
  paddingVertical   : space.xs + 2,
  borderRadius      : radius.xs,
  borderWidth       : 1,
  borderColor       : colors.border.light,
  backgroundColor   : 'transparent',
},
```

### Pas de try/finally nécessaire

Cette story ne touche aucun setter de chargement/sauvegarde. Les seuls handlers sont `setFilter` (navigation synchrone) et `router.push` (navigation synchrone). Règle try/finally non applicable.

---

## Commit attendu

```
fix(ux): empty state + CTA contextuel évènements non-stage — dead-end UX (story 47-8)
```
