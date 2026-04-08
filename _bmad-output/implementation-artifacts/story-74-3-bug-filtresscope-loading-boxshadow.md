# Story 74.3 : Bug FiltresScope — États de chargement + boxShadow hardcodé

Status: done

## Story

En tant qu'admin,
je veux voir un indicateur "Chargement…" dans les dropdowns de filtres (Implantation / Groupe / Joueur) pendant que les données se chargent, et que la shadow du dropdown soit conforme aux tokens du design system,
afin que l'interface ne paraisse pas cassée pendant les fetches asynchrones et que le code soit sans valeur hardcodée.

## Acceptance Criteria

1. Pendant le fetch `listImplantations()`, le dropdown Implantation affiche "Chargement…" en texte muted (`AureakText` avec `colors.text.muted`) au lieu d'être vide.
2. Pendant le fetch `listGroupsByImplantation()`, le dropdown Groupe affiche "Chargement…" en texte muted au lieu d'être vide.
3. Pendant le fetch `listJoueurs()`, la liste joueurs du dropdown Joueur affiche "Chargement…" en texte muted au lieu d'être vide.
4. `boxShadow: '0 8px 24px rgba(0,0,0,0.12)'` (ligne ~269) est remplacé par `shadows.lg` (token `@aureak/theme`).
5. Zéro valeur rgba/hex hardcodée dans `FiltresScope.tsx` après implémentation — uniquement des tokens `@aureak/theme`.
6. `try/finally` présent sur tout `setState` de chargement — vérification uniquement, ne pas modifier le pattern existant s'il est correct.
7. Console guards `if (process.env.NODE_ENV !== 'production')` présents sur tous les `console.error` — vérification uniquement.

## Tasks / Subtasks

- [x] T1 — Ajouter 3 états de chargement loading dans FiltresScope.tsx (AC: 1, 2, 3)
  - [x] T1.1 — Ajouter `loadingImplantations`, `loadingGroups`, `loadingJoueurs` (`useState<boolean>`) dans `FiltresScope.tsx`
  - [x] T1.2 — Dans le `useEffect` `listImplantations` : `setLoadingImplantations(true)` avant le fetch, `finally { setLoadingImplantations(false) }`
  - [x] T1.3 — Dans le `useEffect` `listGroupsByImplantation` : `setLoadingGroups(true)` avant le fetch, `finally { setLoadingGroups(false) }`
  - [x] T1.4 — Dans le `useEffect` `listJoueurs` : `setLoadingJoueurs(true)` avant le fetch, `finally { setLoadingJoueurs(false) }`
  - [x] T1.5 — Dans le JSX dropdown Implantation : afficher `{loadingImplantations && <AureakText style={styles.dropdownEmpty}>Chargement…</AureakText>}` avant le `ScrollView`
  - [x] T1.6 — Dans le JSX dropdown Groupe : afficher `{loadingGroups && <AureakText style={styles.dropdownEmpty}>Chargement…</AureakText>}` avant le check `groups.length === 0`
  - [x] T1.7 — Dans le JSX dropdown Joueur : afficher `{loadingJoueurs && <AureakText style={styles.dropdownEmpty}>Chargement…</AureakText>}` avant le `ScrollView`

- [x] T2 — Remplacer boxShadow hardcodé par shadows.lg (AC: 4, 5)
  - [x] T2.1 — Ligne ~269 de `FiltresScope.tsx` : remplacer `boxShadow: '0 8px 24px rgba(0,0,0,0.12)'` par `boxShadow: shadows.lg`
  - [x] T2.2 — Vérifier qu'il ne reste aucune autre valeur rgba/hex hardcodée dans le fichier (grep `rgba\|#[0-9a-fA-F]`)

- [x] T3 — Vérification QA (AC: 6, 7)
  - [x] T3.1 — Vérifier que chaque `useEffect` de chargement a bien `try/finally` sur son setState
  - [x] T3.2 — Vérifier que tous les `console.error` sont protégés par `if (process.env.NODE_ENV !== 'production')`
  - [x] T3.3 — Grep `rgba\|#[0-9a-fA-F]` sur `FiltresScope.tsx` → zéro résultat attendu

- [ ] T4 — Validation (AC: tous)
  - [ ] T4.1 — Ouvrir `/activites` dans le navigateur, cliquer sur "Implantation ▾" → vérifier "Chargement…" apparaît brièvement puis les options s'affichent
  - [ ] T4.2 — Sélectionner une implantation, cliquer "Groupe ▾" → vérifier "Chargement…" apparaît brièvement puis les groupes s'affichent
  - [ ] T4.3 — Cliquer "Joueur ▾" → vérifier "Chargement…" apparaît brièvement puis les joueurs s'affichent
  - [ ] T4.4 — Inspecter le dropdown dans les DevTools → vérifier que `box-shadow` est la valeur de `shadows.lg` (non hardcodée)

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

### T1 — Pattern état de chargement

**Pattern validé dans le projet :**

```tsx
// 1. Ajouter les états
const [loadingImplantations, setLoadingImplantations] = useState(false)
const [loadingGroups,        setLoadingGroups]        = useState(false)
const [loadingJoueurs,       setLoadingJoueurs]       = useState(false)

// 2. Pattern try/finally dans useEffect
useEffect(() => {
  ;(async () => {
    setLoadingImplantations(true)
    try {
      const { data } = await listImplantations()
      setImplantations(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[FiltresScope] listImplantations error:', err)
    } finally {
      setLoadingImplantations(false)
    }
  })()
}, [])

// 3. Dans le JSX, afficher "Chargement…" avant les items
{showImplDropdown && (
  <View style={styles.dropdown}>
    {loadingImplantations && (
      <AureakText style={styles.dropdownEmpty}>Chargement…</AureakText>
    )}
    {!loadingImplantations && (
      <ScrollView style={{ maxHeight: 200 }}>
        {implantations.map(impl => ( ... ))}
        {implantations.length === 0 && (
          <AureakText style={styles.dropdownEmpty}>Aucune implantation</AureakText>
        )}
      </ScrollView>
    )}
  </View>
)}
```

Référence : pattern try/finally — CLAUDE.md §3 règle absolue #3.

Le style `dropdownEmpty` existant (ligne 282-289) convient pour le "Chargement…" : `colors.text.muted`, centré, padding `space.md`.

---

### T2 — Token shadows.lg

**Correction :**

```tsx
// AVANT (ligne ~269 dans le StyleSheet) :
// @ts-ignore web
boxShadow: '0 8px 24px rgba(0,0,0,0.12)',

// APRÈS :
// @ts-ignore web
boxShadow: shadows.lg,
```

Valeur résolue : `shadows.lg = '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'`

Import déjà présent ligne 9 : `import { colors, space, radius, shadows } from '@aureak/theme'` ← `shadows` est déjà importé.

---

### Design (story UI)

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// dropdown shadow
boxShadow: shadows.lg   // '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'

// texte Chargement…
color: colors.text.muted  // style dropdownEmpty existant — réutiliser directement
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | Modifier | 3 états loading + shadows.lg |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — non impacté par cette story
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — non impacté
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — non impacté
- `aureak/packages/theme/src/tokens.ts` — tokens déjà définis (`shadows.lg`, `colors.text.muted`)
- `aureak/packages/api-client/` — aucun changement API requis

---

### Dépendances à protéger

- `ScopeState` type (ligne 13-18) — ne pas modifier la signature, utilisée dans presences/page.tsx et evaluations/page.tsx
- `FiltresScope` props `value` + `onChange` (ligne 21-23) — ne pas modifier la signature

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 185-190 (shadows)
- Fichier cible : `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx`
- Pattern try/finally : CLAUDE.md §"Règles absolues de code" #3
- `shadows.lg` défini à `tokens.ts:188`

---

### Multi-tenant

Aucune implication multi-tenant — composant UI pur, aucun paramètre tenantId ajouté ou modifié.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | À modifier |
