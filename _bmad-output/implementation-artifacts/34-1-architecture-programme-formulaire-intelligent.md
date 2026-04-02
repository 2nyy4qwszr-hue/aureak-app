# Story 34.1 : Architecture Programme & Formulaire Création Entraînement Intelligent

Status: done

## Story

En tant qu'admin de l'académie,
Je veux une architecture programme claire (Académie / Stage) avec un formulaire de création d'entraînement intelligent qui pré-mâche les choix (méthode → module/bloc → numéro auto-filtré),
Afin de saisir mon contenu pédagogique rapidement et sans friction, avec le bon contexte proposé à chaque étape.

## Contexte Métier

### Hiérarchie pédagogique
- **Programme** = plan saisonnier qui référence des entraînements (ex: "Académie 2025-2026", "Stage Tir au but mars 2026")
- **Entraînement** = unité atomique réutilisable, appartient à une méthode + module/bloc
- Un même entraînement peut appartenir à plusieurs programmes
- Les stages Situationnel réutilisent la bibliothèque existante ; les stages Technique créent de nouveaux entraînements

### Structure des méthodes
| Méthode | Unité | Modules/Blocs | Numéros |
|---------|-------|---------------|---------|
| Goal & Player | Module numéroté | 3 modules | M1: 1-5 / M2: 6-10 / M3: 11-15 |
| Technique | Module numéroté | 8 modules | M1: 1-4 / M2: 5-8 / M3: 9-12 / M4: 13-15 / M5: 16-19 / M6: 20-23 / M7: 24-27 / M8: 28-30 |
| Situationnel | **Bloc** nommé | 7 blocs | Tir au but / 1c1 / Centre / Relance / Ballon profondeur / Phase arrêtée / Communication |
| Performance | Libre | Pas de module | Numérotation libre |
| Décisionnel | À définir | — | — |
| Intégration | À définir | — | — |
| Perfectionnement | À définir | — | — |

### Découverte vs Consolidation
- Chaque entraînement est typé : `découverte` ou `consolidation`
- Technique : 2 découverte + 2 consolidation par module
- Situationnel : 2 séances par bloc (pair/impair)
- Goal & Player : 5 entraînements par module (ratio à définir)

## Acceptance Criteria

**AC1 — Entité Programme**
- **When** l'admin accède à la section Méthodologie
- **Then** il voit une liste de programmes avec : nom, type (Académie/Stage), saison, méthodes couvertes, nb entraînements liés
- **And** il peut créer un programme : nom libre, type Académie ou Stage, saison, description optionnelle
- **And** un programme Stage a un thème associé (ex: "Tir au but", "1c1", "Performance")
- **And** un programme peut être dupliqué pour la saison suivante (tous les liens entraînements copiés)

**AC2 — Formulaire Création Entraînement : Cascading Intelligent**
- **When** l'admin crée un nouvel entraînement
- **Then** le formulaire se construit en cascade :
  1. **Programme** : sélecteur (Académie / Stage X) — obligatoire
  2. **Méthode** : Goal & Player / Technique / Situationnel / Performance / Décisionnel / Intégration / Perfectionnement
  3. **Module ou Bloc** : selon la méthode choisie (voir AC3 et AC4)
  4. **Numéro d'entraînement** : auto-filtré selon le module/bloc (voir AC3)
  5. **Type** : Découverte ou Consolidation
  6. **Titre** : champ texte libre
  7. **Thèmes pédagogiques** : multi-select depuis la bibliothèque (optionnel)
  8. **Description** : texte riche optionnel

**AC3 — Auto-filtrage Numéro (Goal & Player + Technique)**
- **When** l'admin choisit Goal & Player + Module 1
- **Then** le sélecteur numéro propose uniquement 1 à 5
- **And** Goal & Player Module 2 → 6 à 10 / Module 3 → 11 à 15
- **When** l'admin choisit Technique + Module 3
- **Then** le sélecteur numéro propose uniquement 9 à 12
- **And** les numéros déjà utilisés dans ce module/programme sont signalés (⚠️ déjà utilisé) mais restent sélectionnables

**AC4 — Blocs Situationnel (nommés, pas numérotés)**
- **When** l'admin choisit la méthode Situationnel
- **Then** au lieu d'un sélecteur "Module X", un sélecteur "Bloc" apparaît avec les 7 blocs : Tir au but / 1v1 / Centre / Relance / Ballon profondeur / Phase arrêtée / Communication
- **And** le numéro d'entraînement dans un bloc est libre (pas de range imposé)
- **And** un indicateur pair/impair est affiché selon le numéro saisi (informatif, pas bloquant)

**AC5 — Réutilisation Entraînement dans Plusieurs Programmes**
- **When** l'admin veut ajouter un entraînement existant à un programme Stage
- **Then** il peut rechercher dans la bibliothèque et lier l'entraînement au programme
- **And** l'entraînement n'est pas dupliqué — il est partagé (1 entraînement → N programmes)
- **And** la fiche entraînement affiche la liste des programmes qui l'utilisent

**AC6 — Performance : Création Libre**
- **When** l'admin choisit la méthode Performance
- **Then** aucun module/bloc n'est proposé — formulaire simplifié (titre, description, thèmes)
- **And** une option "Piocher dans Situationnel" permet de lier des exercices situationnels existants comme base

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase
  - [x] 1.1 Table `programmes` : id, name, type ENUM('academie','stage'), season_id, theme TEXT NULLABLE, description, is_active, created_at
  - [x] 1.2 Table `programme_trainings` : programme_id, training_id (methodology_sessions) — join table
  - [x] 1.3 Colonne `training_type ENUM('decouverte','consolidation')` sur `methodology_sessions`
  - [x] 1.4 Colonne `bloc_name TEXT NULLABLE` sur `methodology_sessions` (pour Situationnel)
  - [x] 1.5 Colonne `module_number INT NULLABLE` sur `methodology_sessions` (pour Goal&Player, Technique)
  - [x] 1.6 Colonne `training_number INT NULLABLE` sur `methodology_sessions`
  - [x] 1.7 Table `method_module_config` : method, module_number, range_start, range_end (seed des ranges)
  - [x] 1.8 Seed `method_module_config` : Goal&Player (3 modules), Technique (8 modules)
  - [x] 1.9 Seed `situationnel_blocs` : 7 blocs nommés (via SITUATIONNEL_BLOCS const dans @aureak/types)

- [x] Task 2 — Types TypeScript `@aureak/types`
  - [x] 2.1 `ProgrammeType`, `Programme`, `ProgrammeTraining`
  - [x] 2.2 `TrainingType` ('decouverte' | 'consolidation')
  - [x] 2.3 `MethodModuleConfig`, `SituationnelBloc`
  - [x] 2.4 Mise à jour `MethodologySession` : + module_number, bloc_name, training_number, training_type

- [x] Task 3 — API `@aureak/api-client`
  - [x] 3.1 `listProgrammes(filters?)` — liste programmes avec stats
  - [x] 3.2 `createProgramme(data)` / `updateProgramme` / `duplicateProgramme(id, newSeason)`
  - [x] 3.3 `getModuleConfig(method, moduleNumber)` — range start/end pour auto-filtrage
  - [x] 3.4 `listSituationnelBlocs()` — via SITUATIONNEL_BLOCS const dans @aureak/types
  - [x] 3.5 `createTraining(data)` — avec programme_id, module/bloc, type, numéro
  - [x] 3.6 `linkTrainingToProgramme(trainingId, programmeId)`
  - [x] 3.7 `listTrainingsByProgramme(programmeId, filters?)`
  - [x] 3.8 `getUsedTrainingNumbers(programmeId, method, moduleOrBloc)` — numéros déjà pris

- [x] Task 4 — UI Admin `apps/web/app/(admin)/methodologie/programmes/`
  - [x] 4.1 Page liste programmes : cartes Programme avec type/saison/nb entraînements
  - [x] 4.2 Page création/édition programme : formulaire + type Académie/Stage + thème si Stage
  - [x] 4.3 Formulaire création entraînement : cascading Programme → Méthode → Module/Bloc → Numéro → Type → Titre
  - [x] 4.4 Sélecteur numéro intelligent : range filtré + indicateur "déjà utilisé"
  - [x] 4.5 Sélecteur bloc Situationnel : dropdown 7 blocs nommés
  - [ ] 4.6 Modal "Lier entraînement existant" : search + prévisualisation (reporté story 34-2)

## Dev Notes

### Ranges Technique (8 modules — 30 entraînements total)
M1: 1-4 / M2: 5-8 / M3: 9-12 / M4: 13-15 (3) / M5: 16-19 / M6: 20-23 / M7: 24-27 / M8: 28-30 (3)
Modules 4 et 8 = 3 entraînements uniquement (confirmé par l'utilisateur).

### Découverte/Consolidation Technique
- 2 entraînements découverte + 2 consolidation par module
- Le formulaire peut proposer : "Ce module a déjà X découverte / Y consolidation"

### Décisionnel / Intégration / Perfectionnement
- Structure non définie — formulaire libre pour ces méthodes (comme Performance)
- À structurer dans une story ultérieure quand le contenu est prêt

### Rétrocompatibilité
- Les `methodology_sessions` existants sans module/bloc/training_number gardent leurs données
- Les nouvelles colonnes sont NULLABLE — migration non destructive

### Dépendances
- `methodology_sessions`, `methodology_themes`, `methodology_situations` existants (Epic précédent)
- `academy_seasons` pour le lien programme-saison
