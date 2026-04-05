# Story 52-8 — Card evolution animation tier upgrade

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P3
**Dépend de** : story-52-6 (header refacto), story-52-2 (PlayerTier)

---

## Story

En tant qu'admin, lorsque je modifie le statut académique d'un joueur depuis la fiche et que ce changement résulte en un upgrade de tier (ex : Prospect → Académicien), je veux voir une animation de "level up" (flip + flash or) accompagnée d'un toast de confirmation, afin de rendre l'acte de progression du joueur mémorable.

---

## Acceptance Criteria

1. **AC1 — Détection d'upgrade** : Un upgrade de tier est détecté quand le `computePlayerTier(joueur)` change vers un tier supérieur suite à une mise à jour du statut académie. L'ordre des tiers est : `Prospect < Académicien < Confirmé < Elite`.

2. **AC2 — Animation flip** : Sur Platform web, le composant affichant le tier (le badge tier dans le header ou la mini card de résumé) effectue une animation CSS `rotateY(0deg) → rotateY(90deg) → rotateY(0deg)` en 0.6s. Implémenté via injection `<style>` avec `@keyframes tierFlip`.

3. **AC3 — Flash or** : Simultanément au flip, un flash `background-color: rgba(193,172,92,0.3)` → `transparent` en 1.2s couvre toute la zone du header (overlay temporaire). Implémenté via `Animated.Value` opacity 0 → 0.8 → 0 en React Native `Animated`.

4. **AC4 — Toast niveau up** : Après l'animation, un toast `"⭐ Niveau up ! {NomJoueur} est maintenant {NouveauTier}"` s'affiche via `useToast()`, durée 4s. La couleur du toast correspond au nouveau tier.

5. **AC5 — Déclencheur précis** : L'animation ne se déclenche que sur un **upgrade** (Prospect→Académicien, Académicien→Confirmé, Confirmé→Elite). Un downgrade ou un changement sans upgrade de tier n'active pas l'animation.

6. **AC6 — Fallback mobile** : Sur Platform native, seul le toast est affiché (pas d'animation CSS). L'animation Animated.Value flash fonctionne sur les deux plateformes.

7. **AC7 — Une seule fois** : L'animation ne se rejoue pas si l'utilisateur recharge la page ou navigue et revient. Elle est déclenchée uniquement dans la session courante au moment de la sauvegarde.

---

## Tasks

- [x] **T1** — `prevTierRef`, `flashOpacity` ajoutés ; upgrade détecté après success
- [x] **T2** — `triggerLevelUpAnimation` : CSS flip + Animated flash + toast
- [x] **T3** — Flash overlay `Animated.View` dans header
- [x] **T4** — `TIER_ORDER` défini dans composant
- [x] **T5** — CSS `@keyframes tierFlip` injecté dynamiquement
- [x] **T6** — try/finally OK, `prevTierRef` mis à jour avant `setSavingEdit(true)`

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — animation level up |

---

## Notes techniques

- `Animated.Value` pour le flash est cross-platform (fonctionne natif + web).
- L'animation CSS flip est web-only (via `style` tag injection), d'où le guard `Platform.OS === 'web'`.
- `useToast` est déjà importé dans `page.tsx` — l'utiliser directement.
- Ne pas enchaîner l'animation sur le montage initial (quand le joueur charge pour la première fois) — uniquement sur le delta post-save.
