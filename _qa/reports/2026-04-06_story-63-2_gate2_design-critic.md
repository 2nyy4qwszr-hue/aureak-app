# Design Critic — Story 63.2
Date : 2026-04-06
Route auditée : `(admin)/evenements`
App running : ❌ (Playwright skipped — app non démarrée, curl exit code 7)

---

## Verdict global

**PASS avec warnings** — Audit statique uniquement (app non démarrée). Aucun anti-pattern BLOCKER détecté à la lecture du code. Quelques warnings de layout hardcodés non bloquants.

---

## Screenshots produits

Aucun screenshot — app non démarrée.

---

## Anti-patterns détectés (BLOCKERS)

> Aucun anti-pattern BLOCKER détecté.

| Anti-pattern | Localisation | Preuve screenshot |
|---|---|---|
| — | — | — |

---

## Principes design — évaluation

| # | Principe | Statut | Observation |
|---|----------|--------|-------------|
| 1 | Fond clair | ✅ | `backgroundColor: colors.light.primary` (#F3EFE7) — conforme |
| 2 | Bento cards | ✅ | Grille de cards avec `EventCard` — 2 colonnes flexWrap, responsive |
| 3 | Profondeur | ✅ | Cards avec `boxShadow: shadows.sm` + `borderWidth: 1` (border.light) |
| 4 | Pictos navigation | N/A | Pas de navigation propre à cette page |
| 5 | Personnage qui dépasse | N/A | Page événements, pas de profil joueur |
| 6 | Photos terrains | N/A | Vue liste — pas d'implantation photo |
| 7 | Background flouté | ✅ | Modal overlay : `colors.overlay.dark` — pattern token correct |
| 8 | Panel dans panel | ✅ | Modal type-picker : `animationType="fade"`, centré, `maxWidth: 440` |
| 9 | Terrain + data points | N/A | Module évènements, pas de pitch interactif |
| 10 | Home screen DLS | N/A | Page liste, pas un dashboard home |
| 11 | L'académie = univers | ✅ | Bande de couleur par statut en haut de chaque card — identité premium |
| 12 | Animations progressives | ⚠️ | Skeleton present (SkeletonCard), mais pas d'animation hover explicite sur EventCard — `Pressable` sans feedback visuel documenté. Non bloquant. |

---

## Palette — conformité

| Élément | Couleur trouvée | Token attendu | Statut |
|---------|-----------------|---------------|--------|
| Fond page | `colors.light.primary` | `#F3EFE7` | ✅ |
| Cards surface | `colors.light.surface` | `#FFFFFF` | ✅ |
| Accent gold (titre, bouton) | `colors.accent.gold` | `#C1AC5C` | ✅ |
| Error state | `colors.accent.red + '1f'` | token + opacité | ✅ |
| Stage type pill | `colors.accent.gold + '1f'` | token + opacité | ✅ |
| Tournoi type pill | `colors.entity.club + '1f'` | token + opacité | ✅ |
| StatusBadge background | `color + '20'` | devrait être `'1f'` | ⚠️ WARNING — incohérence de suffixe hex (0x20=12.5% vs 0x1f=12.2%, différence visuelle négligeable) |
| Overlay modal | `colors.overlay.dark` | `rgba(0,0,0,0.5)` | ✅ |
| Texte muted | `colors.text.muted` | `#71717A` | ✅ |
| Ombre card | `shadows.sm` | token | ✅ |
| Border radius card | `borderRadius: 10` | `radius.card = 16` | ⚠️ WARNING — sous les 16px recommandés |
| Border radius modal | `radius.cardLg` | token | ✅ |

---

## Warnings (non-bloquants)

1. **`StatusBadge` : suffixe `'20'` au lieu de `'1f'`** (ligne 58) — incohérence mineure avec le reste de la page qui utilise uniformément `'1f'`. Correction possible à la prochaine itération.
2. **`EventCard` : `borderRadius: 10`** au lieu du token `radius.card` (16) — légèrement sous le standard design. Non bloquant.
3. **Hover feedback non visible dans le code** — `Pressable` sans `pressStyle` ou `hoverStyle`. Sur web, l'interaction n'est pas confirmée visuellement (sauf opacity native RN). Qualité UX à améliorer dans la prochaine itération.
4. **App non démarrée** — audit visuel réel impossible. Les problèmes de rendu ne peuvent pas être confirmés.

---

## Erreurs console JS

> Audit statique uniquement — app non démarrée. Aucune erreur console observable.

---

## Ambiance par rôle

| Rôle | Attendu | Évaluation |
|------|---------|------------|
| Admin | Centre de commandement premium — gold dominant, bento, données en avant | ✅ — gold en titre, pills colorées, cards structurées avec bande statut, skeleton loading, empty state soigné |
