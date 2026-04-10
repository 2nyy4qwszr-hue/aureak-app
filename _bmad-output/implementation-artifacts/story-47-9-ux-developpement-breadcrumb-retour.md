# Story 47-9 — UX : Breadcrumb / bouton retour dans les sous-pages Développement

**Epic** : 47 — Design/UX batch
**Status** : done
**Priority** : P1 — Navigation bloquante (utilisateur coincé)
**Effort** : XS (3 fichiers, CSS/style uniquement)

---

## Contexte

Les trois sous-pages de la section Développement (`/developpement/prospection`, `/developpement/marketing`, `/developpement/partenariats`) ont été créées en Story 63.3.

Un bouton retour minimal existe déjà dans chacune — un `Pressable` nu avec du texte `← Développement`. Cependant, le composant est insuffisant sur deux points :

1. **Affordance faible** : le `Pressable` n'a aucune zone de tap visible ni état hover. Sur desktop, l'utilisateur ne distingue pas qu'il s'agit d'un bouton cliquable.
2. **Duplication de code** : les trois fichiers définissent chacun des styles identiques (`backBtn`, `backText`) au lieu de partager un composant ou un pattern commun.
3. **Pas de feedback visuel** : aucun état `pressed` / hover déclaré sur le bouton retour (contrairement aux `DevSectionCard` dans `page.tsx` parent qui utilisent `pressed && styles.cardPressed`).

La story décision originale (Jeremy) : *"Les sous-pages Développement n'ont pas de bouton retour vers le hub parent. L'utilisateur est bloqué sans pouvoir revenir."* — le bouton existait techniquement mais était invisible/non évident à l'usage.

Cette story corrige les 3 fichiers pour rendre la navigation retour **visible, accessible, et cohérente**.

---

## Acceptance Criteria

### AC1 — Le bouton retour a un état hover/pressed visible dans les 3 pages

Dans chaque `page.tsx` concerné, le `Pressable` du bouton retour utilise le callback `style` pour appliquer un état pressed :

```tsx
<Pressable
  style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
  onPress={() => router.back()}
>
```

- `backBtnPressed` : `opacity: 0.6` — cohérent avec le pattern `cardPressed` de `page.tsx`
- `router.back()` remplace `router.push('/(admin)/developpement' as never)` — navigation retour native plus robuste (respecte l'historique)

### AC2 — Le bouton retour a un fond subtil et une zone de tap suffisante

Le style `backBtn` est enrichi pour être perceptible visuellement :

```typescript
backBtn: {
  flexDirection     : 'row',
  alignItems        : 'center',
  alignSelf         : 'flex-start',
  marginBottom      : space.md,
  paddingHorizontal : space.sm,
  paddingVertical   : space.xs,
  borderRadius      : radius.xs,
  backgroundColor   : colors.light.hover,    // fond subtil au repos
  borderWidth       : 1,
  borderColor       : colors.border.light,
},
backBtnPressed: {
  opacity: 0.6,
},
backText: {
  color     : colors.text.muted,
  fontSize  : 13,
  fontWeight: '600',
} as never,
```

- `colors.light.hover` (token existant) : fond beige très léger qui signale le caractère interactif
- `colors.border.light` : bordure discrète cohérente avec les cards
- `radius.xs` (token `6px`) : coins légèrement arrondis
- **Aucune couleur hardcodée** — 100% tokens `@aureak/theme`

### AC3 — Les 3 fichiers sont uniformisés (même structure, même styles)

Les fichiers `prospection/page.tsx`, `marketing/page.tsx` et `partenariats/page.tsx` ont exactement le même pattern de bouton retour. Aucune différence de style entre les trois.

---

## Tasks

- [ ] **T1** — Lire les 3 fichiers `page.tsx` (`prospection`, `marketing`, `partenariats`) et confirmer les noms de styles existants avant modification
- [ ] **T2** — Dans `prospection/page.tsx` : remplacer `router.push('/(admin)/developpement' as never)` par `router.back()`, ajouter état `pressed`, enrichir styles `backBtn` + ajouter `backBtnPressed` (AC1, AC2)
- [ ] **T3** — Dans `marketing/page.tsx` : idem T2 (AC1, AC2)
- [ ] **T4** — Dans `partenariats/page.tsx` : idem T2 (AC1, AC2)
- [ ] **T5** — QA scan : `grep -n "console\." prospection/page.tsx marketing/page.tsx partenariats/page.tsx | grep -v NODE_ENV` → 0 résultat
- [ ] **T6** — QA scan : `grep -n "#[0-9a-fA-F]" prospection/page.tsx marketing/page.tsx partenariats/page.tsx` → 0 couleur hardcodée hors templates
- [ ] **T7** — `cd aureak && npx tsc --noEmit` → 0 erreur TypeScript

---

## Fichiers modifiés

1. `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx`
2. `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx`
3. `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx`

Aucune migration Supabase. Aucune modification `@aureak/types`, `@aureak/api-client`, `@aureak/ui`.

---

## Dépendances

- Story 63-3 (`section-developpement-prospection-marketing`) : `done` — les 3 pages existent, cette story améliore uniquement leur bouton retour.
- Aucune autre dépendance.

---

## Notes techniques

### Pourquoi `router.back()` plutôt que `router.push`

`router.back()` suit l'historique de navigation natif d'Expo Router. Si l'utilisateur arrive sur `/developpement/prospection` depuis un lien direct (bookmark, email), `router.back()` retourne à la page précédente dans l'historique du navigateur (pas forcément le hub). Pour une SPA admin où les utilisateurs naviguent depuis le hub, `router.back()` est plus naturel et évite les boucles de navigation.

Si le besoin est de toujours revenir vers `/(admin)/developpement` indépendamment de l'historique, utiliser `router.replace('/(admin)/developpement' as never)` — décision laissée au développeur selon le comportement souhaité.

### Tokens utilisés (tous existants dans `@aureak/theme`)

| Token | Valeur approximative | Usage |
|-------|---------------------|-------|
| `colors.light.hover` | beige très clair | fond bouton retour |
| `colors.border.light` | gris clair | bordure bouton retour |
| `colors.text.muted` | gris moyen | texte `← Développement` |
| `radius.xs` | 6px | coins bouton retour |
| `space.sm` | padding horizontal | zone de tap |
| `space.xs` | padding vertical | zone de tap |

### Pas de try/finally nécessaire

Cette story ne touche aucun setter de chargement/sauvegarde. `router.back()` et `router.push()` sont des navigations synchrones. Règle try/finally non applicable.

### Pattern final du bouton retour (les 3 pages identiques)

```tsx
<Pressable
  style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
  onPress={() => router.back()}
>
  <AureakText style={styles.backText}>← Développement</AureakText>
</Pressable>
```

```typescript
backBtn: {
  flexDirection    : 'row',
  alignItems       : 'center',
  alignSelf        : 'flex-start',
  marginBottom     : space.md,
  paddingHorizontal: space.sm,
  paddingVertical  : space.xs,
  borderRadius     : radius.xs,
  backgroundColor  : colors.light.hover,
  borderWidth      : 1,
  borderColor      : colors.border.light,
},
backBtnPressed: {
  opacity: 0.6,
},
backText: {
  color     : colors.text.muted,
  fontSize  : 13,
  fontWeight: '600',
} as never,
```

---

## Commit attendu

```
fix(ux): breadcrumb retour visible dans sous-pages Développement (story 47-9)
```
