# Bug Crawler — 2026-04-07

## Résumé

- Pages / fichiers inspectés : 16 (analyse statique) + 16 routes Playwright live (crawl 2026-04-07 v2)
- CRITICAL : 0
- HIGH : 3 + 1 nouveau (voir section "Bugs live Playwright")
- MEDIUM : 2
- LOW : 5 + 1 nouveau
- INFO : 3

---

## Bugs détectés

---

### 🟠 HIGH — Couleurs hardcodées hors tokens dans TableauSeances

**Fichier :** `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
**Lignes :** 67, 68, 133, 545

**Description :**
- Ligne 67 : `text: '#1D4ED8'` (bleu Tailwind) pour le badge "Planifiée" — hors design system
- Ligne 68 : `text: '#92400E'` (ambre foncé) pour le badge "En cours" — déjà dans `colors.status.warningText` → à remplacer
- Ligne 133 : `const ALPHA_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']` — tableau de 5 couleurs hardcodées pour les avatars coach. Violet + bleu notamment hors charte AUREAK (cf. `_avatarHelpers.ts` qui les exclut explicitement)
- Ligne 545 : `color: '#FFFFFF'` dans `avatarText` — devrait utiliser `colors.text.primary`

**Impact :** Incohérence visuelle si le design system évolue. `#8B5CF6` et `#3B82F6` sont hors charte AUREAK (les mêmes couleurs sont explicitement exclus dans `_avatarHelpers.ts`).

---

### 🟠 HIGH — Couleurs hardcodées dans ActivitesHeader et presences/page

**Fichiers :**
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — ligne 105 : `color: '#18181B'` dans `newBtnText` (= `colors.text.dark` — doublon sans token)
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — ligne 249 : `color: '#FFFFFF'` dans `badgeRedText` (= `colors.text.primary`), ligne 729 : `color: '#18181B'` dans `avatarText`

**Description :** Valeurs hardcodées identiques à des tokens existants (`colors.text.dark` = `#18181B`, `colors.text.primary` = `#FFFFFF`). Si les tokens sont mis à jour, ces couleurs ne suivront pas.

**Impact :** Medium en pratique (valeurs actuellement identiques), mais violation de règle absolue n°2.

---

### 🟠 HIGH — `setLoading(true)` hors bloc `try` dans StatCards (pattern IIFE)

**Fichier :** `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
**Ligne :** 46–63

**Description :** Le pattern utilisé est :
```typescript
useEffect(() => {
  setLoading(true)      // ← hors du try, mais AVANT le IIFE async
  ;(async () => {
    try { ... }
    catch { ... }
    finally { setLoading(false) }
  })()
}, [...])
```
Le `setLoading(true)` est placé synchroniquement avant le IIFE — si le IIFE throw de façon synchrone avant d'atteindre le `finally`, `setLoading(false)` ne serait pas appelé. En pratique le IIFE ne peut pas throw synchrone ici, mais le pattern diverge du standard projet (`try { ... } finally { setLoading(false) }` avec `setLoading(true)` juste avant le `try`).

**Impact :** Spinner potentiellement bloqué dans un cas de regression future.

---

### 🟡 MEDIUM — Couleurs hardcodées dans PseudoFiltresTemporels

**Fichier :** `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`
**Ligne :** 40 — `color: isActive ? '#FFFFFF' : colors.text.muted`

**Description :** `'#FFFFFF'` hardcodé au lieu de `colors.text.primary`. Même pattern que ci-dessus.

**Impact :** Faible en pratique, violation règle n°2.

---

### 🟡 MEDIUM — Silent catch dans loadTierFilter / formatBirthDate / formatDotDate

**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`
**Lignes :** 41, 203, 354

**Description :**
```typescript
} catch { return [] }    // ligne 41 — loadTierFilter()
} catch { return null }  // ligne 203 — formatBirthDate()
} catch { return '—' }   // ligne 354 — formatDotDate()
```
Ces blocs `catch` sans corps ne respectent pas le pattern "console guard obligatoire". L'absence de log masque les erreurs de parsing JSON (localStorage corrompu) et de parsing de date.

**Impact :** Debug difficile si localStorage est corrompu ou si une date invalide est reçue. Pas de BLOCKER car les fallbacks sont corrects.

---

## Issues LOW

### 🔵 LOW — `console.error` non-guardé dans evenements/page.tsx

**Fichier :** `aureak/apps/web/app/(admin)/evenements/page.tsx`
**Ligne :** 216

```typescript
if ((process.env.NODE_ENV as string) !== 'production')
```
Ce pattern cast `as string` est non-standard par rapport au reste du projet qui utilise `process.env.NODE_ENV !== 'production'` sans cast. Le cast est inutile (TypeScript infère correctement le type). Mineur mais incohérent.

---

### 🔵 LOW — Colonne MÉTHODE toujours `null` dans TableauSeances

**Fichier :** `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
**Ligne :** 375

```typescript
<MethodeBadge method={null} />
```
Le commentaire indique "non disponible via listSessionsWithAttendance". La colonne MÉTHODE est toujours vide (`—`) dans le tableau. Ce n'est pas un bug de code (pas d'erreur), mais une feature non implémentée présentée à l'utilisateur comme vide sans indication "bientôt disponible".

---

### 🔵 LOW — Colonne COACH toujours vide dans TableauSeances

**Fichier :** `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`
**Ligne :** 385

```typescript
<CoachAvatars coachIds={[]} coachNames={new Map()} />
```
Même pattern que MÉTHODE — colonne COACH systématiquement vide (`—`).

---

### 🔵 LOW — `@ts-ignore web only boxShadow` sans commentaire d'alternative

**Fichiers :** `StatCards.tsx:135`, `presences/page.tsx:180`, `evenements/page.tsx:485`

Pattern `// @ts-ignore — web only boxShadow` utilisé plusieurs fois. Pattern acceptable dans ce contexte (RN Web), mais répétitif. Pas de BLOCKER.

---

### 🔵 LOW — `eslint-disable react-hooks/exhaustive-deps` dans children/index.tsx

**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`
**Lignes :** 1075, 1004

Deux suppressions d'ESLint sur les dépendances de `useEffect`/`useCallback`. Peut masquer une stale closure dans `load()`. À surveiller si les filtres ne répondent plus correctement après une navigation.

---

## Fichiers sans issue bloquante

- `aureak/apps/web/app/(admin)/activites/page.tsx` — aucune erreur détectée
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — try/finally OK, console guards OK
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — try/finally OK, console guards OK
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — try/finally OK (2 blocs), console guards OK (seules couleurs hardcodées signalées)
- `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` — page statique, aucun appel async, OK
- `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` — page statique, OK
- `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` — page statique, OK
- `aureak/apps/web/app/(admin)/evenements/page.tsx` — try/finally OK, console guard OK (seul cast `as string` mineur)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — try/finally OK, console guard OK
- `aureak/apps/web/app/(admin)/children/index.tsx` — try/finally OK, console guards OK (silent catches dans helpers non-async = acceptable)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — try/finally OK, console guards OK
- `aureak/packages/theme/src/tokens.ts` — tokens complets, tous les tokens référencés dans les fichiers inspecté sont définis
- `aureak/apps/web/app/(admin)/children/_avatarHelpers.ts` — aucune issue

---

## INFO

- [INFO] App tourne — `curl http://localhost:8081` retourne HTTP 200. Playwright disponible.
- [INFO] Tous les tokens utilisés (`colors.dark.elevated`, `colors.dark.textMuted`, `colors.dark.border`, `colors.status.orangeText`, `colors.status.injured`, etc.) sont bien définis dans `tokens.ts`. Pas de token manquant.
- [INFO] Accès Supabase : 100% via `@aureak/api-client` dans tous les fichiers inspectés. Règle n°1 respectée.

---

## Recommandations

1. **HIGH — Corriger ALPHA_COLORS** dans `TableauSeances.tsx:133` : remplacer `#8B5CF6` (violet) et `#3B82F6` (bleu) par des couleurs conformes à la charte AUREAK. Utiliser la même palette que `_avatarHelpers.ts`.
2. **HIGH — Tokeniser les couleurs hardcodées** dans `TableauSeances.tsx:67-68`, `ActivitesHeader.tsx:105`, `presences/page.tsx:249+729`, `PseudoFiltresTemporels.tsx:40` : remplacer `'#18181B'` → `colors.text.dark`, `'#FFFFFF'` → `colors.text.primary`, `'#92400E'` → `colors.status.warningText`.
3. **MEDIUM — Ajouter console guard dans silent catches** de `children/index.tsx` (lignes 41, 203, 354) pour faciliter le debug de localStorage corrompu.

---

## Bugs live Playwright (crawl 2026-04-07 v2)

Crawl navigateur complet effectué sur 16 routes admin.

### 🟠 HIGH — Vue `coach_current_grade` → 406 sur `/coaches` et `/coaches/[id]/grade`

**Symptôme Playwright** :
- `GET /rest/v1/coach_current_grade?select=*&coach_id=eq.{uuid}` → HTTP 406 × 4 (liste coaches) + 1 (fiche grade)
- Colonne GRADE affiche "—" pour tous les coachs dans la liste
- Page `/coaches/[id]/grade` se rend mais grade courant absent

**Cause** : Vue `coach_current_grade` définie en migration `00091_grade_content_permissions.sql` non appliquée sur l'instance Supabase dev locale. Existe en production remote.

**Fichiers** :
- `supabase/migrations/00091_grade_content_permissions.sql`
- `aureak/packages/api-client/src/admin/grades.ts:44` (`getCoachCurrentGrade`)
- `aureak/apps/web/app/(admin)/coaches/index.tsx:85` (appel en boucle sur tous les coachs)
- `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx:31` (appel unique)

**Impact prod** : Aucun (vue présente en remote). Bug dev uniquement.
**Fix** : `supabase db push` depuis la racine pour synchroniser les migrations.

---

### 🔵 LOW — Warning `Image.style.resizeMode deprecated` sur `/clubs`

**Symptôme Playwright** :
```
[warn] Image: style.resizeMode is deprecated. Please use props.resizeMode.
```
**Cause** : Composant `<Image>` utilisant `style={{ resizeMode: ... }}` au lieu de la prop `resizeMode` (probablement logos clubs).
**Fichier probable** : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` ou composant UI logo club.
**Impact** : Aucun fonctionnel. Warning migration React Native.

---

### INFO — Double chargement `child_directory` sur `/dashboard`

Requêtes `child_directory` émises deux fois (reqid 881 puis 899) sur la page dashboard. Probablement un double useEffect ou absence de memoïsation. Non bloquant mais inefficace (50 lignes × 2).

---

## Chiffres (mis à jour)

| Sévérité | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 3 + 1 (coach_current_grade 406) |
| MEDIUM | 2 |
| LOW | 5 + 1 (resizeMode deprecated) |
| INFO | 3 + 1 (double fetch child_directory) |
