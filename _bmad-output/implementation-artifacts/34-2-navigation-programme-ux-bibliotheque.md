# Story 34.2 : Navigation Programme — UX Bibliothèque Entraînements

Status: done

## Story

En tant qu'admin de l'académie,
Je veux une navigation visuelle et fluide dans mes programmes et ma bibliothèque d'entraînements (Programme → Méthode → Module/Bloc → Entraînement) avec des cartes attractives,
Afin de retrouver n'importe quel entraînement en moins de 3 clics et d'avoir envie de saisir mon contenu.

## Contexte Métier

- L'admin doit avoir ENVIE d'utiliser cette interface — c'est la condition pour que le contenu pédagogique soit alimenté
- La navigation doit être visuelle, pas une liste de lignes grises
- Un programme Académie contient ~30 entraînements par méthode principale
- Un programme Stage contient 8-15 entraînements ciblés
- La bibliothèque Situationnel est partagée entre plusieurs programmes

## Acceptance Criteria

**AC1 — Hub Programmes : Vue d'Ensemble Visuelle**
- **When** l'admin ouvre la section Méthodologie
- **Then** il voit ses programmes en cartes visuelles distinctes :
  - Programme Académie : carte premium (gold) avec saison + méthodes couvertes + nb entraînements total
  - Programmes Stage : cartes distinctes avec le thème en gros (ex: "🥅 Stage Tir au but")
- **And** chaque carte affiche : taux de complétion (entraînements saisis / entraînements prévus)
- **And** un bouton "Nouveau programme" est accessible directement depuis le hub

**AC2 — Drill-Down Programme → Méthode**
- **When** l'admin clique sur un programme
- **Then** il voit les méthodes disponibles dans ce programme en tuiles colorées :
  - Goal & Player (couleur dédiée)
  - Technique (couleur dédiée)
  - Situationnel (couleur dédiée)
  - Performance / Décisionnel / Intégration / Perfectionnement
- **And** chaque tuile affiche : nb entraînements saisis / nb prévus + barre de progression

**AC3 — Drill-Down Méthode → Modules (Goal & Player / Technique)**
- **When** l'admin clique sur Technique ou Goal & Player
- **Then** il voit les modules en rang horizontal (Module 1, Module 2... Module 8)
- **And** chaque module affiche : découverte X/2 + consolidation X/2 (progression visuelle)
- **And** un clic sur un module affiche les entraînements de ce module en grille de cartes

**AC4 — Drill-Down Méthode → Blocs (Situationnel)**
- **When** l'admin clique sur Situationnel
- **Then** il voit les 7 blocs en cartes : Tir au but / 1v1 / Centre / Relance / Ballon profondeur / Phase arrêtée / Communication
- **And** chaque bloc-carte affiche le nb d'entraînements saisis
- **And** un clic sur un bloc affiche les entraînements du bloc (pair/impair visuellement distincts)

**AC5 — Carte Entraînement : Riche et Lisible**
- **When** l'admin voit la liste des entraînements d'un module/bloc
- **Then** chaque entraînement est une carte avec :
  - Numéro + titre en gros
  - Badge type : 🔵 Découverte / 🟠 Consolidation
  - Thèmes pédagogiques associés (chips)
  - Indicateur "utilisé dans N programmes"
  - Actions rapides : ✏️ Modifier / 📋 Dupliquer / 🔗 Lier à un autre programme
- **And** la carte est cliquable pour ouvrir la fiche complète

**AC6 — Recherche Rapide dans la Bibliothèque**
- **When** l'admin cherche un entraînement
- **Then** une barre de recherche globale permet de filtrer par : titre, méthode, bloc/module, type (découverte/consolidation), thème
- **And** les résultats s'affichent en temps réel en cartes
- **And** depuis les résultats, l'admin peut lier directement un entraînement à un programme

**AC7 — Indicateur Pair/Impair Situationnel**
- **When** l'admin consulte les entraînements d'un bloc Situationnel
- **Then** les entraînements sont visuellement groupés par paires : "Module 1 (pair)" / "Module 2 (impair)"
- **And** l'indicateur est informatif — pas de blocage si le coach dévie de la structure

**AC8 — Duplication Programme pour Nouvelle Saison**
- **When** l'admin veut créer le programme de la saison suivante
- **Then** un bouton "Dupliquer pour saison X" copie tous les liens programme → entraînements
- **And** les entraînements eux-mêmes ne sont pas dupliqués (partagés)
- **And** l'admin peut ensuite modifier/ajouter des entraînements dans le nouveau programme sans affecter l'ancien

## Tasks / Subtasks

- [x] Task 1 — API `@aureak/api-client`
  - [ ] 1.1 `getProgrammeOverview(programmeId)` — méthodes + progression par méthode
  - [ ] 1.2 `getMethodProgress(programmeId, method)` — modules/blocs + taux complétion
  - [ ] 1.3 `listTrainingsByModuleOrBloc(programmeId, method, moduleOrBloc)` — cartes entraînements
  - [ ] 1.4 `searchTrainings(query, filters)` — recherche globale bibliothèque
  - [ ] 1.5 `duplicateProgramme(programmeId, newSeasonId)` — duplication saison

- [x] Task 2 — UI Admin `apps/web/app/(admin)/methodologie/`
  - [ ] 2.1 Hub programmes : cartes visuelles Académie (gold) + Stages
  - [ ] 2.2 Page programme : tuiles méthodes colorées + barres progression
  - [ ] 2.3 Vue modules (Goal&Player / Technique) : rang horizontal + progression découverte/conso
  - [ ] 2.4 Vue blocs Situationnel : 7 cartes blocs + paires pair/impair
  - [ ] 2.5 Composant `TrainingCard` : numéro, titre, badges type, thèmes, actions rapides
  - [ ] 2.6 Barre recherche globale bibliothèque avec filtres
  - [ ] 2.7 Modal "Lier à un programme" depuis les résultats de recherche

- [x] Task 3 — Design
  - [ ] 3.1 Palette couleurs par méthode (tokens dans `@aureak/theme`)
  - [ ] 3.2 Badge Découverte (🔵 bleu) / Consolidation (🟠 orange)
  - [ ] 3.3 Carte Programme Académie : style gold premium
  - [ ] 3.4 Carte Programme Stage : style distinct avec thème en vedette

## Dev Notes

### Couleurs méthodes suggérées (à valider avec le design system)
- Goal & Player : vert émeraude
- Technique : bleu indigo
- Situationnel : violet
- Performance : rouge/orange
- Décisionnel : cyan
- Intégration : vert sauge
- Perfectionnement : gold

### Taux de complétion
- "Entraînements prévus" = config fixe par méthode (Technique = 30 entraînements : M1-M3 et M5-M7 = 4 chacun, M4 et M8 = 3 chacun)
- "Entraînements saisis" = COUNT des trainings liés au programme pour cette méthode
- Barre de progression = saisis / prévus

### Performance
- Pas de modules — la vue Performance affiche directement les entraînements en grille libre
- Pas de barre de progression (pas de cible fixe)

### Dépendances
- Story 34-1 pour le modèle de données (programmes, module config, blocs)
- Design system `@aureak/theme` pour les tokens couleur méthodes
