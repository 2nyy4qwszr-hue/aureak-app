# Story 46.2 : BUG — Création séance — Safari autocomplete déclenche popup mot de passe

Status: done

## Story

En tant qu'admin Aureak créant une séance sur Safari,
je veux que les sélecteurs implantation et groupe n'affichent pas le popup de complétion automatique / gestionnaire de mots de passe Safari,
afin de pouvoir sélectionner normalement sans interférence browser.

## Acceptance Criteria

1. Le sélecteur "Implantation" dans `seances/new.tsx` n'affiche pas le popup Safari de complétion automatique ni de gestionnaire de mots de passe
2. Le sélecteur "Groupe" n'affiche pas non plus ce popup
3. Les pickers fonctionnent normalement sur Chrome et Firefox (pas de régression)
4. L'UX reste identique — les éléments sont toujours cliquables et filtrent correctement

## Tasks / Subtasks

- [x] T1 — Diagnostiquer la cause
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/seances/new.tsx` — identifier les inputs/pickers implantation et groupe
  - [x] T1.2 — Identifier si ce sont des `<input type="text">` ou des `<Pressable>` avec state

- [x] T2 — Corriger le comportement Safari
  - [x] T2.1 — Si `<input>` : ajouter `autoComplete="off"` + `autoCorrect="off"` + `autoCapitalize="off"` + `name` unique non-ambigu (éviter "password", "email", "username")
  - [x] T2.2 — Si composant React Native : utiliser `accessible={false}` ou `aria-hidden` sur les éléments non-interactifs
  - [x] T2.3 — Ajouter `data-form-type="other"` sur les conteneurs de picker (astuce Safari spécifique)
  - [x] T2.4 — Si TextInput : `textContentType="none"` (iOS/Safari RN Web hint)

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Tester sur Safari → aucun popup mot de passe/complétion automatique

## Dev Notes

### Contexte Safari
Safari associe les champs texte adjacents à un champ email/mot de passe → déclenche le gestionnaire de mots de passe.
Solutions :
1. `autoComplete="off"` (standard HTML)
2. `data-form-type="other"` (contourne la heuristique Safari)
3. `name` non-ambigu (éviter "login", "user", "pass", "email")
4. Si picker custom (non-input) : Safari peut quand même détecter le formulaire parent → ajouter `autoComplete="off"` sur le `<form>` ou wrapper

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Ajouter attributs anti-autocomplete sur pickers |

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes List
- Composants identifiés : `SearchableSelect` (Pressable trigger + TextInput dropdown) et `MultiSearchableSelect` (même pattern)
- Les `TextInput` avaient déjà `autoComplete='off'`, `autoCorrect={false}`, `autoCapitalize="none"` et `data-form-type: 'other'` (via spread web)
- Corrections appliquées sur `SearchableSelect` et `MultiSearchableSelect` :
  1. `data-form-type="other"` ajouté sur le `View` wrapper racine (via spread conditionnel `Platform.OS === 'web'`) — critique pour que Safari ne détecte pas le conteneur comme champ de formulaire
  2. `textContentType="none"` ajouté sur les deux `TextInput` de recherche — hint iOS/Safari RN Web
- `npx tsc --noEmit` → 0 erreur

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | modifié |
