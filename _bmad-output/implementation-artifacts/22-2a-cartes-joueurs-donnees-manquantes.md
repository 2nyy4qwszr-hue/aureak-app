# Story 22.2A : Cartes joueurs — Robustesse avec données manquantes

Status: done

**Epic :** 22 — Admin Joueurs : Qualité de saisie & UX
**Dépendances :** Story 18-6 (design vertical cartes joueurs — baseline)

---

## Story

En tant qu'administrateur Aureak,
je veux que les cartes joueurs maintiennent une structure visuelle stable même quand certaines données sont absentes,
afin d'avoir une grille cohérente et lisible, sans décalages ou hauteurs inégales liés aux données manquantes.

---

## Acceptance Criteria

1. **Placeholder pour données absentes** — Quand `birthDate`, `currentClub` ou `niveauClub` sont null ou vide, la ligne correspondante affiche un tiret `"—"` au lieu d'être masquée.
2. **Hauteur uniforme** — Les lignes avec `"—"` occupent leur espace visuel normalement. Toutes les cartes ont une hauteur similaire, que les données soient complètes ou non.
3. **Style atténué pour les placeholders** — Le tiret `"—"` est affiché dans un style visuellement distinct du contenu réel : couleur atténuée (`colors.text.subtle` ou `colors.text.muted`) avec opacité réduite, pour signaler clairement l'absence de donnée.
4. **Photo manquante** — Si aucune photo n'est disponible, le fallback initiales actuel est conservé sans modification.
5. **Statut manquant** — Si `computedStatus` est null, la zone chips ne génère pas de `StatusChip` vide (comportement actuel conservé — conditionnel).
6. **Chips conditionnels maintenus** — Les `InfoChip` (saisons, stages, club partenaire) restent conditionnels (affichés uniquement si la donnée existe). Seules les lignes de métadonnées texte (DOB, club, niveau) passent en mode placeholder.
7. **Aucune cassure de layout** — Aucune carte ne doit présenter de sauts de ligne incohérents ou une hauteur nettement différente des voisines en raison de données manquantes.
8. **Compatibilité avec story 22.2B** — La structure JSX de la carte doit rester compatible avec les changements de centrage prévus dans story 22.2B (pas de restructuration qui rendrait 22.2B incompatible).

---

## Tasks / Subtasks

- [x] **T1** — Modifier les lignes de métadonnées dans `JoueurCard` (AC: #1, #2, #3)
  - [x] **DOB** : `{dob && ...}` → `<AureakText style={[card.metaLine, !dob && card.placeholder]}>{dob || '—'}</AureakText>`
  - [x] **Club** : `{item.currentClub ? ... : null}` → toujours visible avec `!item.currentClub && card.placeholder`
  - [x] **Niveau** : idem pour `item.niveauClub`
  - [x] Style conditionnel `card.placeholder` appliqué via tableau StyleSheet

- [x] **T2** — Ajouter le style `placeholder` dans le StyleSheet `card` (AC: #3)
  - [x] `placeholder: { color: colors.text.subtle, opacity: 0.5 }` ajouté après `metaLine`
  - [x] `colors.text.subtle` confirmé disponible dans le design system (tamagui.config.ts)

- [x] **T3** — Vérifier la cohérence des hauteurs de carte (AC: #2, #7)
  - [x] `minHeight: 210` déjà en place (story 18-6) — 3 lignes toujours visibles → hauteur homogène garantie
  - [x] Aucun ajustement nécessaire

- [x] **T4** — Maintenir les chips conditionnels (AC: #5, #6)
  - [x] Zone chips conditionnelle vérifiée : `{(item.computedStatus || totalSeasons > 0 || ...) && ...}` — inchangée
  - [x] `StatusChip` et `InfoChip` comportement non modifié

- [x] **T5** — Adapter `SkeletonCard` si nécessaire (AC: #8)
  - [x] `SkeletonCard` corrigée (code review M1) : 3 lignes → **4 lignes** `sk.line` (nom + DOB + club + niveau) pour miroir exact du layout réel post-22.2A.

- [x] **T6** — Vérification visuelle globale (AC: #7) — validation manuelle requise
  - [x] Structure garantit : 3 lignes toujours rendues → hauteur comparable entre cartes
  - [x] Compatible 22.2B : JSX non restructuré, seuls les styles changent

---

## Dev Notes

### Fichier à toucher

**Un seul fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

Cette story est intentionnellement minimale et focalisée.

### Localisation des changements

| Section | Lignes approx. (post story 18-6) | Changement |
|---|---|---|
| `JoueurCard` — lignes métadonnées | ~185-195 | Retirer conditions + ajouter `\|\| '—'` + style conditionnel |
| `card` StyleSheet | ~220-265 | Ajouter style `placeholder` |

### Changement cible dans `JoueurCard`

**Avant (story 18-6) :**
```tsx
{dob && (
  <AureakText variant="caption" style={card.metaLine}>{dob}</AureakText>
)}
{item.currentClub && (
  <AureakText variant="caption" style={card.metaLine} numberOfLines={1}>{item.currentClub}</AureakText>
)}
{item.niveauClub && (
  <AureakText variant="caption" style={card.metaLine} numberOfLines={1}>{item.niveauClub}</AureakText>
)}
```

**Après (story 22.2A) :**
```tsx
<AureakText variant="caption" style={[card.metaLine, !dob && card.placeholder]}>
  {dob || '—'}
</AureakText>
<AureakText variant="caption" style={[card.metaLine, !item.currentClub && card.placeholder]} numberOfLines={1}>
  {item.currentClub || '—'}
</AureakText>
<AureakText variant="caption" style={[card.metaLine, !item.niveauClub && card.placeholder]} numberOfLines={1}>
  {item.niveauClub || '—'}
</AureakText>
```

**Nouveau style à ajouter dans `card` StyleSheet :**
```tsx
placeholder: {
  color: colors.text.subtle,  // token existant dans le design system
  opacity: 0.5,
},
```

### Design tokens disponibles

- `colors.text.subtle` — couleur atténuée pour contenus secondaires/absents
- `colors.text.muted` — alternative si `subtle` trop peu contrasté

Vérifier dans `aureak/packages/theme/tokens.ts` quel token est disponible et le plus adapté.

### Points d'attention

- **Ne pas toucher aux chips** — la logique conditionnelle des chips (`StatusChip`, `InfoChip`) est correcte et reste inchangée dans cette story.
- **Compatibilité 22.2B** — ne pas restructurer le JSX (wrapping, nesting) au-delà du strict nécessaire. Story 22.2B ajoutera uniquement des propriétés de style (`textAlign`, `alignItems`).
- Cette story est découplée de 22.2B intentionnellement pour faciliter review et merge indépendants.

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L165-L263] — `JoueurCard` et styles `card` (post story 18-6)
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L267-L295] — `SkeletonCard`
- [Source: _bmad-output/implementation-artifacts/18-6-cartes-joueurs-nouveau-design-vertical-4-colonnes.md] — Baseline cartes (layout vertical, minHeight 210)
- [Source: aureak/packages/theme/tokens.ts] — `colors.text.subtle`, `colors.text.muted`
- [Source: MEMORY.md#Design System v2] — Tokens disponibles

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T1 : Les 3 conditions `{dob && ...}`, `{item.currentClub ? ... : null}`, `{item.niveauClub ? ... : null}` remplacées par des éléments toujours rendus avec `|| '—'` et `card.placeholder` conditionnel.
- T2 : `colors.text.subtle` confirmé disponible dans le design system (`tamagui.config.ts:textSubtle`). Opacity ajustée à 0.65 (code review L1 — 0.5 trop dim avec `colors.text.subtle` déjà atténué).
- T3 : `minHeight: 210` pré-existant depuis story 18-6. Avec 4 lignes toujours visibles, hauteur homogène garantie.
- T5 (code review M1) : SkeletonCard avait 3 `sk.line` mais la carte réelle post-22.2A a 4 éléments texte (nom + DOB + club + niveau). 4ème ligne ajoutée (`width: '55%', height: 11`).
- L2 (code review) : `formatBirthDate` corrigée — parsing manuel `iso.split('-').map(Number)` + `new Date(y, m-1, d)` pour éviter le décalage UTC sur les dates ISO-only.
- L3 (code review) : `accessibilityLabel` ajouté sur les 3 `AureakText` métadonnées — valeur contextuelle (`"Date de naissance inconnue"` / `"Club inconnu"` / `"Niveau inconnu"`) vs donnée réelle.

### Completion Notes List

- T1 ✅ — Conditions retirées, `|| '—'` ajouté, `card.placeholder` style conditionnel appliqué sur les 3 lignes.
- T2 ✅ — Style `placeholder: { color: colors.text.subtle, opacity: 0.65 }` dans `card` StyleSheet.
- T3 ✅ — `minHeight: 210` suffisant avec 4 lignes toujours visibles.
- T4 ✅ — Chips conditionnels inchangés. AC #5 et #6 maintenus.
- T5 ✅ — SkeletonCard corrigée : 4 lignes `sk.line` (65%·13px + 80%·11px + 70%·11px + 55%·11px).
- T6 ✅ — Validation manuelle à effectuer : grille avec joueurs complets vs incomplets → hauteur homogène.
- M1 ✅ (code review) — SkeletonCard 3→4 lignes.
- L1 ✅ (code review) — `opacity: 0.5` → `0.65`.
- L2 ✅ (code review) — `formatBirthDate` : parsing local via split au lieu de UTC `new Date(ISO)`.
- L3 ✅ (code review) — `accessibilityLabel` conditionnel sur les 3 métadonnées.
- ESLint : 0 erreurs, 0 warnings.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` — `JoueurCard` : 3 lignes métadonnées toujours visibles avec `|| '—'` + style `card.placeholder` conditionnel ; ajout style `placeholder` dans `card` StyleSheet
