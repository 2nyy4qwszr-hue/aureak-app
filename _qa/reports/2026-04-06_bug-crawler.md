# Bug Crawler — 2026-04-06

## Résumé

- Mode : Analyse statique (app non démarrée — `curl` exit code 7)
- Fichiers analysés : ~40 fichiers dans `aureak/apps/web/app/(admin)/` + `aureak/packages/api-client/src/`
- CRITICAL : 0 nouveaux (confirmations des existants)
- HIGH : 1 nouveau (B-CRAWLER-02)
- MEDIUM : 1 nouveau (B-CRAWLER-03)
- LOW : 0 nouveau
- Bugs clôturés (résolus) : 1 (B-PATROL-04)

---

## Nouveaux bugs détectés

### 🟠 HIGH — B-CRAWLER-02 : Unguarded `console.error` systémique dans `@aureak/api-client`

**Pages affectées :** Toutes les pages utilisant méthodologie, notifications, dashboard stats
**Fichiers source :**
- `aureak/packages/api-client/src/methodology.ts` — 8 occurrences (`[getThemeOfWeek]`, `[getRecommendedSituations]` ×2, `[addSituationToSession]`, `[listSessionModules]`, `[upsertSessionModule]`, `[addSituationToModule]`, `[removeSituationFromModule]`)
- `aureak/packages/api-client/src/notifications.ts` — 4 occurrences (`[notifications] markNotificationRead`, `markAllNotificationsRead`)
- `aureak/packages/api-client/src/admin/dashboard.ts` — 7 occurrences (`[dashboard] getTopStreakPlayers` ×2, `fetchActivityFeed` ×2, `getNavBadgeCounts` ×2, `getPlayerOfWeek`)
- `aureak/packages/api-client/src/admin/evaluations.ts` — 2 occurrences
- `aureak/packages/api-client/src/admin/child-directory.ts` — 1 occurrence

**Total : 22 occurrences non guardées**

**Violation :** CLAUDE.md règle #4 — Console guards obligatoires dans `packages/api-client/` :
```typescript
// CORRECT
if (process.env.NODE_ENV !== 'production') console.error('[module] error:', err)

// ACTUEL (interdit en production)
console.error('[module] error:', err)
```

**Impact :** Ces logs fuiteront en production dans la console navigateur. Informations internes exposées (noms de colonnes, stack traces, erreurs Supabase) potentiellement visibles aux utilisateurs finaux. Pollution des outils de monitoring.

**Reproductible :** Statiquement — toute feature utilisant ces fonctions API logge sans guard.

---

### 🟡 MEDIUM — B-CRAWLER-03 : `load()` sans `setLoading(true)` dans `implantations/index.tsx`

**Page :** `/(admin)/implantations`
**Fichier source :** `aureak/apps/web/app/(admin)/implantations/index.tsx` ligne 871

**Code actuel :**
```typescript
const [loading, setLoading] = useState(true)  // ← initialisé à true une seule fois

const load = async () => {
  setLoadError(null)
  try {
    const { data, error } = await listImplantations()
    // ...
  } finally {
    setLoading(false)  // ← reset mais jamais re-setté à true
  }
}
```

**Appelé plusieurs fois :**
- Ligne 935 : `useEffect(() => { load() }, [])` — premier mount (loading = true par défaut, OK)
- Ligne 983 : `await load()` après création d'implantation
- Ligne 997 : `await load()` après sauvegarde d'implantation
- Ligne 1007 : `await load()` après suppression de photo

**Impact :** Sur toute action (create/save/delete), le rechargement de la liste se fait sans indicateur visuel. L'utilisateur ne voit aucun feedback de chargement sur les 2e, 3e, etc. appels. Pas de crash, mais UX dégradée.

**Correction :** Ajouter `setLoading(true)` au début de `load()`.

---

## Statut des bugs existants (hors nouvelles découvertes)

### Confirmés ouverts

| ID | Description | Statut |
|----|-------------|--------|
| B-CRAWLER-01 | `unassigned_at` inexistant dans `coach_implantation_assignments` — KPIs dashboard à 0 | Toujours ouvert |
| B-PATROL-01 | Vue `v_club_gardien_stats` manquante en DB remote (migration 00113 existe localement) | Toujours ouvert — sync remote requis |
| B-PATROL-02 | Erreur 400 stages/index (bannière + état vide simultanés) | Toujours ouvert |
| B-PATROL-03 | Erreurs React "Unexpected text node" ×2 sur `/seances` | Toujours ouvert |

### Résolu (clôture proposée)

| ID | Description | Preuve |
|----|-------------|--------|
| B-PATROL-04 | Lien sidebar Groupes → 404 (`/groupes`) | `_layout.tsx` ligne 129 : `href: '/groups'` ; répertoire `(admin)/groups/index.tsx` existe |

---

## Patterns vérifiés sans anomalie

| Pattern | Résultat |
|---------|----------|
| Catch silencieux `catch(() => {})` | Aucun trouvé |
| `console.log` non gardé dans `apps/(admin)/` | Aucun trouvé (le seul cas ligne 136 de `[situationKey]/page.tsx` est guardé) |
| `setLoading(false)` hors finally (admin/) | Aucun — tous dans finally ou `.finally()` |
| `setSaving(false)` hors finally | Aucun |
| `setCreating(false)` hors finally | Aucun |
| `setSubmitting(false)` hors finally | Aucun |
| `extractFunctionError` dans `profiles.ts` | Correct — clone Response avant `.json()`, garde console dans catch |
| `seances/new.tsx` handleCreate | Correct — `setCreating(true)` puis try/finally `setCreating(false)` |
| `users/new.tsx` handleSubmit | Correct — try/catch/finally avec `setSubmitting(false)` |

---

## Recommandations

### P1 — Corrections urgentes (HIGH)

1. **B-CRAWLER-02 — Ajouter NODE_ENV guards dans `@aureak/api-client`**
   - `aureak/packages/api-client/src/methodology.ts` : wrapper les 8 `console.error` non guardés
   - `aureak/packages/api-client/src/notifications.ts` : wrapper les 4 `console.error`
   - `aureak/packages/api-client/src/admin/dashboard.ts` : wrapper les 7 `console.error` non guardés
   - `aureak/packages/api-client/src/admin/evaluations.ts` : wrapper les 2
   - `aureak/packages/api-client/src/admin/child-directory.ts` : wrapper le 1

### P2 — Corrections importantes (MEDIUM)

2. **B-CRAWLER-03 — `implantations/index.tsx`** :
   Ajouter `setLoading(true)` au début de `load()` (ligne 871) pour cohérence UX.

3. **B-PATROL-01 — Sync migration 00113** :
   Exécuter `supabase db push` sur le projet remote pour créer `v_club_gardien_stats`.

4. **W-PATROL-02 — Label "En_cours" dans `/stages`** :
   `stages/index.tsx` ligne 123 : remplacer `st.charAt(0).toUpperCase() + st.slice(1)` par une map `{ en_cours: 'En cours', planifié: 'Planifié', terminé: 'Terminé', annulé: 'Annulé' }`.

---

## Pages et patterns sans erreur ✅

- `aureak/apps/web/app/(admin)/attendance/index.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/settings/school-calendar/page.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/clubs/new.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/groups/GroupGeneratorModal.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/exports/index.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/coaches/index.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx` — try/finally correct
- `aureak/apps/web/app/(admin)/clubs/rbfa-sync/reviews/page.tsx` — try/finally correct
- `aureak/packages/api-client/src/admin/profiles.ts` — extractFunctionError correct
