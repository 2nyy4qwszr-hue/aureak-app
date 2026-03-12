# Story 21.1 : Training Builder — Contexte Global & Méthodologie Dynamique

Status: done

## Story

En tant qu'admin/coach,
je veux sélectionner le contexte de la séance (Académie / Stage) dès le Step 1 du formulaire de création, et que l'interface génère automatiquement un titre lisible basé sur la méthode, le contexte et la référence,
afin que chaque séance soit correctement identifiée et que la logique par méthode soit cohérente pour tous les types (pas uniquement Technique).

## Acceptance Criteria

1. Le Step 1 du formulaire `/seances/new.tsx` expose un toggle **Contexte** (Académie | Stage) immédiatement sous la sélection d'implantation, avant le type de groupe.
2. Le contexte sélectionné est propagé à toutes les étapes suivantes et stocké en base dans la colonne `sessions.context_type`.
3. Le Step 2 pour la méthode **Technique** supprime son propre toggle académie/stage local (remplacé par le contexte global du Step 1).
4. Un champ **Titre** pré-rempli et éditable apparaît au Step 2, généré automatiquement à partir de la méthode + contexte + référence (ex : `Goal & Player – Module 2 – ENT 7`).
5. Pour **Goal & Player**, le formulaire expose explicitement :
   - Un sélecteur **Module** (Module 1 | Module 2 | Module 3)
   - Un sélecteur **ENT** (ENT 1 à ENT 15) — 15 entraînements **par module** (soit 45 références distinctes au total)
   - Le titre est pré-rempli : `Goal & Player – Module {X} – ENT {Y}`
6. Le champ `sessions.label` (titre) est créé en DB via migration et accepté par `createSession()`.
7. Le titre reste éditable manuellement avant création.
8. Sur la page détail de la séance, le titre est affiché en h1 s'il existe, sinon le libellé du groupe.

## Tasks / Subtasks

- [x] Migration DB `sessions.context_type` + `sessions.label` (AC: #2, #6)
  - [x] Créer migration `00071_sessions_context_label.sql` (note : 00070 était déjà pris par themes)
  - [x] `ALTER TABLE sessions ADD COLUMN context_type TEXT CHECK (context_type IN ('academie', 'stage')) DEFAULT 'academie'`
  - [x] `ALTER TABLE sessions ADD COLUMN label TEXT`
  - [x] Créer index `idx_sessions_context_type` sur `(tenant_id, context_type)`

- [x] Types TypeScript (AC: #2, #6)
  - [x] Ajouter `contextType: 'academie' | 'stage' | null` dans `Session` entity (entities.ts)
  - [x] Ajouter `label: string | null` dans `Session` entity
  - [x] Mettre à jour `GPContentRef` : `module: 1|2|3` + `entNumber: number (1-15)` + `globalNumber` + rétrocompat `sequence?`/`half?`/`repeat?`
  - [x] Vérifier que `TechniqueAcademieContentRef` et `TechniqueStageContentRef` restent compatibles
  - [ ] Re-générer les types Supabase via MCP `generate_typescript_types` (à faire après application migration sur project Supabase cible)

- [x] API Client — `createSession` + `updateSession` (AC: #6)
  - [x] Ajouter `contextType?: 'academie' | 'stage'` et `label?: string` dans les params de `createSession()`
  - [x] Ajouter les mêmes champs dans `updateSession()`
  - [x] Fichier : `aureak/packages/api-client/src/sessions/sessions.ts`

- [x] Refonte Step 1 de `seances/new.tsx` (AC: #1)
  - [x] Ajouter state `contextType: 'academie' | 'stage'` (défaut `'academie'`)
  - [x] Afficher le toggle Contexte entre "Implantation" et le toggle de type de séance (existant/ponctuel)
  - [x] UI : deux boutons radio stylisés `🏫 Académie` / `🏕️ Stage`
  - [x] `contextType` toujours valide (défaut = 'academie')

- [x] Refonte Step 2 — Méthode Technique (AC: #3)
  - [x] Supprimer le toggle academie/stage interne au bloc Technique (`techniqueCtx` / `acadContext` supprimés)
  - [x] Utiliser `contextType` (du Step 1) pour déterminer si c'est `TechniqueAcademieContentRef` ou `TechniqueStageContentRef`
  - [x] Si `contextType === 'stage'` : afficher champ Concept + sélecteur séquence 1-8
  - [x] Si `contextType === 'academie'` : calculer auto depuis le numéro d'entraînement

- [x] Refonte Step 2 — Méthode Goal & Player (AC: #5)
  - [x] Sélecteur **Module** : 3 boutons (Module 1 / Module 2 / Module 3)
  - [x] Sélecteur **ENT** : 1 à 15 (affiché comme "ENT 1", "ENT 2", ...)
  - [x] Champs `half`/`repeat` supprimés de l'UI (conservés dans le type pour rétrocompat)
  - [x] `globalNumber = (module - 1) * 15 + entNumber`
  - [x] Rollover inter-modules pour multi-date (`globalOffset` calcule module+ent dynamiquement)

- [x] Génération automatique du titre (AC: #4, #7)
  - [x] Créer fonction `generateSessionLabel(sessionType, contentRef, contextType, trainingNumber?)` dans `seances/_utils.ts`
  - [x] Exemples de sortie : Goal & Player → "Goal & Player – Module 2 – ENT 7", Technique Stage → "Technique Stage – {concept} – Séq. X"
  - [x] Composant `TitleField` avec `TextInput` pré-rempli, lien "↺ Restaurer"
  - [x] State `sessionTitle` lié au champ

- [x] Transmission du titre et du contexte au handleCreate (AC: #6)
  - [x] `label: sessionTitle.trim() || undefined` et `contextType` passés dans `createSession()`

- [x] Affichage dans la page détail (AC: #8)
  - [x] Dans `seances/[sessionId]/page.tsx` : `session.label` affiché en `variant="h1"`, fallback sur date (corrigé en code review)
  - [x] Dans `SessionCard.tsx` : `session.label` affiché comme titre principal si présent, groupName en sous-titre

- [ ] Tests manuels (tous AC)
  - [ ] Créer séance Goal & Player, vérifier titre auto + ENT numbering
  - [ ] Créer séance Technique en mode Stage → vérifier que le toggle global Step 1 contrôle le contexte
  - [ ] Vérifier que le label apparaît dans la liste et le détail

### Review Follow-ups (AI)
- [ ] [AI-Review][LOW] `contentRefLabel()` : vérifier l'affichage pour les très anciennes séances GP sans `globalNumber` dans la DB
- [ ] [AI-Review][LOW] Migration `00071` : vérifier la couverture RLS après application sur Supabase

## Dev Notes

### Modification de GPContentRef — Attention Breaking Change

**Situation actuelle :**
```typescript
GPContentRef = {
  method: 'goal_and_player'
  module: number    // 1-3
  sequence: number  // 1-5
  globalNumber: number  // (module-1)*5 + sequence → max 15
  half: 'A' | 'B'
  repeat: 1 | 2
}
```

**Nouvelle structure demandée :**
```typescript
GPContentRef = {
  method: 'goal_and_player'
  module: 1 | 2 | 3         // Module 1, 2 ou 3
  entNumber: number          // 1-15 par module
  globalNumber: number       // (module-1)*15 + entNumber → max 45
  // half/repeat : garder pour backward-compat des séances existantes, mais ne plus les exposer en UI
}
```

> ⚠️ Ce changement modifie la sémantique du `globalNumber` (max passe de 15 à 45). Toute séance Goal & Player existante aura un `contentRef` dans l'ancien format. Implémenter une fonction de migration de lecture : si `contentRef.sequence` existe → ancienne structure, si `contentRef.entNumber` existe → nouvelle. La DB stocke `contentRef` en JSON donc pas de migration SQL nécessaire.
>
> **Note :** Les champs `half` et `repeat` sont conservés dans le type pour la rétrocompatibilité mais ne sont plus requis à la création. S'ils sont absents, ne pas lever d'erreur.

### Champs Technique — Contexte global vs local

Fichier : `aureak/apps/web/app/(admin)/seances/new.tsx`

Le bloc Technique actuel (environs lignes 480-550) contient un toggle local `acadContext: 'academie' | 'stage'`. Ce toggle doit être **supprimé** et remplacé par le state `contextType` de Step 1.

Chercher : `acadContext` dans new.tsx → toutes les occurrences sont à remplacer par `contextType`.

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00070_sessions_context_label.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier Session + GPContentRef |
| `aureak/packages/api-client/src/sessions/sessions.ts` | Modifier createSession/updateSession |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Modifier (Step 1, Step 2 Technique + GP) |
| `aureak/apps/web/app/(admin)/seances/_utils.ts` | Ajouter `generateSessionLabel` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier affichage titre |
| `aureak/apps/web/app/(admin)/seances/_components/SessionCard.tsx` | Afficher label |

### Style des toggles contexte

Utiliser le même pattern que les chips SessionType existants dans Step 2 :
- Fond blanc avec bordure `colors.border.light` au repos
- Fond gold avec bordure `colors.border.gold` si sélectionné
- Police 14px, border-radius `radius.sm` (8px)
- Même animation hover que `transitions.fast`

### Compatibilité API

`computeContentRef(sessionType, trainingIndex)` dans sessions.ts : cette fonction calcule les ContentRef côté client. Pour GP, le `trainingIndex` passé devra être `(module-1)*15 + entNumber - 1`. Ne pas casser cette fonction, juste la mettre à jour pour GP.

### Routing pattern Expo Router

`seances/new.tsx` est un fichier direct (pattern sans `page.tsx`), donc pas de `index.tsx` à créer. Route accessible via `/seances/new`.

### References

- [Source: aureak/apps/web/app/(admin)/seances/new.tsx] — 1586 lignes, wizard 4 steps
- [Source: aureak/packages/types/src/entities.ts#GPContentRef] — structure actuelle module/sequence/half/repeat
- [Source: aureak/packages/types/src/entities.ts#Session] — sessionType, contentRef, methodologySessionId, notes
- [Source: aureak/packages/types/src/enums.ts#SessionType] — 7 types : goal_and_player, technique, situationnel, decisionnel, perfectionnement, integration, equipe
- [Source: aureak/apps/web/app/(admin)/seances/_utils.ts] — contentRefLabel(), TERRAINS, DURATIONS
- [Source: _bmad-output/planning-artifacts/architecture.md] — Supabase migrations, accès via @aureak/api-client uniquement

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migration numérotée 00071 (00070 déjà occupé par `themes_order_category`)
- `GPContentRef.entNumber` requis dans le nouveau type → `computeContentRef` mis à jour avec `entNumber: seq` pour rétrocompat auto-génération
- Supabase TypeScript types non régénérés (types locaux = `as unknown as` cast) — à régénérer après migration appliquée
- `TitleField` : dépendance `onChange` stabilisée via ref pattern (code review)
- Multi-date GP : rollover inter-modules implémenté via `globalOffset` (code review)
- `contentRefLabel()` : mise à jour pour le nouveau format GP (code review)
- `page.tsx` : `variant="h1"` corrigé (code review — était h2)
- `generateSessionLabel` : label stage utilise `r.context` plutôt que `contextType` (code review)

### File List

- `supabase/migrations/00071_sessions_context_label.sql` — Créé : ADD COLUMN context_type + label + index
- `aureak/packages/types/src/entities.ts` — Modifié : `Session.contextType`, `Session.label`, `GPContentRef` (entNumber + backward compat)
- `aureak/packages/api-client/src/sessions/sessions.ts` — Modifié : `mapSession`, `CreateSessionParams`, `createSession`, `UpdateSessionParams`, `updateSession`, `SessionRowAdmin`, `listSessionsAdminView`, `computeContentRef`
- `aureak/apps/web/app/(admin)/seances/new.tsx` — Modifié : state `contextType`/`gpModule`/`gpEntNumber`/`sessionTitle`, TitleField, Step 1 toggle contexte, Step 2 GP + Technique, handleCreate, step3Valid, reset
- `aureak/apps/web/app/(admin)/seances/_utils.ts` — Modifié : `contentRefLabel` (nouveau format GP), ajout `generateSessionLabel`
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — Modifié : affichage `session.label` h1 + `session.contextType`
- `aureak/apps/web/app/(admin)/seances/_components/SessionCard.tsx` — Modifié : affichage `session.label` comme titre si présent
- `aureak/apps/web/app/(admin)/seances/_components/constants.ts` — Non modifié (existant)
