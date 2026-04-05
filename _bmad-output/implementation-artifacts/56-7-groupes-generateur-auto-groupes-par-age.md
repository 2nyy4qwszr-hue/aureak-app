# Story 56.7 : Groupes — Générateur auto groupes par âge

Status: done

## Story

En tant qu'administrateur,
Je veux générer automatiquement une proposition de groupes pour la nouvelle saison en regroupant les joueurs par catégorie d'âge,
Afin d'accélérer la mise en place des groupes en début de saison et éviter le travail manuel de tri.

## Contexte & Décisions de Design

### Logique de génération
À partir des joueurs actifs de l'académie (`child_directory` avec `actif = true`), calculer la catégorie d'âge selon `birth_date` et la saison courante :
- U10 : nés en 2016-2017
- U12 : nés en 2014-2015
- U14 : nés en 2012-2013
- U17 : nés en 2009-2011

Les tranches d'âge sont configurables dans le code (constantes). Les joueurs sans `birth_date` vont dans un groupe "Non classifiés".

### Résultat de la génération
L'API `generateGroupsBySeason(implantationId, seasonId)` retourne une proposition (pas encore créée en DB) :
```typescript
type GroupProposal = {
  name: string
  ageCategory: string
  members: { childId: string; displayName: string; birthYear: number }[]
}[]
```

### Modal de confirmation
La proposition est affichée dans une modal :
- Tableau par catégorie : nom du groupe proposé + nb joueurs + liste noms
- L'admin peut renommer les groupes avant de confirmer
- Bouton "Créer ces groupes" → crée les groupes + ajoute les membres en DB

### Idempotence
Si un groupe avec le même nom existe déjà dans l'implantation, la modal avertit et propose de fusionner ou ignorer.

## Acceptance Criteria

**AC1 — Bouton "Générer groupes saison" dans groups/index.tsx**
- **Given** la page liste des groupes
- **When** l'admin voit la page
- **Then** un bouton "Générer groupes saison" est visible (en haut, accès admin uniquement)

**AC2 — Proposition de groupes par catégorie**
- **Given** le clic sur "Générer groupes saison"
- **When** l'API `generateGroupsBySeason` est appelée
- **Then** une modal s'ouvre avec les groupes proposés (U10, U12, U14, U17, Non classifiés)
- **And** chaque groupe affiche le nombre de joueurs et leurs noms

**AC3 — Renommage des groupes avant confirmation**
- **Given** la modal de proposition ouverte
- **When** l'admin modifie le nom d'un groupe proposé (ex. "U14 Bleus")
- **Then** le changement est reflété immédiatement dans la modal
- **And** le nom modifié est utilisé lors de la création en DB

**AC4 — Création des groupes en DB après confirmation**
- **Given** la modal avec groupes renommés ou par défaut
- **When** l'admin clique "Créer ces groupes"
- **Then** `createGroup` est appelé pour chaque groupe + `addGroupMember` pour chaque joueur
- **And** la modal se ferme et la liste des groupes est rechargée

**AC5 — Avertissement de conflit (groupe existant même nom)**
- **Given** un groupe "U14" existe déjà dans l'implantation
- **When** la modal affiche la proposition contenant un groupe "U14"
- **Then** un avertissement "Ce groupe existe déjà — les membres seront ajoutés" est visible
- **And** l'admin peut choisir Fusionner (ajouter les nouveaux membres) ou Ignorer ce groupe

**AC6 — Joueurs sans date de naissance**
- **Given** des joueurs actifs sans `birth_date`
- **When** la génération est calculée
- **Then** ces joueurs sont placés dans un groupe "Non classifiés"
- **And** l'admin peut choisir de créer ou non ce groupe dans la modal

## Tasks

- [ ] Créer `generateGroupsBySeason(implantationId, seasonId)` dans `@aureak/api-client/src/sessions/implantations.ts` (logique côté client sur données existantes, pas de RPC)
- [ ] Définir constantes tranches d'âge dans `@aureak/types/src/enums.ts` ou dans le fichier API
- [ ] Créer type `GroupProposal` dans `@aureak/types/src/entities.ts`
- [ ] Créer composant `GroupGeneratorModal.tsx` dans `apps/web/app/(admin)/groups/` ou `@aureak/ui`
- [ ] Tableau propositions dans la modal : catégorie + nb joueurs + champ renommage
- [ ] Bouton "Créer ces groupes" avec try/finally sur `setCreating`
- [ ] Logique de détection conflit (groupe même nom dans l'implantation)
- [ ] Options Fusionner / Ignorer pour chaque conflit
- [ ] Bouton "Générer groupes saison" dans `groups/index.tsx` (rôle admin uniquement)
- [ ] QA scan : try/finally, console guards
- [ ] Test Playwright : cliquer générer, vérifier modal ouverte avec catégories

## Fichiers concernés

- `aureak/packages/api-client/src/sessions/implantations.ts` (generateGroupsBySeason)
- `aureak/packages/types/src/entities.ts` (GroupProposal)
- `aureak/packages/types/src/enums.ts` (constantes tranches d'âge ou dans API)
- `aureak/apps/web/app/(admin)/groups/GroupGeneratorModal.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/groups/index.tsx` (bouton + intégration modal)

## Dépendances

- `listChildDirectory` dans `@aureak/api-client` pour récupérer les joueurs actifs
- API `createGroup` et `addGroupMember` existantes dans `@aureak/api-client`

## Notes techniques

- `generateGroupsBySeason` est une fonction pure côté client : récupère tous les joueurs actifs, calcule les catégories selon birth_date, retourne la proposition sans écrire en DB
- Calcul catégorie : `const year = new Date(birth_date).getFullYear(); const age = currentYear - year;`
- Les tranches d'âge sont en années UEFA (calculées sur le 1er janvier de la saison)
