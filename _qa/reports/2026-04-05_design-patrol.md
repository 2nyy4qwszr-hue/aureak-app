# Design Patrol — 2026-04-05

> Agent : Design Patrol autonome
> App : http://localhost:8082 (status 200 ✅)
> Référence : `_agents/design-vision.md` — 12 principes + 6 anti-patterns

---

## Résumé

- Pages scannées : 7 (dashboard, children/joueurs, séances, stages, clubs, methodologie/seances, presences)
- BLOCKER détectés : 3
- WARNING détectés : 6
- Pages conformes : 0 (toutes ont au moins 1 warning)

---

## Dérives par page

### /dashboard

🔴 **BLOCKER** — Bento grid à colonnes égales (non asymétrique)
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`, ligne 53
→ Observé : `grid-template-columns: repeat(3, 1fr)` — 3 colonnes de 388px chacune
→ Attendu : `1.5fr / 1fr / 1.15fr` asymétrique + rangées `1fr / 1fr / 0.75fr` selon `design-vision.md` §Dashboard Admin

🔴 **BLOCKER** — Absence de hero tile dark
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
→ Observé : Toutes les tiles ont fond `#FFFFFF` — aucune hero tile avec fond `#2A2827` + photo gardien + overlay gradient + stats gold
→ Attendu : Tile col 1 rows 1–2 = fond `#2A2827`, photo gardien opacity 0.55, gradient bas, badge gold, headline blanc 28px weight 900

⚠️ **WARNING** — Fond principal incorrect (`#F2F2F2` au lieu de `#F0EBE1`)
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (style global wrapper Expo)
→ Observé : `background-color: rgb(242, 242, 242)` sur le root container
→ Attendu : `#F0EBE1` (beige chaud validé) — le content area beige `#F3EFE7` est correct lui

⚠️ **WARNING** — Erreur console : getImplantationStats HTTP 400
→ Fichier : `aureak/packages/api-client/src/` (appel stats implantation)
→ Observé : `[dashboard] getImplantationStats error: [object Object]` + HTTP 400
→ Attendu : Zéro erreur JS — à investiguer côté API/Supabase

---

### /children (Joueurs)

✅ Cards joueurs style FUT conformes (background-card.jpg, badges, stats, nom uppercase)
✅ Montserrat partiellement chargé pour les noms de joueurs (cards)

⚠️ **WARNING** — Polices Rajdhani + Geist encore actives sur toute l'UI
→ Fichier : `aureak/packages/theme/src/tamagui.config.ts`, lignes 88–126 + 175–178
→ Observé : `fonts.heading = rajdhaniFont`, `fonts.body = geistFont` — Rajdhani SemiBold et Geist Regular chargés et appliqués
→ Attendu : `Montserrat` pour heading + body (décision Story 45.1)
→ Note : Montserrat est partiellement présent (cards joueurs, clubs) mais coexiste avec Rajdhani/Geist sur tous les labels UI système

⚠️ **WARNING** — Absence de transitions hover sur les cards joueurs
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` ou composant card joueur
→ Observé : `transition: none` sur les tiles — pas d'animation au survol
→ Attendu : `transitions.fast` (150ms) minimum sur hover selon design-vision Principe 12

---

### /seances

✅ Fond content area : `rgb(243, 239, 231)` = `#F3EFE7` ✅
✅ Pas de backdrop-filter ni glassmorphism
✅ Pas de dégradé violet/bleu

⚠️ **WARNING** — Polices Rajdhani + Geist (problème global — voir ci-dessus)
→ Fichier : `aureak/packages/theme/src/tamagui.config.ts`

⚠️ **WARNING** — Vue calendrier vide sans empty state illustré
→ Fichier : `aureak/apps/web/app/(admin)/seances/index.tsx` ou composant calendrier
→ Observé : Calendrier Avril 2026 vide, aucune indication visuelle ni illustration d'incitation
→ Attendu : Empty state avec picto ou message d'incitation à créer une séance

---

### /stages

🔴 **BLOCKER** — Texte blanc sur fond gold très clair (badges de statut)
→ Fichier : `aureak/apps/web/app/(admin)/stages/index.tsx` (badges TERMINÉ / PLANIFIÉ)
→ Observé : `color: rgb(255, 255, 255)` sur fond `rgba(193, 172, 92, 0.13)` (gold à 13% opacité ≈ fond quasi-blanc)
→ Attendu : Texte `#8B7830` (gold dark) ou `#1A1A1A` sur fond gold clair — jamais blanc sur fond quasi-transparent

✅ Layout liste conforme (sous-page)
✅ Cards stages avec shadow et border-radius ≤ 24px
✅ Filtres de statut avec pills fonctionnelles

---

### /clubs

✅ Cards clubs avec background-card-club.jpg, logos dans cercle gold — style visuellement premium ✅
✅ Fond content area beige `#F3EFE7` ✅
✅ Pas de backdrop-filter
✅ Montserrat chargé pour les noms de clubs

⚠️ **WARNING** — `border-radius: 70px` sur conteneurs de logos clubs
→ Fichier : `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`, ligne 296 (`CIRCLE_OUTER / 2 = 70px`)
→ Observé : `border-radius: 70px` sur le cercle décoratif gold (`CIRCLE_OUTER = 140px`)
→ Règle : max `radius.cardLg` = 24px. Exception visuellement justifiée pour un cercle décoratif pur.
→ Action recommandée : documenter comme exception décorée ou utiliser `borderRadius: '50%'` explicitement

---

### /methodologie/seances (Entraînements pédagogiques)

✅ Fond content area beige ✅
✅ Cards de séances avec shadow et radius corrects
✅ Pills de méthodes colorées (Goal and Player, Technique, etc.)
✅ Pas de backdrop-filter

⚠️ **WARNING** — Polices Rajdhani + Geist (problème global)
→ Fichier : `aureak/packages/theme/src/tamagui.config.ts`

---

### /presences (Dashboard Présences)

✅ Fond content area beige ✅
✅ Layout liste séances avec shadow ✅
✅ Pas d'erreur console

⚠️ **WARNING** — UUIDs bruts affichés au lieu des noms de séances
→ Fichier : `aureak/apps/web/app/(admin)/attendance/index.tsx` (ou composant sessions list)
→ Observé : `610ac8c9-47be-4340-b5b3-873683d9d031` affiché comme titre de séance
→ Attendu : Nom de la séance ou date formatée

---

## Analyse typographique transversale (BLOCKER groupé)

**Problème global** — Config Tamagui non migrée vers Montserrat :

```typescript
// aureak/packages/theme/src/tamagui.config.ts — lignes 175–178
fonts: {
  heading: rajdhaniFont,   // doit devenir montserratFont
  body   : geistFont,      // doit devenir montserratFont
}
```

Les tokens `tokens.ts` déclarent bien `Montserrat` (display/heading/body) depuis Story 45.1, mais `tamagui.config.ts` n'a jamais été mis à jour. Toute l'UI admin utilise Rajdhani (heading) et Geist (body) — Montserrat n'apparaît que dans les composants l'important explicitement (ClubCard, PlayerCard).

**Impact** : 7/7 pages scannées.

---

## État des 6 anti-patterns design-vision

| Anti-pattern | Statut | Pages concernées |
|---|---|---|
| FLAT DESIGN | ✅ Absent — shadows présentes partout | — |
| DARK DOMINANT | ✅ Absent — sidebar dark seulement | — |
| SURCHARGE D'INFO | ✅ OK — bonne aération générale | — |
| CORPORATE/FORMEL | ✅ OK — cards visuelles premium | — |
| RONDS SUR TERRAIN | N/A — module terrain pas encore implémenté | — |
| CHEAP/INACHEVÉ | ⚠️ Partiel — badges statut stages blanc sur fond clair | /stages |

---

## Actions recommandées

| Priorité | Page | Fichier | Action |
|---|---|---|---|
| P1 | GLOBAL | `aureak/packages/theme/src/tamagui.config.ts` | Créer `montserratFont` + remplacer `heading`/`body` dans `createTamagui` |
| P1 | /stages | `aureak/apps/web/app/(admin)/stages/index.tsx` | Corriger couleur texte badges statut : `#8B7830` sur fond gold clair, pas blanc |
| P1 | /dashboard | `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Grille asymétrique `1.5fr 1fr 1.15fr` + hero tile `#2A2827` col 1 rows 1–2 |
| P2 | /presences | `aureak/apps/web/app/(admin)/attendance/index.tsx` | Résoudre affichage UUID → nom de séance |
| P2 | /dashboard | API client | Investiguer erreur HTTP 400 sur `getImplantationStats` |
| P3 | /seances | Composant calendrier | Ajouter empty state illustré quand aucune séance dans la période |
| P3 | /children | Composant card joueur | Ajouter `transition: 150ms` sur hover |

---

## Pages conformes ✅

Aucune page n'est 100% conforme en raison du problème typographique global (Rajdhani/Geist au lieu de Montserrat).

**Pages les plus proches de la conformité :**
- `/methodologie/seances` — aucune dérive critique hors typo globale
- `/clubs` — visuellement très premium, cercle décoratif 70px borderline mais justifié

---

## Note sur les routes

Routes inexistantes testées (404 Expo) : `/groups`, `/profils`, `/tableau-de-bord`.
Routes admin actives : `/dashboard`, `/children`, `/seances`, `/stages`, `/clubs`, `/methodologie/seances`, `/presences`.
La page 404 Expo a un fond sombre système — hors scope app.

---

*Design Patrol — 2026-04-05 — Agent autonome*
*Référence : `_agents/design-vision.md` (mis à jour 2026-04-04)*
