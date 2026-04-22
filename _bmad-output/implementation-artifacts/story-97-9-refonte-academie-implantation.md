# Story 97.9 — Académie / Implantation : refonte complète

Status: done

## Completion Notes

### Diagnostic

- **Avant** : redirect vers `/implantations` (1729 lignes legacy, riche : map, bulk, compare).
- **Problème identique à 97.8** : onglet IMPLANTATIONS d'AcademieNavBar jamais actif sur la page finale.

### Refonte

- Page native `/academie/implantations` avec AdminPageHeader + AcademieNavBar (IMPLANTATIONS actif ✓).
- StatCards : total, GPS configurés, avec photo.
- Filtres : recherche + toggle toutes/actives/fermées.
- Grid de cards (nom, adresse, chips GPS/PHOTO) click → `/implantations` legacy pour détail.
- CTA "Gestion avancée →" vers page legacy pour map + bulk + compare.

### Non-fait (volontaire)

- **Toggle carte/liste (AC #3)** : reporté — map component réside dans la page legacy. Évolution future possible si besoin map inline dans la vue académie.

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.9
- **Story key** : `97-9-refonte-academie-implantation`
- **Priorité** : P2 (refonte qualitative)
- **Dépendances** : **97.3** (AdminPageHeader v2) · recommandé : après 97.6
- **Source** : Audit UI 2026-04-22. L'utilisateur a signalé : "implantation pareil [à refaire pour que ça ressemble aux autres pages]."
- **Effort estimé** : M (~4-6h — refonte liste implantations académie)

## Story

As an admin,
I want que la page `/academie/implantations` soit refaite dans le pattern canonique Académie (header v2, liste cohérente, states propres) et que la page `/academie/implantations/compare` (si conservée ici) soit alignée,
So that la zone Académie est visuellement uniforme et que la consultation des implantations suit les mêmes standards que les autres sous-sections.

## Contexte

### État actuel

Pages :
- `aureak/apps/web/app/(admin)/academie/implantations/index.tsx` — liste
- `aureak/apps/web/app/(admin)/implantations/compare/page.tsx` — **à la racine** (sera migrée en Epic 98.3 sous Performance — voir notes ci-dessous)

### Ambiguïté périmètre

La page `/implantations/compare` est en racine — elle est candidate à migration sous `/performance/comparaisons/implantations` en Epic 98.3 (cohérence Performance). **Décision** : cette story 97.9 ne touche QUE `/academie/implantations` (liste). La compare reste dans le scope Epic 98.

### Résultat attendu

- Page liste refondue avec header v2, table/cards, filtres basiques (nom, statut actif), link carte (si map existe déjà).
- Réutilisation composant `ImplantationMap` (déplacé en 95.1 sous `components/admin/implantations/`) si pertinent.

## Acceptance Criteria

1. **Diagnostic documenté** : anomalies relevées + décisions prises.

2. **Page liste `/academie/implantations`** :
   - `<AdminPageHeader title="Implantations" />` (pas d'eyebrow, pas de subtitle)
   - Liste tokenisée (table ou grid)
   - Colonnes : nom, ville, capacité joueurs, statut actif/fermé
   - Filtres texte + toggle actif/fermé
   - Action `+ Nouvelle implantation` si route `/new` existe, sinon masquée

3. **Vue carte (optionnelle)** : si un composant `ImplantationMap` est fonctionnel, l'afficher en toggle "Liste / Carte" sous le header. Sinon mode liste seul, documenter en dev notes.

4. **Data** : api-client uniquement. Fonctions à vérifier :
   - `listImplantations(filters?)`
   - `getImplantationById(id)` (si page détail existe)

5. **States** : loading skeleton, empty, error avec retry.

6. **Styles tokenisés** : 0 hex hardcodé.

7. **try/finally + console guards** sur tous les setters.

8. **AcademieNavBar** : onglet "Implantations" actif ; count optionnel via Context.

9. **Conformité CLAUDE.md** : tsc OK, Expo Router patterns, tokens seuls.

10. **Test Playwright** :
    - `/academie/implantations` → charge
    - Filtres et toggle carte/liste testés
    - Console zéro erreur
    - Screenshots before/after

11. **Non-goals explicites** :
    - **Pas de migration** `/implantations/compare` (Epic 98.3)
    - **Pas de fonctionnalité nouvelle** (CRUD complet implantations)
    - **Pas de refonte du composant Map** si existant — juste intégration

## Tasks / Subtasks

- [ ] **T1 — Diagnostic** (AC #1)
  - [ ] Playwright + screenshots
  - [ ] Lire code actuel
  - [ ] Relever anomalies

- [ ] **T2 — API client** (AC #4)
  - [ ] Vérifier `listImplantations`, créer si absent

- [ ] **T3 — Refonte liste** (AC #2, #5, #6, #7)
  - [ ] Header v2
  - [ ] Table tokenisée
  - [ ] Filtres + states

- [ ] **T4 — Toggle carte (optionnel)** (AC #3)
  - [ ] Intégrer `ImplantationMap` si fonctionnel
  - [ ] Toggle Liste/Carte

- [ ] **T5 — Navigation** (AC #8)
  - [ ] Onglet actif dans AcademieNavBar

- [ ] **T6 — QA** (AC #9, #10)
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright + screenshots

## Dev Notes

### Composant ImplantationMap

Localisation depuis 95.1 : `aureak/apps/web/components/admin/implantations/ImplantationMap.tsx`.
Vérifier :
- Est-ce un composant React Native (expo-maps, react-native-maps) ? Ou web seulement ?
- Est-il fonctionnel (pas juste un stub) ?
- Dépendances clés (coordonnées GPS dans `implantations` ?)

### Pattern de référence

`/academie/joueurs` ou `/academie/clubs` (après 97.6, 97.8) — structure liste + filtres + states.

### Volume de données

Probablement < 50 implantations. Pas besoin de virtualisation ni pagination.

### References

- Page actuelle : `aureak/apps/web/app/(admin)/academie/implantations/index.tsx`
- Composant Map : `aureak/apps/web/components/admin/implantations/ImplantationMap.tsx`
- Page compare orpheline (hors scope 97.9, scope 98.3) : `aureak/apps/web/app/(admin)/implantations/compare/page.tsx`
- Pattern de référence : pages 97.6 (joueurs, coaches)
