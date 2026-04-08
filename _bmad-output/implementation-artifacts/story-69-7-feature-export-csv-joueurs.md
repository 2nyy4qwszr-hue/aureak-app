# Story 69.7 : FEATURE — Export CSV joueurs depuis /children

Status: done

## Story
En tant qu'admin, je veux pouvoir exporter la liste des joueurs (après filtres appliqués) en CSV, afin d'utiliser les données pour les stages, communications RBFA et gestion hors-app.

## Acceptance Criteria
1. Bouton "Exporter CSV" présent dans le header de `/children`, à droite du titre
2. Le CSV est généré côté client (pas d'API) à partir des données déjà chargées (respect des filtres actifs)
3. Colonnes CSV : `Prénom`, `Nom`, `Date de naissance`, `Statut`, `Club actuel`, `Parent 1 email`, `Parent 2 email`, `Actif`
4. Nom du fichier : `joueurs-aureak-YYYY-MM-DD.csv`
5. Le téléchargement démarre immédiatement via `window.URL.createObjectURL` + `<a>` click
6. Si 0 joueurs filtrés : bouton désactivé (opacity 0.5, cursor not-allowed, prop `disabled`)

## Dev Notes
La page joueurs est `aureak/apps/web/app/(admin)/children/index.tsx` (fichier principal — pas de `page.tsx` séparé dans ce cas).

Le type `ChildDirectoryEntry` est dans `@aureak/types`. Les champs à mapper :
- `prenom` et `nom` sont déjà disponibles séparément dans `ChildDirectoryEntry` (champs `prenom` + `nom`). Si null, splitter `displayName` sur le premier espace.
- `birthDate`, `statut`, `currentClub`, `parent1Email`, `parent2Email`, `actif`

Pas d'appel API supplémentaire — utiliser les données déjà dans le state `joueurs` filtré (la variable contenant les joueurs après application de tous les filtres actifs).

Échapper les virgules et guillemets dans les valeurs CSV : entourer chaque champ de guillemets doubles, doubler les guillemets internes (RFC 4180).

La page utilise React Native Web + `div`/style inline (pas de RN pur). La logique `window.URL.createObjectURL` est safe en web.

Style bouton "Exporter CSV" :
```
backgroundColor: colors.light.muted
borderWidth: 1 / border: `1px solid ${colors.border.divider}`
borderRadius: radius.md (ou 8)
paddingHorizontal: space.md
paddingVertical: 8
fontSize: 13
color: colors.text.dark
```
Placer à droite du titre, dans le même `div` header flex.

## Tasks
- [ ] T1 — Dans `children/index.tsx`, créer la fonction `exportCSV(joueurs: ChildDirectoryEntry[])` :
  - Construire le header CSV : `"Prénom","Nom","Date de naissance","Statut","Club actuel","Parent 1 email","Parent 2 email","Actif"`
  - Construire les lignes en échappant chaque champ (guillemets doubles, escape interne)
  - Générer `new Blob([csv], { type: 'text/csv;charset=utf-8;' })`
  - Créer un `<a>` temporaire, `click()`, puis `revokeObjectURL`
  - Nom du fichier : `joueurs-aureak-${new Date().toISOString().slice(0, 10)}.csv`
- [ ] T2 — Ajouter le bouton "Exporter CSV" dans le header, à droite du titre
- [ ] T3 — Désactiver le bouton si la liste filtrée est vide (0 joueurs)
- [ ] T4 — QA scan : console guards, pas de couleurs hardcodées

## Dépendances
Aucune — story indépendante.

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | À modifier |
