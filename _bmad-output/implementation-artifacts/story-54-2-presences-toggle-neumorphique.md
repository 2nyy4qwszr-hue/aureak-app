# Story 54-2 — Présences : Toggle neumorphique présent/absent

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-2
- **Status** : done
- **Priority** : P2
- **Type** : UI Component / Design
- **Estimated effort** : S (2–3h)
- **Dependencies** : Story 49-4 (ready — toggle basique existant)

---

## User Story

**En tant qu'admin ou coach**, quand j'enregistre la présence d'un joueur via un toggle, je veux ressentir un retour visuel "neumorphique" qui s'enfonce au clic (animation spring 150ms, changement de couleur vert/rouge), afin d'avoir un ressenti premium et de confirmation claire que le toggle a bien été actionné.

---

## Contexte technique

### Fichier cible
Nouveau composant : `aureak/packages/ui/src/AttendanceToggle.tsx`
Et son usage dans : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### Neumorphisme web
L'effet "neumorphique" (bouton qui s'enfonce) est simulé via :
- État normal : `boxShadow: '4px 4px 8px rgba(0,0,0,0.12), -4px -4px 8px rgba(255,255,255,0.8)'`
- État appuyé : `boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.15), inset -3px -3px 6px rgba(255,255,255,0.7)'`

L'animation spring 150ms est simulée via `transform: scale(0.96)` au clic avec `transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)`.

React Native Web supporte `boxShadow` et `transition` via style inline ou `StyleSheet` avec les propriétés DOM.

---

## Acceptance Criteria

1. **AC1** — Le composant `AttendanceToggle` est créé dans `@aureak/ui` et exporté depuis son index.

2. **AC2** — Le composant accepte les props : `{ status: 'present' | 'absent' | null; onToggle: () => void; disabled?: boolean; size?: 'sm' | 'md' }`.

3. **AC3** — État `absent` ou `null` : fond `colors.accent.red` (#E05252), ombre neumorphique normale, label "Absent" en blanc.

4. **AC4** — État `present` : fond `colors.status.success` (#10B981), ombre neumorphique normale, label "Présent" en blanc.

5. **AC5** — Au moment du clic (onPress) : le bouton passe immédiatement à l'état "enfoncé" (`scale(0.96)` + ombre inset) pendant 150ms, puis revient à l'état normal avec l'animation spring.

6. **AC6** — Si `disabled = true` : opacity 0.5, le scale animation ne se déclenche pas, `onToggle` n'est pas appelé.

7. **AC7** — Le toggle est utilisé dans la section présences de `[sessionId]/page.tsx` en remplacement des anciens boutons présent/absent.

8. **AC8** — Le composant est exporté depuis `@aureak/ui/src/index.ts`.

---

## Tasks

- [x] **T1 — Créer `AttendanceToggle.tsx` dans `@aureak/ui/src/`**

  ```tsx
  import React, { useRef, useState } from 'react'
  import { Pressable, StyleSheet } from 'react-native'
  import { AureakText } from './AureakText'
  import { colors, space, radius } from '@aureak/theme'

  type AttendanceToggleProps = {
    status    : 'present' | 'absent' | null
    onToggle  : () => void
    disabled ?: boolean
    size     ?: 'sm' | 'md'
  }

  export function AttendanceToggle({ status, onToggle, disabled = false, size = 'md' }: AttendanceToggleProps) {
    const [pressed, setPressed] = useState(false)
    const isPresent = status === 'present'
    const bg = isPresent ? colors.status.success : colors.accent.red
    const label = isPresent ? 'Présent' : 'Absent'

    return (
      <Pressable
        disabled={disabled}
        onPressIn={() => { if (!disabled) setPressed(true) }}
        onPressOut={() => { setPressed(false) }}
        onPress={() => { if (!disabled) onToggle() }}
        style={[
          st.base,
          size === 'sm' ? st.sm : st.md,
          { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
          pressed ? st.pressed : st.normal,
        ]}
      >
        <AureakText style={st.label}>{label}</AureakText>
      </Pressable>
    )
  }
  ```

- [x] **T2 — Styles neumorphiques**
  - Utiliser `boxShadow` via `(StyleSheet as any)` ou style inline pour les ombres
  - `st.normal` : `boxShadow: '3px 3px 6px rgba(0,0,0,0.12), -2px -2px 5px rgba(255,255,255,0.5)'`
  - `st.pressed` : `boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.3)', transform: [{scale: 0.96}]`
  - Note : React Native Web supporte les shadow strings dans les objets de style

- [x] **T3 — Exporter depuis `@aureak/ui/src/index.ts`**
  - Ajouter `export { AttendanceToggle } from './AttendanceToggle'`

- [x] **T4 — Utiliser dans `[sessionId]/page.tsx`**
  - Importer `AttendanceToggle` depuis `@aureak/ui`
  - Remplacer les anciens boutons présent/absent par `<AttendanceToggle>`

- [x] **T5 — QA scan**
  - Vérifier que `onToggle` n'est jamais appelé si `disabled = true`
  - Vérifier l'export depuis `@aureak/ui`
  - Vérifier les couleurs : uniquement tokens (`colors.status.success`, `colors.accent.red`)

---

## Design détaillé

### Normal — absent
```
┌──────────────────┐
│    ✗  Absent     │  ← fond rouge, ombre extérieure
└──────────────────┘
     ↓ clic
┌──────────────────┐  ← enfoncé (scale 0.96, ombre inset)
│    ✗  Absent     │
└──────────────────┘
     ↓ 150ms
┌──────────────────┐
│    ✓  Présent    │  ← fond vert, ombre extérieure
└──────────────────┘
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/packages/ui/src/AttendanceToggle.tsx` | CREATE — composant toggle neumorphique |
| `aureak/packages/ui/src/index.ts` | Exporter `AttendanceToggle` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Utiliser `AttendanceToggle` |

---

## Pas de migration SQL

Cette story est 100% front-end / composant UI.

---

## Commit

```
feat(epic-54): story 54-2 — toggle neumorphique présent/absent dans @aureak/ui
```
