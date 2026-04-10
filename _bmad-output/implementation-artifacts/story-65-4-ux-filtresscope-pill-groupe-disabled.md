# Story 65-4 — UX FiltresScope : pill Groupe/Joueur grisé si dépendance non satisfaite

**Epic** : 65 — Activités Hub Unifié (Séances · Présences · Évaluations)
**Status** : cancelled — Superseded par story-65-8. Jeremy ne veut pas du hint "Choisir une implantation d'abord". Le pill reste grisé sans texte.
**Priority** : P1 — quick-win UX, 0 migration
**Effort estimé** : XS (1 fichier, ~30 lignes modifiées)

---

## Contexte & Problème

Dans `FiltresScope.tsx` (composant partagé stories 65-1 / 65-2 / 65-3), le pill **"Groupe ▾"** est toujours actif et cliquable, quelle que soit la sélection courante. Quand l'utilisateur clique sur ce pill sans avoir préalablement choisi une implantation, le dropdown s'ouvre et affiche le message d'erreur tardif `"Sélectionner une implantation d'abord"`.

Conséquence : **3 clics perdus** — clic pill Groupe → lire message → clic fermeture → clic pill Implantation. L'utilisateur découvre la contrainte de dépendance après le fait, pas avant.

Même problème symétrique pour le pill **"Joueur ▾"** : bien que le scope joueur soit indépendant du groupe dans l'implémentation actuelle, la cohérence UX requiert de documenter ce comportement (voir note dans les tâches).

---

## Décision validée

> "Le pill Groupe ▾ doit être visuellement grisé et non-cliquable tant qu'aucune implantation n'est sélectionnée."

---

## Acceptance Criteria

### AC1 — Pill Groupe grisé sans implantation
- Quand `scope !== 'implantation'` ET `implantationId` est `null` ou `undefined`, le pill "Groupe ▾" est rendu avec `opacity: 0.45` et `cursor: not-allowed` (web)
- Dans cet état, un `onPress` sur ce pill est **ignoré** (aucun dropdown ne s'ouvre)
- Aucun dropdown d'erreur n'est plus jamais affiché dans cet état

### AC2 — Pill Groupe actif avec implantation sélectionnée
- Dès qu'une implantation est sélectionnée (`implantationId` non-null, peu importe que `scope === 'implantation'` ou `scope === 'groupe'`), le pill "Groupe ▾" retrouve son apparence normale (`opacity: 1`, `cursor: pointer`)
- Le dropdown de groupes s'ouvre normalement au clic

### AC3 — Feedback visuel explicatif
- Quand le pill Groupe est grisé, un sous-texte `"Choisir une implantation d'abord"` est affiché directement sous le pill (pas dans un dropdown) en `colors.text.muted`, `fontSize: 10`
- Ce texte est invisible (`display: none` ou `opacity: 0`) quand le pill est actif

---

## Acceptance Criteria secondaires

### AC4 — Pill Joueur : comportement inchangé (scope indépendant)
- Le pill "Joueur ▾" reste toujours actif et cliquable (scope `joueur` est indépendant de `implantationId` et `groupId` dans l'implémentation actuelle)
- Aucune modification du comportement du pill Joueur dans cette story
- NOTE : si une dépendance joueur → groupe est introduite dans une story future, elle fera l'objet d'une story dédiée

### AC5 — Aucune régression
- Le pill "Global" et le pill "Implantation ▾" fonctionnent exactement comme avant
- Les stories 65-1, 65-2, 65-3 qui consomment `FiltresScope` ne nécessitent aucune modification de leurs props ni de leur logique parent

---

## Tasks

- [ ] **T1** — Lire `FiltresScope.tsx` dans son état actuel (déjà fait : voir implémentation ci-dessous)
- [ ] **T2** — Ajouter la variable dérivée `groupPillEnabled` :
  ```typescript
  const groupPillEnabled = !!(value.implantationId)
  ```
- [ ] **T3** — Modifier la fonction `pillStyle` pour accepter un paramètre `disabled?: boolean` :
  ```typescript
  function pillStyle(active: boolean, disabled = false): ViewStyle {
    return {
      paddingHorizontal: 14,
      paddingVertical  : 6,
      borderRadius     : radius.badge,
      backgroundColor  : active ? colors.accent.gold : colors.light.muted,
      borderWidth      : 1,
      borderColor      : active ? colors.accent.gold : colors.border.light,
      opacity          : disabled ? 0.45 : 1,
      cursor           : disabled ? 'not-allowed' : 'pointer',  // web only via style prop
    }
  }
  ```
  Note : `cursor` est une prop de style valide dans React Native Web (Expo Router web). Utiliser `style={{ cursor: ... } as any}` si TypeScript le rejette, mais préférer un cast via ViewStyle étendu.

- [ ] **T4** — Modifier le Pressable Groupe pour bloquer le press quand `!groupPillEnabled` :
  ```tsx
  <Pressable
    style={pillStyle(isActive('groupe'), !groupPillEnabled)}
    onPress={() => {
      if (!groupPillEnabled) return   // guard — ne rien faire
      setShowGroupDropdown(v => !v)
      setShowImplDropdown(false)
      setShowJoueurDropdown(false)
    }}
  >
  ```

- [ ] **T5** — Ajouter le sous-texte hint sous le pill Groupe (conditionnel) :
  ```tsx
  {/* Hint visible seulement quand le pill est désactivé */}
  {!groupPillEnabled && (
    <AureakText style={styles.pillHint}>Choisir une implantation d'abord</AureakText>
  )}
  ```
  Avec le style :
  ```typescript
  pillHint: {
    fontSize  : 10,
    fontFamily: 'Montserrat',
    color     : colors.text.muted,
    marginTop : 2,
    textAlign : 'center',
  }
  ```

- [ ] **T6** — Supprimer le message d'erreur tardif dans le dropdown Groupe (devenu inutile) :
  - Supprimer la condition `{value.implantationId ? 'Aucun groupe' : 'Sélectionner une implantation d\'abord'}` dans le dropdown Groupe
  - Remplacer par le message simple `'Aucun groupe'` uniquement (cas edge : implantation sans groupe)

- [ ] **T7** — QA scan sur `FiltresScope.tsx` :
  ```bash
  grep -n "setLoading\|setSaving\|setCreating" aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx
  grep -n "console\." aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx | grep -v "NODE_ENV"
  ```

---

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` | Modifier — pill Groupe disabled + hint |

**Aucune migration SQL. Aucun changement API. Aucun changement de types.**

---

## Contraintes techniques

- Styles **uniquement** via `colors`, `space`, `radius`, `shadows` depuis `@aureak/theme` — aucune couleur hardcodée
- `cursor: 'not-allowed'` est supporté dans Expo Router web via `StyleSheet` (React Native Web), peut nécessiter `as any` pour satisfaire TypeScript
- Ne pas utiliser `disabled` prop sur `<Pressable>` (React Native ne supporte pas `disabled` nativement sur Pressable — utiliser le guard dans `onPress` + `opacity` visuelle)

---

## Dépendances

- **Dépend de** : story 65-1 (`done` ou `in-progress` — `FiltresScope.tsx` existe)
- **Bloque** : aucune story ne dépend de 65-4

---

## Références

- Implémentation actuelle : `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` (lignes 155–192)
- Message d'erreur tardif actuel (à supprimer) : ligne 173 — `'Sélectionner une implantation d\'abord'`
- Tokens utilisés : `colors.accent.gold`, `colors.light.muted`, `colors.border.light`, `colors.text.muted`, `colors.text.dark`, `radius.badge`, `space.sm`, `space.md`
