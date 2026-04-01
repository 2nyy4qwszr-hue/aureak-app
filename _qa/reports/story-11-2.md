# Rapport story 11-2 — Permissions de contenu par grade

**Date** : 2026-04-01
**Commit** : 429a9a4
**Statut** : ✅ done

---

## Changements apportés

| Fichier | Action | Raison |
|---------|--------|--------|
| `supabase/migrations/00091_grade_content_permissions.sql` | Créé | Migration idempotente : enum, table, vue, fonctions, colonnes, policies |
| `packages/types/src/enums.ts` | Modifié | `CoachGradeLevel` type miroir enum PostgreSQL |
| `packages/types/src/entities.ts` | Modifié | `requiredGradeLevel` sur `Theme` et `Situation` |
| `packages/api-client/src/referentiel/themes.ts` | Modifié | `requiredGradeLevel` dans mapper + `UpdateThemeParams` |
| `packages/api-client/src/referentiel/situations.ts` | Modifié | `updateSituationGradeLevel()` ajouté |
| `packages/api-client/src/index.ts` | Modifié | Export `updateSituationGradeLevel` |
| `apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx` | Modifié | Sélecteur grade chips + sauvegarde dans `updateTheme` |
| `apps/web/app/(admin)/methodologie/situations/[situationKey]/page.tsx` | Modifié | Sélecteur grade + `handleSaveGrade` avec try/finally |

---

## Contenu migration 00091

1. **`coach_grade_level` enum** (IF NOT EXISTS — migration 11-1 absente du repo)
2. **`coach_grades` table** (IF NOT EXISTS — append-only, immuable par policy)
3. **`coach_current_grade` vue** — DISTINCT ON (coach_id) ORDER BY awarded_at DESC
4. **`current_user_grade()`** — SECURITY DEFINER, STABLE, REVOKE ALL / GRANT TO authenticated
5. **`themes.required_grade_level`** + **`situations.required_grade_level`** — `coach_grade_level NOT NULL DEFAULT 'bronze'`
6. **`grade_rank(g coach_grade_level)`** — IMMUTABLE, retourne 1–4
7. **Policy `grade_access_themes`** — admin voit tout, non-coach voit tout, coach filtré par grade_rank
8. **Policy `grade_access_situations`** — idem

---

## Note sur les situations.ts

`situations.ts` ne dispose pas de mapper snake_case→camelCase (contrairement à `themes.ts`). La colonne `required_grade_level` est lue via cast explicite `(s as unknown as Record<string, unknown>).required_grade_level` dans la page UI pour respecter le pattern existant sans le réformer (hors scope).

---

## QA Gates

| Gate | Résultat |
|------|----------|
| try/finally state setters | ✅ `setSaving` dans finally (SectionIdentite) + `setGradeSaving` dans finally (situation page) |
| console sans NODE_ENV guard | ✅ Aucun console.* ajouté |
| catch vides | ✅ Aucun |
| TypeScript | ✅ Zéro erreur dans les fichiers modifiés |
| Playwright AuthGuard | ✅ /methodologie/themes → /login |

---

## Points à vérifier avant production

- [ ] Appliquer migration 00091 en remote
- [ ] Vérifier que `award_coach_grade` RPC existe en remote DB (Story 11.1)
- [ ] Tester : coach Bronze → ne voit pas contenu Or/Platine
- [ ] Tester : coach Or → voit Bronze + Argent + Or, pas Platine
- [ ] Coach sans grade → COALESCE → Bronze (comportement défensif)
