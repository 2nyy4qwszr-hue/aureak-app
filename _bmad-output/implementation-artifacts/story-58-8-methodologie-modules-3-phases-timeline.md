# Story 58-8 — Méthodologie : Modules 3 phases — timeline visuelle de séance

**Epic** : 58 — Méthodologie "Tactical Notebook"
**Status** : done
**Priority** : medium
**Effort** : M (demi-journée)

---

## Contexte

La migration `00111_methodology_sessions_modules.sql` a introduit la notion de modules sur les séances pédagogiques (table `methodology_session_modules`). Cette story rend ce concept visible dans l'interface : une timeline visuelle des 3 phases — Activation / Développement / Conclusion — avec durées et contenu, dans la fiche séance et dans le wizard de création.

---

## User Story

**En tant que** coach ou administrateur Aureak,
**je veux** voir et éditer la structure en 3 phases de mes séances sous forme de timeline visuelle,
**afin de** m'assurer que chaque séance est pédagogiquement équilibrée et bien structurée dans le temps.

---

## Acceptance Criteria

- [ ] AC1 — La fiche détail d'une séance (`seances/[sessionId]/`) affiche une section "Structure de la séance" avec une timeline horizontale en 3 blocs : **Activation** (fond vert clair), **Développement** (fond or), **Conclusion** (fond bleu) — largeur proportionnelle à la durée de chaque phase
- [ ] AC2 — Chaque bloc de la timeline affiche : nom de la phase, durée en minutes, et les 1–3 premières situations associées (ellipsis si plus)
- [ ] AC3 — Les 3 phases correspondent à `module_type = 'activation' | 'development' | 'conclusion'` dans `methodology_session_modules` — si un module n'existe pas pour une phase, le bloc affiche "— Non configuré —" en gris
- [ ] AC4 — Un clic sur un bloc de la timeline ouvre un panel d'édition inline permettant de : modifier la durée (en minutes, stepper +5/-5), et ajouter/retirer des situations associées au module
- [ ] AC5 — Les types `MethodologyModuleType = 'activation' | 'development' | 'conclusion'` et `MethodologySessionModule = { id, sessionId, moduleType, durationMinutes, situations: MethodologySituation[] }` sont ajoutés dans `@aureak/types`
- [ ] AC6 — Les fonctions API suivantes sont créées dans `@aureak/api-client/src/methodology.ts` :
  - `listSessionModules(methodologySessionId: string)` — retourne les modules d'une séance pédagogique
  - `upsertSessionModule(methodologySessionId, moduleType, durationMinutes)` — crée ou met à jour
  - `addSituationToModule(moduleId, situationId)` et `removeSituationFromModule(moduleId, situationId)`
- [ ] AC7 — Dans le wizard `seances/new.tsx`, l'étape "Contenu" inclut les 3 blocs de phase (timeline verticale sur mobile, horizontale sur desktop) avec les durées éditables par stepper — la somme des 3 durées est affichée et comparée à la durée totale de la séance (`durationMinutes` du groupe)
- [ ] AC8 — Si la somme des durées dépasse la durée totale prévue, un warning visuel s'affiche (bordure rouge sur le bloc dépassant, texte "Total dépassé")
- [ ] AC9 — `try/finally` sur tous les setters de chargement/sauvegarde ; `console.error` guardé
- [ ] AC10 — Les couleurs des phases sont des tokens nommés dans `@aureak/theme` : `colors.phase.activation` (#D4EDDA), `colors.phase.development` (#FFF3CD), `colors.phase.conclusion` (#CCE5FF) — si ces tokens n'existent pas, les créer dans `tokens.ts`

---

## Tasks

### T1 — Tokens couleurs phases dans `@aureak/theme`

Fichier : `aureak/packages/theme/tokens.ts`

Ajouter si absent :
```typescript
phase: {
  activation : '#D4EDDA',   // vert clair
  development: '#FFF3CD',   // or clair
  conclusion : '#CCE5FF',   // bleu clair
},
```

- [ ] Tokens `colors.phase.*` ajoutés

### T2 — Types TS dans `@aureak/types`

Fichier : `aureak/packages/types/src/entities.ts`

```typescript
export type MethodologyModuleType = 'activation' | 'development' | 'conclusion'

export type MethodologySessionModule = {
  id              : string
  sessionId       : string  // methodology_session_id
  moduleType      : MethodologyModuleType
  durationMinutes : number
  situations      : MethodologySituation[]
}
```

Fichier : `aureak/packages/types/src/enums.ts`

```typescript
export const MODULE_LABELS: Record<MethodologyModuleType, string> = {
  activation : 'Activation',
  development: 'Développement',
  conclusion : 'Conclusion',
}

export const MODULE_TYPES: MethodologyModuleType[] = ['activation', 'development', 'conclusion']
```

- [ ] Types et constantes ajoutés

### T3 — Fonctions API

Fichier : `aureak/packages/api-client/src/methodology.ts`

```typescript
export async function listSessionModules(
  methodologySessionId: string,
): Promise<{ data: MethodologySessionModule[]; error: unknown }> {
  const { data, error } = await supabase
    .from('methodology_session_modules')
    .select(`
      id,
      methodology_session_id,
      module_type,
      duration_minutes,
      methodology_module_situations (
        methodology_situations ( * )
      )
    `)
    .eq('methodology_session_id', methodologySessionId)
    .order('module_type')

  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[listSessionModules] error:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map((row: any) => ({
      id             : row.id,
      sessionId      : row.methodology_session_id,
      moduleType     : row.module_type,
      durationMinutes: row.duration_minutes ?? 0,
      situations     : (row.methodology_module_situations ?? [])
        .map((s: any) => mapMethodologySituation(s.methodology_situations))
        .filter(Boolean),
    })),
    error: null,
  }
}

export async function upsertSessionModule(
  methodologySessionId: string,
  moduleType          : MethodologyModuleType,
  durationMinutes     : number,
): Promise<{ data: { id: string } | null; error: unknown }> {
  const { data, error } = await supabase
    .from('methodology_session_modules')
    .upsert(
      { methodology_session_id: methodologySessionId, module_type: moduleType, duration_minutes: durationMinutes },
      { onConflict: 'methodology_session_id,module_type' },
    )
    .select('id')
    .single()
  if (error && process.env.NODE_ENV !== 'production')
    console.error('[upsertSessionModule] error:', error)
  return { data: data ?? null, error }
}
```

- [ ] Fonctions `listSessionModules`, `upsertSessionModule` créées et exportées
- [ ] Fonctions `addSituationToModule`, `removeSituationFromModule` créées

### T4 — Composant `SessionTimeline`

Fichier : `aureak/apps/web/app/(admin)/seances/_components/SessionTimeline.tsx` (nouveau)

Props :
```typescript
type Props = {
  modules       : MethodologySessionModule[]
  totalDuration : number   // minutes — durée prévue du groupe
  onEditModule  : (moduleType: MethodologyModuleType) => void
  readOnly?     : boolean
}
```

Affichage :
- Flex row (desktop) / flex column (mobile via `useWindowDimensions`)
- Chaque bloc : largeur proportionnelle `(duration/totalDuration)*100%`, min 80px
- Couleur fond : `colors.phase[module.moduleType]`
- Texte : label + durée + noms situations (max 2, ellipsis)
- Clic → `onEditModule(moduleType)`
- Warning si total > totalDuration : bordure `colors.accent.red` sur le bloc dépassant

- [ ] Composant `SessionTimeline` créé

### T5 — Intégration dans la fiche séance

Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/index.tsx`

```typescript
const [sessionModules,  setSessionModules]  = useState<MethodologySessionModule[]>([])
const [loadingModules,  setLoadingModules]  = useState(false)
const [editingModule,   setEditingModule]   = useState<MethodologyModuleType | null>(null)
const [savingModule,    setSavingModule]    = useState(false)

useEffect(() => {
  if (!session?.methodologySessionId) return
  setLoadingModules(true)
  listSessionModules(session.methodologySessionId)
    .then(res => { if (res.data) setSessionModules(res.data) })
    .catch(err => {
      if (process.env.NODE_ENV !== 'production')
        console.error('[SessionPage] loadModules error:', err)
    })
    .finally(() => setLoadingModules(false))
}, [session?.methodologySessionId])

const handleSaveModule = async (moduleType: MethodologyModuleType, durationMinutes: number) => {
  if (!session?.methodologySessionId) return
  setSavingModule(true)
  try {
    const { error } = await upsertSessionModule(session.methodologySessionId, moduleType, durationMinutes)
    if (error && process.env.NODE_ENV !== 'production')
      console.error('[SessionPage] saveModule error:', error)
    else {
      setSessionModules(prev =>
        prev.map(m => m.moduleType === moduleType ? { ...m, durationMinutes } : m)
      )
    }
  } finally {
    setSavingModule(false)
  }
}
```

- [ ] Section "Structure de la séance" intégrée avec `SessionTimeline`
- [ ] Panel édition module avec stepper durée

### T6 — Intégration dans `seances/new.tsx`

Ajouter les 3 blocs phase dans l'étape contenu avec durées éditables et warning de dépassement.

- [ ] Timeline verticale (mobile) / horizontale (desktop) dans wizard

---

## Dépendances

- Migration `00111` `done` — `methodology_session_modules` table existante
- Epic 20 `done` — `methodology_sessions` + `MethodologySituation` disponibles
- Story 58-6 (recommandé) — `difficultyLevel` pour enrichir les situations dans les modules

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `aureak/packages/theme/tokens.ts` | Modifier — `colors.phase.*` |
| `aureak/packages/types/src/entities.ts` | Modifier — `MethodologyModuleType`, `MethodologySessionModule` |
| `aureak/packages/types/src/enums.ts` | Modifier — `MODULE_LABELS`, `MODULE_TYPES` |
| `aureak/packages/api-client/src/methodology.ts` | Modifier — `listSessionModules`, `upsertSessionModule`, etc. |
| `aureak/apps/web/app/(admin)/seances/_components/SessionTimeline.tsx` | Créer |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/index.tsx` | Modifier — section structure |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Modifier — étape contenu phases |

---

## QA post-story

```bash
grep -n "setLoadingModules\|setSavingModule" aureak/apps/web/app/(admin)/seances/\[sessionId\]/index.tsx
grep -n "finally" aureak/apps/web/app/(admin)/seances/\[sessionId\]/index.tsx
grep -n "console\." aureak/packages/api-client/src/methodology.ts | grep -v "NODE_ENV"
```

---

## Commit message cible

```
feat(epic-58): story 58-8 — méthodologie timeline 3 phases activation/développement/conclusion
```
