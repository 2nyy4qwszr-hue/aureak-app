# Story 69.10 : BUG — checkAcademyMilestones → 406 PGRST116 au chargement dashboard

Status: done

## Story

En tant qu'admin,
je veux que le dashboard se charge sans erreur 406,
afin d'éviter une exception silencieuse à chaque ouverture.

## Acceptance Criteria

1. `checkAcademyMilestones` ne génère plus d'erreur 406 (PGRST116) en console
2. Le dashboard se charge normalement même si le profil est absent dans `profiles`
3. La fonction gère gracieusement le cas "0 résultats" sans crasher

## Tasks

- [x] T1 — Dans `aureak/packages/api-client/src/gamification/milestones.ts`, localiser `checkAcademyMilestones`
- [x] T2 — Remplacer `.single()` par `.maybeSingle()` sur la requête `profiles` — `.maybeSingle()` retourne `null` au lieu d'une erreur PGRST116 quand 0 lignes
- [x] T3 — Ajouter une guard : si le profil est `null` → retourner early sans lancer les checks de milestones
- [x] T4 — Vérifier que zéro erreur console sur le dashboard après le fix

## Dev Notes

**Cause exacte :** `.single()` sur PostgREST lance une erreur PGRST116 si la requête retourne 0 lignes. Pour les requêtes où 0 résultats est un cas valide (profil non encore créé, compte test), utiliser `.maybeSingle()` qui retourne `null` proprement.

**Pattern correct :**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('...')
  .eq('user_id', userId)
  .maybeSingle()   // ← au lieu de .single()

if (!profile) return   // guard early exit
```

Console guard obligatoire. Try/finally obligatoire.

### Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/gamification/milestones.ts` | `.single()` → `.maybeSingle()` + guard null |

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- `.single()` remplacé par `.maybeSingle()` à la ligne 54
- Guard `if (!profile) return { data: [], error: null }` ajouté à la ligne 60
- Console guards et try/finally déjà présents — conformes aux règles du projet
- Aucune migration SQL nécessaire (fix purement API client)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/gamification/milestones.ts` | Modifié ✓ |
