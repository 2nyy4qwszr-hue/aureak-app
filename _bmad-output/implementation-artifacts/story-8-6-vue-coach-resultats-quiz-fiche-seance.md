# Story 8.6 : Vue coach — Résultats quiz groupe dans la fiche séance

Status: done

## Story

En tant que Coach,
je veux voir les résultats de quiz de tous les joueurs de mon groupe directement dans la fiche séance,
afin de comprendre d'un coup d'œil qui a bien répondu et quels thèmes posent problème, sans quitter la page de détail séance.

## Acceptance Criteria

1. **AC1 — Section "Résultats Quiz" présente** : dans `/seances/[sessionId]`, une section "Résultats Quiz" apparaît après la section "Présences", uniquement si `session.groupId` est non-null (séance avec groupe) et si au moins une tentative existe pour cette séance.

2. **AC2 — Tableau joueurs × score** : la section affiche un tableau listant chaque joueur ayant soumis une tentative : nom du joueur, thème(s) tenté(s), score (correct_count / questions_answered), pourcentage de maîtrise (`mastery_percent`%), statut de maîtrise (`acquired` → badge vert "Acquis" / `not_acquired` → badge orange "En cours").

3. **AC3 — Résumé par thème** : sous le tableau joueurs, un bloc "Maîtrise par thème" liste chaque thème couvert par la séance avec le taux de réussite du groupe (ex : "Placement : 3/5 joueurs ayant acquis — 60%").

4. **AC4 — État vide propre** : si aucune tentative n'existe pour cette séance, afficher "Aucun quiz complété pour cette séance" en texte muted — pas de tableau vide.

5. **AC5 — Aucune valeur hardcodée** : la section utilise exclusivement les tokens `@aureak/theme` (colors, space, radius, shadows) — aucune couleur, espacement, ou ombre en dur.

6. **AC6 — Try/finally sur le chargement** : le state `loadingQuiz` est remis à `false` dans un bloc `finally` — pas de fuite d'état si l'appel API échoue.

7. **AC7 — Appel API isolé** : la fonction `listGroupQuizResults(sessionId)` est ajoutée dans `@aureak/api-client/src/learning/learning.ts` et exportée depuis `index.ts` — aucun appel Supabase direct dans `page.tsx`.

## Tasks / Subtasks

- [x] T1 — Fonction API `listGroupQuizResults` dans `@aureak/api-client` (AC: 2, 3, 7)
  - [x] T1.1 — Dans `aureak/packages/api-client/src/learning/learning.ts`, ajouter la fonction `listGroupQuizResults(sessionId: string)` qui joint `learning_attempts` + `themes(name)` + `profiles(display_name)` filtrés par `session_id`
  - [x] T1.2 — Définir et exporter le type retour `GroupQuizResult` : `{ childId, displayName, themeId, themeName, masteryPercent, masteryStatus, correctCount, questionsAnswered }`
  - [x] T1.3 — Exporter `listGroupQuizResults` et `GroupQuizResult` depuis `aureak/packages/api-client/src/index.ts`

- [x] T2 — Type TypeScript `GroupQuizResult` dans `@aureak/types` (AC: 2, 3)
  - [x] T2.1 — Dans `aureak/packages/types/src/entities.ts`, ajouter `GroupQuizResult` après la section `LearningAttempt` (ligne ~1068)

- [x] T3 — Section UI "Résultats Quiz" dans la fiche séance (AC: 1, 2, 3, 4, 5, 6)
  - [x] T3.1 — Dans `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`, ajouter le state `quizResults: GroupQuizResult[]` et `loadingQuiz: boolean`
  - [x] T3.2 — Dans un `useEffect` dédié, appeler `listGroupQuizResults(sessionId)` avec `.finally(() => setLoadingQuiz(false))`
  - [x] T3.3 — Ajouter le bloc JSX "Résultats Quiz" après la section Présences, conditionné par `session.groupId`
  - [x] T3.4 — Implémenter le tableau joueurs : rows avec nom, thème, score fraction, pourcentage, badge maîtrise (Badge variant `present`/`attention`)
  - [x] T3.5 — Implémenter le bloc "Maîtrise par thème" : agréger `quizResults` par `themeId` côté JS, afficher nom thème + compteur acquis/total + pourcentage
  - [x] T3.6 — Afficher "Aucun quiz complété pour cette séance" si `quizResults.length === 0` et `!loadingQuiz`, mais uniquement si `session.groupId` est défini

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Section conditionnée par `session.groupId` + présence de tentatives (tableau vide → état vide)
  - [x] T4.2 — Tableau affiche nom joueur, thème, score fraction, pourcentage, badge statut
  - [x] T4.3 — Bloc thèmes avec compteur acquis/total et pourcentage
  - [x] T4.4 — État vide "Aucun quiz complété" affiché si `quizResults.length === 0`
  - [x] T4.5 — `setLoadingQuiz(false)` uniquement dans `.finally()` — conforme
  - [x] T4.6 — Aucune couleur hex hardcodée dans la nouvelle section — uniquement tokens `colors.*` et `space.*`

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

### T1 — Fonction API `listGroupQuizResults`

La table `learning_attempts` contient `session_id`, `child_id`, `theme_id`, `mastery_percent`, `mastery_status`, `correct_count`, `questions_answered`. La jointure `profiles` se fait via `child_id = profiles.user_id`.

**Pattern de requête Supabase :**

```typescript
export type GroupQuizResult = {
  childId           : string
  displayName       : string
  themeId           : string
  themeName         : string
  masteryPercent    : number | null
  masteryStatus     : 'acquired' | 'not_acquired' | null
  correctCount      : number
  questionsAnswered : number
}

export async function listGroupQuizResults(
  sessionId: string
): Promise<{ data: GroupQuizResult[]; error: unknown }> {
  const { data, error } = await supabase
    .from('learning_attempts')
    .select(`
      child_id,
      theme_id,
      mastery_percent,
      mastery_status,
      correct_count,
      questions_answered,
      themes(name),
      profiles!child_id(display_name)
    `)
    .eq('session_id', sessionId)
    .not('ended_at', 'is', null)

  if (error || !data) return { data: [], error }

  type RawRow = {
    child_id          : string
    theme_id          : string
    mastery_percent   : number | null
    mastery_status    : string | null
    correct_count     : number
    questions_answered: number
    themes            : { name: string } | { name: string }[] | null
    profiles          : { display_name: string } | { display_name: string }[] | null
  }

  const results: GroupQuizResult[] = (data as unknown as RawRow[]).map(row => {
    const themeName = Array.isArray(row.themes)
      ? (row.themes[0]?.name ?? '')
      : ((row.themes as { name?: string } | null)?.name ?? '')
    const displayName = Array.isArray(row.profiles)
      ? (row.profiles[0]?.display_name ?? row.child_id.slice(0, 8))
      : ((row.profiles as { display_name?: string } | null)?.display_name ?? row.child_id.slice(0, 8))
    return {
      childId          : row.child_id,
      displayName,
      themeId          : row.theme_id,
      themeName,
      masteryPercent   : row.mastery_percent,
      masteryStatus    : row.mastery_status as 'acquired' | 'not_acquired' | null,
      correctCount     : row.correct_count,
      questionsAnswered: row.questions_answered,
    }
  })

  return { data: results, error: null }
}
```

Référence jointure `profiles!child_id` : pattern déjà utilisé dans `aureak/packages/api-client/src/sessions/sessions.ts` lignes ~1303-1322.

---

### T2 — Type dans `@aureak/types`

Ajouter dans `aureak/packages/types/src/entities.ts` après la section `LearningAttempt` (ligne ~1068) :

```typescript
/** GroupQuizResult — résultat quiz d'un joueur pour une séance donnée (vue coach) */
export type GroupQuizResult = {
  childId           : string
  displayName       : string
  themeId           : string
  themeName         : string
  masteryPercent    : number | null
  masteryStatus     : 'acquired' | 'not_acquired' | null
  correctCount      : number
  questionsAnswered : number
}
```

---

### T3 — Section UI dans la fiche séance

**State à ajouter** (près des autres states de chargement, ligne ~1102) :

```typescript
const [quizResults,  setQuizResults]  = useState<GroupQuizResult[]>([])
const [loadingQuiz,  setLoadingQuiz]  = useState(false)
```

**Import à ajouter en tête du fichier** :

```typescript
import { listGroupQuizResults } from '@aureak/api-client'
import type { GroupQuizResult } from '@aureak/types'
```

**Chargement (dans le useEffect principal ou dans un useEffect séparé déclenché quand `sessionId` est disponible)** :

```typescript
if (sessionId && session?.groupId) {
  setLoadingQuiz(true)
  try {
    const { data } = await listGroupQuizResults(sessionId)
    setQuizResults(data)
  } finally {
    setLoadingQuiz(false)
  }
}
```

**Section JSX à insérer après la View card Présences (après ligne ~2432)** :

```tsx
{/* Résultats Quiz — Story 8.6 — FR24 */}
{session.groupId && (
  <View style={styles.card}>
    <AureakText variant="label">Résultats Quiz</AureakText>

    {loadingQuiz ? (
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        Chargement…
      </AureakText>
    ) : quizResults.length === 0 ? (
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        Aucun quiz complété pour cette séance
      </AureakText>
    ) : (
      <>
        {/* Tableau joueurs */}
        {quizResults.map((r, idx) => (
          <View
            key={`${r.childId}-${r.themeId}`}
            style={{
              flexDirection    : 'row',
              alignItems       : 'center',
              justifyContent   : 'space-between',
              paddingVertical  : space.xs,
              borderBottomWidth: idx < quizResults.length - 1 ? 1 : 0,
              borderBottomColor: colors.border.light,
            }}
          >
            <AureakText variant="body" style={{ flex: 2 }}>{r.displayName}</AureakText>
            <AureakText variant="caption" style={{ flex: 2, color: colors.text.muted }}>{r.themeName}</AureakText>
            <AureakText variant="caption" style={{ flex: 1, textAlign: 'center' as never }}>
              {r.correctCount}/{r.questionsAnswered}
            </AureakText>
            <AureakText variant="caption" style={{ flex: 1, textAlign: 'center' as never }}>
              {r.masteryPercent != null ? `${r.masteryPercent}%` : '—'}
            </AureakText>
            <View style={{ flex: 1, alignItems: 'flex-end' as never }}>
              <Badge variant={r.masteryStatus === 'acquired' ? 'success' : 'warning'}>
                {r.masteryStatus === 'acquired' ? 'Acquis' : 'En cours'}
              </Badge>
            </View>
          </View>
        ))}

        {/* Maîtrise par thème */}
        {(() => {
          const themeMap: Record<string, { name: string; total: number; acquired: number }> = {}
          for (const r of quizResults) {
            if (!themeMap[r.themeId]) themeMap[r.themeId] = { name: r.themeName, total: 0, acquired: 0 }
            themeMap[r.themeId].total++
            if (r.masteryStatus === 'acquired') themeMap[r.themeId].acquired++
          }
          return (
            <View style={{ marginTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border.divider, paddingTop: space.sm }}>
              <AureakText variant="label" style={{ marginBottom: space.xs }}>Maîtrise par thème</AureakText>
              {Object.values(themeMap).map(t => (
                <View key={t.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <AureakText variant="caption">{t.name}</AureakText>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {t.acquired}/{t.total} ({Math.round((t.acquired / t.total) * 100)}%)
                  </AureakText>
                </View>
              ))}
            </View>
          )
        })()}
      </>
    )}
  </View>
)}
```

Référence pattern card : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` lignes 2333–2432 (section Présences).

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, radius, shadows } from '@aureak/theme'

// Card container
backgroundColor : colors.light.surface  // #FFFFFF
borderRadius    : radius.card            // (token existant)
boxShadow       : shadows.sm
padding         : space.md

// Séparateurs
borderColor : colors.border.light
borderColor : colors.border.divider

// Texte secondaire
color : colors.text.muted
```

Principes design à respecter :
- Profondeur obligatoire : la card a `shadows.sm` (jamais flat)
- Fond clair : `colors.light.surface` pour la card, jamais de fond sombre
- Pas de surcharge d'info : tableau compact, maîtrise par thème résumée en une ligne par thème

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/types/src/entities.ts` | Modifier | Ajouter type `GroupQuizResult` après ligne ~1068 |
| `aureak/packages/api-client/src/learning/learning.ts` | Modifier | Ajouter `listGroupQuizResults` + export type `GroupQuizResult` |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter `listGroupQuizResults` et `GroupQuizResult` depuis `./learning/learning` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier | Ajouter state `quizResults`/`loadingQuiz`, appel API dans useEffect, section JSX après Présences |

### Fichiers à NE PAS modifier

- `supabase/migrations/` — aucune migration nécessaire (tables `learning_attempts`, `themes`, `profiles` déjà en place)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/index.tsx` — re-export inchangé
- `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx` — non impacté
- `aureak/apps/web/app/(admin)/seances/[sessionId]/timeline.tsx` — non impacté
- Toute autre section existante de `page.tsx` — ne pas modifier les sections Présences, Évaluations, Actions rapides existantes

---

### Dépendances à protéger

- `getSessionLearningReport(sessionId)` (ligne 67 de `learning.ts`) — ne pas modifier sa signature, elle est exportée et utilisée ailleurs (Story 8.5)
- Stories 54-x (`SquadStatusGrid`, `handleMarkAllPresent`) dans `page.tsx` — la nouvelle section JSX s'insère APRÈS la section Présences, pas à l'intérieur

---

### Multi-tenant

RLS sur `learning_attempts` : `learning_attempts_tenant_read` (migration 00140) filtre par `tenant_id = current_tenant_id()`. Les coachs peuvent lire les tentatives de leurs séances via la policy coach existante (archive 00025 ligne ~112 : `WHERE sc.session_id = learning_attempts.session_id AND sc.coach_id = auth.uid()`). Aucun paramètre `tenantId` à passer — RLS gère l'isolation.

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Type `LearningAttempt` : `aureak/packages/types/src/entities.ts` lignes 1048–1068
- Fonction API existante `getSessionLearningReport` : `aureak/packages/api-client/src/learning/learning.ts` lignes 67–98
- Pattern jointure profiles : `aureak/packages/api-client/src/sessions/sessions.ts` lignes 1303–1322
- Pattern section card + Badge : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` lignes 2333–2432
- PRD FR24 : "Un Coach peut consulter les résultats de quiz de l'ensemble de son groupe"
- PRD FR72 : "Les résultats de quiz sont agrégés par thème pour analyse longitudinale"
- Story 8.5 (done) : `_bmad-output/implementation-artifacts/8-5-rapports-coach-vue-agregee-groupe-acces-parent.md`

---

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Badge variant fix : `success`/`warning` n'existent pas → remplacés par `present`/`attention` (conformes à BadgeVariant)
- Badge API : utilise prop `label` (pas `children`)
- `space.xxs` n'existe pas → remplacé par valeur fixe `2` (seule valeur non-token tolérée, padding mineur)

### Completion Notes List
- useEffect dédié déclenché sur `[sessionId, session?.groupId]` (pattern isolated, pas dans le useEffect principal)
- `GroupQuizResult` ajouté dans `@aureak/types/src/entities.ts` ET re-exporté depuis `@aureak/api-client` (type seul via `export type { GroupQuizResult }` dans learning.ts)
- `profiles!child_id(display_name)` : jointure Supabase via hint FK, pattern identique à sessions.ts

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/types/src/entities.ts` | Modifié — `GroupQuizResult` ajouté après `LearningAttempt` |
| `aureak/packages/api-client/src/learning/learning.ts` | Modifié — `listGroupQuizResults` + `export type { GroupQuizResult }` |
| `aureak/packages/api-client/src/index.ts` | Modifié — exports `listGroupQuizResults` + `GroupQuizResult` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifié — state, useEffect, section JSX "Résultats Quiz" |
