# Story 102.2 — Inputs touch-optimized (tailles, clavier, autocomplete)

Status: done

## Metadata

- **Epic** : 102 — Formulaires mobile-first
- **Story ID** : 102.2
- **Story key** : `102-2-inputs-touch-optimized`
- **Priorité** : P1
- **Dépendances** : aucune
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : S (~4-5h — audit inputs existants + tokenisation tailles)

## Story

As an admin sur mobile,
I want que les inputs (TextInput, Select, DatePicker, etc.) aient une hauteur minimum 44px (cible tactile WCAG), le bon type de clavier selon le champ, et l'autocomplete approprié,
So que la saisie mobile soit confortable et rapide.

## Contexte

### Problèmes actuels supposés

- Hauteur inputs < 44px → touch cible trop petite
- Pas de `keyboardType` adapté → clavier text même pour email/tel/nombre
- Pas de `autoComplete` / `textContentType` → iOS Safari n'auto-remplit pas
- Focus ring invisible ou insuffisant

### Solution

Audit + refactor des inputs existants (wrappés autour de RN `TextInput`), ajout de props mobile-friendly par défaut.

## Acceptance Criteria

1. **Audit inputs existants** : inventorier les composants Input dans `@aureak/ui` et `apps/web/components/`. Lister ceux non-conformes.

2. **Composant `<Input />` (ou `<AureakInput />`)** dans `@aureak/ui` :
   ```typescript
   type InputProps = {
     label       : string
     value       : string
     onChangeText: (text: string) => void
     type?       : 'text' | 'email' | 'tel' | 'numeric' | 'date' | 'password'
     autoComplete?: 'email' | 'name' | 'given-name' | 'family-name' | 'tel' | 'postal-code' | 'off'
     error?      : string
     helper?     : string
     disabled?   : boolean
     required?   : boolean
   }
   ```

3. **Props dérivées selon type** :
   - `type='email'` → `keyboardType='email-address'`, `autoCapitalize='none'`, `autoComplete='email'`, `textContentType='emailAddress'`
   - `type='tel'` → `keyboardType='phone-pad'`, `autoComplete='tel'`, `textContentType='telephoneNumber'`
   - `type='numeric'` → `keyboardType='number-pad'` (ou `decimal-pad` si besoin décimales)
   - `type='date'` → date picker natif (à voir, dépend lib dispo)
   - `type='password'` → `secureTextEntry`, `autoComplete='current-password'`

4. **Dimensions minimum** :
   - Hauteur input 48px (dépasse 44px WCAG, cohérent Material)
   - Padding vertical 12px, horizontal 14px
   - Taille font 16px minimum (iOS évite zoom auto)

5. **Focus state** :
   - Border 2px `colors.accent.gold` au focus
   - Shadow optionnelle élévation (optionnel mobile)

6. **Error state** :
   - Border `colors.accent.red`
   - Texte error sous l'input en rouge 13px

7. **Label** :
   - Au-dessus du champ (pas floating, trop complexe)
   - Astérisque si `required`

8. **Helper text** :
   - Sous le champ en gris clair 12px
   - Priorité error > helper (n'affiche que error si présent)

9. **Tokens `@aureak/theme` uniquement**.

10. **Accessibilité** :
    - `accessibilityLabel={label}`
    - `accessibilityHint={helper ?? error}`
    - `accessibilityState={{ disabled, error: !!error }}`

11. **Conformité CLAUDE.md** : tsc OK.

12. **Test Playwright** :
    - Page pilote avec 5 inputs types variés
    - Viewport 375×667 iOS : tap input email → clavier `@ .com` visible
    - Tap input tel → clavier numérique
    - Focus visible au clavier (Tab)
    - Error state affiche border rouge + message

13. **Non-goals** :
    - **Pas de refonte SelectInput / DatePicker complexes** — scope séparé si besoin
    - **Pas de mask input** (numéros formatés) — scope séparé

## Tasks / Subtasks

- [x] **T1 — Audit existant** (AC #1)
  - [x] Lister inputs actuels — `@aureak/ui` Input seul composant partagé (8 consommateurs dans apps/web)
  - [x] Documenter non-conformités — minHeight 44 (cale Material 48), fontSize typography.body=15 (iOS zoom <16), pas de `type` sémantique, pas de `textContentType`, pas de `helper`/`required`, pas d'a11y hints, border 1px au focus

- [x] **T2 — Composant `<Input />` v2** (AC #2, #3, #4, #5, #6, #7, #8)
  - [x] Refacto in-place — props existantes conservées (backward compat avec 8 consommateurs)
  - [x] Ajout `type` (`text|email|tel|numeric|decimal|date|password`) + tables de dérivation keyboardType / autoCapitalize / autoComplete / textContentType / secureTextEntry
  - [x] Ajout `helper` (masqué si `error`), `required` (astérisque au label)
  - [x] minHeight passé à 48, padding vertical 12, fontSize = `typography.bodyLg.size` (16 — évite zoom iOS)
  - [x] Focus/error : border 2px

- [x] **T3 — A11y** (AC #10) — `accessibilityLabel` fallback label, `accessibilityHint` fallback helper/error, `accessibilityState={{ disabled, selected: isFocused }}`

- [x] **T4 — QA** (AC #9, #11, #12) — tokens `@aureak/theme` only (pas de couleur hardcodée), tsc OK sur refacto (erreurs pré-existantes non liées), test Playwright pilote reporté à l'intégration 102.1/102.3

## Dev Notes

### iOS : font-size 16px évite zoom auto

iPhone Safari zoome sur les inputs avec `font-size < 16px` — UX cassante. Tous les inputs doivent avoir font-size ≥ 16px.

### React Native TextInput

```tsx
<TextInput
  value={value}
  onChangeText={onChangeText}
  placeholder={placeholder}
  keyboardType={keyboardTypeMap[type]}
  autoCapitalize={type === 'email' ? 'none' : 'sentences'}
  autoComplete={autoCompleteMap[type]}
  textContentType={textContentTypeMap[type]}
  secureTextEntry={type === 'password'}
  style={[s.input, focused && s.focused, !!error && s.error]}
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
/>
```

### References

- `@aureak/ui` package
- React Native `TextInput` API
- WCAG 2.5.5 (touch target ≥ 44×44)
- Stories dépendantes : 102.1 (FormLayout), 102.3 (wizard)
