# Story 97.7 — Académie / Scout : refonte complète

Status: done

## Completion Notes

### Diagnostic

- **Avant** : stub "Bientôt disponible" de Story 75.2 (pas de header cohérent, pas d'AcademieNavBar).
- **Cause profonde** : le rôle `scout` **n'existe pas** dans l'enum DB `user_role` (confirmé par Epic 89 et `hub-counts.ts:149 — scouts: number | null // toujours null — rôle scout pas dans user_role enum`). Le concept "scout" dans Aureak = **évaluateur** d'un prospect gardien (table `prospect_scout_evaluations`, Story 89.2), pas un profil utilisateur autonome.
- **Ce qui était cassé** : désalignement entre l'onglet "Scouts" visible dans la sidebar/nav Académie et l'absence totale d'un concept de profil scout côté DB. L'utilisateur voyait un onglet nav qui promettait une liste, mais atterrissait sur un stub.

### Refonte

- `<AdminPageHeader title="Scouts" />` + `<AcademieNavBar />` intégrés (onglet SCOUTS actif, count 0).
- Carte explicative : clarifie que les observations scout se font depuis la fiche prospect gardien.
- CTA "Voir les prospects gardiens →" qui route vers `/prospection/gardiens`.
- Hint en bas : documentation du chemin pour créer un vrai rôle scout si le produit évolue (requis : ajout valeur à `user_role` enum).

### Non-fait (volontaire)

- **Pas de création de rôle `scout`** dans user_role — changement de schéma DB hors scope template (AC #11 non-goals).
- **Pas de création de `listScouts()`** — n'aurait retourné aucun user puisque le rôle n'existe pas.
- **Pas de refonte des évaluations scout** (prospect_scout_evaluations) — déjà implémentées en Story 89.2, accessibles depuis la fiche prospect gardien.

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.7
- **Story key** : `97-7-refonte-academie-scout`
- **Priorité** : P2 (refonte qualitative — pas bloquante pour la navigation globale)
- **Dépendances** : **97.3** (AdminPageHeader v2) · recommandé : après 97.6 (pattern Académie consolidé)
- **Source** : Audit UI 2026-04-22. L'utilisateur a signalé : "faire attention que dans scout, il faut refaire la page parce que je ne sais pas ce qui s'est passé."
- **Effort estimé** : M (~5-7h — diagnostic visuel + refonte liste + header + states + QA)

## Story

As an admin,
I want que la page `/academie/scouts` soit **refaite complètement** pour présenter la liste des scouts de l'académie de manière claire, cohérente avec le reste de la zone Académie, et sans anomalie visuelle ni fonctionnelle,
So that je puisse consulter et gérer les scouts dans les mêmes standards que Joueurs, Coaches ou Groupes.

## Contexte

### État actuel

Page : `aureak/apps/web/app/(admin)/academie/scouts/index.tsx`

L'utilisateur rapporte un état "cassé" ou incohérent — sans précision détaillée sur la nature exacte du bug. Le dev doit commencer par un **diagnostic visuel + console** :

1. Lancer dev server + navigate `/academie/scouts`
2. Screenshot de l'état actuel
3. Console Chrome DevTools : identifier erreurs JS, warnings
4. Lire le code de la page actuelle — identifier les anomalies (imports cassés, composants orphelins, styles non-tokenisés, queries Supabase obsolètes…)

### Historique à considérer

- La table / entité "scout" a évolué (cf. commits `academie/scouts/...`). Possibles divergences schéma DB ↔ types TS ↔ UI.
- La page a peut-être été générée en early stage avec des patterns obsolètes (header custom, styles inline, fetch direct Supabase hors api-client).

### Résultat attendu

Page refaite dans le pattern "page liste Académie" canonique, avec :
- `<AdminPageHeader title="Scouts" />`
- Liste tabulaire (ou cards responsive) des scouts actifs
- Filtres basiques (nom, date ajout)
- Action `+ Nouveau scout` si route `/new` existe, sinon masquée
- Empty state approprié ("Aucun scout pour l'instant")
- Loading skeleton
- Error state avec retry

## Acceptance Criteria

1. **Diagnostic documenté** : en tête du fichier `index.tsx` ou dans les completion notes de la story, lister :
   - Ce qui était cassé avant (erreurs console, régression visuelle, data manquante, etc.)
   - Ce qui a été refait
   - Ce qui a été volontairement omis (non-goals)

2. **Header** : `<AdminPageHeader title="Scouts" />` (pas d'eyebrow, pas de subtitle).

3. **Liste des scouts** : afficher nom prénom, email, date d'arrivée, indicateur actif/inactif. Filtres texte (nom) et toggle actif/inactif minimum.

4. **Data** : fetch via `@aureak/api-client` uniquement (pas d'accès direct `supabase.from('scouts')`). Si la fonction `listScouts()` n'existe pas, la créer dans `aureak/packages/api-client/src/admin/scouts.ts`.

5. **States UI** :
   - Loading : `<SkeletonCard>` ou équivalent cohérent avec les autres pages Académie
   - Empty (aucun scout) : message d'encouragement + lien bouton "+ Nouveau scout" si route existe
   - Error : message clair + bouton retry

6. **Styles** : 100% tokens `@aureak/theme` — `grep '#[0-9a-fA-F]{3,6}'` sur le fichier refait = 0 match.

7. **`try/finally`** sur les state setters loading :
   ```typescript
   setLoading(true)
   try {
     const { data } = await listScouts()
     setScouts(data ?? [])
   } finally {
     setLoading(false)
   }
   ```

8. **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)` systématiques.

9. **Navigation** : intégration correcte dans `AcademieNavBar` (le onglet "Scouts" doit être actif sur cette page).

10. **Conformité CLAUDE.md** :
    - `npx tsc --noEmit` EXIT 0
    - Tokens seuls
    - api-client pour accès DB
    - Pattern Expo Router `page.tsx` + `index.tsx` re-export (si structure actuelle avec `index.tsx` → la convertir, ou garder `index.tsx` avec la logique si pattern existant déjà)

11. **Test Playwright** :
    - `/academie/scouts` → charge sans erreur console
    - Screenshot confirme le nouveau design
    - Tester au moins 1 interaction (filtre texte ou toggle actif/inactif)
    - Vérifier l'intégration `AcademieNavBar` (onglet actif)

12. **Non-goals explicites** :
    - **Pas de création de fonctionnalités métier nouvelles** (ajout/édition/suppression scouts) si pas déjà présentes — scope = refonte de l'existant
    - **Pas de modification du schéma DB**
    - **Pas de refonte des rôles/permissions** autour de la table scouts

## Tasks / Subtasks

- [ ] **T1 — Diagnostic** (AC #1)
  - [ ] Playwright navigate `/academie/scouts` + screenshot
  - [ ] Lire code actuel `index.tsx`
  - [ ] Relever erreurs console + patterns obsolètes
  - [ ] Documenter findings

- [ ] **T2 — API client** (AC #4)
  - [ ] Vérifier `listScouts()` dans api-client ; créer si absent
  - [ ] Types TS miroirs du schéma DB

- [ ] **T3 — Refonte page** (AC #2, #3, #5, #6, #7, #8)
  - [ ] Header v2
  - [ ] Liste/table tokenisée
  - [ ] States loading/empty/error

- [ ] **T4 — Navigation** (AC #9)
  - [ ] Vérifier onglet "Scouts" dans AcademieNavBar
  - [ ] Count optionnel via Context

- [ ] **T5 — QA** (AC #10, #11)
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright + screenshots before/after

## Dev Notes

### Pattern de référence

Se baser sur `/academie/coaches` ou `/academie/joueurs` (après 97.6) comme pattern canonique. Structure type :
```tsx
export default function ScoutsPage() {
  const [scouts, setScouts] = useState<Scout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await listScouts()
      setScouts(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[academie/scouts] load:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(
    () => scouts.filter(s => s.fullName.toLowerCase().includes(filter.toLowerCase())),
    [scouts, filter],
  )

  return (
    <View>
      <AdminPageHeader title="Scouts" />
      {/* AcademieNavBar hérité du layout parent */}
      {/* filtres */}
      {loading ? <SkeletonCard /> : filtered.length === 0 ? <EmptyState /> : <ScoutsTable data={filtered} />}
    </View>
  )
}
```

### Grep usage de la page

Avant refonte, vérifier si `/academie/scouts` est référencé depuis d'autres pages (ex. bouton "Gérer les scouts" quelque part). Si oui, s'assurer que la page refaite conserve le chemin attendu.

### Données potentiellement orphelines

Si la DB contient un schéma `scouts` obsolète ou partiellement migré (foreign keys cassées, colonnes non-utilisées), **ne pas y toucher dans cette story** — documenter en dev notes et ouvrir une story infra dédiée.

### References

- Page actuelle : `aureak/apps/web/app/(admin)/academie/scouts/index.tsx`
- Composant header : `aureak/apps/web/components/admin/AdminPageHeader.tsx`
- Nav secondaire : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx`
- Pattern de référence : pages Coaches et Joueurs (post-97.6)
- API client : `aureak/packages/api-client/src/admin/` (ajouter `scouts.ts` si absent)
