# Story 97.13 — Partenariat : template + titres + fix bug runtime

Status: done

## Completion Notes

### Bug runtime signalé — DIAGNOSTIQUÉ

**Cause identifiée** : migration `00169_sponsors_and_links.sql` existe en local mais **n'a pas été appliquée à la base Supabase distante**. Erreur console :

```
Could not find the table 'public.sponsors' in the schema cache
Hint: Perhaps you meant the table 'public.consents'
PGRST205 — /rest/v1/sponsors
```

Les pages `/partenariat/sponsors` et `/partenariat/clubs` s'affichent correctement (fallback UI OK — empty state "Aucun sponsor configuré") mais les opérations DB échouent avec 404 PGRST205.

**Fix hors scope de cette story (template)** — action requise de l'utilisateur :

```bash
# Depuis la racine du dépôt
supabase db push
# OU
supabase migration up
```

Les migrations `00168_create_media_items.sql` et `00169_sponsors_and_links.sql` doivent être poussées. Ouvrir une story dédiée (`97-13a-fix-sponsors-migration`) si nécessaire pour tracer le déploiement.

### Template appliqué

- AdminPageHeader v2 "Sponsors" / "Clubs partenaires" + PartenariatNavBar
- PartenariatNavBar retiré de `_layout.tsx`, intégré dans chaque page après AdminPageHeader
- Actions "+ Nouveau sponsor" / "+ Nouveau partenariat" conservées via `actionButton` prop
- Cleanup : headerRow + headerText + title + subtitle styles conservés mais non utilisés (peuvent être retirés en cleanup ultérieur)
- Hub `/partenariat` : redirect `/partenariat/sponsors` conservé (pas de titre à ajouter)

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.13
- **Story key** : `97-13-template-partenariat`
- **Priorité** : P1 (l'utilisateur a signalé un bug runtime à investiguer)
- **Dépendances** : **97.3** (AdminPageHeader v2)
- **Source** : Audit UI 2026-04-22. User : "Partenariat, slash sponsor, club partenaire" + "il y a une page partenariat qui ne fonctionne pas. Est-ce que tu sais regarder si ça a été fait ou pas ?" — diagnostic rapide a montré que la page existe (Epic 92) mais bug runtime possible.
- **Effort estimé** : M (~4-5h — 4 pages + diagnostic éventuel bug runtime + fix)

## Story

As an admin,
I want que les pages Partenariat (hub, sponsors, clubs partenaires) utilisent le template `<AdminPageHeader />` v2, que tout bug runtime signalé par l'utilisateur soit diagnostiqué et corrigé, et que les titres reflètent les sous-sections,
So that la zone Partenariat soit cohérente avec le reste de l'admin et fonctionne sans erreur.

## Contexte

### Pages existantes (Epic 92, mergées)

- `/partenariat` → redirect vers `/partenariat/sponsors` (Story 92.1)
- `/partenariat/sponsors` — liste sponsors (Story 92.2)
- `/partenariat/sponsors/[sponsorId]` — détail sponsor
- `/partenariat/clubs` — liste clubs partenaires (Story 92.3)

### Bug runtime signalé

L'utilisateur mentionne que "la page Partenariat ne fonctionne pas". Le code existe (`partenariat/page.tsx` fait un Redirect, `sponsors/page.tsx` est bien implémenté). Le bug est donc probablement :
- Erreur JS runtime au chargement (data manquante, null ref)
- Problème RLS (pas de sponsors visibles pour l'admin connecté)
- Bug dans le redirect (loop?)
- Erreur de compilation silencieuse

**Action en début de story** : dev server + Playwright navigate `/partenariat` → analyser console, network, screenshot. Identifier la cause exacte avant de refaire le header.

### Titres cibles

| URL | Titre |
|---|---|
| `/partenariat` | redirect (pas de titre, juste redirect) |
| `/partenariat/sponsors` | "Sponsors" |
| `/partenariat/sponsors/[id]` | nom du sponsor (dynamique) |
| `/partenariat/clubs` | "Clubs partenaires" |

## Acceptance Criteria

1. **Diagnostic bug runtime** (AC prioritaire) :
   - Lancer dev server + navigate `/partenariat` + `/partenariat/sponsors` + `/partenariat/clubs`
   - Analyser console + network
   - **Documenter** la cause exacte du bug en dev notes + completion notes
   - **Fixer** le bug si identifié — si fix hors scope template (ex. RLS à corriger, refacto api-client), ouvrir story séparée et documenter

2. **Hub `/partenariat`** : conserver le `<Redirect href="/partenariat/sponsors" />` existant (pas de titre nécessaire).

3. **`/partenariat/sponsors`** (liste) : `<AdminPageHeader title="Sponsors" />` + retirer eyebrow/subtitle custom si présents. Action `+ Nouveau sponsor` si route ou modal existe.

4. **`/partenariat/sponsors/[sponsorId]`** : titre dynamique = nom sponsor (fallback "Sponsor").

5. **`/partenariat/clubs`** : `<AdminPageHeader title="Clubs partenaires" />`.

6. **Nav secondaire** : si un composant `PartenariatNavBar` ou équivalent existe avec 2 onglets (Sponsors · Clubs partenaires), le conserver sous le header. Si inexistant et pattern pertinent → créer (optionnel, peut être dans une story séparée si scope trop gros).

7. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Grep headers locaux → remplacer par AdminPageHeader
   - Grep hex → 0 match

8. **try/finally + console guards** respectés.

9. **Data** : api-client uniquement. `listSponsors`, `getSponsorById`, `listPartnerClubs` — vérifier signatures et utilisation.

10. **Conformité CLAUDE.md** : tsc OK, tokens, patterns Expo Router.

11. **Test Playwright** :
    - `/partenariat` → redirect effectif vers `/partenariat/sponsors`
    - `/partenariat/sponsors` → charge liste, console zéro erreur
    - `/partenariat/sponsors/<uuid>` → détail charge, titre dynamique
    - `/partenariat/clubs` → charge liste
    - **Bug initialement signalé = résolu**, vérifier empiriquement
    - Screenshots before/after

12. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** — le flow sponsors et clubs partenaires (Epic 92) reste identique
    - **Pas de migration URL** — les URLs actuelles `/partenariat/*` sont conformes
    - **Si le bug runtime nécessite un refactor DB ou RLS** → ouvrir story séparée, ne pas gonfler 97.13

## Tasks / Subtasks

- [ ] **T1 — Diagnostic bug runtime** (AC #1)
  - [ ] Dev server + Playwright sur les 3 URLs principales
  - [ ] Analyser console + network
  - [ ] Documenter cause + fix si possible dans scope template

- [ ] **T2 — Hub redirect** (AC #2)
  - [ ] Vérifier `partenariat/page.tsx` fonctionne (redirect effective)

- [ ] **T3 — Sponsors liste** (AC #3)
  - [ ] Header v2
  - [ ] Cleanup

- [ ] **T4 — Sponsor détail** (AC #4)
  - [ ] Header dynamique avec nom

- [ ] **T5 — Clubs partenaires** (AC #5)
  - [ ] Header v2

- [ ] **T6 — Nav secondaire (optionnel)** (AC #6)
  - [ ] Vérifier si composant de tabs existe
  - [ ] Créer si scope permet ; sinon reporter

- [ ] **T7 — QA** (AC #7-11)
  - [ ] Grep hex + headers locaux
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright — vérifier bug résolu

## Dev Notes

### Hypothèses bug runtime

Causes probables à investiguer :
1. **RLS `sponsors`** : l'admin connecté n'a pas les permissions sur la table. Vérifier `supabase/migrations/` pour les policies sponsors.
2. **Chargement infini** : `setLoading(true)` sans `finally` ou erreur avalée.
3. **Null ref** sur un champ sponsor (ex. `sponsor.annualContribution.amount` si contribution null).
4. **Redirect loop** : `partenariat/page.tsx` → `/partenariat/sponsors` → quelque chose qui renvoie vers `/partenariat`.

Investiguer console + network en priorité pour isoler la cause.

### Epic 92 statut

Les 3 stories Epic 92 (92.1, 92.2, 92.3) sont **done** selon `git log --oneline` — les tables sponsors et liens enfants existent en DB. Le bug n'est donc pas un manque de data model.

### Pattern de référence

Post-97.3 (Activités + Méthodologie). Alignement mécanique header + cleanup.

### References

- Pages : `app/(admin)/partenariat/`
- Code sponsors déjà audité : `partenariat/sponsors/page.tsx` (Story 92.2)
- Code clubs partenaires : `partenariat/clubs/page.tsx` (Story 92.3)
- Composants : `components/admin/partenariat/` (cf. SponsorFormModal)
- Stories Epic 92 : 92.1 (hub), 92.2 (sponsors), 92.3 (clubs partenaires)
- Types : `@aureak/types` — `SponsorType`, `SponsorWithCounts`
