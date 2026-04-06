# UX Inspector — 2026-04-06

## Résumé

- Flux audités : 5
- Frictions HAUTE priorité (P1) : 3
- Frictions MOYENNE priorité (P2) : 3
- Incohérences : 4
- App vérifiée : ❌ http://localhost:8081 — app non démarrée (analyse statique uniquement)
- Note : rapport précédent disponible : `2026-04-05_ux-inspector.md` — le présent rapport approfondit les flux et ajoute les frictions non couvertes

---

## Frictions détectées

### ⚡ [UX - P1] Flux séance — Step 2 cumule trop de responsabilités

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Le Step 2 "Détails" agrège dans un seul écran : la sélection de méthodologie (tiles), le numéro d'entraînement dans le cycle (grille de 32 chips max pour Technique), le contenu pédagogique contextuel (GP Module+ENT, blocs Décisionnel, concept Technique stage), la sélection de coaches (lead + assistants), le terrain, et l'heure/durée. Un admin doit scroller significativement dans un seul "step" pour remplir jusqu'à 8 sous-sections. La `StepBar` affiche "Détails" mais ne refléte pas cette densité.
**Impact :** La perception de progression est faussée — l'admin pense être à l'étape 2/6 mais effectue réellement le travail cognitif d'une page entière. Sur des séances Décisionnelles (blocs + coaches + terrain), le Step 2 peut nécessiter 8-12 interactions avant de pouvoir avancer. Violation flagrante de "max 3 clics pour une action courante".
**Proposition :** Extraire la sélection coaches + terrain vers le Step 3 (renommer "Logistique"), et compresser Thèmes+Ateliers en une seule étape optionnelle — ce qui ramène à 4 steps cohérents : Contexte / Méthode / Logistique / Date.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### ⚡ [UX - P1] Fiche séance — double bouton "Retour" redondant en tête de page

**Flux concerné :** Flux 1 et 5 — Fiche séance et navigation
**Page :** `/seances/[sessionId]`
**Friction :** La fiche de séance affiche simultanément deux éléments de retour en tête de page :
1. Un breadcrumb "Séances / {date}" avec "Séances" cliquable (ligne 1693)
2. Un bouton "← Séances" juste en dessous (ligne 1715)

Les deux déclenchent `router.push('/seances')`. L'admin voit deux contrôles identiques sur moins de 40px de hauteur verticale.
**Impact :** Confusion cognitive sur lequel utiliser. Surcharge visuelle en tête de page. Incohérent avec les autres fiches de l'app (clubs, joueurs) qui n'ont qu'un seul pattern de retour.
**Proposition :** Supprimer le bouton "← Séances" (ligne 1714-1717) et conserver uniquement le breadcrumb cliquable, en alignant sur le pattern standard des autres fiches de l'app.
**Fichier :** `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

---

### ⚡ [UX - P1] Page Clubs — recherche non temps-réel, même pattern cassé que Joueurs

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs`
**Friction :** La page Clubs utilise le même pattern que la page Joueurs (rapport du 2026-04-05) : champ `searchInput` séparé de `search`, avec un bouton "Chercher" obligatoire (`handleSearch = () => setSearch(searchInput.trim())`). L'admin doit taper le nom puis cliquer "Chercher" ou appuyer Entrée — pas de recherche en temps réel.
**Impact :** Parcours Ajouter joueur à club : Dashboard → Clubs (1 clic sidebar) → taper nom club → clic "Chercher" → ouvrir fiche → section PlayerPicker → taper nom joueur → clic résultat = **7 interactions** pour une action courante. Le PlayerPicker dans la fiche club est lui temps-réel (debounce implicite via `useMemo`), créant une incohérence au sein du même flux.
**Proposition :** Remplacer `handleSearch` par un `useEffect` avec debounce 350ms sur `searchInput` (pattern déjà présent dans le guest search de `[sessionId]/page.tsx` ligne 1376), supprimer le bouton "Chercher" et la variable `search` séparée.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/page.tsx`

---

### ⚡ [UX - P2] Fiche séance — état de chargement régressif (texte seul, pas de skeleton)

**Flux concerné :** Flux 1 — Consulter une séance
**Page :** `/seances/[sessionId]`
**Friction :** Quand `loading === true`, la page affiche uniquement `<AureakText>Chargement…</AureakText>` centré (lignes 1629-1635). Aucun skeleton, aucune silhouette de la future mise en page. À titre de comparaison, la page Joueurs dispose de `SkeletonCard` et `PremiumSkeletonCard`, et la page Clubs dispose de `ClubCardSkeleton`. La fiche séance est la plus consultée de l'app après le dashboard.
**Impact :** Perception de lenteur accrue (layout shift brutal au chargement), incohérence visuelle forte avec les pages liste qui ont toutes des skeletons. Sur connexion lente, l'admin voit une page blanche avec un seul mot pendant 1-3 secondes.
**Proposition :** Créer un `SessionDetailSkeleton` composé de : un bloc header dark (MatchReportHeader placeholder), 3 cards grises empilées de hauteurs variables, en cohérence avec le pattern `ListRowSkeleton` déjà importé dans la fiche mais non utilisé ici.
**Fichier :** `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

---

### ⚡ [UX - P2] Navigation sidebar — 8 items dans "Administration" difficiles à scanner

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/_layout.tsx`
**Friction :** Le groupe "Administration" comporte 8 items (Utilisateurs, Accès temporaires, Tickets support, Journal d'audit, Calendrier scolaire, Anomalies, Messages coaches, Permissions grades). C'est le groupe le plus chargé de la sidebar, et il regroupe des actions très rarement utilisées (Calendrier scolaire, Anomalies, Permissions grades) avec des actions plus fréquentes (Utilisateurs, Messages coaches). L'absence de hiérarchie visuelle force l'admin à scanner toute la liste.
**Impact :** Temps de navigation accru pour les items Administration rares. La sidebar est actuellement à 6 groupes — le groupe Administration représente 30% de tous les items de navigation. Story 63.1 (refactoring sidebar) est ready-for-dev mais non encore livrée.
**Proposition :** Dans l'attente de la Story 63.1, scinder "Administration" en deux sous-groupes : "Équipe" (Utilisateurs, Accès temporaires, Tickets, Messages) et "Système" (Audit, Calendrier, Anomalies, Permissions) — 2 lignes de code dans `_layout.tsx`.
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx`

---

### ⚡ [UX - P2] Fiche club — 3 sections joueurs sans distinction visuelle forte entre "liaison directe" et "via annuaire"

**Flux concerné :** Flux 3 — Consulter la fiche d'un club
**Page :** `/clubs/[clubId]`
**Friction :** La fiche club affiche trois listes de joueurs distincts : "Joueurs actuellement" (liaison directe `current`), "Joueurs affiliés" (liaison directe `affiliated`), et les `annuairePlayers` (liaison implicite via `club_directory_id`). Les deux premières listes ont un PlayerPicker avec bouton "Retirer". La troisième (`AnnuairePlayerRow`) est read-only et labellisée "via annuaire" en italique grisé de 10px. Un admin non-technique peut facilement chercher le bouton "Retirer" sur une ligne "via annuaire" et ne pas comprendre pourquoi il est absent.
**Impact :** Confusion sur le modèle de liaison. L'admin peut contacter le support pour signaler un bug ("je ne peux pas retirer ce joueur") alors que le comportement est intentionnel. L'absence d'explication contextuelle sur la liaison implicite (via `club_directory_id`) est une friction de compréhension.
**Proposition :** Ajouter une icône d'info `ⓘ` ou une note courte "Ces joueurs sont liés automatiquement via leur club enregistré dans l'annuaire. Modifier via la fiche joueur." au-dessus de la section annuaire, pour distinguer explicitement les 3 sources.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance (groupe existant, simple) | 10+ | ~100s | Step 2 surchargé — méthode + numéro + coaches + terrain dans un seul écran |
| Trouver un joueur | 3 + validation manuelle | ~20s | Recherche non temps-réel sur Joueurs et Clubs |
| Ajouter joueur à club | 7 | ~25s | Recherche club non temps-réel + navigation vers fiche avant PlayerPicker |
| Consulter fiche séance | 2 | ~8s | Loading state régressif (texte seul), double bouton retour |
| Navigation générale | — | — | 8 items dans "Administration" — groupe surchargé sans hiérarchie |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/seances/[sessionId]` | Skeleton de chargement (structure prévisible) | Layout shift brutal — incohérence avec toutes les pages liste |
| `/seances/new` (Step 2) | Indicateur de progression interne à l'étape | Admin ne sait pas combien de sous-sections restent dans l'étape |
| `/clubs` (liste) | État vide filtré sans bouton "Réinitialiser les filtres" | Admin bloqué si aucun club ne correspond, doit deviner comment repartir |
| `/seances/new` (Step 1) | Message si 0 groupes après sélection d'implantation | L'admin voit un dropdown vide sans suggestion de créer un groupe |

---

## Incohérences de patterns

**1. Recherche temps-réel vs bouton "Chercher" obligatoire**
- `/seances/[sessionId]` — guest search : debounce 300ms automatique ✅
- `/clubs/[clubId]` — PlayerPicker : recherche immédiate via `useMemo` ✅
- `/children` — recherche globale : bouton "Chercher" obligatoire ❌
- `/clubs` — recherche globale : bouton "Chercher" obligatoire ❌
- Recommandation : unifier vers le pattern debounce (≥ 3 chars / 350ms) sur toutes les listes.

**2. Bouton retour dupliqué sur la fiche séance uniquement**
- `/clubs/[clubId]` : breadcrumb seul ✅
- `/children/[childId]` : bouton "← Retour" seul ✅
- `/seances/[sessionId]` : breadcrumb cliquable + bouton "← Séances" séparé ❌
- Recommandation : supprimer le bouton `← Séances` (lignes 1714-1717), conserver le breadcrumb.

**3. Skeleton de chargement présent sur les listes, absent sur les fiches de séance**
- `/children` : `SkeletonCard` et `PremiumSkeletonCard` ✅
- `/clubs` : `ClubCardSkeleton` ✅
- `/seances/[sessionId]` : texte `Chargement…` seul ❌
- `/stages/[stageId]` : non vérifié — risque identique
- Recommandation : créer un `SessionDetailSkeleton` sur le modèle des skeletons de liste.

**4. Confirmation suppression inconsistante (déjà identifiée 2026-04-05 — non corrigée)**
- `/clubs/[clubId]` : `ConfirmDialog` ✅
- `/methodologie/seances` : `ConfirmDialog` ✅
- `/stages/[stageId]` : pas de `ConfirmDialog` sur journées/blocs ❌
- Status : friction P1 identifiée le 2026-04-05, non traitée — toujours active.

---

## Recommandations prioritaires

1. **Supprimer le bouton "← Séances" redondant dans `/seances/[sessionId]`** — 1 suppression de 4 lignes, zéro risque de régression, impact visuel immédiat sur la page la plus consultée de l'app opérationnelle.
2. **Unifier la recherche temps-réel sur `/clubs/page.tsx` et `/children/index.tsx`** — copier le pattern debounce 350ms déjà implémenté dans la guest search de la fiche séance. Réduit le flow "trouver un club" de 7 à 6 interactions.
3. **Ajouter un skeleton de chargement sur la fiche séance** — le `ListRowSkeleton` est déjà importé dans `[sessionId]/page.tsx` mais non utilisé pour le state de loading global. Substituer le texte `Chargement…` par 3 blocs skeleton.
4. **Scinder le groupe "Administration" en deux** dans `_layout.tsx` — 2 lignes de changement, améliore la lisibilité de la sidebar en attendant la Story 63.1 (refactoring complet).
5. **Ajouter une note explicative sur la section "via annuaire" dans la fiche club** — éviter les tickets support sur le comportement intentionnel des liaisons implicites.
