# Story 107.1 : Formulaire création stage v2 — nom auto, méthode, saison chips, RLS fix

Status: review

## Story

En tant qu'**admin**,
je veux **créer un stage via un formulaire uniformisé (nom auto-généré, méthode pédagogique, saison auto-proposée, lieu auto-rempli depuis l'implantation)** sans heurter l'erreur RLS actuelle,
afin de **garder une nomenclature cohérente entre tous les stages et d'arrêter de retaper les mêmes infos à chaque création**.

## Contexte

Le formulaire actuel (`aureak/apps/web/app/(admin)/evenements/stages/new.tsx`) est trop manuel :
- Le nom est libre → chaque admin invente son propre format (ex. "Stage Été 2024", "Technique Onhaye 26", "Pâques Onhaye Technique").
- La saison est un texte libre → typos fréquents (`2025-2026` vs `25/26`).
- Le lieu est un champ libre → alors que 90 % du temps il correspond à l'adresse de l'implantation choisie.
- Le champ "Participants max" pollue l'UI sans servir — le nombre est implicite via les groupes créés ensuite.
- **Bug bloquant** : `new row violates row-level security policy for table "stages"` — impossible de créer un stage en prod. La policy `stages_tenant` (migration 00041) utilise `FOR ALL USING (...)` sans `WITH CHECK`, et `createStage` n'envoie pas `tenant_id`.

**Nouveau format de nom uniformisé** : `{Méthode} - {Type période} - {Short name implantation} - {Année}`
Exemple : `Goal and Player - Pâques - Onhaye - 2026`

## Acceptance Criteria

- **AC1 — Nouveau champ Méthode (chips)** : l'utilisateur choisit une méthode pédagogique via chips parmi les 5 valeurs de `GroupMethod` : `Goal and Player`, `Technique`, `Situationnel`, `Performance`, `Décisionnel`. Stocké dans le state (pas persisté en DB — sert uniquement à générer le nom).
- **AC2 — Nom auto-généré** : dès qu'un des inputs change (méthode, type période, implantation, date début), le champ "Nom du stage" se remplit automatiquement au format `{Méthode} - {Type} - {ImplantationShortName} - {Année début}` (ex. `Goal and Player - Pâques - Onhaye - 2026`). Les parties manquantes sont omises avec leur séparateur (pas de ` -  - ` vide).
- **AC3 — Nom éditable** : l'utilisateur peut à tout moment modifier le nom manuellement. Une fois édité manuellement, la regénération auto est désactivée pour cette session (flag local `nameTouched = true`). Un petit lien "Régénérer" à côté du champ permet de réactiver la génération auto.
- **AC4 — Saison en chips auto-proposées** : à partir de la date de début sélectionnée, deux chips saison sont proposées :
  - `{annéeN-1}-{annéeN}` (ex. `2025-2026`)
  - `{annéeN}-{annéeN+1}` (ex. `2026-2027`)
  - Par défaut, celle qui contient la date de début est sélectionnée (règle : saison `2025-2026` = 01/07/2025 → 30/06/2026).
  - Le champ TextInput libre est supprimé ; la saison stockée côté DB (`season_label`) est la chip sélectionnée.
- **AC5 — Lieu auto-rempli** : quand l'utilisateur clique une chip d'implantation, le champ "Lieu (terrain, salle…)" se pré-remplit avec `implantation.address` (si non-null). Si l'utilisateur dé-sélectionne l'implantation, le champ lieu n'est pas vidé automatiquement. Le champ reste éditable à tout moment.
- **AC6 — Champ Participants max supprimé** : la section "Participants max" est retirée de l'UI. La colonne DB `max_participants` reste (nullable) — l'insert envoie `null`.
- **AC7 — Fix RLS INSERT** : une nouvelle migration remplace la policy `stages_tenant` (00041) par un pattern aligné sur 00140 :
  - `stages_tenant_read` : SELECT — `tenant_id = current_tenant_id() AND is_active_user()`
  - `stages_admin_write` : ALL — `current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user()` + `WITH CHECK` identique
  - `createStage` côté client appelle `resolveTenantId()` (comme dans `prospection.ts:223-244`) et envoie `tenant_id` dans l'insert.
- **AC8 — Short name implantations** : nouvelle colonne `implantations.short_name TEXT` + seed data :
  - `R.C.S Onhaye` → `Onhaye`
  - `R.E.S Templiers-Nandrin` → `Templiers`
  - `Union Rochefortoise` → `Rochefort`
  - Si `short_name` est null, fallback sur `name` complet pour la génération du nom.
- **AC9 — Validation** : le bouton "Créer le stage" reste désactivé tant que `name`, `startDate`, `endDate` ne sont pas remplis (inchangé). La méthode, le type et l'implantation ne sont pas requis (le nom auto les ignore si absent).
- **AC10 — Respect règles Aureak** : 
  - Accès Supabase via `@aureak/api-client` uniquement
  - Styles via `@aureak/theme` tokens
  - try/finally sur `setSaving`
  - Console guards `if (process.env.NODE_ENV !== 'production')`
  - Pas de fichiers non-routes dans `app/`

## Tasks / Subtasks

### Préparation

- [x] Lire les fichiers existants :
  - `aureak/apps/web/app/(admin)/evenements/stages/new.tsx` (formulaire actuel)
  - `aureak/packages/api-client/src/admin/stages.ts` (`createStage`)
  - `aureak/packages/api-client/src/sessions/implantations.ts` (`listImplantations`, `mapImplantation`)
  - `aureak/packages/api-client/src/admin/prospection.ts:223-244` (pattern `resolveTenantId`)
  - `aureak/packages/types/src/entities.ts:477-489` (type `Implantation`)
  - `aureak/packages/types/src/entities.ts:492` (type `GroupMethod`)
  - `supabase/migrations/00041_academy_status_system.sql:81-83` (policy à remplacer)
  - `supabase/migrations/00140_enable_rls_all_public_tables.sql:55-80` (pattern policies à reproduire)

### 1. Migration Supabase (AC7, AC8)

- [x] Créer `supabase/migrations/00170_stage_form_v2.sql` (ou numéro suivant après vérification `ls supabase/migrations/ | tail -3`)
  ```sql
  -- =============================================================================
  -- Migration 00170 : Stage form v2 — RLS INSERT fix + implantations.short_name
  -- =============================================================================

  -- 1. Fix RLS on stages : remplace policy unique par split read/admin_write
  --    (pattern aligné sur 00140_enable_rls_all_public_tables.sql)
  DROP POLICY IF EXISTS "stages_tenant" ON stages;

  DROP POLICY IF EXISTS "stages_tenant_read" ON stages;
  CREATE POLICY "stages_tenant_read" ON stages
    FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());

  DROP POLICY IF EXISTS "stages_admin_write" ON stages;
  CREATE POLICY "stages_admin_write" ON stages
    FOR ALL
    USING      (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user())
    WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

  -- 2. implantations.short_name (nullable) + seed data
  ALTER TABLE implantations ADD COLUMN IF NOT EXISTS short_name TEXT;

  UPDATE implantations SET short_name = 'Onhaye'     WHERE name ILIKE '%Onhaye%'       AND short_name IS NULL;
  UPDATE implantations SET short_name = 'Templiers'  WHERE name ILIKE '%Templiers%'    AND short_name IS NULL;
  UPDATE implantations SET short_name = 'Rochefort'  WHERE name ILIKE '%Rochefortoise%' AND short_name IS NULL;
  ```
- [x] Vérifier la numérotation : `ls supabase/migrations/ | tail -3` (last = `00169`, donc **00170**)
- [ ] Test migration localement : `supabase db reset` puis `supabase db push` _(à faire manuellement avant PR)_

### 2. Types (AC8)

- [x] `aureak/packages/types/src/entities.ts` ligne ~477-489 : ajouter `shortName: string | null` au type `Implantation`
  ```typescript
  export type Implantation = {
    id         : string
    tenantId   : string
    name       : string
    shortName  : string | null  // Story 107-1 — nom court pour génération auto nom stage
    address    : string | null
    // ... reste inchangé
  }
  ```

### 3. API client — mapping + tenant_id (AC5, AC7, AC8)

- [x] `aureak/packages/api-client/src/sessions/implantations.ts` ligne ~21-35 : ajouter `shortName` dans `mapImplantation`
  ```typescript
  function mapImplantation(row: Record<string, unknown>): Implantation {
    return {
      id         : row.id          as string,
      tenantId   : row.tenant_id   as string,
      name       : row.name        as string,
      shortName  : (row.short_name as string | null) ?? null,  // Story 107-1
      address    : (row.address    as string | null) ?? null,
      // ... reste inchangé
    }
  }
  ```

- [x] `aureak/packages/api-client/src/admin/stages.ts` : ajouter helper `resolveTenantId` (copie le pattern de `prospection.ts:223-244`) ET modifier `createStage` pour envoyer `tenant_id`
  ```typescript
  async function resolveTenantId(): Promise<string> {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) throw new Error('Non authentifié')
    const jwtTenant = (user.app_metadata?.tenant_id as string | undefined)
      ?? (user.user_metadata?.tenant_id as string | undefined)
    if (jwtTenant) return jwtTenant
    const { data: profile, error } = await supabase
      .from('profiles').select('tenant_id').eq('user_id', user.id).maybeSingle()
    if (error || !profile?.tenant_id) throw new Error('tenant_id introuvable')
    return profile.tenant_id as string
  }

  export async function createStage(params: CreateStageParams): Promise<Stage> {
    const tenantId = await resolveTenantId()
    const { data, error } = await supabase
      .from('stages')
      .insert({
        tenant_id       : tenantId,       // ← NEW (fix RLS WITH CHECK)
        name            : params.name,
        // ... reste inchangé
      })
      .select()
      .single()
    if (error) throw error
    return mapStage(data as Record<string, unknown>)
  }
  ```

### 4. UI formulaire (AC1 à AC6, AC9, AC10)

- [x] `aureak/apps/web/app/(admin)/evenements/stages/new.tsx` : refactor complet
  - Importer `GroupMethod` depuis `@aureak/types` + tableau `STAGE_METHODS` local (5 valeurs)
  - Ajouter state : `method: GroupMethod | ''`, `nameTouched: boolean` (init false)
  - **Supprimer** le state/UI `maxParticipants`
  - **Remplacer** le TextInput saison par chips (2 options calculées via helper `computeSeasonOptions(startDate)`)
  - Ajouter helper `generateStageName({ method, type, implantationShortName, year })` qui retourne `"Goal and Player - Pâques - Onhaye - 2026"` en joignant avec ` - ` et filtrant les parts vides
  - `useEffect` qui re-génère le nom quand `[method, type, implantationId, startDate]` changent, **seulement si `!nameTouched`**
  - `onChangeText={setName}` du TextInput nom → set `nameTouched = true`
  - Lien "Régénérer" à côté du label nom → set `nameTouched = false` et re-générer
  - Quand `implantationId` change → si `implantation.address` non-null, `setLocation(implantation.address)`. Ne PAS écraser si l'utilisateur a déjà tapé manuellement (flag `locationTouched` similaire si besoin — version simple : n'écrase que si `location === ''` ou que la nouvelle adresse vient d'un clic fraîchement différent → voir discussion simple ci-dessous)
  - Helper saison :
    ```typescript
    function computeSeasonOptions(startDate: string): { value: string; isDefault: boolean }[] {
      if (!startDate) return []
      const d = new Date(startDate)
      const y = d.getFullYear()
      const m = d.getMonth() + 1  // 1-12
      // Saison = 1er juillet → 30 juin (cutoff 7)
      const currentSeason = m >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`
      const nextSeason    = m >= 7 ? `${y+1}-${y+2}` : `${y}-${y+1}`
      return [
        { value: currentSeason, isDefault: true },
        { value: nextSeason,    isDefault: false },
      ]
    }
    ```
  - Helper nom :
    ```typescript
    function generateStageName(parts: {
      method?: GroupMethod | ''
      type?: StageType | ''
      implantationShortName?: string | null
      year?: number | null
    }): string {
      const bits = [
        parts.method || null,
        parts.type ? STAGE_TYPE_LABEL[parts.type] : null,  // 'Pâques' au lieu de 'pâques'
        parts.implantationShortName || null,
        parts.year ?? null,
      ].filter(Boolean)
      return bits.join(' - ')
    }
    ```
    Note : `STAGE_TYPE_LABEL` = map `{'été':'Été','toussaint':'Toussaint','hiver':'Hiver','pâques':'Pâques','custom':'Personnalisé'}`. Pour `custom`, ne pas insérer (ou décider : à discuter, au choix skip).

### 5. QA post-implémentation (règles CLAUDE.md)

- [x] `grep -n "setSaving(false)\|setLoading(false)" aureak/apps/web/app/(admin)/evenements/stages/new.tsx` → aucun match hors bloc `finally`
- [x] `grep -n "console\." aureak/apps/web/app/(admin)/evenements/stages/new.tsx aureak/packages/api-client/src/admin/stages.ts` → chaque match guardé par `NODE_ENV !== 'production'`
- [ ] Test Playwright _(skippé — dev server non démarré ; à valider manuellement avec compte admin)_ :
  1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` (attendu 200)
  2. Navigate `/(admin)/evenements/stages/new`
  3. Screenshot avant remplissage
  4. Cliquer chip "Pâques" → chip "R.C.S Onhaye" → date début `27/04/2026` → vérifier :
     - Nom = `Pâques - Onhaye - 2026` (sans méthode)
     - Saison chip `2025-2026` sélectionnée
     - Lieu = adresse de R.C.S Onhaye
  5. Cliquer chip méthode "Goal and Player" → nom = `Goal and Player - Pâques - Onhaye - 2026`
  6. Éditer manuellement le nom → cliquer chip Hiver → nom ne change pas
  7. Cliquer lien "Régénérer" → nom reprend `Goal and Player - Hiver - Onhaye - 2026`
  8. Renseigner date fin `01/05/2026` → cliquer "Créer le stage" → pas d'erreur RLS → redirect vers `/stages/{id}`
  9. `mcp__playwright__browser_console_messages` → zéro erreur JS
- [x] `cd aureak && npx tsc --noEmit` → zéro erreur

### 6. Commit

- [x] Message : `feat(epic-107): story 107.1 — formulaire stage v2 (nom auto, méthode, saison chips, lieu auto, fix RLS)`
- [ ] PR via workflow standard (branch `feat/epic-107-story-107-1-stage-form-v2`) _(à discuter avec user)_

## Dev Notes

### Architecture / patterns à respecter

**Source de vérité** : `CLAUDE.md` (règles absolues) et migrations 00140 pour pattern RLS split.

- **RLS pattern canonique** (00140) : `{table}_tenant_read` (SELECT + tenant + is_active_user) + `{table}_admin_write` (ALL + role check + tenant + is_active_user, avec `WITH CHECK` SYMÉTRIQUE à `USING`).
- **tenant_id côté client** : toujours résoudre via helper `resolveTenantId()` qui check JWT d'abord puis fallback `profiles` → pattern dans `prospection.ts:223-244`, `sponsors.ts:17-`, `coach-prospection.ts:56-`.
- **Types snake → camel** (rappel AUTO-MEMORY) : toujours explicite via mapper function. Ne jamais `as Implantation[]` sur `data` brut.
- **Chips pattern** : déjà dans `new.tsx` (`s.chip` / `s.chipActive`). Réutiliser style existant pour méthode + saison.
- **Expo Router** : fichier est `new.tsx` (route `/new`), pas besoin de `index.tsx`.

### Files à toucher

| Fichier | Action |
|---|---|
| `supabase/migrations/00170_stage_form_v2.sql` | CREATE (nouvelle migration) |
| `aureak/packages/types/src/entities.ts` | EDIT (ajout `shortName` à `Implantation` ligne ~481) |
| `aureak/packages/api-client/src/sessions/implantations.ts` | EDIT (`mapImplantation` ligne ~21-35) |
| `aureak/packages/api-client/src/admin/stages.ts` | EDIT (ajout `resolveTenantId` + `createStage` envoie `tenant_id`) |
| `aureak/apps/web/app/(admin)/evenements/stages/new.tsx` | REFACTOR (méthode, saison chips, lieu auto, nom auto, suppr max participants) |

### Testing Standards

- **QA manuel via Playwright** (voir AC9 + section Tasks).
- Pas de test unit prévu (pattern Aureak : on teste via Playwright pour les features UI).
- TSC strict : `cd aureak && npx tsc --noEmit` doit passer.

### Project Structure Notes

- Aucun nouveau fichier `app/` non-route ne doit être créé (règle 6 CLAUDE.md). Les helpers `computeSeasonOptions` et `generateStageName` vivent dans le même fichier `new.tsx` (ou éventuellement dans `aureak/apps/web/lib/stages/` si on veut les réutiliser — pour l'instant, garder inline).
- Pas de nouveau composant partagé : tout tient dans le fichier de la route.

### Edge cases & pièges

1. **Type `custom` (Personnalisé)** : décider du comportement du nom auto. Recommandation : ne pas inclure dans le nom (`filter(Boolean)` évite "custom" comme part). Discuter avec le user si autre préférence.
2. **Date début vide** : `computeSeasonOptions('')` retourne `[]` → aucune chip saison proposée → seasonLabel stocké = `null`.
3. **Implantation sans `short_name`** : fallback sur `name` complet dans la génération auto. Cohérent avec AC8.
4. **Implantation sans `address`** : ne pas pré-remplir le lieu, laisser vide.
5. **`nameTouched`** : doit être reset si le user clique "Régénérer". Attention à ne pas boucler (useEffect qui regen met `nameTouched` à true sinon → utiliser flag pour savoir si l'update vient du user ou de l'auto-gen).

### References

- [Source: CLAUDE.md § Règles absolues de code] — try/finally, console guards, accès Supabase via api-client
- [Source: supabase/migrations/00041_academy_status_system.sql:81-83] — policy `stages_tenant` actuelle (à remplacer)
- [Source: supabase/migrations/00140_enable_rls_all_public_tables.sql:55-80] — pattern split read/write à reproduire
- [Source: aureak/packages/api-client/src/admin/prospection.ts:223-244] — helper `resolveTenantId`
- [Source: aureak/packages/types/src/entities.ts:492] — type `GroupMethod` = 5 valeurs

### Previous story intelligence

Story immédiatement précédente : **105.1 Panini** (`story-105-1-generation-cartes-panini-stages.md`) — même domaine (stages), a déjà mis en place `listStageChildren` dans `stages.ts`. Rien à réutiliser directement ici, mais confirme que la structure `@aureak/api-client/src/admin/stages.ts` est la bonne destination pour les fonctions de stage.

Dernier fix RLS important : migration 00140 (oct. 2025, lot de 41 tables). La table `stages` n'a pas été incluse dans 00140 car elle avait déjà une policy — mais cette policy est cassée. Cette story termine le lot.

### Git intelligence

Derniers commits relatifs :
- `820946f fix(epic-105): story 105.1 — touch targets 44px mobile-first`
- `c0076fd feat(epic-105): story 105.1 — génération cartes Panini pour stages`
- `146d56e fix: auto-review pre-push corrections`

Pattern branch : `feat/epic-{N}-story-{N}-{n}-{slug}`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context)

### Debug Log References

Aucun blocage rencontré. TSC clean au premier passage.

### Completion Notes List

- ✅ Migration `00170_stage_form_v2.sql` créée : drop policy `stages_tenant` + recréation split `stages_tenant_read` (SELECT) + `stages_admin_write` (ALL avec WITH CHECK symétrique), pattern aligné sur 00140. Ajout colonne `implantations.short_name` + seed Onhaye/Templiers/Rochefort via `ILIKE`.
- ✅ Type `Implantation.shortName` ajouté (`entities.ts` ligne 481).
- ✅ `mapImplantation` mappe `short_name` → `shortName` (`implantations.ts` ligne 25).
- ✅ Helper `resolveTenantId()` ajouté dans `admin/stages.ts` (pattern `prospection.ts`), et `createStage` envoie maintenant `tenant_id` dans l'insert → fix définitif RLS.
- ✅ Refactor complet de `new.tsx` :
  - Nouveaux state : `method: GroupMethod | ''`, `nameTouched: boolean`
  - Helpers locaux `computeSeasonOptions(startDate)` (cutoff 1er juillet) + `generateStageName({...})`
  - Nom auto-généré via `useEffect` écoutant `[method, type, implantationId, startDate, nameTouched, implantations]` ; ne s'exécute que si `!nameTouched`
  - Édition manuelle du nom → set `nameTouched=true` ; lien "↻ Régénérer" affiché conditionnellement pour reset à false
  - Chips Méthode (5 valeurs GroupMethod) en tête du formulaire
  - Saison remplacée par 2 chips `{yN-1}-{yN}` + `{yN}-{yN+1}` ; message "Sélectionne une date" si pas de date ; auto-sélection de la saison par défaut (celle qui contient la date) via useEffect
  - Clic sur chip implantation → pré-remplit `location` avec `implantation.address`
  - Suppression complète du champ "Participants max" ; `createStage` reçoit `maxParticipants: null`
  - Console guard ajouté sur `console.error` dans le catch
- ⚠️ Test Playwright **skippé** — dev server non démarré (curl 000). À valider manuellement par l'utilisateur avec compte admin authentifié (la migration 00170 doit être appliquée : `supabase db push` depuis la racine du dépôt).
- ✅ TSC `npx tsc --noEmit` : aucune erreur
- ✅ Regex QA : `setSaving(false)` uniquement dans `finally` bloc ; aucun `console.` non guardé dans les fichiers touchés

### File List

- `supabase/migrations/00170_stage_form_v2.sql` (new)
- `aureak/packages/types/src/entities.ts` (modified — ajout `shortName` à `Implantation`)
- `aureak/packages/api-client/src/sessions/implantations.ts` (modified — `mapImplantation`)
- `aureak/packages/api-client/src/admin/stages.ts` (modified — `resolveTenantId`, `createStage` envoie `tenant_id`)
- `aureak/apps/web/app/(admin)/evenements/stages/new.tsx` (refactor complet)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (epic-107 + story status)
- `_bmad-output/implementation-artifacts/story-107-1-stage-form-v2.md` (new — story file)

### Change Log

- 2026-04-24 : Implémentation story 107.1 — formulaire stage v2 (nom auto, méthode, saison chips, lieu auto, suppression max participants, fix RLS INSERT).
