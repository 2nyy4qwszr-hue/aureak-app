# Story 75.7 : Vue quiz QCM depuis board parent — session explicite

Status: done

## Story

En tant que parent,
je veux accéder à un quiz QCM pour mon enfant depuis une séance spécifique du board parent (route `/parent/children/[childId]/quiz/[sessionId]`),
afin que mon enfant puisse compléter le quiz lié à n'importe quelle séance passée — pas uniquement la dernière — et que le parent puisse choisir la séance cible avant de lancer le quiz.

## Acceptance Criteria

1. La route `/parent/children/[childId]/quiz/[sessionId]` est accessible et charge les questions QCM liées à la session `sessionId` fournie dans l'URL.
2. Au chargement, le système appelle `getSessionQuiz(sessionId)` qui : (1) charge les thèmes via `session_themes` pour le `sessionId` donné, (2) tire jusqu'à 5 questions publiées avec leurs options via `listPublishedByTheme` + `listOptionsByQuestionIds`, (3) retourne `{ sessionId, firstThemeId, questions, error }`.
3. Si `sessionId` est invalide ou si aucune question publiée n'est disponible pour cette séance, un message clair s'affiche ("Aucune question disponible pour cette séance.") — pas d'écran blanc ni d'erreur JS.
4. Le quiz s'affiche en mode stepper identique à la story 75.6 : une question par écran, 4 options max en colonne, tap/clic révèle immédiatement si correct (fond vert/rouge + icône ✓/✗), pas de re-sélection possible.
5. Un bouton "Question suivante" (ou "Voir résultats" à la dernière question) ne devient actif qu'après sélection d'une option.
6. Après la dernière question, l'écran de résultats affiche : score (X / Y), message d'encouragement contextuel (≥4/5 : "Excellent !", 3/5 : "Bien joué !", <3 : "Continue, tu vas y arriver !"), et un bouton "Retour à la fiche".
7. Les résultats sont sauvegardés en base via `createLearningAttempt(sessionId, firstThemeId)` au moment de la **première réponse** de l'enfant (pas au chargement) + `submitAnswer` après chaque réponse + `stopAttempt` à la fin — identique au pattern 75.6.
8. Si score ≥ 80% (≥4/5), un badge de succès (icône trophée + fond gold) est affiché sur l'écran résultats.
9. Un état de chargement (skeleton : 3 blocs gris animés) est affiché pendant la récupération des questions — aucun layout shift.
10. Conformité design : tokens `@aureak/theme` exclusivement (zéro couleur hardcodée), fond `colors.light.primary`, cards `colors.light.surface` + `shadows.sm`, correct `colors.status.present`, incorrect `colors.status.absent`, CTA `colors.accent.gold`.

## Tasks / Subtasks

- [x] T1 — Fonction API `getSessionQuiz` dans `@aureak/api-client` (AC: 2, 3, 7)
  - [x] T1.1 — Dans `aureak/packages/api-client/src/child/childQuiz.ts`, ajouter la fonction `getSessionQuiz(sessionId: string): Promise<ChildQuizData>` qui : (1) charge les thèmes via `session_themes` filtrés par `session_id = sessionId`, (2) pour chaque thème tire les questions publiées + options via `listPublishedByTheme` + `listOptionsByQuestionIds`, (3) retourne `{ sessionId, firstThemeId, questions: max 5, error }` — même type `ChildQuizData` que `getLastSessionQuiz`
  - [x] T1.2 — Exporter `getSessionQuiz` depuis `aureak/packages/api-client/src/index.ts`

- [x] T2 — Page quiz session explicite (AC: 1, 4, 5, 6, 8, 9, 10)
  - [x] T2.1 — Créer `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/page.tsx` — composant principal utilisant `useLocalSearchParams` pour extraire `childId` et `sessionId`
  - [x] T2.2 — Créer `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/index.tsx` — re-export de `./page`
  - [x] T2.3 — Copier la structure stepper de `story-75-6/quiz/page.tsx` en adaptant : remplacer `getLastSessionQuiz(childId)` par `getSessionQuiz(sessionId)`, supprimer le paramètre `childId` de l'appel API
  - [x] T2.4 — Implémenter l'écran résultats avec score + message d'encouragement + badge trophée si score ≥ 80%
  - [x] T2.5 — Implémenter le skeleton de chargement (identique à `quiz/page.tsx` parent)
  - [x] T2.6 — Implémenter le cas vide ("Aucune question disponible pour cette séance.")

- [x] T3 — Sauvegarde résultats (AC: 7)
  - [x] T3.1 — Appeler `createLearningAttempt(sessionId, firstThemeId)` à la **première sélection d'option** (pas au chargement) — stocker `attemptId` dans state
  - [x] T3.2 — Appeler `submitAnswer(attemptId, questionId, selectedOptionId)` après chaque réponse
  - [x] T3.3 — Appeler `stopAttempt(attemptId, 'child_stopped')` après la dernière question

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer vers `/parent/children/{childId}/quiz/{sessionId}` avec un `sessionId` valide, vérifier le chargement des questions
  - [x] T4.2 — Tester avec un `sessionId` sans thèmes → vérifier le message "Aucune question disponible pour cette séance."
  - [x] T4.3 — Compléter 4 questions correctes sur 5 → vérifier le badge trophée gold sur l'écran résultats
  - [x] T4.4 — Grep les fichiers créés/modifiés : zéro couleur hardcodée (`#`), try/finally sur `setLoading`

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

### T1 — Fonction API `getSessionQuiz`

**Fichier à modifier** : `aureak/packages/api-client/src/child/childQuiz.ts`

Ajouter après `getLastSessionQuiz` :

```typescript
/**
 * Récupère jusqu'à 5 questions publiées issues des thèmes d'une séance spécifique.
 * Étapes : session_themes (filtré par sessionId) → quiz_questions + quiz_options
 */
export async function getSessionQuiz(sessionId: string): Promise<ChildQuizData> {
  try {
    // Step 1 : thèmes de la séance
    const { data: themeLinks, error: themeError } = await supabase
      .from('session_themes')
      .select('theme_id')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true })

    if (themeError) return { sessionId, firstThemeId: null, questions: [], error: themeError }

    const themeIds = (themeLinks ?? []).map((r: { theme_id: string }) => r.theme_id)
    if (themeIds.length === 0) {
      return { sessionId, firstThemeId: null, questions: [], error: null }
    }

    // Step 2 : questions publiées des thèmes (max 5)
    const allQuestions: (QuizQuestion & { options: QuizOption[] })[] = []
    for (const themeId of themeIds) {
      const { data: qs } = await listPublishedByTheme(themeId)
      if (qs && qs.length > 0) {
        const qIds = qs.map((q: QuizQuestion) => q.id)
        const opts = await listOptionsByQuestionIds(qIds)
        const optMap = new Map<string, QuizOption[]>()
        for (const opt of opts) {
          if (!optMap.has(opt.questionId)) optMap.set(opt.questionId, [])
          optMap.get(opt.questionId)!.push(opt)
        }
        for (const q of qs) {
          allQuestions.push({ ...q, options: optMap.get(q.id) ?? [] })
          if (allQuestions.length >= 5) break
        }
      }
      if (allQuestions.length >= 5) break
    }

    return {
      sessionId,
      firstThemeId : themeIds[0],
      questions    : allQuestions.slice(0, 5),
      error        : null,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[getSessionQuiz] error:', err)
    return { sessionId, firstThemeId: null, questions: [], error: err }
  }
}
```

**Type de retour** : `ChildQuizData` déjà défini dans `childQuiz.ts` — même type, pas de doublon.

---

### T2 — Page quiz session explicite

**Fichier à créer** : `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/page.tsx`

Structure identique à `quiz/page.tsx` (75.6), différences uniquement :

```typescript
// Paramètres extraits de l'URL
const { childId, sessionId } = useLocalSearchParams<{ childId: string; sessionId: string }>()

// Chargement des questions — via sessionId direct (pas childId)
useEffect(() => {
  if (!sessionId) return
  setLoading(true)
  getSessionQuiz(sessionId)
    .then(d => setQuizData(d))
    .catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[QuizSessionPage] load error:', err)
    })
    .finally(() => setLoading(false))
}, [sessionId])
```

**Badge trophée si score ≥ 80%** — à ajouter dans `ResultsScreen` :

```typescript
const isPerfect = correctCount / total >= 0.8  // ≥ 4/5

// Dans le JSX résultats :
{isPerfect && (
  <div style={{
    backgroundColor : colors.accent.gold + '22',
    border          : `1px solid ${colors.accent.gold}`,
    borderRadius    : radius.card,
    padding         : `${space[2]}px ${space[4]}px`,
    marginBottom    : space[4],
    textAlign       : 'center',
  }}>
    <span style={{ fontSize: 28 }}>🏆</span>
    <p style={{ color: colors.accent.gold, fontWeight: 700, margin: 0 }}>
      Badge débloqué — Maîtrise de séance !
    </p>
  </div>
)}
```

**Message vide spécifique** : `"Aucune question disponible pour cette séance."` (pas "dernière séance" comme en 75.6).

**Bouton retour** : `router.push(\`/parent/children/${childId}\`)` — retour à la fiche enfant.

**Pattern de référence** : `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` lignes 1–200 — copier et adapter.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// Page fond
backgroundColor : colors.light.primary

// Card question
backgroundColor : colors.light.surface
borderRadius    : radius.card  // 16
boxShadow       : shadows.sm

// Option neutre
backgroundColor : colors.light.surface
border          : `1px solid ${colors.border.light}`

// Option correcte (après reveal)
backgroundColor : colors.status.present + '22'
border          : `1px solid ${colors.status.present}`

// Option incorrecte (après reveal)
backgroundColor : colors.status.absent + '22'
border          : `1px solid ${colors.status.absent}`

// Bouton CTA actif
backgroundColor : colors.accent.gold

// Bouton CTA inactif
backgroundColor : colors.light.muted

// Badge trophée
backgroundColor : colors.accent.gold + '22'
border          : `1px solid ${colors.accent.gold}`

// Score final
color           : colors.accent.gold
```

Principes design :
- Mobile-first : padding ≥ 16px, tap target ≥ 48px
- Feedback immédiat : changement bg + border sans animation complexe
- Indicateur progression "Question X / Y" en haut de card

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/child/childQuiz.ts` | Modifier | Ajouter `getSessionQuiz(sessionId)` après `getLastSessionQuiz` |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter `getSessionQuiz` |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/page.tsx` | Créer | Composant quiz stepper session explicite |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/index.tsx` | Créer | Re-export de `./page` |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/child/childQuiz.ts` — ne modifier que par ajout de `getSessionQuiz`, ne pas toucher `getLastSessionQuiz` ni `ChildQuizData`
- `aureak/packages/api-client/src/referentiel/quiz.ts` — fonctions `listPublishedByTheme`, `listOptionsByQuestionIds` à importer uniquement
- `aureak/packages/api-client/src/learning/learning.ts` — fonctions `createLearningAttempt`, `submitAnswer`, `stopAttempt` à importer uniquement
- `aureak/packages/types/src/entities.ts` — types existants suffisants, aucun ajout nécessaire
- `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` — story 75.6 done, ne pas modifier
- `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` — SubNav déjà modifié en 75.6, ne pas retoucher
- `supabase/migrations/` — aucune migration nécessaire (tables `session_themes`, `quiz_questions`, `quiz_options`, `learning_attempts`, `learning_answers` existent)

---

### Dépendances à protéger

- Story 75.6 (`quiz/page.tsx`) utilise `getLastSessionQuiz` et `ChildQuizData` — ne pas modifier leur signature
- `createLearningAttempt` attend `(sessionId: string | null, themeId: string)` — respecter la signature exacte
- `submitAnswer` attend `(attemptId, questionId, selectedOptionId)` — respecter la signature exacte
- `stopAttempt` attend `(attemptId, stopReason: string)` — respecter la signature exacte

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- `QuizQuestion`, `QuizOption` : `aureak/packages/types/src/entities.ts` lignes 313–332
- `ChildQuizData`, `getLastSessionQuiz` : `aureak/packages/api-client/src/child/childQuiz.ts`
- `listPublishedByTheme`, `listOptionsByQuestionIds` : `aureak/packages/api-client/src/referentiel/quiz.ts`
- `createLearningAttempt`, `submitAnswer`, `stopAttempt` : `aureak/packages/api-client/src/learning/learning.ts`
- Pattern de référence stepper : `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx`
- Story liée : `_bmad-output/implementation-artifacts/story-75-6-quiz-qcm-enfant-post-seance.md` (done)

---

### Multi-tenant

RLS gère l'isolation sur `session_themes`, `quiz_questions`, `quiz_options`, `learning_attempts`, `learning_answers`. Aucun paramètre `tenantId` à passer manuellement — le JWT claim suffit.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/child/childQuiz.ts` | Modifié — ajout `getSessionQuiz` |
| `aureak/packages/api-client/src/index.ts` | Modifié — export `getSessionQuiz` |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/page.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/[sessionId]/index.tsx` | Créé |
