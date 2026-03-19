# Story 22.3 : Cartes joueurs — Refonte visuelle avancée

Status: done

**Epic :** 22 — Admin Joueurs : Qualité de saisie & UX
**Dépendances :** Story 22.2A (données manquantes — done) + Story 22.2B (centrage — done)

> ⚠️ **STORY INTENTIONNELLEMENT OUVERTE**
> La solution finale n'est pas encore définie. Cette story est un point d'entrée pour un brainstorming approfondi avec le Product Owner avant toute implémentation. Elle ne doit PAS être développée sans avoir d'abord répondu aux questions en section "Questions PO".

---

## Story

En tant qu'administrateur Aureak,
je veux que les cartes joueurs soient visuellement beaucoup plus soignées et attrayantes,
afin d'avoir une expérience d'administration élégante et représentative du niveau de qualité premium d'Aureak.

---

## Contexte & Motivation

Les stories 22.2A et 22.2B apportent des corrections de robustesse et d'alignement. Elles stabilisent la baseline visuelle. Mais l'objectif final est plus ambitieux : rendre les cartes **visuellement excellentes**, à la hauteur d'une application premium.

L'enjeu est triple :
- **Esthétique** : les cartes doivent être belles, modernes, et donner envie
- **Hiérarchie de l'information** : les données importantes doivent ressortir immédiatement
- **Identité visuelle** : cohérence parfaite avec le design system Aureak Light Premium DA (beige, blanc, or)

---

## Périmètre pressenti — À confirmer en brainstorming

Les axes d'amélioration suivants sont identifiés comme pertinents, mais **aucun n'est décidé**. Chaque axe devra être validé, rejeté ou affiné lors du brainstorming PO.

| Axe | Description | Décidé ? |
|---|---|---|
| **Image / avatar** | Taille, style du masque (cercle/carré arrondi), bordure dorée, ombre, fallback initiales | ❓ |
| **Typographie** | Hiérarchie nom/infos, poids de police, tailles, couleurs | ❓ |
| **Badges / chips** | Style, placement, taille, couleurs, icônes éventuelles | ❓ |
| **Spacing** | Padding interne, gap entre éléments, respiration générale | ❓ |
| **Ombres** | Niveau d'ombre (sm/md/lg), couleur, blur, ombre dorée pour cartes spéciales | ❓ |
| **Bordures** | Épaisseur, couleur, style (solid/gradient/accent gold) | ❓ |
| **Radius** | Arrondis des coins (radius.cardLg = 24 ?) | ❓ |
| **Hover / interactions** | Effet au survol (scale, shadow+, border gold), transitions | ❓ |
| **Responsive** | Comportement à différentes largeurs, nombre de colonnes | ❓ |
| **Couleur de fond de carte** | Blanc pur vs légèrement teinté vs variante gold pour cartes spéciales | ❓ |

---

## Questions PO — À répondre avant implémentation

> Ces questions doivent être posées et répondues lors d'un brainstorming structuré avant que le développement commence.

1. **Avatar / photo** : Quelle taille idéale pour la photo ? Doit-il y avoir une bordure (gold ?) ou un ring autour de la photo ? Le fallback initiales doit-il être stylisé différemment (fond dégradé ? initiales en or ?)

2. **Informations prioritaires** : Quelles sont les 2-3 informations les plus importantes à mettre en avant visuellement ? (Nom ? Statut académique ? Club ? Catégorie d'âge ?)

3. **Badge de statut** : Le badge de statut (Académicien, Nouveau, Ancien…) doit-il être plus grand et plus proéminent ? Doit-il occuper une position différente sur la carte (en haut en bandeau ? en bas ?)

4. **Effet hover** : Souhaites-tu un effet au survol de la souris ? (scale légère, ombre plus prononcée, apparition d'une bordure gold, transition de couleur…)

5. **Carte dark vs light** : Veux-tu garder le fond light actuel (`colors.light.surface`) pour toutes les cartes, ou explorer des variantes (carte gold pour les académiciens, carte sombre pour certains statuts…) ?

6. **Référence visuelle** : As-tu des inspirations UI (Dribbble, Linear, Notion, une app similaire) à partager comme référence stylistique ? Même une capture d'écran approximative aide à cadrer la vision.

7. **Grille** : Veux-tu changer le nombre de colonnes (actuellement 4-5 colonnes auto), ou conserver cela ?

8. **Responsive mobile** : La refonte visuelle doit-elle aussi s'appliquer sur l'application mobile (Expo), ou est-elle ciblée uniquement sur le web admin pour l'instant ?

---

## Acceptance Criteria (provisoires — à remplacer après brainstorming)

> Ces critères sont des placeholders. Ils devront être réécrits avec des critères vérifiables concrets après le brainstorming PO.

1. **[À confirmer]** Les cartes ont un niveau de finition visuelle nettement supérieur à la baseline des stories 22.2A/22.2B.
2. **[À confirmer]** La hiérarchie de l'information est claire : l'information la plus importante est immédiatement identifiable.
3. **[À confirmer]** Les cartes respectent le design system Aureak Light Premium DA (tokens `colors.light.*`, `shadows.*`, `radius.*`).
4. **[À confirmer]** Les cartes sont cohérentes et lisibles sur toutes les résolutions supportées.
5. **[À confirmer]** Les interactions (hover, focus) sont fluides et confèrent une sensation premium.

---

## Risques & Points d'attention

| Item | Description |
|---|---|
| **Risque scope** | Sans cadrage précis, la refonte visuelle peut dériver vers un scope trop large. Un brainstorming structuré est indispensable. |
| **Risque cohérence** | Des changements visuels profonds sur les cartes joueurs peuvent créer des incohérences avec d'autres sections (cartes clubs, etc.). Penser à l'impact systémique. |
| **Risque performance** | Des effets d'ombre/gradient lourds peuvent dégrader les performances de rendu pour une grille de 600+ joueurs. Tester avec un dataset complet. |
| **Risque tokens** | Si de nouveaux tokens sont créés dans `packages/theme/tokens.ts`, ils doivent être ajoutés proprement et documentés pour ne pas créer de dette technique. |

---

## Prochaines étapes — Processus recommandé

1. **Brainstorming PO** — Répondre aux 8 questions de la section "Questions PO"
2. **Référence visuelle** — Fournir une inspiration UI ou une direction stylistique claire
3. **Affiner les ACs** — Convertir les placeholders en critères d'acceptation réels et vérifiables
4. **Évaluer le découpage** — Selon la scope confirmée, cette story peut être découpée en :
   - `22.3A` — Améliorations typographie & spacing (non-breaking)
   - `22.3B` — Nouveau design avatar/photo
   - `22.3C` — Interactions hover & animations
   - *(ou tout autre découpage qui fait sens)*
5. **Implémenter** — Seulement après validation du PO sur les AC finaux

---

## Dev Notes (préliminaires)

> Cette section sera complétée après le brainstorming PO. Les éléments ci-dessous sont des indications générales, non des instructions de développement.

### Fichiers pressentis (non confirmés)

| Fichier | Raison |
|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | `JoueurCard`, `SkeletonCard`, styles `card` |
| `aureak/packages/theme/tokens.ts` | Si de nouveaux tokens sont requis |
| `aureak/packages/ui/` | Si des composants réutilisables sont créés |

### Tokens design disponibles (à exploiter)

Depuis `aureak/packages/theme/tokens.ts` (Design System v2 Light Premium DA) :
- `colors.light.primary` (#F3EFE7) — fond beige principal
- `colors.light.surface` (#FFFFFF) — fond card blanc
- `colors.accent.gold` — couleur or premium
- `colors.accent.goldLight` (#D6C98E) — or clair
- `shadows.sm / shadows.md / shadows.lg / shadows.gold` — niveaux d'ombre
- `radius.cardLg: 24` — arrondi fort
- `transitions.fast / transitions.normal` — durées de transition
- `colors.border.gold / colors.border.goldSolid` — bordures dorées

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx] — `JoueurCard` baseline (post 22.2A + 22.2B)
- [Source: aureak/packages/theme/tokens.ts] — Tous les design tokens disponibles
- [Source: MEMORY.md#Design System v2] — Palette et composants Aureak
- [Source: _bmad-output/implementation-artifacts/22-2a-cartes-joueurs-donnees-manquantes.md] — Story 22.2A (baseline)
- [Source: _bmad-output/implementation-artifacts/22-2b-cartes-joueurs-centrage-harmonisation.md] — Story 22.2B (baseline)

---

## Dev Agent Record

### Agent Model Used

(À compléter après brainstorming PO)

### Debug Log References

### Completion Notes List

### File List
