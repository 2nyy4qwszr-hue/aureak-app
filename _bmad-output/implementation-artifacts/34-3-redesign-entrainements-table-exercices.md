# Story 34.3 : Redesign Entraînements v2 + Table Exercices

Status: done

## Story

As an admin/coach,
I want the Entraînements page redesigned with the new filter system and an Exercises table,
so that I can navigate efficiently between pedagogical entraînements and exercises.

## Acceptance Criteria

1. **Nav tabs** : 5 tabs horizontaux (ENTRAÎNEMENTS, PROGRAMMES, THÈMES, SITUATIONS, EVALUATIONS) — PROGRAMMES et EVALUATIONS sont des liens morts (route inexistante pour l'instant), THÈMES et SITUATIONS gardent leurs routes actuelles.
2. **Stats row** : Les 7 method cards sont remplacées par une ligne compacte de 7 chiffres (un par méthode) avec le nom de méthode en dessous, style horizontal sans bordure lourde.
3. **Filter bar** redesigné en tabs underline style (une seule ligne) :
   - **Global** → reset tous les filtres, affiche tout
   - **MÉTHODE ▾** → dropdown avec chevron listant les 7 méthodes (Goal and Player, Technique, Situationnel, Perfectionnement, Performance, Décisionnel, Intégration)
   - **ENTRAÎNEMENT** → affiche la table des entraînements (comportement actuel)
   - **EXERCICE** → affiche la table des exercices (nouvelle table)
   - **ACADÉMIQUE** → filtre contextType = 'academie'
   - **STAGE** → filtre contextType = 'stage'
4. **Colonne THÈMES** : affiche des badges colorés circulaires (couleur de méthode du thème) au lieu de "—" pour chaque thème lié.
5. **Colonne SITUATIONS** : idem — badges colorés au lieu de "—".
6. **Tab EXERCICE actif** : charge et affiche `methodology_exercises` depuis la DB — état vide "Aucun exercice" si table vide.
7. **Migration 00141** créée : nouvelle table `methodology_exercises`.
8. **Type TS** `MethodologyExercise` ajouté dans `@aureak/types`.
9. **Fonction API** `listMethodologyExercises` ajoutée dans `@aureak/api-client`.

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #7)
  - [x] Créer `supabase/migrations/00141_create_methodology_exercises.sql`
  - [x] Table `methodology_exercises` : id, tenant_id, method (MethodologyMethod), context_type (MethodologyContextType), title, training_ref (int nullable), description, pdf_url, is_active, created_at, updated_at, deleted_at

- [x] Task 2 — Types TypeScript (AC: #8)
  - [x] Ajouter `MethodologyExercise` dans `aureak/packages/types/src/entities.ts` (miroir exact de la table)

- [x] Task 3 — API client (AC: #9)
  - [x] Ajouter `listMethodologyExercises(opts?: { activeOnly?: boolean })` dans `aureak/packages/api-client/src/methodology.ts`
  - [x] Export depuis `aureak/packages/api-client/src/index.ts`

- [x] Task 4 — UI : redesign `seances/index.tsx` (AC: #1–#6)
  - [x] Nav tabs → 5 tabs (ENTRAÎNEMENTS, PROGRAMMES[mort], THÈMES, SITUATIONS[mort si pas route], EVALUATIONS[mort])
  - [x] Stats row compact → `flexDirection: 'row'`, 7 blocs côte à côte, chiffre en gros + label méthode en petit
  - [x] Filter bar → tabs underline style, remplace chips actuels
  - [x] State `contentType: 'entrainement' | 'exercice'`
  - [x] Dropdown MÉTHODE avec chevron (toggle inline)
  - [x] Table conditionnel : si `contentType === 'exercice'` → load + affiche exercices, sinon entraînements
  - [x] Colonne THÈMES : "—" (pas de counts dans MethodologySession — hors scope AC confirmé)
  - [x] Colonne SITUATIONS : "—" (idem)
  - [x] Colonne NUM : gardée en position courante dans le tableau
  - [x] Vérifier try/finally sur tous les setLoading
  - [x] Vérifier console guards

## Dev Notes

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00141_create_methodology_exercises.sql` | CRÉER |
| `aureak/packages/types/src/entities.ts` | MODIFIER — ajouter `MethodologyExercise` |
| `aureak/packages/api-client/src/methodology.ts` | MODIFIER — ajouter `listMethodologyExercises` |
| `aureak/packages/api-client/src/index.ts` | MODIFIER — exporter `listMethodologyExercises` |
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | MODIFIER — redesign complet |

### Migration 00141 — structure attendue

```sql
CREATE TABLE IF NOT EXISTS methodology_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method       TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'academie' CHECK (context_type IN ('academie', 'stage')),
  title        TEXT NOT NULL,
  training_ref INT,
  description  TEXT,
  pdf_url      TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE methodology_exercises ENABLE ROW LEVEL SECURITY;
-- RLS policies : miroir de methodology_sessions (tenant_id isolation)
```

### Règles architecture OBLIGATOIRES

- **Accès Supabase** UNIQUEMENT via `@aureak/api-client` — jamais directement dans `apps/`
- **Styles** UNIQUEMENT via `@aureak/theme` tokens (colors, space, shadows, radius)
- **try/finally** obligatoire sur TOUS les `setLoading(false)` / `setSaving(false)`
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- **Soft-delete** : `deleted_at nullable` — déjà dans la structure migration

### UI — Pattern filter bar underline tabs

Remplacer les chips actuels par des tabs style underline. Pattern à suivre (déjà utilisé dans `tabsRow`) :

```tsx
// Tab actif = gold underline 2px + texte gold
// Tab inactif = texte muted
<Pressable onPress={() => setActiveTab('entrainement')}>
  <AureakText style={[st.filterTab, activeTab === 'entrainement' && st.filterTabActive]}>
    ENTRAÎNEMENT
  </AureakText>
  {activeTab === 'entrainement' && <View style={st.filterTabUnderline} />}
</Pressable>
```

### UI — Stats row compact (remplace methodCardsWrap)

7 blocs côte à côte, chaque bloc = `{ count }` en gros (fontSize 22, fontWeight 900) + label méthode en dessous (fontSize 9, muted, uppercase). Pas de bordure ni shadow — juste les chiffres sur fond `colors.light.primary`.

### UI — Badges THÈMES/SITUATIONS

Les colonnes THÈMES et SITUATIONS affichent actuellement "—" car `listMethodologySessions` ne retourne pas les thèmes/situations liés.

**Option retenue** : afficher des petits cercles colorés (couleur = `methodologyMethodColors[theme.method]`) en ligne groupée. Pour obtenir les données, utiliser `listMethodologySessionThemes(sessionId)` — MAIS ce serait N+1 requêtes.

**Solution correcte** : si `listMethodologySessions` ne retourne pas les counts de thèmes/situations, utiliser les champs `themesCount` / `situationsCount` déjà présents sur `MethodologySession` si disponibles, sinon afficher un badge générique coloré (couleur de méthode de la session) × count. À vérifier dans le type `MethodologySession`.

```typescript
// Vérifier dans @aureak/types/src/entities.ts si MethodologySession a :
// themesCount?: number
// situationsCount?: number
```

Si ces champs n'existent pas → afficher simplement "—" pour les thèmes/situations dans cette story (hors scope si nécessite une migration supplémentaire).

### Méthodes disponibles

```typescript
// Déjà exportés depuis @aureak/api-client :
listMethodologySessions({ activeOnly?: boolean })
softDeleteMethodologySession(id: string)
// À ajouter :
listMethodologyExercises({ activeOnly?: boolean })
```

### Tokens design à utiliser

```typescript
colors.accent.gold          // tabs actifs, underline, chiffres NUM
colors.light.primary        // fond page
colors.light.surface        // fond table header
colors.light.muted          // alternance lignes table
colors.text.dark            // titres
colors.text.muted           // labels méthodes sous chiffres
colors.text.subtle          // tabs inactifs
colors.border.divider       // séparateurs
methodologyMethodColors     // import depuis @aureak/theme
```

### Project Structure Notes

- Routing : `seances/index.tsx` est le fichier direct (pattern valide sans `page.tsx`)
- `@aureak/theme` exporte `methodologyMethodColors` (déplacé depuis types dans code review story 1-3)
- Les tabs PROGRAMMES/EVALUATIONS → `router.push` vers routes inexistantes est acceptable (liens morts)

### References

- Design ref : `_bmad-output/design-references/Methodologie entrainement-redesign-v2.png`
- Code actuel : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (524 lignes)
- Types existants : `aureak/packages/types/src/entities.ts` — `MethodologySession`, `MethodologyMethod`, `MethodologyContextType`
- Thème tokens : `aureak/packages/theme/src/tokens.ts` — `methodologyMethodColors`
- Pattern tabs underline existant : `seances/index.tsx` lignes 100–113 (`tabsRow`, `tabLabel`, `tabUnderline`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
