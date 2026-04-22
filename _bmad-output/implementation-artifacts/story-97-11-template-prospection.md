# Story 97.11 — Prospection : template + titres sur 3 sous-pages

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.11
- **Story key** : `97-11-template-prospection`
- **Priorité** : P1
- **Dépendances** : **97.3** (AdminPageHeader v2) + **97.4** (migration URL `/prospection`)
- **Source** : Audit UI 2026-04-22. Zone Prospection avec 3 sous-sections (Clubs, Gardiens, Entraîneurs) — appliquer le template canonique.
- **Effort estimé** : M (~4-6h — 3 listes + détails + hub)

## Story

As an admin,
I want que les pages de la zone Prospection (clubs, gardiens, entraîneurs) utilisent le template `<AdminPageHeader />` v2 avec titre = sous-section active,
So that la zone Prospection est visuellement cohérente avec le reste de l'admin et que la navigation soit lisible.

## Contexte

### État cible après 97.4

Après migration :
- `/prospection` — hub
- `/prospection/clubs` — liste clubs (CRM)
- `/prospection/clubs/[prospectId]` — détail club
- `/prospection/gardiens` — liste gardiens
- `/prospection/gardiens/ajouter` — formulaire ajout
- `/prospection/entraineurs` — liste entraîneurs
- `/prospection/entraineurs/[prospectId]` — détail entraîneur
- `/prospection/attribution` — attribution
- `/prospection/ressources` — ressources

### Composant ProspectionNavBar

`aureak/apps/web/components/admin/prospection/ProspectionNavBar.tsx` — nav secondaire probablement déjà présente avec les 3 pipelines.

### Titres

| URL | Titre |
|---|---|
| `/prospection` | "Prospection" (hub) |
| `/prospection/clubs` | "Clubs" |
| `/prospection/clubs/[id]` | nom club |
| `/prospection/gardiens` | "Gardiens" |
| `/prospection/gardiens/ajouter` | "Nouveau gardien" |
| `/prospection/entraineurs` | "Entraîneurs" |
| `/prospection/entraineurs/[id]` | nom entraîneur |
| `/prospection/attribution` | "Attribution" |
| `/prospection/ressources` | "Ressources" |

## Acceptance Criteria

1. **Hub `/prospection`** :
   - `<AdminPageHeader title="Prospection" />` (pas d'eyebrow, pas de subtitle)
   - Vue d'ensemble ou redirect vers `/prospection/clubs`
   - Si vue d'ensemble : 3 cartes (clubs, gardiens, entraîneurs) avec count et pipeline actif

2. **Liste `/prospection/clubs`** : title "Clubs", header v2, nav secondaire `ProspectionNavBar`, action "+ Nouveau prospect club" si applicable.

3. **Détail `/prospection/clubs/[prospectId]`** : titre = nom du club (dynamique, fallback "Club").

4. **Liste `/prospection/gardiens`** : title "Gardiens", action "+ Nouveau gardien" → navigue `/prospection/gardiens/ajouter`.

5. **Formulaire `/prospection/gardiens/ajouter`** : title "Nouveau gardien".

6. **Liste `/prospection/entraineurs`** : title "Entraîneurs", action "+ Nouvel entraîneur".

7. **Détail `/prospection/entraineurs/[prospectId]`** : titre = nom (dynamique).

8. **Page `/prospection/attribution`** : title "Attribution" (outil d'attribution manuelle).

9. **Page `/prospection/ressources`** : title "Ressources".

10. **Nav secondaire `ProspectionNavBar`** : vérifier et s'assurer que les 3 onglets (Clubs, Gardiens, Entraîneurs) sont visibles et que l'onglet actif est correctement détecté par `usePathname()` après la migration URL 97.4.

11. **Cleanup** :
    - Retirer eyebrow/subtitle custom si existants dans les pages
    - Grep `<View style={styles.header}>` local → remplacer par AdminPageHeader
    - Grep hex hardcodés → 0 match

12. **try/finally + console guards** sur setters loading/saving.

13. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns.

14. **Test Playwright** :
    - Les 9 pages concernées chargent
    - Titres corrects et dynamiques
    - Console zéro erreur
    - Nav secondaire onglet actif correct

15. **Non-goals explicites** :
    - **Pas de migration URL** (97.4)
    - **Pas de refonte fonctionnelle** des pipelines (CRM logic)
    - **Pas de nouveau composant métier** (réutilise ProspectionKPIs, ClubCard, ContactForm, etc. déplacés en 95.1)

## Tasks / Subtasks

- [ ] **T1 — Hub** (AC #1)
  - [ ] Page `/prospection/page.tsx` avec header v2
  - [ ] Vue d'ensemble (3 cartes) ou redirect

- [ ] **T2 — Clubs** (AC #2, #3)
  - [ ] Liste header v2
  - [ ] Détail titre dynamique

- [ ] **T3 — Gardiens** (AC #4, #5)
  - [ ] Liste header v2
  - [ ] Formulaire ajouter header v2

- [ ] **T4 — Entraîneurs** (AC #6, #7)
  - [ ] Liste header v2
  - [ ] Détail titre dynamique

- [ ] **T5 — Attribution + Ressources** (AC #8, #9)
  - [ ] Headers v2

- [ ] **T6 — Nav secondaire** (AC #10)
  - [ ] Vérifier `ProspectionNavBar` active tab correct après URL /prospection/* (post-97.4)

- [ ] **T7 — Cleanup + QA** (AC #11-14)
  - [ ] Grep hex + headers locaux
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright

## Dev Notes

### Dépendance stricte 97.4

97.11 **ne peut pas démarrer tant que 97.4 n'est pas mergé** — les pages vivent encore à `/developpement/prospection/*` avant migration.

### Pattern de référence

Zone Activités + Méthodologie (post-97.3) — canonique. Réutiliser les mêmes helpers si besoin.

### Composants déjà hors app/

Depuis 95.1 : `components/admin/prospection/` contient AdminFilters, ClubCard, ClubList, ContactForm, ContactList, ProspectionKPIs. Ils sont déjà prêts à être réutilisés.

### References

- Pages (post-97.4) : `app/(admin)/prospection/`
- Composants : `components/admin/prospection/`
- Nav : `components/admin/prospection/ProspectionNavBar.tsx`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
