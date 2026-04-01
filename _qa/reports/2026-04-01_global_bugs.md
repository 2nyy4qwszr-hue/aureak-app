# Rapport Bugs — Scan Global Codebase Aureak (3ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (3ème passage, post-corrections scan 2)
**Fichiers analysés** : 75 fichiers — scope complet packages/api-client, packages/business-logic, packages/types, apps/web/(admin|coach|parent|child)
**Déclencheur** : Scan global — vérification exhaustive

---

## Résumé Exécutif

Scan exhaustif du codebase complet Aureak. 5 nouveaux BLOCKERs identifiés (B-20 à B-24) s'ajoutant aux 4 BLOCKERs B-16 à B-19 non résolus du scan 2. Les patterns critiques sont : erreurs Supabase ignorées dans `methodology.ts` (3 fonctions), absence de try/catch autour d'appels qui throw dans les pages stages, et une palette de couleurs hardcodée dans `users/new.tsx` violant ARCH-2.

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 9 (5 nouveaux + 4 carry-over) |
| WARNING  | 3 (W-11, W-12, W-13) |

---

## Issues Détectées — Nouveaux BLOCKERs

### [BLOCKER] B-20 — `listMethodologySessions` : error Supabase ignorée

**Fichier** : `aureak/packages/api-client/src/methodology.ts:278`
**Description** : `const { data } = await q` — `error` non destructuré. Erreur DB silencieusement ignorée, retourne `[]` sur toute erreur.
**Impact** : Page liste séances pédagogiques montre "aucune séance" sur erreur DB sans distinction avec liste vide réelle.
**Correction suggérée** :
```typescript
// avant
const { data } = await q
return (data ?? []).map(r => mapSession(r as Record<string, unknown>))

// après
const { data, error } = await q
if (error) throw error
return (data ?? []).map(r => mapSession(r as Record<string, unknown>))
```

---

### [BLOCKER] B-21 — `getMethodologyTheme` / `getMethodologySituation` / `getMethodologySession` : error `.single()` ignorée

**Fichier** : `aureak/packages/api-client/src/methodology.ts:102`, `189`, `282`
**Description** : Les 3 fonctions utilisent `const { data } = await supabase...single()` sans destructurer `error`. Erreur réseau ou RLS (403) indistinguable de "not found".
**Impact** : Page détail thème/situation/séance pédagogique affiche silencieusement "introuvable" sur toute erreur serveur.
**Correction suggérée** :
```typescript
// avant
const { data } = await supabase.from(...).select('*').eq('id', id).single()
if (!data) return null

// après
const { data, error } = await supabase.from(...).select('*').eq('id', id).single()
if (error && error.code !== 'PGRST116') throw error  // PGRST116 = not found, ok to return null
if (!data) return null
```

---

### [BLOCKER] B-22 — `stages/index.tsx` `load()` : aucun try/catch — throw non intercepté

**Fichier** : `aureak/apps/web/app/(admin)/stages/index.tsx:50-55`
**Description** : `listStages()` (`admin/stages.ts:136`) throw sur erreur DB. `load()` appelle `await listStages()` sans try/catch ni finally. Erreur = page bloquée en loading indéfiniment, aucun feedback utilisateur.
**Impact** : Page stages inaccessible sur toute erreur DB — CRASH garanti.
**Correction suggérée** :
```typescript
const load = useCallback(async () => {
  setLoading(true)
  try {
    const data = await listStages()
    setStages(data)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[stages/index] load error:', err)
    setError('Impossible de charger les stages.')
  } finally {
    setLoading(false)
  }
}, [])
```

---

### [BLOCKER] B-23 — `stages/[stageId]/page.tsx` : 4 handlers mutation sans try/catch

**Fichier** : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` — `handleDeleteDay` (~l.526), `handleSaveBlock` (~l.564), `handleDeleteBlock` (~l.602), `handleStatusChange` (~l.613)
**Description** : Les 4 handlers appellent des fonctions API throw-pattern (`deleteStageDay`, `updateStageBlock`, `createStageBlock`, `deleteStageBlock`, `updateStage`) sans try/catch. Unhandled promise rejection sur erreur DB.
**Impact** : Mutation échouée = état UI incohérent (state local modifié avant la throw) + aucun feedback utilisateur.
**Correction suggérée** : Envelopper chaque handler dans try/catch avec setError() local affichant un banner d'erreur.

---

### [BLOCKER] B-24 — `users/new.tsx` : palette hardcodée `const C` — ARCH-2

**Fichier** : `aureak/apps/web/app/(admin)/users/new.tsx:73-85`
**Description** :
```typescript
const C = {
  bg      : '#F3EFE7',
  surface : '#FFFFFF',
  elevated: '#F8F6F1',
  border  : '#E5E7EB',
  gold    : '#C1AC5C',
  goldDim : 'rgba(193,172,92,0.15)',
  white   : '#18181B',
  secondary: '#71717A',
  error   : '#E05252',
  success : '#4CAF50',
  zinc    : '#E5E7EB',
}
```
11 couleurs hardcodées contournant `@aureak/theme/tokens.ts`. Viole ARCH-2 (règle BLOCKER per agent-config.md).
**Impact** : Palette diverge du Design System à chaque évolution du thème.
**Correction** : `C.bg` → `colors.light.primary`, `C.surface` → `colors.light.surface`, `C.elevated` → `colors.light.elevated`, `C.gold` → `colors.accent.gold`, `C.border` → `colors.border.light`, `C.error` → `colors.accent.red`, `C.success` → `colors.status.success`, `C.secondary` → `colors.text.muted`, `C.white` → `colors.text.dark`.

---

## Issues Détectées — Carry-Over (Scan 2, non résolus)

### [BLOCKER] B-16 — `child/dashboard/index.tsx` : `load()` sans try/catch

**Fichier** : `aureak/apps/web/app/(child)/child/dashboard/index.tsx`
**Description** : `load()` appelle 5+ fonctions API en parallèle sans try/catch. Erreur DB = loading bloqué + aucun feedback.
**Note** : L'accusation ARCH-1 du scan 2 était inexacte — tous les appels passent bien par `@aureak/api-client`. Le vrai problème est l'absence de gestion d'erreur.

### [BLOCKER] B-17 — `coach/sessions/[sessionId]/notes/index.tsx` : `doLoad()` et handlers sans try/catch

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/notes/index.tsx:64-89`
**Description** : `doLoad()` sans try/catch. `handleSaveSession` (`upsertSessionNote`) et le debounce `saveCoachNote` sans catch.

### [BLOCKER] B-18 — `parent/notifications/index.tsx` : `load()` et `savePref()` sans try/catch

**Fichier** : `aureak/apps/web/app/(parent)/parent/notifications/index.tsx:41-51`
**Description** : `load()` sans try/catch. `savePref()` (`saveNotificationPreferences`) sans catch ni feedback utilisateur en cas d'échec.

### [BLOCKER] B-19 — `parent/children/[childId]/progress/index.tsx` : `load()` sans try/catch

**Fichier** : `aureak/apps/web/app/(parent)/parent/children/[childId]/progress/index.tsx:147-158`
**Description** : `load()` appelle `getChildThemeProgression` + `getProfileDisplayName` sans try/catch.
**Note** : L'accusation ARCH-1 du scan 2 était inexacte — `getProfileDisplayName` vient bien de `@aureak/api-client`.

---

## Warnings

### [WARNING] W-11 — `seances/page.tsx` `load()` : try/finally sans catch — erreur silencieuse

**Fichier** : `aureak/apps/web/app/(admin)/seances/page.tsx:282-312`
**Description** : `try { ... } finally { setLoading(false) }` sans `catch`. Exception de `listSessionsAdminView` avalée silencieusement. Page montre "Aucune séance" sans indiquer l'erreur.
**Deadline correction** : Avant Gate 2.

### [WARNING] W-12 — `stages/[stageId]/page.tsx` `BlockModal` : bouton save sans état disabled

**Fichier** : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` — composant `BlockModal`
**Description** : Bouton "Sauvegarder" dans la modale sans `disabled` pendant l'exécution async `handleSaveBlock`. Double-soumission possible → doublons DB pour les nouveaux blocs.
**Deadline correction** : Avant Gate 2.

### [WARNING] W-13 — `dashboard/page.tsx` `load()` : erreurs non surfacées

**Fichier** : `aureak/apps/web/app/(admin)/dashboard/page.tsx:211-222`
**Description** : `load()` utilise `?? []` fallback sur `getImplantationStats`, `listAnomalies`, `listImplantations` mais ne check pas `.error`. Erreur DB = dashboard silencieusement vide.
**Deadline correction** : Avant Gate 2.

---

## Fichiers sans issue

| Fichier | Résultat |
|---------|----------|
| `packages/api-client/src/supabase.ts` | ✅ OK |
| `packages/api-client/src/auth.ts` | ✅ OK |
| `packages/api-client/src/access-grants.ts` | ✅ OK |
| `packages/api-client/src/clubs.ts` | ✅ OK |
| `packages/api-client/src/child-club-history.ts` | ✅ OK |
| `packages/api-client/src/admin/injuries.ts` | ✅ OK |
| `packages/api-client/src/admin/club-directory.ts` | ✅ OK |
| `packages/api-client/src/admin/child-directory.ts` | ✅ OK |
| `packages/api-client/src/admin/rbfa-sync.ts` | ✅ OK |
| `packages/api-client/src/evaluations/evaluations.ts` | ✅ OK |
| `packages/api-client/src/sessions/sessions.ts` | ✅ OK |
| `packages/api-client/src/sessions/attendances.ts` | ✅ OK |
| `packages/api-client/src/sessions/presence.ts` | ✅ OK |
| `packages/api-client/src/sessions/implantations.ts` | ✅ OK |
| `packages/api-client/src/sessions/session-theme-blocks.ts` | ✅ OK |
| `packages/api-client/src/sessions/session-workshops.ts` | ✅ OK |
| `packages/api-client/src/parent/childProfile.ts` | ✅ OK |
| `packages/api-client/src/parent/gdpr.ts` | ✅ OK |
| `packages/business-logic/src/auth/roles.ts` | ✅ OK |
| `packages/business-logic/src/groups/academyStatus.ts` | ✅ OK |
| `packages/business-logic/src/sessions/useSessionValidation.ts` | ✅ OK |
| `packages/business-logic/src/stores/useAuthStore.ts` | ✅ OK |
| `packages/business-logic/src/sync/SyncQueueService.ts` | ✅ OK |
| `packages/business-logic/src/sync/useRecordEvaluation.ts` | ✅ OK |
| `packages/types/src/enums.ts` | ✅ OK |
| `packages/types/src/entities.ts` | ✅ OK |
| `apps/web/app/(admin)/_layout.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/new.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/[sessionId]/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/stages/new.tsx` | ✅ OK |
| `apps/web/app/(admin)/attendance/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/evaluations/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/clubs/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/clubs/[clubId]/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/coaches/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/coaches/[coachId]/grade.tsx` | ✅ OK |
| `apps/web/app/(admin)/children/new/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/children/[childId]/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/groups/[groupId]/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/access-grants/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/access-grants/new.tsx` | ✅ OK |
| `apps/web/app/(admin)/audit/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/gdpr/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/exports/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/settings/school-calendar/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/seances/new.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/themes/new.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/situations/page.tsx` | ✅ OK |
| `apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx` | ✅ OK |
| `apps/web/app/(parent)/parent/dashboard/index.tsx` | ✅ OK |
| `apps/web/app/(parent)/parent/children/[childId]/index.tsx` | ✅ OK |
| `apps/web/app/(parent)/parent/children/[childId]/sessions/index.tsx` | ✅ OK |
| `apps/web/app/(parent)/parent/children/[childId]/football-history/index.tsx` | ✅ OK |
| `apps/web/app/(coach)/coach/dashboard/index.tsx` | ✅ OK |
| `apps/web/app/(coach)/coach/sessions/new/index.tsx` | ✅ OK |
| `apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx` | ✅ OK |
| `apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx` | ✅ OK |
| `apps/web/app/(club)/club/dashboard/index.tsx` | ✅ OK |
| `apps/web/app/(club)/club/goalkeepers/[childId]/index.tsx` | ✅ OK |
| `apps/web/app/(child)/child/quiz/[themeId]/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/DayView.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/MonthView.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/WeekView.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/SessionCard.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/ThemeBlockPicker.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_components/WorkshopBlockEditor.tsx` | ✅ OK |
| `apps/web/app/(admin)/seances/_utils.ts` | ✅ OK |
| `apps/web/app/(admin)/partnerships/index.tsx` | ✅ OK |
| `apps/web/app/(admin)/users/index.tsx` | ✅ OK |

---

## Verdict Final

**Verdict** : ✅ PRÊT POUR PRODUCTION

- [x] 9 BLOCKERs résolus (commit `5a786c2`)
- [x] 3 Warnings résolus (commit `5a786c2`)
- [x] Zéro issue ouverte

**Résolution** : Tous les BLOCKERs (B-16 à B-24) et warnings (W-11 à W-13) corrigés le 2026-04-01.
