# Story 97.3 — `<AdminPageHeader />` v2 : retirer eyebrow/subtitle par défaut + propager aux 8 pages existantes

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.3
- **Story key** : `97-3-admin-page-header-v2`
- **Priorité** : **P0** — prérequis pour toutes les stories template-application de l'Epic 97 (97.6, 97.10-13) et des Epics 98/99
- **Dépendances** : aucune (mais **bloque** 97.6, 97.10, 97.11, 97.12, 97.13, 98.2, 98.4, 99.3-6)
- **Source** : Audit UI 2026-04-22. L'utilisateur veut un header simplifié — titre H1 seul + action/filtre à droite centré verticalement. Plus d'eyebrow "PILOTAGE • AVRIL 2026" ni de sous-titre descriptif.
- **Effort estimé** : M (~5-7h — refactor composant + adaptation 8 pages Activités + Méthodologie)

## Story

As an admin,
I want que le composant `<AdminPageHeader />` soit simplifié — titre H1 comme seul élément visuel principal, avec éventuellement un bouton de filtre/action à droite centré verticalement — et que les 8 pages déjà alignées (Activités x3 + Méthodologie x5) perdent leurs eyebrow et subtitle encombrants,
So that les pages admin sont plus lisibles et aérées, et que toutes les pages de l'Epic 97 puissent adopter un même pattern cohérent.

## Contexte

### État actuel

`AdminPageHeader` (`aureak/apps/web/components/admin/AdminPageHeader.tsx`) accepte :
- `eyebrow: string` **(obligatoire)** — ex. "PILOTAGE • AVRIL 2026" avec barre dorée 36×1px à droite
- `title: string` **(obligatoire)** — ex. "Activités"
- `subtitle?: string` — ex. "Séances programmées, présences des joueurs…"
- `periodButton?`, `actionButton?` — optionnels, rendus à droite avec `alignItems: 'flex-end'`

Rendu visuel sur page Activités actuelle :
```
PILOTAGE • AVRIL 2026 ────
Activités
Séances programmées, présences des joueurs et évaluations des coachs
— tout le pouls de l'académie au même endroit.                    [ Avril 2026 ▾ ]
```

### État cible (après 97.3)

```
Activités                                                        [ Avril 2026 ▾ ]
```

- Plus d'eyebrow par défaut
- Plus de subtitle par défaut
- Bouton période/action centré verticalement sur le titre (pas aligné flex-end en bas)

### Pages à adapter

**Activités (3 pages)** :
- `aureak/apps/web/app/(admin)/activites/page.tsx` (hub séances)
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

**Méthodologie (5 pages)** :
- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx`
- `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx`

**Règle titre** : le titre doit refléter la **sous-section active**, pas la zone parente. Ex sur `/activites/seances` → titre = "Séances" (pas "Activités").

## Acceptance Criteria

1. **`AdminPageHeader.tsx` v2 — nouvelle signature** :
   ```typescript
   export type AdminPageHeaderProps = {
     title        : string
     eyebrow?     : string         // optionnel (était obligatoire)
     subtitle?    : string         // déjà optionnel, comportement inchangé
     periodButton?: { label: string; onPress: () => void }
     actionButton?: { label: string; onPress: () => void }
   }
   ```

2. **Rendu quand `eyebrow` omis** : pas de barre dorée, pas de row eyebrow — le titre part directement en haut.

3. **Rendu quand `subtitle` omis** : pas de ligne de description — rien sous le titre.

4. **Alignement boutons** : `alignItems: 'center'` (au lieu de `'flex-end'`) dans `styles.container`, pour que les boutons période/action soient centrés verticalement sur le H1 quand eyebrow/subtitle sont absents.
   - Quand eyebrow ou subtitle présents : conserver un rendu correct (boutons centrés sur l'ensemble du bloc gauche).

5. **Les 8 pages alignées passent à la v2 sans eyebrow ni subtitle** :
   - Retirer les props `eyebrow=` et `subtitle=` de tous les appels `<AdminPageHeader>` des 8 pages.
   - Retirer les helpers locaux `formatEyebrow(...)` orphelins.
   - Retirer les constantes de subtitle locales (ex. `const PAGE_SUBTITLE = '...'`).

6. **Titres par sous-section** (nouvelle règle à appliquer) :
   | Page | Nouveau title |
   |---|---|
   | `/activites` | "Séances" *(la page hub activites affiche la liste séances)* |
   | `/activites/presences` | "Présences" |
   | `/activites/evaluations` | "Évaluations" |
   | `/methodologie/seances` | "Entraînements" |
   | `/methodologie/programmes` | "Programmes" |
   | `/methodologie/themes` | "Thèmes" |
   | `/methodologie/situations` | "Situations" |
   | `/methodologie/evaluations` | "Évaluations" |

7. **Les helpers de navigation secondaires restent** : `ActivitesHeader` et `MethodologieHeader` (les barres de tabs avec counts) ne changent pas dans cette story. Ils affichent toujours les 3 onglets Activités ou 5 onglets Méthodologie.

8. **Cleanup** :
   - Grep `eyebrow=` dans `aureak/apps/web/app/(admin)/activites/ methodologie/` → 0 match
   - Grep `subtitle=` dans idem → 0 match
   - Grep `formatEyebrow` usage → 0 match après la story (si plus aucune page ne l'utilise, le fichier `formatPeriodLabel.ts` peut garder l'export, mais si vraiment orphelin → supprimer)

9. **Responsive** : le comportement mobile (passage en colonne sous 640px) doit être préservé — quand eyebrow/subtitle absents, le header reste élégant en mobile (titre + bouton centré ou empilé).

10. **Tests visuels** : Playwright screenshots des 8 pages avant/après pour comparer. Aucune régression visuelle hors retrait eyebrow/subtitle attendu. Le titre doit être dans la même position (38px desktop).

11. **Conformité CLAUDE.md** :
    - `cd aureak && npx tsc --noEmit` EXIT 0
    - Aucun hex hardcodé introduit
    - Tokens `@aureak/theme` uniquement

12. **Non-goals explicites** :
    - **Pas de suppression du support `eyebrow`/`subtitle`** — les props restent, juste optionnelles. Une page future pourra les réutiliser si besoin ponctuel.
    - **Pas de refactor des composants de nav internes** (ActivitesHeader, MethodologieHeader) — scope séparé si besoin.
    - **Pas d'application** aux pages hors Activités/Méthodologie — les zones non encore alignées (Académie, Marketing, etc.) sont traitées par 97.6 à 97.13.

## Tasks / Subtasks

- [ ] **T1 — Refactor `AdminPageHeader.tsx`** (AC #1, #2, #3, #4)
  - [ ] Lire `aureak/apps/web/components/admin/AdminPageHeader.tsx`
  - [ ] Rendre `eyebrow?` optionnel
  - [ ] Conditionner le rendu du bloc eyebrow (`{eyebrow && (...)}`)
  - [ ] Changer `alignItems: 'flex-end'` → `'center'` sur container
  - [ ] Ajuster les marges internes si rendu dégradé en absence eyebrow/subtitle

- [ ] **T2 — Adapter les 3 pages Activités** (AC #5, #6)
  - [ ] `/activites/page.tsx` → title="Séances", supprimer eyebrow/subtitle
  - [ ] `/activites/presences/page.tsx` → title="Présences"
  - [ ] `/activites/evaluations/page.tsx` → title="Évaluations"

- [ ] **T3 — Adapter les 5 pages Méthodologie** (AC #5, #6)
  - [ ] `/methodologie/seances/index.tsx` → title="Entraînements"
  - [ ] `/methodologie/programmes/index.tsx` → title="Programmes"
  - [ ] `/methodologie/themes/index.tsx` → title="Thèmes"
  - [ ] `/methodologie/situations/page.tsx` → title="Situations"
  - [ ] `/methodologie/evaluations/page.tsx` → title="Évaluations"

- [ ] **T4 — Cleanup helpers orphelins** (AC #8)
  - [ ] Grep `formatEyebrow`, `PAGE_SUBTITLE`, `SUBTITLE_TEXT` dans les 8 pages
  - [ ] Supprimer imports et constantes devenus orphelins

- [ ] **T5 — QA & tests visuels** (AC #9, #10, #11)
  - [ ] `npx tsc --noEmit` EXIT 0
  - [ ] Dev server + Playwright : screenshots des 8 pages
  - [ ] Vérifier responsive 500px
  - [ ] Console zéro erreur

## Dev Notes

### Pourquoi `eyebrow` reste une prop (optionnelle) plutôt que supprimée

Le retrait du kicker "PILOTAGE • AVRIL 2026" est une décision UX actuelle. Une future story (ex: page avec contexte temporel fort) pourrait vouloir réintroduire un eyebrow ponctuel. Garder la prop ouverte évite un refactor retour en arrière.

### Pourquoi les subtitle hub partagés disparaissent

Les 3 pages Activités partagent actuellement un subtitle unique :
> "Séances programmées, présences des joueurs et évaluations des coachs — tout le pouls de l'académie au même endroit."

Idem Méthodologie. L'utilisateur a indiqué (2026-04-22) : "Je ne veux pas voir ces titres. Je veux juste voir le titre et pas les descriptions et pas le sous-titre."

Trade-off : perte d'un rappel contextuel, gain de densité d'info et d'aération. Décision produit retenue.

### Alignement boutons

Le pattern actuel (`alignItems: 'flex-end'`) aligne les boutons sur la baseline basse du header (fin subtitle). Sans subtitle, ce pattern laisse les boutons trop hauts. Changer à `'center'` centre sur la hauteur totale du header (ce qui reste correct avec OU sans eyebrow/subtitle, grâce à Flexbox sur row container).

### Impact sur la structure responsive

Le breakpoint mobile (`width < 640`) passe container en `flexDirection: 'column'`. Aucune modification nécessaire — le changement `'flex-end'` → `'center'` n'affecte pas le layout colonne.

### References

- Composant : `aureak/apps/web/components/admin/AdminPageHeader.tsx`
- Tokens : `aureak/packages/theme/src/tokens.ts`
- Pages concernées : voir section "Contexte — Pages à adapter"
- Stories précédentes : 93.1 (création composant), 93.5/6/7 (application Activités + Méthodologie)
- Références utilisateur : capture écran 2026-04-22 (page Activités avec eyebrow + subtitle à retirer)
