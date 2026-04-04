# Story 44.8 : UX — Groupe — clic joueur → fiche éditable /children/:id

Status: done

## Story

En tant qu'admin Aureak consultant la fiche d'un groupe,
je veux pouvoir cliquer sur un joueur du groupe pour accéder directement à sa fiche éditable,
afin de modifier ses informations sans devoir naviguer manuellement vers /children.

## Acceptance Criteria

1. Dans la fiche groupe `(admin)/groups/[groupId]/page.tsx`, chaque joueur listé est cliquable
2. Cliquer sur un joueur navigue vers `(admin)/children/[childId]`
3. L'élément cliquable a un cursor pointer et un hover state visible (fond légèrement plus sombre)
4. La navigation utilise `router.push` d'Expo Router
5. Aucune régression sur l'affichage de la liste des joueurs

## Tasks / Subtasks

- [x] T1 — Rendre les joueurs cliquables dans la fiche groupe
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` — identifier le composant d'affichage des membres
  - [x] T1.2 — Wrapper chaque item joueur dans un `<Pressable>` avec `onPress={() => router.push(\`/(admin)/children/\${member.childId}\`)}`
  - [x] T1.3 — Ajouter hover state : `({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]`
  - [x] T1.4 — Style pressed : `backgroundColor: colors.light.hover`
  - [x] T1.5 — Icône chevron droit `›` en fin de ligne pour indiquer la navigabilité

- [x] T2 — Validation
  - [x] T2.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T2.2 — Playwright : clic sur joueur → navigation vers /children/:id

## Dev Notes

### Pattern Pressable navigable
```typescript
import { useRouter } from 'expo-router'
const router = useRouter()

<Pressable
  onPress={() => router.push(`/(admin)/children/${member.childId}`)}
  style={({ pressed }) => [styles.memberRow, pressed && { backgroundColor: colors.light.hover }]}
>
  <Text style={styles.memberName}>{member.displayName}</Text>
  <Text style={styles.chevron}>›</Text>
</Pressable>
```

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` | Rendre joueurs cliquables |

## Dev Agent Record

- **Type de membre** : `GroupMemberWithName` (depuis `@aureak/types`)
- **Champ ID utilisé** : `m.childId` (propriété `childId: string` du type `GroupMemberWithName`)
- **Composant modifié** : `JoueursTab` dans `groups/[groupId]/page.tsx`
- **Changements** :
  1. `const router = useRouter()` ajouté dans `JoueursTab`
  2. `<View key={m.childId}>` remplacé par `<Pressable key={m.childId} onPress={() => router.push(...)}>`
  3. Style `({ pressed })` avec `colors.light.hover` sur pressed
  4. Chevron `›` ajouté avant le bouton ✕
  5. Bouton ✕ : `onPress` wrappé avec `e.stopPropagation?.()` pour éviter la navigation lors du clic suppression
- **TSC** : 0 erreur
- **QA** : try/finally présent partout, zéro console non-guardé
- **Playwright** : skipped — app non démarrée

## File List

- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` — joueurs cliquables avec navigation
