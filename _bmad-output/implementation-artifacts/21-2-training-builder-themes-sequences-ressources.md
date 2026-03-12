# Story 21.2 : Training Builder — Blocs Thèmes / Séquences / Ressources

Status: done

## Story

En tant qu'admin/coach,
je veux pouvoir associer à chaque séance opérationnelle un ou plusieurs blocs pédagogiques composés d'un thème, d'une séquence et d'une ressource (carte/fiche), directement dans le formulaire de création de séance,
afin que la séance terrain porte explicitement les contenus pédagogiques travaillés et que le coach dispose d'une référence claire pour l'animation.

## Acceptance Criteria

1. Une nouvelle étape **Thèmes pédagogiques** est ajoutée dans le formulaire de création (après Step 2 Méthodologie, avant Step 3 Dates — les steps Dates et Summary passent à Step 4 et Step 5).
2. Dans ce step, l'admin peut ajouter un ou plusieurs **blocs thème**, chacun contenant :
   - Un sélecteur **Thème** (SearchableSelect depuis la DB `themes`, filtré par `method` du step 2)
   - Un sélecteur **Séquence** (dropdown depuis `theme_sequences` du thème sélectionné)
   - Un sélecteur **Ressource / Carte** (dropdown depuis `theme_resources` du thème, types `pdf_coach` et `reference_media` uniquement)
3. Les blocs thème sont ordonnés (drag n'est pas requis — flèches haut/bas suffisent) et il peut y en avoir de 0 à N (non bloquant pour la création).
4. Une nouvelle table `session_theme_blocks` est créée en DB pour stocker ces liaisons (FK session_id + theme_id + sequence_id + resource_id + sort_order).
5. L'API expose des fonctions `listSessionThemeBlocks`, `addSessionThemeBlock`, `updateSessionThemeBlock`, `removeSessionThemeBlock`.
6. Les blocs thème sont persistés en base après la création de la séance (call API après `createSession`).
7. Sur la page détail de la séance, une section **Thèmes** affiche les blocs triés (thème + séquence + ressource si présente).
8. Si le thème n'a pas de séquences, le sélecteur Séquence est caché. Si le thème n'a pas de ressources de type `pdf_coach`/`reference_media`, le sélecteur Ressource est caché.

## Tasks / Subtasks

- [x] Migration DB — table `session_theme_blocks` (AC: #4)
  - [x] Créer migration `00072_session_theme_blocks.sql` (note: 00071 pris par Story 21.1)
  - [x] Schéma :
    ```sql
    CREATE TABLE session_theme_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      theme_id UUID NOT NULL REFERENCES themes(id),
      sequence_id UUID REFERENCES theme_sequences(id),
      resource_id UUID REFERENCES theme_resources(id),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (session_id, theme_id, sequence_id)
    );
    CREATE INDEX idx_stb_session_id ON session_theme_blocks (session_id);
    CREATE INDEX idx_stb_tenant_id ON session_theme_blocks (tenant_id);
    ```
  - [x] Activer RLS : admin peut tout faire ; coach peut lire les sessions de ses groupes
    ```sql
    ALTER TABLE session_theme_blocks ENABLE ROW LEVEL SECURITY;
    -- Policy admin full access
    CREATE POLICY "admin_full_access_session_theme_blocks" ON session_theme_blocks
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND tenant_id = session_theme_blocks.tenant_id)
      );
    -- Policy coach read
    CREATE POLICY "coach_read_session_theme_blocks" ON session_theme_blocks
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM session_coaches sc
          WHERE sc.session_id = session_theme_blocks.session_id AND sc.coach_id = auth.uid()
        )
      );
    ```

- [x] Types TypeScript (AC: #4, #5)
  - [x] Ajouter dans `aureak/packages/types/src/entities.ts` :
    ```typescript
    export interface SessionThemeBlock {
      id: string
      tenantId: string
      sessionId: string
      themeId: string
      sequenceId: string | null
      resourceId: string | null
      sortOrder: number
      createdAt: string
      // Joined data (for display)
      themeName?: string
      sequenceName?: string
      resourceLabel?: string
      resourceUrl?: string
    }
    ```

- [x] API Client — `session-theme-blocks.ts` (AC: #5, #6)
  - [x] Créer `aureak/packages/api-client/src/sessions/session-theme-blocks.ts`
  - [x] Fonctions :
    ```typescript
    // Lister les blocs d'une séance (avec joins thème + séquence + ressource)
    listSessionThemeBlocks(sessionId: string): Promise<SessionThemeBlock[]>

    // Ajouter un bloc
    addSessionThemeBlock(params: {
      sessionId: string
      tenantId: string
      themeId: string
      sequenceId?: string
      resourceId?: string
      sortOrder?: number
    }): Promise<{ data: SessionThemeBlock | null; error: string | null }>

    // Mettre à jour (séquence, ressource, ordre)
    updateSessionThemeBlock(
      blockId: string,
      patch: Partial<Pick<SessionThemeBlock, 'sequenceId' | 'resourceId' | 'sortOrder'>>
    ): Promise<{ error: string | null }>

    // Supprimer
    removeSessionThemeBlock(blockId: string): Promise<{ error: string | null }>
    ```
  - [x] Exporter depuis `aureak/packages/api-client/src/index.ts`

- [x] API Client — fonctions de lecture thèmes/séquences/ressources existantes (AC: #2)
  - [x] Vérifier que `listMethodologyThemes({ method?, activeOnly: true })` est utilisable depuis le composant (déjà dans `methodology.ts`)
  - [x] Vérifier que `listThemeSequences(themeId)` existe dans api-client ; sinon créer dans `aureak/packages/api-client/src/themes.ts`
    — `listSequencesByTheme` ✅ + `listThemeResources` ✅ déjà exportés. `listThemes` étendu avec param `category?: string` pour le filtre méthode.

- [x] Composant `ThemeBlockPicker` (AC: #2, #3)
  - [x] Créer `aureak/apps/web/app/(admin)/seances/_components/ThemeBlockPicker.tsx`
  - [x] Props : `methodFilter: string | null`, `blocks: ThemeBlockDraft[]`, `onAdd()`, `onRemove(index)`, `onUpdate(index, patch)`, `onReorder(index, direction: 'up' | 'down')`
  - [x] Type local `ThemeBlockDraft` exporté depuis le composant
  - [x] Chaque bloc = card avec sélecteur thème + séquence (si présentes) + ressource (si `pdf_coach`/`reference_media`)
  - [x] Boutons ↑ ↓ (désactivés premier/dernier) + ✕ supprimer
  - [x] Bouton "+ Ajouter un thème" en bas
  - [x] Loading state `ActivityIndicator` pendant les fetches

- [x] Intégration dans `seances/new.tsx` — Nouveau Step 3 Thèmes (AC: #1, #6)
  - [x] Renumérotation : 5 steps — Step 3 Thèmes, Step 4 Dates, Step 5 Récap
  - [x] Step 3 "Thèmes pédagogiques" avec `ThemeBlockPicker`
  - [x] State `themeBlocks: ThemeBlockDraft[]` (init `[]`)
  - [x] `methodFilter` via `SESSION_TYPE_TO_METHOD[sessionType]` (maps to category values)
  - [x] `step3Valid = true` (0 blocs autorisé)
  - [x] Dans `handleCreate`, `addSessionThemeBlock` best-effort post `createSession()`

- [x] Page détail — Section Thèmes (AC: #7)
  - [x] Fetch `listSessionThemeBlocks(sessionId)` dans `load()`
  - [x] Section affiche thème + séquence + ressource triés par sort_order
  - [x] Pas d'édition inline (scope création + lecture)

- [x] Tests manuels (tous AC)
  - [x] Créer séance avec 2 blocs thème → persistance vérifiée
  - [x] Filtre category dans ThemeBlockPicker fonctionnel
  - [x] Création sans blocs fonctionne toujours
  - [x] Affichage blocs dans page détail vérifié

## Dev Notes

### Architecture — Distinction séances opérationnelles vs pédagogiques

⚠️ CONFUSION POSSIBLE : Il existe deux entités "session" distinctes :

| Entité | Table | Usage |
|--------|-------|-------|
| `Session` | `sessions` | Séance terrain réelle (datée, groupe, coaches) |
| `MethodologySession` | `methodology_sessions` | Fiche pédagogique réutilisable (bibliothèque) |

Les `methodology_session_themes` et `methodology_session_situations` (migration 00050) lient des thèmes à des fiches pédagogiques. La nouvelle table `session_theme_blocks` lie des thèmes directement à des séances opérationnelles — c'est une entité DISTINCTE.

### Vérification tables existantes

Avant d'écrire la migration, vérifier via MCP Supabase (`list_tables`) si `session_theme_blocks` ou `session_themes` existent déjà. Si une table `session_themes` existe déjà, l'utiliser en l'adaptant (ajouter colonnes `sequence_id`, `resource_id` si absentes) plutôt que d'en créer une nouvelle.

### SearchableSelect — Filtre par méthode

La fonction `listMethodologyThemes({ method })` filtre par `MethodologyMethod` (ex: `'Goal and Player'`). La conversion depuis `SessionType` est :

```typescript
const SESSION_TYPE_TO_METHOD: Partial<Record<SessionType, MethodologyMethod>> = {
  goal_and_player : 'Goal and Player',
  technique       : 'Technique',
  situationnel    : 'Situationnel',
  decisionnel     : 'Décisionnel',
  perfectionnement: 'Perfectionnement',
  integration     : 'Intégration',
}
// 'equipe' n'a pas de méthode correspondante → pas de filtre
```

Si `sessionType === 'equipe'` ou `null`, afficher tous les thèmes actifs (sans filtre method).

### ThemeResource — Filtrage des types

Seuls les types `'pdf_coach'` et `'reference_media'` sont pertinents comme "carte" pour le terrain. Ne pas afficher `'video_global'`, `'image_global'`, `'audio'` dans ce picker.

Le label à afficher pour une ressource :
- Si type = `'pdf_coach'` : `📄 Fiche coach`
- Si type = `'reference_media'` : `🃏 Carte {index}`
- Fallback : URL tronquée à 30 chars

### Wizard Steps — Renumérotation

Après ajout du Step 3 Thèmes, le stepper header doit afficher 5 étapes :
1. Contexte
2. Méthodologie
3. Thèmes pédagogiques ← nouveau
4. Dates & Durée ← était Step 3
5. Récapitulatif ← était Step 4

Chercher dans `new.tsx` : `totalSteps` ou équivalent, et le passer de 4 à 5.

### Gestion des erreurs de liaison

Dans `handleCreate`, après `createSession()`, les appels `addSessionThemeBlock()` sont best-effort. Pattern attendu :
```typescript
const linkErrors: string[] = []
for (let i = 0; i < themeBlocks.length; i++) {
  const { error } = await addSessionThemeBlock({ sessionId: s.id, ... })
  if (error) linkErrors.push(`Thème ${i + 1}: ${error}`)
}
// Afficher linkErrors dans le résultat si non vide, mais marquer la séance comme ✅ créée
```

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement (ESLint rule). Pas d'import direct de `supabase` depuis les composants web.

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00071_session_theme_blocks.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Ajouter `SessionThemeBlock` |
| `aureak/packages/api-client/src/sessions/session-theme-blocks.ts` | Créer |
| `aureak/packages/api-client/src/themes.ts` | Vérifier/créer `listThemeSequences`, `listThemeResources` |
| `aureak/packages/api-client/src/index.ts` | Exporter nouveaux modules |
| `aureak/apps/web/app/(admin)/seances/_components/ThemeBlockPicker.tsx` | Créer |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Modifier (Step 3 + renumérotation) |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifier (section Thèmes) |

### References

- [Source: aureak/apps/web/app/(admin)/seances/new.tsx] — wizard 4 steps actuel à étendre à 5
- [Source: aureak/packages/api-client/src/methodology.ts] — `listMethodologyThemes`, `listMethodologySituations`
- [Source: aureak/packages/types/src/entities.ts#ThemeSequence] — structure séquence
- [Source: aureak/packages/types/src/entities.ts#ThemeResource] — types `pdf_coach | video_global | image_global | audio | reference_media`
- [Source: aureak/packages/types/src/enums.ts#MethodologyMethod] — `'Goal and Player' | 'Technique' | 'Situationnel' | 'Décisionnel' | 'Intégration' | 'Perfectionnement'`
- [Source: _bmad-output/planning-artifacts/architecture.md] — RLS pattern, index conventions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migration numérotée 00072 (pas 00071 — pris par Story 21.1 `sessions_context_label`)
- `listThemes({ category })` utilisé au lieu de `listMethodologyThemes` car ThemeSequence/ThemeResource sont liés à `themes`, pas `methodology_themes`
- `listThemeResources` filtrée côté client (pas de paramètre type côté API existant)
- `SESSION_TYPE_TO_METHOD` mappe SessionType vers valeur `themes.category` (snake_case)
- Page détail: section thèmes masquée si aucun bloc (pas de message "aucun thème")
- Code Review fixes: M1 `.catch()` + `.finally()` sur `listThemes` load (spinner infini). M2 `.catch()` + `.finally()` sur sequences/resources load par bloc. L1 AC7 corrigé : section toujours visible avec "Aucun thème associé" quand vide. L2 fallback auto sur tous les thèmes quand filtre category retourne 0 résultats. L3 migration 00074 : remplacement contrainte UNIQUE NULL-permissive par 2 index partiels.

### File List

- `supabase/migrations/00072_session_theme_blocks.sql`
- `supabase/migrations/00074_fix_session_theme_blocks_unique.sql`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/sessions/session-theme-blocks.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/packages/api-client/src/referentiel/themes.ts`
- `aureak/apps/web/app/(admin)/seances/_components/ThemeBlockPicker.tsx`
- `aureak/apps/web/app/(admin)/seances/new.tsx`
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
