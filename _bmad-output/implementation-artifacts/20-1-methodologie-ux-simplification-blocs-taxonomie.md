# Story 20.1 : Méthodologie UX — Simplification navigation & blocs comme taxonomie

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que la navigation de la section Méthodologie soit simplifiée (Entraînements / Thèmes / Situations uniquement) et que les Blocs deviennent une taxonomie interne accessible via un bouton discret dans les pages Thèmes et Situations,
afin de réduire la friction cognitive et de centrer l'interface sur les contenus pédagogiques réels plutôt que sur la structure de classification.

## Acceptance Criteria

1. La navigation admin section "Méthodologie" ne contient plus l'entrée "Blocs" — seules figurent : Entraînements, Thèmes, Situations.
2. La page `/methodologie/theme-groups` reste accessible comme route valide (pas de 404) mais n'est plus liée dans la navigation.
3. La page Thèmes affiche un badge "Bloc : {nom}" sur chaque card de thème (quand un `groupId` est défini).
4. La page Thèmes affiche une barre de filtre par Bloc : "Tous | Tir au but | Centre | …" (filtrage côté client immédiat).
5. La page Thèmes affiche un bouton discret "⚙ Gérer les blocs" qui ouvre la gestion des blocs.
6. La page Situations affiche un badge "Bloc : {nom}" sur chaque card de situation (quand un `blocId` est défini).
7. La page Situations affiche une barre de filtre par Bloc (même logique qu'AC4).
8. La page Situations affiche un bouton discret "⚙ Gérer les blocs".
9. La gestion des blocs (modal ou drawer) permet : créer un bloc, renommer un bloc, supprimer un bloc si aucun thème ni situation ne le référence.
10. La suppression d'un bloc utilisé est bloquée avec un message d'erreur explicite ("Ce bloc est utilisé par X thème(s) ou situation(s)").
11. Aucune donnée existante n'est perdue ou modifiée (zéro migration destructive).
12. Le design system Light Premium est respecté (couleurs, ombres, tokens `@aureak/theme`).

## Tasks / Subtasks

- [x] T1 — Retirer "Blocs" de la navigation admin (AC: 1, 2)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/_layout.tsx`, supprimer `{ label: 'Blocs', href: '/methodologie/theme-groups' }` du tableau `NAV_GROUPS`
  - [x] T1.2 — Vérifier que la route `/methodologie/theme-groups` reste résolue (index.tsx doit exister)

- [x] T2 — Enrichir l'API theme-groups pour rename + delete (AC: 9, 10)
  - [x] T2.1 — Dans `aureak/packages/api-client/src/referentiel/themes.ts`, ajouter `updateThemeGroup(id, { name: string })` → `UPDATE theme_groups SET name=$1 WHERE id=$2`
  - [x] T2.2 — Ajouter `deleteThemeGroup(id)` → soft-delete (`UPDATE theme_groups SET deleted_at=now() WHERE id=$1`) uniquement si aucun thème ni situation ne le référence ; retourner `{ error: 'IN_USE', count: number }` si utilisé
  - [x] T2.3 — Exporter les deux nouvelles fonctions dans `aureak/packages/api-client/src/index.ts`

- [x] T3 — Page Thèmes : badge Bloc + filtre + bouton Gérer (AC: 3, 4, 5)
  - [x] T3.1 — Dans `themes/index.tsx` : ajouter `selectedGroupId` (state string | null)
  - [x] T3.2 — Ajouter la barre de filtres par Bloc au-dessus de la liste (bouton "Tous" + un bouton par groupe) — filtrage côté client sur la liste déjà chargée
  - [x] T3.3 — Dans `ThemeCard`, afficher un badge avec le nom du groupe si `theme.groupId !== null`
  - [x] T3.4 — Ajouter le bouton discret "⚙ Gérer les blocs" dans le header (style ghost/muted, petit)
  - [x] T3.5 — Wirer le bouton pour ouvrir `BlocsManagerModal`

- [x] T4 — Page Situations : badge Bloc + filtre + bouton Gérer (AC: 6, 7, 8)
  - [x] T4.1 — Dans `situations/index.tsx` (route active Expo Router) : ajouter `selectedGroupId` (state string | null) — NOTE: fichier réel = index.tsx, pas page.tsx (voir Dev Notes)
  - [x] T4.2 — Modifier le rendu : mode "sections groupées avec badge Bloc" + filtre client-side
  - [x] T4.3 — Afficher un badge avec le nom du bloc si `sit.blocId !== null`
  - [x] T4.4 — Ajouter la barre de filtres Bloc (même pattern que T3.2)
  - [x] T4.5 — Ajouter le bouton discret "⚙ Gérer les blocs" dans le header
  - [x] T4.6 — Wirer le bouton pour ouvrir `BlocsManagerModal`

- [x] T5 — Créer le composant `BlocsManagerModal` (AC: 9, 10, 11, 12)
  - [x] T5.1 — Créer `aureak/apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx`
  - [x] T5.2 — Props : `{ visible: boolean; onClose: () => void; onBlocChanged: () => void }`
  - [x] T5.3 — Implémenter la liste des blocs avec inline rename (input + bouton OK par ligne)
  - [x] T5.4 — Implémenter le bouton Supprimer par bloc : appeler `deleteThemeGroup(id)`, afficher l'erreur si `IN_USE`
  - [x] T5.5 — Implémenter la zone "Ajouter un bloc" (input + bouton Ajouter → `createThemeGroup`)
  - [x] T5.6 — Sur `onBlocChanged` : déclencher un rechargement des blocs dans les pages parentes (via callback)

- [x] T6 — Validation et tests manuels (AC: tous)
  - [x] T6.1 — Vérifier que la nav affiche bien : Entraînements / Thèmes / Situations (sans Blocs)
  - [x] T6.2 — Vérifier badge Bloc visible sur thèmes et situations ayant un groupId/blocId
  - [x] T6.3 — Vérifier filtre : sélectionner un Bloc → seuls les items de ce bloc s'affichent
  - [x] T6.4 — Vérifier modal Gérer blocs : créer, renommer, tenter de supprimer un bloc utilisé (erreur attendue), supprimer un bloc libre
  - [x] T6.5 — Vérifier que `/methodologie/theme-groups` répond toujours (pas de 404)

## Dev Notes

### Architecture actuelle — Éléments critiques à connaître

**Deux systèmes de données distincts dans la section Méthodologie :**

1. **Référentiel pédagogique** (Epic 3 — tables `themes`, `theme_groups`, `situations`, `situation_groups`) :
   - C'est ce que les pages `/methodologie/themes/`, `/methodologie/situations/` et `/methodologie/theme-groups/` affichent
   - Les "Blocs" dans ce contexte = table `theme_groups`
   - `Theme.groupId` → FK `theme_groups.id`
   - `Situation.blocId` → FK `theme_groups.id` (même table que pour les thèmes — terminologie différente dans le code mais même entité)

2. **Module Méthodologie** (Migration 00050 — tables `methodology_themes`, `methodology_situations`, `methodology_sessions`) :
   - Affiché sur `/methodologie/seances/`
   - **Ne pas toucher** dans cette story — totalement séparé

**Attention** : `situations.bloc_id` et `themes.group_id` pointent TOUS LES DEUX vers `theme_groups.id`. Ce n'est pas un bug, c'est intentionnel : un Bloc est le classificateur commun des Thèmes et des Situations.

---

### Fichiers à modifier

| Fichier | Action | Raison |
|---------|--------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Supprimer ligne nav "Blocs" | AC1 |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Ajouter filtre + badge + bouton modal | AC3-5 |
| `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` | Ajouter filtre + badge + bouton modal | AC6-8 |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Ajouter `updateThemeGroup` + `deleteThemeGroup` | AC9-10 |
| `aureak/packages/api-client/src/index.ts` | Exporter les 2 nouvelles fonctions | AC9 |

### Fichiers à créer

| Fichier | Contenu |
|---------|---------|
| `aureak/apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx` | Modal réutilisable gestion blocs |

### Ambiguïté critique — deux fichiers Situations coexistent

Dans `aureak/apps/web/app/(admin)/methodologie/situations/`, **deux fichiers coexistent** :
- `page.tsx` — charge `listSituations()` + `listThemeGroups()` (référentiel, avec `sit.blocId`) ← **C'est celui-ci qu'il faut modifier**
- `index.tsx` — charge `listMethodologySituations()` + `listMethodologyThemes()` (module methodology)

La story cible `page.tsx` (le référentiel) car seule la table `situations` possède `bloc_id` → FK `theme_groups`. Les `MethodologySituation` n'ont pas de champ `blocId`.

**Avant de coder T4**, vérifier quel fichier est effectivement servi par la route `/methodologie/situations` dans Expo Router (si `index.tsx` ne re-exporte pas `page.tsx`, c'est `index.tsx` qui sert la route et les modifications devront s'y faire à la place).

---

### Fichiers à NE PAS MODIFIER

- `aureak/apps/web/app/(admin)/methodologie/theme-groups/page.tsx` — conserver telle quelle (route toujours accessible)
- `aureak/apps/web/app/(admin)/methodologie/theme-groups/index.tsx` — conserver
- Toutes les migrations Supabase — aucune modification DB
- `aureak/packages/api-client/src/referentiel/situations.ts` — `listSituations(params?.blocId)` supporte déjà le filtre, pas à modifier

---

### Pattern de filtre côté client recommandé (éviter requêtes N+1)

Les pages Thèmes et Situations chargent déjà TOUTES les données en parallèle au montage. Le filtre par Bloc doit être **côté client uniquement** sur la liste déjà en mémoire :

```tsx
// Exemple Thèmes — state
const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

// Filtre côté client
const visibleThemes = selectedGroupId
  ? themes.filter(t => t.groupId === selectedGroupId)
  : themes

// Barre de filtre
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
  <Pressable onPress={() => setSelectedGroupId(null)} style={[chip, !selectedGroupId && chipActive]}>
    <AureakText>Tous</AureakText>
  </Pressable>
  {groups.map(g => (
    <Pressable key={g.id} onPress={() => setSelectedGroupId(g.id)} style={[chip, selectedGroupId === g.id && chipActive]}>
      <AureakText>{g.name}</AureakText>
    </Pressable>
  ))}
</View>
```

Ne pas appeler `listThemes({ groupId })` à chaque changement de filtre — évite les requêtes répétées.

---

### Pattern du modal BlocsManagerModal

Le modal doit être une `View` positionnée en overlay (style `position: fixed`) sur web, ou un `Modal` React Native. Exemple structure :

```tsx
// Props
type BlocsManagerModalProps = {
  visible     : boolean
  onClose     : () => void
  onBlocChanged: () => void  // callback → recharge les blocs dans la page parente
}

// Structure interne
// - Liste blocs avec [nom] [input rename] [btn Renommer] [btn Supprimer]
// - Zone Ajouter [input] [btn Ajouter]
// - Gestion erreur IN_USE : "Impossible de supprimer : X thème(s) ou situation(s) utilisent ce bloc"
```

Le composant appelle `createThemeGroup`, `updateThemeGroup`, `deleteThemeGroup` depuis `@aureak/api-client`.
Il appelle `onBlocChanged()` après chaque mutation réussie pour que la page parente recharge `listThemeGroups()`.

---

### Implémentation `deleteThemeGroup` côté API

```ts
export async function deleteThemeGroup(
  id: string
): Promise<{ error: null | { type: 'IN_USE'; count: number } | unknown }> {
  // 1. Vérifier les thèmes qui utilisent ce bloc
  const { count: themeCount } = await supabase
    .from('themes')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', id)
    .is('deleted_at', null)

  // 2. Vérifier les situations qui utilisent ce bloc
  const { count: sitCount } = await supabase
    .from('situations')
    .select('id', { count: 'exact', head: true })
    .eq('bloc_id', id)
    .is('deleted_at', null)

  const total = (themeCount ?? 0) + (sitCount ?? 0)
  if (total > 0) {
    return { error: { type: 'IN_USE', count: total } }
  }

  // 3. Soft-delete
  const { error } = await supabase
    .from('theme_groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error ?? null }
}
```

---

### Design System

Respecter strictement les tokens `@aureak/theme` :
- Fond page : `colors.light.primary`
- Cards : `colors.light.surface`, `borderColor: colors.border.light`, `shadows.sm`
- Badge Bloc : `colors.accent.gold + '20'` background, `colors.accent.gold + '60'` border, texte `colors.text.dark` — même style que les chips gold existants
- Filtre actif : `backgroundColor: colors.accent.gold`, `borderColor: colors.accent.gold`
- Bouton "⚙ Gérer les blocs" : style ghost/muted, fontSize 11-12, `color: colors.text.muted`, aucune prominence
- Erreur suppression : `colors.accent.red`, fond `colors.accent.red + '10'`

---

### Routing — aucune casse

La route `/methodologie/theme-groups` doit rester fonctionnelle. Le fichier `theme-groups/index.tsx` (re-export) et `theme-groups/page.tsx` (contenu) ne sont pas modifiés. Seul le lien dans la nav est supprimé.

---

### Multi-tenant

- `listThemeGroups()` filtre déjà via RLS Supabase (tenant_id dans JWT) — pas de paramètre à passer
- `createThemeGroup({ tenantId, name, sortOrder })` nécessite `tenantId` → récupérer via `useAuthStore(s => s.tenantId)` dans `BlocsManagerModal`

### Project Structure Notes

- Pattern routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export. Le nouveau composant `_components/BlocsManagerModal.tsx` suit la convention de dossier `_components` (préfixe `_` = non-route).
- `@aureak/api-client` : seul point d'accès Supabase — tout appel DB dans `BlocsManagerModal` doit passer par les fonctions exportées de ce package, jamais via `supabase` directement depuis la page.
- Les nouvelles fonctions API doivent être ajoutées dans `referentiel/themes.ts` et exportées dans `index.ts`.

### References

- Navigation actuelle : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 24-31
- Page Thèmes : `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx`
- Page Situations : `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx`
- Page Blocs existante : `aureak/apps/web/app/(admin)/methodologie/theme-groups/page.tsx`
- API ThemeGroups : `aureak/packages/api-client/src/referentiel/themes.ts` (`listThemeGroups`, `createThemeGroup`, `updateThemeGroupOrder`)
- API Situations : `aureak/packages/api-client/src/referentiel/situations.ts` (`listSituations` avec `params?.blocId`)
- Types : `@aureak/types` — `ThemeGroup`, `Theme`, `Situation`
- Design tokens : `aureak/packages/theme/tokens.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T4 implémenté dans `situations/index.tsx` (route active Expo Router) et non `situations/page.tsx` comme indiqué dans les Dev Notes — décision correcte car `index.tsx` sert réellement la route `/methodologie/situations`
- Code review (claude-sonnet-4-6) : 2 High + 3 Medium corrigés — design tokens (colors.accent.red), useCallback deps, stopPropagation retiré, tâches cochées, File List corrigé

### File List

- `aureak/apps/web/app/(admin)/_layout.tsx` (modifié)
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (modifié)
- `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` (modifié — route active Expo Router, pas page.tsx)
- `aureak/apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx` (créé)
- `aureak/packages/api-client/src/referentiel/themes.ts` (modifié)
- `aureak/packages/api-client/src/index.ts` (modifié)
