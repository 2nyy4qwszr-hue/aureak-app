# Design Patrol — Post-Sprint 2026-04-07

Fichiers audités (analyse statique du code) :
- `activites/components/StatCards.tsx`
- `activites/presences/page.tsx`
- `activites/evaluations/page.tsx`
- `activites/components/TableauSeances.tsx`
- `activites/components/ActivitesHeader.tsx`
- `dashboard/page.tsx`

---

## 🔴 BLOCKERS (violations charte explicites)

### B1 — `dashboard/page.tsx` : Police `Geist` (body) hardcodée — 29 occurrences
- **Violation** : `fontFamily: 'Geist, sans-serif'` et `fontFamily: 'Geist, system-ui, sans-serif'` utilisés directement dans 29 endroits du dashboard.
- **Token attendu** : `fonts.body = 'Montserrat'` (décision Story 45.1 — Montserrat remplace Geist pour le body).
- **Geist Mono** est légitime (`fonts.mono`) — les 28 usages `Geist Mono, monospace` sont conformes.
- **Localisation** : `S.container`, `S.resolveBtn`, `S.sectionTitle`, `S.implantSelect`, `S.refreshBtn`, `S.dateInput`, `CountdownTile`, `AnomalyModal`, `AnomalyPill`, `Toast`, `DashboardTopBar`, `ActiveQuestsTile`, et plusieurs composants inline.

### B2 — `dashboard/page.tsx` : Shadow hardcodée dans style `<style>` injecté
- Ligne 2544 : `box-shadow: 0 4px 20px rgba(64,145,108,0.3)` — couleur verte terrain hardcodée, hors tokens.
- Token attendu : à intégrer dans `shadows` ou dans `colors.terrain.*`.

---

## 🟠 WARNINGS (dérives à corriger)

### W1 — `StatCards.tsx` : Card dark avec `statIconLight` couleur `colors.text.primary`
- `statIconLight` utilise `color: colors.text.primary` (blanc `#FFFFFF`) sur fond dark — conforme.
- Mais le label "Évals Complétées" sur card dark (`cardDark`) utilise `colors.accent.goldLight` correctement.
- **Dérive mineure** : la 4ème card dark dans `StatCards` utilise `colors.text.dark` comme fond via `backgroundColor: colors.text.dark` — ce token ne correspond pas sémantiquement à un fond. Le fond dark validé est `#2A2827` (brun-gris). Le résultat visuel dépend de la valeur réelle de `colors.text.dark` dans `tokens.ts`.

### W2 — `presences/page.tsx` : Card dark `cardDark` utilise `colors.text.dark` comme backgroundColor
- Même pattern que W1 — `backgroundColor: colors.text.dark` pour les 4èmes stat cards dans les deux onglets (Présences et Séances). `colors.text.dark` est un token texte (`#18181B`), pas un fond. Le fond validé pour card dark hero est `#2A2827`.

### W3 — `evaluations/page.tsx` : `statSubDark` concatène un alpha hex directement
- Ligne : `color: colors.text.primary + '99'` — pattern de concaténation hex pour alpha. Fonctionnel mais fragile. Préférer `colors.overlay.*` ou un token dédié.

### W4 — `TableauSeances.tsx` : Aucune `boxShadow` sur la card principale
- Style `.card` : `borderWidth: 1, borderColor: colors.border.light` — pas de `boxShadow`. Principe #3 (profondeur obligatoire) non appliqué sur ce composant.
- `StatCards.tsx` applique `shadows.sm` correctement — incohérence entre les deux composants.

### W5 — `ActivitesHeader.tsx` : Fond `colors.light.surface` (blanc) — dérive par rapport au fond de page
- Le header utilise `colors.light.surface` (blanc) alors que le fond de page est `colors.light.primary` (beige). C'est une décision de contraste correcte mais la séparation header/contenu crée un effet "bande blanche" qui peut casser l'ambiance premium si la page a un fond beige.

---

## ✅ CONFORMES (pages/composants OK)

### ActivitesHeader.tsx
- Fond, typographie (Montserrat weight 900/700), tab underline gold via `colors.accent.gold`, bouton gold — tous en tokens. Aucune couleur hardcodée.

### StatCards.tsx
- Tokens utilisés correctement : `colors.light.surface`, `colors.border.divider`, `radius.card`, `shadows.sm`, `colors.accent.gold`, `colors.status.orangeBg/orangeText`. `boxShadow: shadows.sm` présent. Montserrat partout.

### evaluations/page.tsx
- Tableau principal bien structuré : `tableContainer` avec `borderRadius: radius.card`, `boxShadow: shadows.sm`, couleurs toutes via tokens. Pills actives/inactives or conformes.

### presences/page.tsx (StatCardsPresences)
- `boxShadow: shadows.sm`, `radius.card`, tokens couleurs — conforme. Montserrat dans les cardStat/cardLabel.

### TableauSeances.tsx (palette)
- Toutes les couleurs via tokens. `methodologyMethodColors` importé depuis `@aureak/theme` (conforme règle ARCH-10). StatusBadge et MethodeBadge correct. Aucune couleur hardcodée.

### dashboard/page.tsx (palette)
- KpiCard, ImplantationCard, SparklineSVG, ProgressBar, BriefingDuJour — tous utilisent `colors.*`, `shadows.*`, `radius.*`, `transitions.*` depuis tokens. Gamification tokens (`gamification.xp.barHeight`, etc.) consommés correctement. La police `Geist Mono` est légitime via `fonts.mono`.

---

## Synthèse

| Composant | Statut |
|-----------|--------|
| ActivitesHeader | ✅ PASS |
| StatCards | ✅ PASS (avertissement W1 mineur) |
| TableauSeances | 🟠 WARNING W4 (profondeur manquante) |
| presences/page | 🟠 WARNING W2 |
| evaluations/page | 🟠 WARNING W3 |
| dashboard/page | 🔴 FAIL B1 (Geist body 29x), B2 (rgba hardcodée) |

**Action prioritaire** : dashboard/page.tsx — remplacer les 29 `'Geist, sans-serif'` et `'Geist, system-ui, sans-serif'` par `fonts.body` (`'Montserrat'`) + corriger le shadow hardcodé rgba(64,145,108,0.3).
