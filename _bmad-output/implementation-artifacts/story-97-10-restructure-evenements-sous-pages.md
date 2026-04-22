# Story 97.10 — Événements : restructurer en hub + 5 sous-pages par type

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.10
- **Story key** : `97-10-restructure-evenements-sous-pages`
- **Priorité** : P1 (restructuration de navigation)
- **Dépendances** : **97.3** (AdminPageHeader v2) + **97.5** (migration `/stages` → `/evenements/stages`)
- **Source** : Audit UI 2026-04-22. User : "événements il faut également avoir les pages stages, tournois, goal à goal funder, detect et séminaires". L'état actuel montre `/evenements` comme vue unifiée avec onglets-filtres — l'utilisateur veut des sous-pages dédiées par type (comme les autres zones).
- **Effort estimé** : L (~7-10h — restructuration de route + 5 sous-pages + hub + migration éventuelle du composant vue unifiée)

## Story

As an admin,
I want que la zone Événements ait une sous-page par type d'événement (`/evenements/stages`, `/evenements/tournois`, `/evenements/fun-days`, `/evenements/detect-days`, `/evenements/seminaires`) ainsi qu'un hub `/evenements` qui sert de vue d'ensemble ou de redirection vers la sous-page par défaut,
So that la nav soit cohérente avec les autres zones (Activités, Méthodologie, etc.) où chaque sous-section a son URL propre et son titre affiché.

## Contexte

### État actuel

`aureak/apps/web/app/(admin)/evenements/page.tsx` — Story 63.2 : page unifiée qui liste **tous** les événements avec des onglets de filtre :
- Tous · Stage · Tournoi Goal à Goal · Fun Day · Detect Day · Séminaire

Les sous-dossiers existants :
- `evenements/detect-days/page.tsx` + `index.tsx`
- `evenements/fun-days/page.tsx` + `index.tsx`
- `evenements/seminaires/page.tsx` + `index.tsx`
- `evenements/tournois/page.tsx` + `index.tsx`

**Manquante** : pas de sous-dossier `stages/` sous `evenements/`. La page `/stages` vit à la racine et sera migrée par **97.5** vers `/evenements/stages`.

### État cible

Après 97.10 :
```
app/(admin)/evenements/
  page.tsx          → hub "Événements" (vue d'ensemble ou redirect vers /stages)
  index.tsx
  _layout.tsx       → Context éventuel counts par type (optionnel)
  stages/           (déplacé par 97.5)
    page.tsx        → titre "Stages"
  tournois/
    page.tsx        → titre "Tournois"
  fun-days/
    page.tsx        → titre "Fun Days"
  detect-days/
    page.tsx        → titre "Detect Days"
  seminaires/
    page.tsx        → titre "Séminaires"
```

Chaque sous-page affiche uniquement les événements de son type avec un header dédié.
Le hub peut être une vue d'ensemble simple (cartes "X stages · Y tournois · ...") ou un redirect vers la première sous-section.

### Composant `EvenementsContent`

Le fichier `aureak/apps/web/components/admin/evenements/EvenementsContent.tsx` contient probablement la logique filtrage actuelle. Il peut être :
- **Conservé** comme composant réutilisable (param `typeFilter` en input) — chaque sous-page l'utilise en passant son type
- **Scindé** — logique commune + wrappers par type

**Recommandation** : conserver `EvenementsContent` en le paramétrant par type — minimise le refactor.

## Acceptance Criteria

1. **Hub `/evenements`** :
   - Option A — Vue d'ensemble : `<AdminPageHeader title="Événements" />` + 5 cartes type (stages, tournois, fun-days, detect-days, seminaires) avec count et bouton "Voir". Recommandé pour utilité.
   - Option B — Redirect vers `/evenements/stages` (ou autre sous-section par défaut). Plus simple, moins utile.
   - **Décision dev** : recommandation A pour valeur produit ; B acceptable si complexité trop forte.

2. **Page `/evenements/stages`** :
   - Titre : "Stages"
   - Liste filtrée stages uniquement (réutilise `EvenementsContent` paramétré avec `eventType='stage'`, ou page dédiée si structure actuelle plus simple à dupliquer)
   - Action "+ Nouveau stage" si applicable
   - Intégration `EvenementsHeader` (nav secondaire avec 5 onglets type)

3. **Page `/evenements/tournois`** :
   - Titre : "Tournois"
   - Liste filtrée `eventType='tournoi'`
   - Si la page existante affichait déjà ça → l'adapter (header v2 + retrait eyebrow/subtitle si présents)

4. **Page `/evenements/fun-days`** :
   - Titre : "Fun Days"
   - Filtre `eventType='fun_day'`

5. **Page `/evenements/detect-days`** :
   - Titre : "Detect Days"
   - Filtre `eventType='detect_day'`

6. **Page `/evenements/seminaires`** :
   - Titre : "Séminaires"
   - Filtre `eventType='seminaire'`

7. **`EvenementsHeader` (nav secondaire)** : composant de tabs affichant les 5 sous-sections. Intégré au-dessus du contenu de chaque sous-page et/ou du hub. Count badges par type (optionnel, via Context layout).

8. **Layout `evenements/_layout.tsx`** (optionnel mais recommandé) :
   - Pattern similaire à `activites/_layout.tsx` : fetch `getEvenementsCounts()` au mount, expose Context
   - Fonction API à créer dans `@aureak/api-client` si inexistante

9. **Data** : api-client uniquement. Utiliser `listEvents({ type })` ou équivalent existant.

10. **States** : loading (skeleton), empty (par type : "Aucun stage pour l'instant"), error retry.

11. **Styles tokenisés** : 0 hex hardcodé.

12. **try/finally + console guards** sur setters.

13. **Conformité CLAUDE.md** : tsc OK, Expo Router patterns, tokens, api-client.

14. **Test Playwright** :
    - `/evenements` → charge hub
    - `/evenements/stages` → charge liste stages uniquement
    - idem pour les 4 autres types
    - Vérifier counts cohérents entre hub et sous-pages
    - Nav secondaire fonctionnelle (cliquer onglet → change page)
    - Console zéro erreur
    - Screenshots before (capture utilisateur 22 du 2026-04-22) / after

15. **Non-goals explicites** :
    - **Pas de refonte des cards événements** existantes (visuel card reste)
    - **Pas de nouveau fonctionnel** (création, édition)
    - **Pas de migration `/evenements/stages`** → c'est 97.5 qui migre `/stages` vers `/evenements/stages` en amont
    - **Pas de changement de schéma DB** ni d'enum `EventType`

## Tasks / Subtasks

- [ ] **T1 — Comprendre l'existant** (AC #2-6, #7)
  - [ ] Lire `evenements/page.tsx` (Story 63.2)
  - [ ] Lire `EvenementsContent.tsx` et `EvenementsHeader.tsx`
  - [ ] Lire les 4 sous-pages existantes (tournois, fun-days, detect-days, seminaires)

- [ ] **T2 — Layout Context counts (optionnel)** (AC #8)
  - [ ] Créer `getEvenementsCounts()` dans api-client si absent
  - [ ] Créer `evenements/_layout.tsx` avec Context

- [ ] **T3 — Hub `/evenements`** (AC #1)
  - [ ] Header v2
  - [ ] Option A : 5 cartes type avec count + CTA "Voir"
  - [ ] Nav secondaire (EvenementsHeader) en dessous si pattern

- [ ] **T4 — Sous-page stages** (AC #2)
  - [ ] Créer `evenements/stages/page.tsx` si pas encore créé par 97.5
  - [ ] Titre "Stages"
  - [ ] Contenu filtré type stage

- [ ] **T5 — Sous-pages tournois / fun-days / detect-days / seminaires** (AC #3-6)
  - [ ] Adapter les 4 pages existantes
  - [ ] Header v2 + titre par type
  - [ ] Nav secondaire

- [ ] **T6 — EvenementsHeader (nav secondaire)** (AC #7)
  - [ ] Si inexistant comme tabs : créer
  - [ ] 5 onglets avec counts
  - [ ] État actif via `usePathname()`

- [ ] **T7 — QA** (AC #13, #14)
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright sur 6 URLs
  - [ ] Screenshots

## Dev Notes

### Pattern de référence

`activites/_layout.tsx` + `ActivitesHeader` + 3 sous-pages Activités (Séances, Présences, Évaluations) — exactement le même pattern à reproduire pour Événements avec 5 sous-sections.

### Décision hub vue d'ensemble vs redirect

La vue d'ensemble (option A) est plus utile car :
- L'utilisateur voit d'un coup d'œil le volume par type
- Point d'entrée naturel pour un admin qui ne sait pas quoi chercher
- Cohérent avec l'intention "hub" que portent les autres zones

Redirect (option B) est plus rapide à livrer mais perd la valeur du point d'entrée.

### Conservation de la vue "Tous"

La page `/evenements/page.tsx` actuelle offre un onglet "Tous" qui list TOUT. Cette fonctionnalité est-elle à conserver ?

**Proposition** : le hub `/evenements` devient cette vue "Tous" en version vue d'ensemble (5 cartes + table filtrable), couplé à la nav 5 onglets type. L'utilisateur conserve la possibilité de voir tout en un coup d'œil via le hub.

### Composant EvenementsContent — paramétrage

Signature proposée post-refactor :
```typescript
<EvenementsContent typeFilter={'stage' | 'tournoi' | 'fun_day' | 'detect_day' | 'seminaire'} />
```
Le composant prend le filtre en prop et fetche côté api-client. Si le composant actuel fait déjà ça en interne — juste l'appeler depuis chaque sous-page.

### Migration URL `/stages`

Rappel : 97.5 migre `/stages` → `/evenements/stages`. Cette story 97.10 suppose que 97.5 est mergée **avant**. Si ordre inversé, bloquer.

### References

- Page hub actuelle : `app/(admin)/evenements/page.tsx` (Story 63.2)
- Composants : `components/admin/evenements/{EvenementsContent,EvenementsHeader}.tsx`
- Sous-pages existantes : `evenements/{detect-days,fun-days,seminaires,tournois}/page.tsx`
- Page stages (migrée par 97.5) : `evenements/stages/page.tsx`
- Pattern de référence : `activites/_layout.tsx` + `ActivitesHeader`
- Types : `@aureak/types` — `EventType`, `EVENT_TYPES`, `EVENT_TYPE_LABELS`
