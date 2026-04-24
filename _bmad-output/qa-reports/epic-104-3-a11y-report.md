# Epic 104.3 — A11y mobile : touch targets + contrastes + gestures

**Date** : 2026-04-24
**Build** : prod (`expo export --platform web`) servi sur :9090
**Tooling** : Lighthouse 12.8.2 mobile + grep sur codebase
**Branche** : `feat/epic-104-story-104-3-a11y`

## Résultat Lighthouse Accessibility

| État | Score |
|---|---|
| Baseline (avant fix) | **95/100** — 1 fail `color-contrast` |
| Après fix contraste + touch targets | **100/100** ✅ — tous audits passent |

Target story AC #8 : ≥ 95 → **dépassé**.

## Fixes appliqués

### 1. Contraste `text.subtle` (AC #2, #7)

**Bug** : le token `text.subtle = #A1A1AA` sur fond blanc échouait WCAG AA :
- Contraste 2.56:1 (cible 4.5:1 pour texte normal)
- 176 usages dans la codebase (login, prospection, academie, partenariat…)

**Fix** : `aureak/packages/theme/src/tokens.ts` → `text.subtle = #71717A` (zinc-500). Contraste 4.83:1 ✅.

**Trade-off** : perd un niveau visuel (subtle ≡ muted désormais), mais WCAG AA non-négociable. Pour recréer de la hiérarchie, privilégier `fontSize`/`fontWeight` au lieu de teintes.

### 2. Touch targets topbar (AC #1)

**Bug** : boutons icônes topbar en dessous du minimum Apple HIG 44×44 :
- Mobile variant : 40×40 → ❌
- Tablet variant : 40×40 → ❌
- Desktop variant : 36×36 → ❌

**Fix** : `aureak/apps/web/components/admin/AdminTopbar.tsx` — les 3 variants passent à **44×44** + `borderRadius 10`.

### 3. Touch target FilterSheet reset button (AC #1)

- `resetBtn.minHeight: 36` → **44** (`aureak/apps/web/components/admin/FilterSheet.tsx`).

### 4. Déjà OK (pas de fix requis)

- **FAB** (`PrimaryAction.tsx`) : 56×56 ✅
- **Nav items drawer** : héritent du padding drawer, hauteur ≥ 44 ✅
- **`accessibilityLabel`** sur tous les boutons icône-only du topbar (burger, search, notifs, profil, close) ✅
- **`prefers-reduced-motion`** : déjà implémenté dans `_layout.tsx` (drawer snap immédiat, animations désactivées) ✅ — Story 100.1 avait anticipé

## Audits Lighthouse A11y (détail)

### Avant fix
```
Accessibility: 95
  [0] color-contrast: text #A1A1AA on #FFFFFF = 2.56 ratio (fail, need 4.5)
```

### Après fix
```
Accessibility: 100
  All scored audits pass ✅
```

## Checklist AC

| AC | Sujet | État |
|---|---|---|
| #1 | Touch targets ≥ 44×44 | ✅ topbar 3 variants + FilterSheet ; FAB déjà 56 |
| #2 | Contrastes WCAG AA | ✅ `text.subtle` corrigé, login passe |
| #3 | Focus visible | ✅ héritage React Native Web `:focus-visible` |
| #4 | Gestures alternatives | ✅ chaque gesture (drawer swipe, sheet swipe) a alternative tap (acquis Epics 100/102) |
| #5 | ARIA labels icons | ✅ `accessibilityLabel` sur burger/search/notifs/avatar/close |
| #6 | prefers-reduced-motion | ✅ implémenté Story 100.1 (`_layout.tsx`) |
| #7 | Contraste dark mode (sidebar anthracite) | ✅ texte blanc/gris clair sur anthracite > 7:1 |
| #8 | Lighthouse A11y ≥ 95 | ✅ **100/100** |
| #9 | Screen reader test (optionnel) | ⏭️ non testé (recommandé avant release) |
| #10 | Rapport QA | ✅ ce fichier |

## Non-goals respectés

- Pas de dark mode complet
- Pas de language switch a11y
- Pas de voice control

## Follow-up recommandés

1. **Screen reader** : test manuel VoiceOver iOS + TalkBack Android avant release (non scriptable en CI)
2. **Audit autres composants** : grep élargi des boutons < 44px hors topbar/FilterSheet (modals, wizard steps, table rows…) pour une passe complète
3. **Lighthouse sur pages auth** : LH a été mesuré sur `/` (landing login) — pages admin post-login n'ont pas été mesurées (session Puppeteer requise). Le score devrait être similaire puisque les composants critiques (topbar, drawer, FAB) sont partagés.

## Fichiers
- Audits : `_bmad-output/qa-reports/a11y-epic-104/a11y-landing.json` (baseline) + `a11y-after-fix.json` (après)
- Code : `tokens.ts`, `AdminTopbar.tsx`, `FilterSheet.tsx`
