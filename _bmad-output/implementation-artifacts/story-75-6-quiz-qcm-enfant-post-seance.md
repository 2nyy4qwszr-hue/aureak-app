# Story 75.6 : Quiz QCM enfant post-séance (UI parent)

Status: done

## Story

En tant que parent,
je veux accéder à un quiz QCM pour mon enfant depuis la fiche enfant, avec 5 questions tirées des thèmes de la dernière séance,
afin que mon enfant puisse ancrer les apprentissages de la séance en répondant à des questions interactives directement après l'entraînement.

## Acceptance Criteria

1. La route `/parent/children/[childId]/quiz` est accessible et affiche une page de quiz mobile-friendly.
2. Au chargement, le système récupère la dernière séance de l'enfant (via `session_attendees` + `sessions` ordonnés par `scheduled_at DESC`), puis les thèmes liés (`session_themes`), puis tire jusqu'à 5 questions publiées parmi ces thèmes (`quiz_questions` + `quiz_options`).
3. Si aucune séance n'est trouvée, ou si aucun thème ne possède de question publiée, un message d'état clair s'affiche ("Aucune question disponible pour la dernière séance.") — pas d'écran blanc ni d'erreur JS.
4. Chaque question est présentée une par une (mode stepper) : énoncé + 4 options max disposées en colonne — tap/clic sur une option la sélectionne visuellement et révèle immédiatement si elle est correcte (fond vert/rouge + icône ✓/✗) sans permettre de re-sélection.
5. Un bouton "Question suivante" (ou "Voir résultats" à la dernière question) permet de progresser — il n'est actif qu'après qu'une option a été choisie.
6. Après la dernière question, un écran de résultats affiche le score (X / Y), un message d'encouragement contextuel (≥4/5 : "Excellent !", 3/5 : "Bien joué !", <3 : "Continue, tu vas y arriver !"), et un bouton "Retour à la fiche".
7. Les résultats sont sauvegardés en base via `createLearningAttempt` + `submitAnswer` (RPC existants) — l'`attemptId` est créé au début du quiz avec `sessionId` de la séance trouvée et `themeId` du premier thème disponible.
8. La page s'intègre dans le SubNav de la fiche enfant avec un onglet "Quiz" entre "Progression" et "Football".
9. Un état de chargement (skeleton) est affiché pendant la récupération des questions — aucun layout shift.
10. Conformité design : tokens `@aureak/theme` exclusivement (pas de couleurs hardcodées), `colors.light.primary` fond, `colors.light.surface` cards question, `colors.status.present` correct, `colors.status.absent` incorrect, `colors.accent.gold` bouton CTA.

## Tasks / Subtasks

- [x] T1 — Nouvelle fonction API `getLastSessionQuiz` dans `@aureak/api-client` (AC: 2, 3, 7)
  - [x] T1.1 — Créer `aureak/packages/api-client/src/child/childQuiz.ts` avec la fonction `getLastSessionQuiz(childId)` qui : (1) récupère la dernière séance via `session_attendees → sessions`, (2) charge les thèmes via `session_themes`, (3) tire jusqu'à 5 questions publiées avec options via `listPublishedByTheme` + `listOptionsByQuestionIds`, (4) retourne `{ sessionId, questions: QuizQuestion & { options: QuizOption[] }[], error }`
  - [x] T1.2 — Exporter `getLastSessionQuiz` depuis `aureak/packages/api-client/src/index.ts`

- [x] T2 — Page quiz `/parent/children/[childId]/quiz` (AC: 1, 4, 5, 6, 8, 9, 10)
  - [x] T2.1 — Créer `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` (composant principal)
  - [x] T2.2 — Créer `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/index.tsx` (re-export de `./page`)
  - [x] T2.3 — Implémenter le stepper : état `currentIndex`, `selectedOptionId`, `showResult`, `answers[]`
  - [x] T2.4 — Implémenter l'écran résultats avec score + message d'encouragement contextuel + bouton retour
  - [x] T2.5 — Implémenter le skeleton de chargement (3 cartes grises animées)
  - [x] T2.6 — Implémenter le cas vide ("Aucune question disponible")

- [x] T3 — Intégration SubNav (AC: 8)
  - [x] T3.1 — Ajouter l'onglet "Quiz" dans le SubNav de `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` entre "Progression" et "Football"

- [x] T4 — Sauvegarde résultats (AC: 7)
  - [x] T4.1 — Appeler `createLearningAttempt(sessionId, firstThemeId)` au début de la tentative (au premier passage à la question 1)
  - [x] T4.2 — Appeler `submitAnswer(attemptId, questionId, selectedOptionId)` après chaque réponse
  - [x] T4.3 — Appeler `stopAttempt(attemptId, 'child_stopped')` à la fin du quiz (dernier AC)

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Naviguer vers `/parent/children/{childId}/quiz`, vérifier le rendu questions + options
  - [x] T5.2 — Sélectionner une bonne réponse → vérifier fond vert, puis mauvaise → vérifier fond rouge
  - [x] T5.3 — Compléter les 5 questions → vérifier l'écran résultats avec le bon score
  - [x] T5.4 — Vérifier l'onglet "Quiz" visible dans le SubNav de la fiche enfant
  - [x] T5.5 — Grep les fichiers créés : pas de couleur hardcodée, try/finally sur setLoading

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

### T1 — Fonction API `getLastSessionQuiz`

**Fichier à créer** : `aureak/packages/api-client/src/child/childQuiz.ts`

La logique en 3 étapes :

```typescript
// Step 1 : dernière séance de l'enfant
const { data: attendeeRows } = await supabase
  .from('session_attendees')
  .select('session_id')
  .eq('child_id', childId)

const sessionIds = (attendeeRows ?? []).map(r => r.session_id)

const { data: sessions } = await supabase
  .from('sessions')
  .select('id, scheduled_at')
  .in('id', sessionIds)
  .order('scheduled_at', { ascending: false })
  .limit(1)

const lastSession = sessions?.[0]
if (!lastSession) return { sessionId: null, firstThemeId: null, questions: [], error: null }

// Step 2 : thèmes de la séance
const { data: themeLinks } = await supabase
  .from('session_themes')
  .select('theme_id')
  .eq('session_id', lastSession.id)
  .order('sort_order', { ascending: true })

const themeIds = (themeLinks ?? []).map(r => r.theme_id)
if (themeIds.length === 0) return { sessionId: lastSession.id, firstThemeId: null, questions: [], error: null }

// Step 3 : questions publiées des thèmes (max 5)
const allQuestions: (QuizQuestion & { options: QuizOption[] })[] = []
for (const themeId of themeIds) {
  const { data: qs } = await listPublishedByTheme(themeId)  // fonction existante
  if (qs && qs.length > 0) {
    const qIds = qs.map(q => q.id)
    const opts = await listOptionsByQuestionIds(qIds)       // fonction existante
    const optMap = new Map<string, QuizOption[]>>()
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
  sessionId    : lastSession.id,
  firstThemeId : themeIds[0],
  questions    : allQuestions.slice(0, 5),
  error        : null,
}
```

**Type de retour** :
```typescript
export type ChildQuizData = {
  sessionId    : string | null
  firstThemeId : string | null
  questions    : (QuizQuestion & { options: QuizOption[] })[]
  error        : unknown
}
```

Import nécessaire dans `childQuiz.ts` :
```typescript
import { listPublishedByTheme, listOptionsByQuestionIds } from '../referentiel/quiz'
import type { QuizQuestion, QuizOption } from '@aureak/types'
```

---

### T2 — Page quiz (structure stepper)

**Pattern state minimal** :
```typescript
const [quizData,       setQuizData]       = useState<ChildQuizData | null>(null)
const [loading,        setLoading]        = useState(true)
const [currentIndex,   setCurrentIndex]   = useState(0)
const [selectedOption, setSelectedOption] = useState<string | null>(null)
const [showResult,     setShowResult]     = useState(false)
const [answers,        setAnswers]        = useState<{ questionId: string; optionId: string; isCorrect: boolean }[]>([])
const [attemptId,      setAttemptId]      = useState<string | null>(null)
const [attemptStarted, setAttemptStarted] = useState(false)
```

**Déclenchement `createLearningAttempt`** : au moment où l'utilisateur sélectionne la **première réponse** (pas au chargement), pour éviter des tentatives vides.

**Affichage option** :
```typescript
const optionBg = (opt: QuizOption) => {
  if (!showResult || selectedOption !== opt.id) return colors.light.surface
  return opt.isCorrect ? colors.status.present + '22' : colors.status.absent + '22'
}
const optionBorder = (opt: QuizOption) => {
  if (!showResult || selectedOption !== opt.id) return colors.border.light
  return opt.isCorrect ? colors.status.present : colors.status.absent
}
```

**Message d'encouragement** :
```typescript
const encouragement = (correct: number, total: number) => {
  if (correct >= 4) return 'Excellent travail ! Tu maîtrises bien ces thèmes. 🏆'
  if (correct === 3) return 'Bien joué ! Continue à t\'entraîner. 💪'
  return 'Continue, tu vas y arriver ! Relis les thèmes de séance. 🎯'
}
```

**Référence pattern** : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` — structure SubNav, Skeleton, page light premium

---

### T3 — SubNav mise à jour

Fichier : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx`

Ajouter dans le tableau `tabs` de la fonction `SubNav` :
```typescript
{ label: 'Quiz', href: `/parent/children/${childId}/quiz` },
```
**Position** : après `{ label: 'Progression', ... }` et avant `{ label: 'Football', ... }`.

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

// Bouton CTA (Suivant / Voir résultats)
backgroundColor : colors.accent.gold   // désactivé → colors.light.muted

// Score écran final
color           : colors.accent.gold
```

Principes design à respecter :
- Mobile-first : options en colonne pleine largeur, padding généreux (16px+), tap target ≥ 48px
- Feedback immédiat sur sélection : pas d'animation complexe, simple changement bg + border
- Progression visible : indicateur "Question X / Y" en haut de la card

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/api-client/src/child/childQuiz.ts` | Créer | Fonction `getLastSessionQuiz` |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter `getLastSessionQuiz`, `ChildQuizData` |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` | Créer | Composant principal quiz stepper |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/index.tsx` | Créer | Re-export de `./page` |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` | Modifier | Ajouter onglet "Quiz" dans SubNav |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/referentiel/quiz.ts` — ne pas modifier les fonctions existantes, seulement les importer
- `aureak/packages/api-client/src/learning/learning.ts` — fonctions `createLearningAttempt`, `submitAnswer`, `stopAttempt` utilisées telles quelles
- `aureak/packages/types/src/entities.ts` — `QuizQuestion`, `QuizOption`, `LearningAttempt` types existants suffisants
- `supabase/migrations/` — aucune migration nécessaire, toutes les tables existent

---

### Dépendances à protéger

- `index.tsx` (fiche enfant) utilise `SubNav` avec la liste `tabs` hardcodée — ne modifier que le tableau `tabs`, pas la structure du composant
- `createLearningAttempt` attend `(sessionId: string | null, themeId: string)` — respecter la signature exacte
- `submitAnswer` attend `(attemptId, questionId, selectedOptionId)` — respecter la signature exacte

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- `QuizQuestion`, `QuizOption` : `aureak/packages/types/src/entities.ts` lignes 308–332
- `createLearningAttempt`, `submitAnswer`, `stopAttempt` : `aureak/packages/api-client/src/learning/learning.ts`
- `listPublishedByTheme`, `listOptionsByQuestionIds` : `aureak/packages/api-client/src/referentiel/quiz.ts`
- Pattern page parent enfant : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx`
- Pattern page progress : `aureak/apps/web/app/(parent)/parent/children/[childId]/progress/index.tsx`
- Pattern SubNav : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` lignes 93–127

---

### Multi-tenant

RLS gère l'isolation sur `sessions`, `session_attendees`, `session_themes`, `quiz_questions`, `quiz_options`, `learning_attempts`, `learning_answers`. Aucun paramètre `tenantId` à passer manuellement — le JWT claim suffit.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun bug bloquant. TypeScript compile proprement (exit 0).

### Completion Notes List
- `setLoading(false)` est bien dans un `finally` (ligne 127 de page.tsx) — grep correct
- `createLearningAttempt` déclenché sur la première interaction utilisateur (pas au chargement)
- Skeleton animé avec `@keyframes cp` conforme au pattern existant de la fiche enfant

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/child/childQuiz.ts` | Créé |
| `aureak/packages/api-client/src/index.ts` | Modifié |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/page.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/quiz/index.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx` | Modifié (onglet Quiz SubNav) |
