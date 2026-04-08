# Story 75.3 : UX — Modale de confirmation avec sélection de groupe avant conversion essai → membre

Status: done

## Story

En tant qu'admin,
je veux choisir explicitement le groupe de destination et confirmer dans une modale avant de convertir un stagiaire en membre,
afin d'éviter toute conversion accidentelle dans le mauvais groupe.

## Acceptance Criteria

1. Cliquer sur "Ajouter au groupe" pour un stagiaire ouvre une modale de confirmation — aucune action DB n'est exécutée avant la confirmation.
2. La modale affiche le nom du stagiaire concerné et un sélecteur de groupe (`<select>`) listant tous les groupes disponibles (identique au sélecteur de filtre déjà chargé sur la page).
3. Le sélecteur de groupe est obligatoire : le bouton "Confirmer" reste désactivé tant qu'aucun groupe n'est sélectionné.
4. Confirmer exécute `convertTrialToMember` avec le `groupId` choisi dans la modale — jamais avec `groups[0]?.id` sélectionné silencieusement.
5. Annuler dans la modale ferme sans aucune modification — le stagiaire reste dans la liste des suggestions.
6. Après confirmation réussie, le stagiaire est retiré de la liste des suggestions (comportement identique à l'actuel) et la modale se ferme.
7. En cas d'erreur API lors de la conversion, la modale reste ouverte et affiche un message d'erreur inline (pas d'alert/toast externe).
8. L'état `converting` (spinner sur le bouton "Confirmer") est géré avec un bloc `try/finally` garantissant la réinitialisation même en cas d'erreur.
9. Le code ne contient aucune couleur hardcodée — uniquement des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Ajouter l'état et la logique de la modale dans `presences/page.tsx` (AC: 1, 4, 5, 6, 7, 8)
  - [x] T1.1 — Ajouter les états : `pendingConversion: TrialConversionSuggestion | null` (cible de la modale), `modalGroupId: string` (groupe sélectionné), `modalError: string | null`
  - [x] T1.2 — Remplacer `handleConvert` : au clic "Ajouter au groupe" → setter `pendingConversion = s` et `modalGroupId = ''` (ouvrir la modale) ; NE PAS appeler `convertTrialToMember` ici
  - [x] T1.3 — Créer `handleConfirmConvert` : vérifie `pendingConversion && modalGroupId && tenantId`, appelle `convertTrialToMember({ tenantId, childId: pendingConversion.childId, groupId: modalGroupId })`, gère erreur dans `modalError`, ferme la modale si succès, `try/finally` sur `setConverting`
  - [x] T1.4 — Supprimer la ligne `const groupChoice = groups[0]?.id` — ce pattern silencieux est supprimé définitivement

- [x] T2 — Implémenter la modale de confirmation dans le JSX (AC: 1, 2, 3, 5, 7, 9)
  - [x] T2.1 — Ajouter un overlay modale conditionnel `{pendingConversion && (…)}` rendu en fin de composant (après le return principal, avant la fermeture du div racine)
  - [x] T2.2 — Structure modale : overlay backdrop semi-transparent + card blanche centrée avec `boxShadow: shadows.lg`, `borderRadius: radius.card`, padding `space.xl`
  - [x] T2.3 — Contenu modale : titre "Convertir en membre", sous-titre avec le nom `pendingConversion.childName`, sélecteur `<select>` listant `groups` (value = `modalGroupId`, onChange = `setModalGroupId`), option placeholder "— Choisir un groupe —" avec `value=''` désactivée
  - [x] T2.4 — Bouton "Confirmer" : désactivé si `!modalGroupId || converting`, background `colors.accent.gold`, couleur texte `colors.text.dark`
  - [x] T2.5 — Bouton "Annuler" : fond `colors.light.hover`, bordure `colors.border.light`, ferme via `setPendingConversion(null)`
  - [x] T2.6 — Afficher `modalError` sous le sélecteur si non-null (texte rouge `colors.accent.red`, fontSize 12)

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Naviguer sur `/(admin)/presences`, vérifier que la section "Suggestions conversion essai → membre" est visible si des essais existent
  - [x] T3.2 — Cliquer "Ajouter au groupe" → vérifier que la modale s'ouvre avec le nom du stagiaire et le sélecteur de groupe
  - [x] T3.3 — Vérifier que le bouton "Confirmer" est bien désactivé tant qu'aucun groupe n'est sélectionné
  - [x] T3.4 — Sélectionner un groupe → "Confirmer" → vérifier que le stagiaire disparaît de la liste des suggestions
  - [x] T3.5 — Cliquer "Annuler" → vérifier que la liste des suggestions est inchangée

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- Cette page (`presences/page.tsx`) utilise les primitives DOM (`div`, `button`, `select`) inline via `style={{}}` — conserver ce pattern, ne pas migrer vers RN View/Pressable
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : non utilisés dans cette page — conserver le pattern DOM natif existant
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — `convertTrialToMember` est déjà exporté
- **Try/finally obligatoire** sur `setConverting` dans `handleConfirmConvert`

---

### T1 — Remplacement de handleConvert (logique actuelle à corriger)

**Avant (ligne 574–584 dans `presences/page.tsx`) :**
```tsx
const handleConvert = async (s: TrialConversionSuggestion) => {
  const groupChoice = groups[0]?.id   // ← sélection silencieuse du premier groupe
  if (!groupChoice || !tenantId) return
  setConverting(s.childId)
  try {
    await convertTrialToMember({ tenantId, childId: s.childId, groupId: groupChoice })
    setSuggestions(prev => prev.filter(x => x.childId !== s.childId))
  } finally {
    setConverting(null)
  }
}
```

**Après (à remplacer par deux fonctions) :**
```tsx
// Ouvre la modale — pas d'appel API
const handleOpenConvertModal = (s: TrialConversionSuggestion) => {
  setPendingConversion(s)
  setModalGroupId('')
  setModalError(null)
}

// Exécuté depuis la modale — après confirmation explicite
const handleConfirmConvert = async () => {
  if (!pendingConversion || !modalGroupId || !tenantId) return
  setConverting(pendingConversion.childId)
  try {
    const { error } = await convertTrialToMember({
      tenantId,
      childId : pendingConversion.childId,
      groupId : modalGroupId,
    })
    if (error) {
      setModalError('Erreur lors de la conversion. Réessayez.')
      return
    }
    setSuggestions(prev => prev.filter(x => x.childId !== pendingConversion.childId))
    setPendingConversion(null)
  } finally {
    setConverting(null)
  }
}
```

---

### T2 — Structure de la modale (snippet JSX)

Pattern overlay centré déjà utilisé dans d'autres pages admin (ex. `clubs/[clubId]/page.tsx`) :

```tsx
{pendingConversion && (
  <div style={{
    position       : 'fixed',
    inset          : 0,
    background     : 'rgba(0,0,0,0.45)',
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
    zIndex         : 1000,
  }}>
    <div style={{
      background   : colors.light.surface,
      borderRadius : radius.card,
      padding      : space.xl,
      width        : 380,
      maxWidth     : '90vw',
      // @ts-ignore — web only
      boxShadow    : shadows.lg,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark, marginBottom: space.sm }}>
        Convertir en membre
      </div>
      <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: space.md }}>
        {pendingConversion.childName} — {pendingConversion.trialCount} séances d&apos;essai
      </div>

      <label style={{ fontSize: 12, fontWeight: 600, color: colors.text.muted, display: 'block', marginBottom: space.xs }}>
        Groupe de destination *
      </label>
      <select
        value={modalGroupId}
        onChange={e => { setModalGroupId(e.target.value); setModalError(null) }}
        style={{
          width        : '100%',
          padding      : '8px 10px',
          borderRadius : radius.xs,
          border       : `1px solid ${colors.border.light}`,
          background   : colors.light.primary,
          fontSize     : 13,
          color        : colors.text.dark,
          marginBottom : space.sm,
        }}
      >
        <option value='' disabled>— Choisir un groupe —</option>
        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      {modalError && (
        <div style={{ fontSize: 12, color: colors.accent.red, marginBottom: space.sm }}>
          {modalError}
        </div>
      )}

      <div style={{ display: 'flex', gap: space.sm, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setPendingConversion(null)}
          style={{
            padding      : '7px 16px',
            background   : colors.light.hover,
            border       : `1px solid ${colors.border.light}`,
            borderRadius : radius.xs,
            fontSize     : 13,
            fontWeight   : 600,
            color        : colors.text.muted,
            cursor       : 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleConfirmConvert}
          disabled={!modalGroupId || converting === pendingConversion.childId}
          style={{
            padding      : '7px 16px',
            background   : (!modalGroupId || converting === pendingConversion.childId)
              ? colors.light.muted
              : colors.accent.gold,
            border       : 'none',
            borderRadius : radius.xs,
            fontSize     : 13,
            fontWeight   : 600,
            color        : (!modalGroupId || converting === pendingConversion.childId)
              ? colors.text.subtle
              : colors.text.dark,
            cursor       : (!modalGroupId || converting === pendingConversion.childId)
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          {converting === pendingConversion.childId ? '…' : 'Confirmer'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// Overlay backdrop
background     : 'rgba(0,0,0,0.45)'
zIndex         : 1000

// Card modale
backgroundColor: colors.light.surface
borderRadius   : radius.card
boxShadow      : shadows.lg   // jamais shadows.lg.spread etc.
padding        : space.xl

// Bouton Confirmer (actif)
backgroundColor: colors.accent.gold
color          : colors.text.dark

// Bouton Annuler
backgroundColor: colors.light.hover
borderColor    : colors.border.light

// Message erreur
color          : colors.accent.red
```

Principes design à respecter :
- Profondeur obligatoire — la modale utilise `shadows.lg` + overlay backdrop (principe 3)
- Fond clair — card blanche `colors.light.surface` sur fond foncé semi-transparent (principe 1)
- Pas d'alert/confirm natif browser — toujours une modale custom intégrée (anti-pattern corporate)

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/presences/page.tsx` | Modifier | Ajouter états modale, remplacer `handleConvert`, ajouter JSX modale |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/sessions/presences.ts` — `convertTrialToMember` et `TrialConversionSuggestion` sont déjà corrects, aucune modification de signature
- `aureak/packages/types/src/entities.ts` — aucun nouveau type nécessaire
- Tous les autres fichiers de la page `presences/` — cette story ne touche que `presences/page.tsx`

---

### Dépendances à protéger

- `convertTrialToMember` (api-client) : signature `{ tenantId, childId, groupId }` — ne pas modifier
- `TrialConversionSuggestion` (type exporté api-client) : utilisé tel quel comme type de `pendingConversion`
- Le filtre de groupes existant dans la page (`groups` state, `filteredGroups` useMemo) — la modale utilise `groups` (liste complète, pas `filteredGroups`) pour ne pas contraindre le choix par le filtre actif

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fonction API : `aureak/packages/api-client/src/sessions/presences.ts` lignes 359–377 (`convertTrialToMember`)
- Type : `aureak/packages/api-client/src/sessions/presences.ts` lignes 296–301 (`TrialConversionSuggestion`)
- Fichier cible : `aureak/apps/web/app/(admin)/presences/page.tsx` lignes 574–584 (handleConvert à remplacer), 660–675 (bouton à modifier)
- Pattern modale overlay : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (PlayerPicker modal)

---

### Multi-tenant

`tenantId` est déjà extrait de `useAuthStore()` à la ligne 507 de `presences/page.tsx`. Le passer à `convertTrialToMember` dans `handleConfirmConvert` — identique à l'usage actuel.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- Suppression du pattern silencieux `groups[0]?.id` (T1.4)
- `handleConvert` remplacé par `handleOpenConvertModal` + `handleConfirmConvert`
- Modale overlay centrée avec backdrop `rgba(0,0,0,0.45)`, zIndex 1000
- `try/finally` sur `setConverting` dans `handleConfirmConvert` (AC 8)
- Zéro hex hardcodé — uniquement tokens `@aureak/theme`
- TypeScript : aucune erreur dans `presences/page.tsx`

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/presences/page.tsx` | Modifié |
