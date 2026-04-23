# Story 101.3 — FAB mobile + `<PrimaryAction />` wrapper

Status: review

## Metadata

- **Epic** : 101 — Composants data mobile-first
- **Story ID** : 101.3
- **Story key** : `101-3-fab-action-mobile`
- **Priorité** : P2
- **Dépendances** : aucune
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : S (~3-4h — composant FAB + wrapper responsive)

## Story

As an admin sur mobile,
I want que l'action principale de la page (ex. "+ Nouveau joueur", "+ Nouveau ticket") apparaisse en FAB (Floating Action Button) bas-droite au lieu d'être dans le header,
So that l'action reste accessible même en scrollant, à portée de pouce.

## Contexte

### Pattern cible

- **Desktop** : bouton CTA "+ Nouveau joueur" dans `<AdminPageHeader actionButton={...}>` (actuel)
- **Mobile** : bouton rond `<FAB>` position fixed bas-droite, 56×56px, icône `+` (ou icône contextuelle), fond `colors.accent.gold`

Le même composant `<PrimaryAction />` gère les 2 cas selon breakpoint.

## Acceptance Criteria

1. **Composant `<PrimaryAction />`** dans `aureak/apps/web/components/admin/PrimaryAction.tsx`.

2. **API** :
   ```typescript
   type PrimaryActionProps = {
     label  : string                    // "Nouveau joueur"
     icon?  : React.ComponentType       // défaut: PlusIcon
     onPress: () => void
     variant?: 'auto' | 'header' | 'fab'  // auto = détection breakpoint
   }
   ```

3. **Variant header** (desktop) :
   - Rendu bouton pill gold style `actionButton` de `<AdminPageHeader />`
   - **Alternative** : consommer directement via `<AdminPageHeader actionButton={{ label, onPress }} />` plutôt que créer un nouveau rendu

4. **Variant fab** (mobile) :
   - `<Pressable>` position fixed bottom: 24, right: 24
   - Taille 56×56, borderRadius: 28
   - Fond `colors.accent.gold`, icône blanche 24×24 centrée
   - Shadow elevation 6 (iOS: shadowColor/Opacity/Radius, Android: elevation)
   - Au tap : `onPress()`

5. **Variant auto** : détecte breakpoint (< 640 → fab, ≥ 640 → header).

6. **Masquage contextuel** : le FAB mobile doit pouvoir être masqué si une modal / sheet est ouverte (prop `isHidden` ou z-index géré).

7. **Accessibility** :
   - `accessibilityLabel={label}`
   - `accessibilityRole="button"`
   - Hit slop 8 (pour zones tactiles généreuses)

8. **Tokens `@aureak/theme` uniquement**.

9. **Animation optionnelle** : scale 0.95 au press (feedback tactile).

10. **Conformité CLAUDE.md** : tsc OK.

11. **Test Playwright** :
    - Page pilote avec `<PrimaryAction label="Nouveau joueur" onPress={...} />`
    - Viewport 375×667 : FAB visible bas-droite, tap fonctionne
    - Viewport 1440×900 : bouton dans header, FAB non visible

12. **Non-goals** :
    - **Pas de FAB multi-action** (expand avec sous-actions) — complexe, cas rare
    - **Pas de texte à côté du FAB** (extended FAB) — icône seule suffit

## Tasks / Subtasks

- [x] **T1 — Composant `<PrimaryAction />`** (AC #1, #2)
- [x] **T2 — Variant header (délégué à AdminPageHeader)** (AC #3)
- [x] **T3 — Variant FAB mobile** (AC #4, #9)
- [x] **T4 — A11y** (AC #7)
- [x] **T5 — Masquage contextuel** (AC #6)
- [x] **T6 — QA** (AC #8, #10, #11)

## Dev Notes

### Wrapper ou remplacement ?

2 approches :
- **A — Wrapper** : `<PrimaryAction>` wrappe `<AdminPageHeader>` côté desktop et rend FAB côté mobile → duplication possible
- **B — Standalone** : `<PrimaryAction>` rend toujours côté mobile (FAB), côté desktop rend rien et on configure le bouton via `<AdminPageHeader actionButton>` séparément

**Recommandation** : **B** — plus simple, pas de duplication. Le dev appelle `<AdminPageHeader actionButton={...} />` ET `<PrimaryAction {...} />` côté code ; chacun se rend selon breakpoint (inline desktop vs FAB mobile).

### Shadow cross-platform

```tsx
fabShadow: Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  android: {
    elevation: 6,
  },
  default: { boxShadow: '0 3px 6px rgba(0,0,0,0.3)' },  // web
})
```

### References

- `<AdminPageHeader />` v2 : `components/admin/AdminPageHeader.tsx`
- Tokens : `@aureak/theme` — `colors.accent.gold`, `space.xl`
- Icon par défaut : `PlusIcon` (dans `@aureak/ui` — à vérifier)

## Completion Notes

- Approche B retenue (comme recommandé Dev Notes) : `<PrimaryAction />` rend FAB côté mobile (<640), `null` côté desktop. Le bouton desktop est géré indépendamment par `<AdminPageHeader actionButton={...} />`. Pas de duplication.
- **Icône par défaut** : `PlusIcon` n'existe pas dans `@aureak/ui` → implémentée inline via `react-native-svg` (déjà utilisé dans `StatsHeroCard.tsx`). API `PrimaryActionIconProps { size, color }` permet au consommateur de passer sa propre icône contextuelle.
- **Couleurs tokens only** : `colors.accent.gold` (fond), `colors.text.onGold` (icône — remplace `#fff` hardcodé mentionné dans attention renforcée).
- **z-index 30** : sous FilterSheet (60/70) et drawer Epic 100.1 (40/50) — toute modale/sheet ouverte couvre automatiquement le FAB. Prop `isHidden?: boolean` laisse en plus le consommateur masquer explicitement (AC #6).
- **position: fixed sur web** via `Platform.OS === 'web'` override ; `position: absolute` sur RN natif (Pressable wrapper garantit que le FAB reste collé bas-droite au scroll sur web et reste dans le parent scroll view côté natif — cohérent avec le pattern Material Design FAB).
- **Animation scale 0.95** : `Animated.spring` via `onPressIn`/`onPressOut` (AC #9).
- **A11y** : `accessibilityLabel={label}`, `accessibilityRole="button"`, `hitSlop={8}` (AC #7).
- **Pilote d'intégration** : `/academie/coachs` — mêmes appels `openNewCoach` partagés entre `AdminPageHeader.actionButton` (desktop) et `<PrimaryAction />` (mobile FAB). tsc OK.
