# Story 12.5 : Carte de Progression Thème & Collection de Skill Cards

Status: deferred

## Story

En tant qu'Enfant,
Je veux visualiser ma progression sur chaque thème du référentiel sous forme de carte visuelle, et collectionner des skill cards que j'obtiens en maîtrisant les thèmes,
Afin d'avoir une représentation concrète et motivante de ce que j'ai appris.

## Acceptance Criteria

**AC1 — Carte des thèmes**
- **When** l'enfant ouvre "Ma Progression"
- **Then** tous les thèmes accessibles (filtrés par `filterByAudience`) affichés en grille avec statut dérivé de `player_theme_mastery` :
  - `not_started` → grisé + cadenas
  - `in_progress` → cercle partiel animé
  - `acquired` → ✅ badge vert + date + skill card débloquée
  - `revalidated` → ✅✅ badge or + date

**AC2 — Détail thème**
- **And** nom + description + niveau (débutant/intermédiaire/avancé)
- **And** statut de maîtrise + historique tentatives (SANS `mastery_percent`)
- **And** skill card associée : image + rareté + statut
- **And** CTA "Revalider" si `review_due_at <= now()` (révision espacée Story 8.4)

**AC3 — Collection skill cards**
- **And** grille : collectées (en couleur + rareté animée) vs non collectées (silhouette + condition)
- **And** tri : legendary > epic > rare > common

**AC4 — Skill card légendaire**
- **And** déblocage legendary → animation plein écran + notification push parent

**AC5 — Mise à jour**
- **And** `player_theme_mastery` mis à jour par Story 12.2 — toujours à jour après chaque tentative

**AC6 — RLS**
- **And** enfant voit uniquement ses propres `player_theme_mastery` et `player_skill_cards`
- **And** catalogue `skill_cards`, `quest_definitions`, `avatar_items` : SELECT pour tous les rôles du tenant

## Tasks / Subtasks

- [ ] Task 1 — API carte des thèmes (AC: #1, #2)
  - [ ] 1.1 `getChildThemeProgression(childId)` dans `@aureak/api-client` : JOIN `themes` + `player_theme_mastery` + `skill_cards`
  - [ ] 1.2 Appliquer `filterByAudience` côté client selon `age_group` de l'enfant

- [ ] Task 2 — API collection skill cards (AC: #3)
  - [ ] 2.1 `getSkillCardCollection(childId)` : tous `skill_cards` tenant + statut `player_skill_cards`

- [ ] Task 3 — UI Carte des Thèmes (AC: #1, #2)
  - [ ] 3.1 Créer `apps/mobile/app/(child)/progression/themes.tsx`
  - [ ] 3.2 Grille thèmes avec statut visuel
  - [ ] 3.3 Modal détail thème

- [ ] Task 4 — UI Collection Skill Cards (AC: #3, #4)
  - [ ] 4.1 Créer `apps/mobile/app/(child)/progression/skill-cards.tsx`
  - [ ] 4.2 Grille triée par rareté
  - [ ] 4.3 Animation plein écran pour legendary

- [ ] Task 5 — Notification push parent legendary (AC: #4)
  - [ ] 5.1 Déclencher depuis `award_badge_if_applicable` ou trigger `player_skill_cards`
  - [ ] 5.2 Notification via Story 7.1 aux parents de l'enfant

## Dev Notes

### API `getChildThemeProgression`

```typescript
// packages/api-client/src/progression/getChildThemeProgression.ts
export async function getChildThemeProgression(childId: string) {
  // Catalogue thèmes du tenant (tous)
  const { data: themes } = await supabase
    .from('themes')
    .select('id, name, description, target_audience, skill_cards(id, slug, name, rarity, unlock_condition)')

  // Maîtrise par thème de l'enfant
  const { data: mastery } = await supabase
    .from('player_theme_mastery')
    .select('theme_id, mastery_status, first_acquired_at, last_attempt_at, review_count')
    .eq('child_id', childId)

  const { data: reviewDue } = await supabase
    .from('learning_attempts')
    .select('theme_id, review_due_at')
    .eq('child_id', childId)
    .eq('mastery_status', 'acquired')
    .is('reviewed_at', null)
    .lte('review_due_at', new Date().toISOString())

  const masteryMap = new Map(mastery?.map(m => [m.theme_id, m]))
  const reviewMap = new Set(reviewDue?.map(r => r.theme_id))

  return themes?.map(t => ({
    ...t,
    masteryStatus: masteryMap.get(t.id)?.mastery_status ?? 'not_started',
    firstAcquiredAt: masteryMap.get(t.id)?.first_acquired_at,
    reviewDue: reviewMap.has(t.id),
  }))
}
```

### Tri skill cards par rareté

```typescript
const RARITY_ORDER = { legendary: 4, epic: 3, rare: 2, common: 1 }

const sortedCards = [...cards].sort((a, b) =>
  RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
)
```

### Notification push parent pour skill card legendary

```typescript
// Trigger côté client après confirmation de collecte legendary
if (skillCard.rarity === 'legendary') {
  // Récupérer les parents de l'enfant
  const { data: parents } = await supabase
    .from('parent_child_links')
    .select('parent_id')
    .eq('child_id', childId)

  for (const { parent_id } of parents ?? []) {
    await supabase.functions.invoke('send-notification', {
      body: {
        tenantId   : tenantId,
        recipientId: parent_id,
        eventType  : 'legendary_card_unlocked',
        referenceId: skillCard.id,
        urgency    : 'routine',
        title      : 'Skill Card Légendaire !',
        body       : `${childName} a débloqué une skill card légendaire : ${skillCard.name} !`,
      }
    })
  }
}
```

### `filterByAudience` pour thèmes

Réutilise la fonction `filterByAudience` de Story 3.6 :
```typescript
import { filterByAudience } from '@aureak/business-logic'

const accessibleThemes = filterByAudience(allThemes, childProfile)
```

### Dépendances

- **Prérequis** : Story 12.1 (`player_theme_mastery`, `skill_cards`, `player_skill_cards`) + Story 12.2 (mise à jour mastery) + Story 3.6 (`filterByAudience`) + Story 8.4 (`review_due_at`)

### References
- [Source: epics.md#Story-12.5] — lignes 2779–2810

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
