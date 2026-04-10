# UX Inspector — 2026-04-08 (post-epic-75)

## Résumé

- Flux audités : 5
- Frictions HAUTE priorité (P1) : 4
- Frictions MOYENNE priorité (P2) : 4
- Incohérences : 3

---

## Frictions détectées

### [UX - P1] Créer une séance — 6 étapes, seuil de 3 clics dépassé

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Le formulaire de création de séance est découpé en 6 étapes (Contexte → Détails → Thèmes → Ateliers → Date → Résumé). Depuis le dashboard, il faut 2 clics pour atteindre la page, puis 5 à 6 interactions minimales pour passer l'étape 1 (implantation + groupe + "Suivant") et l'étape 2 (type de séance + coach principal + "Suivant"). Un admin crée plusieurs séances identiques chaque semaine.
**Impact :** 10–15 clics pour une création basique d'une séance hebdomadaire récurrente. La duplication de séance existe mais n'est pas mise en avant dans l'UI (toast discret uniquement).
**Proposition :** Ajouter un bouton "Dupliquer la séance" bien visible sur les cards de la vue liste/semaine, qui pré-remplit toutes les étapes et saute directement à l'étape Date.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`, `aureak/apps/web/app/(admin)/seances/page.tsx`

---

### [UX - P1] Recherche joueurs non instantanée — validation manuelle requise

**Flux concerné :** Flux 2 — Trouver un joueur et voir sa fiche
**Page :** `/children`
**Friction :** La recherche dans l'annuaire joueurs n'est pas live (pas de debounce). L'utilisateur doit soit appuyer sur Entrée, soit cliquer le bouton "Rechercher". `searchInput` et `search` sont deux states séparés, `setSearch` n'est appelé que via `handleSearch`. Avec 678 joueurs dans l'annuaire, ce pattern ralentit la découverte.
**Impact :** L'utilisateur tape un nom, rien ne se passe, il ne comprend pas pourquoi la liste ne filtre pas. Nécessite une action supplémentaire non-intuitive pour des apps web modernes.
**Proposition :** Ajouter un `useEffect` avec debounce 300ms sur `searchInput` pour déclencher `setSearch` automatiquement, tout en conservant l'action immédiate via Entrée.
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx` (lignes 976–1083)

---

### [UX - P1] Champs date stages en texte libre — format AAAA-MM-JJ non natif

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/new`, `/stages/[stageId]`
**Friction :** Les champs de date (date de début, date de fin d'un stage, et date d'ajout d'une journée) sont des `TextInput` avec placeholder `AAAA-MM-JJ`. Aucun sélecteur de date natif. Le reste de l'app (exports, dashboard comparison, users/new) utilise `<input type="date">` HTML natif qui affiche un date-picker.
**Impact :** L'admin doit mémoriser et saisir le format manuellement. Risque d'erreur de format (MM/JJ au lieu de MM-JJ), validation silencieuse si le format est incorrect.
**Proposition :** Remplacer les `TextInput` pour les champs date dans stages/new.tsx et stages/[stageId]/page.tsx par `<input type="date">` (déjà utilisé dans exports/index.tsx et dashboard/comparison.tsx).
**Fichier :** `aureak/apps/web/app/(admin)/stages/new.tsx` (lignes 121–135), `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` (ligne 820)

---

### [UX - P1] Copyright 2025 affiché sur la page de login en 2026

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/login`
**Friction :** Le footer de la page de login affiche "© 2025 Aureak · Tous droits réservés" alors que nous sommes en 2026. Visible à chaque connexion par tous les utilisateurs.
**Impact :** Impression de maintenance négligée, crédibilité entamée pour une plateforme premium.
**Proposition :** Remplacer la chaîne statique par `© ${new Date().getFullYear()} Aureak · Tous droits réservés` pour un calcul dynamique.
**Fichier :** `aureak/apps/web/app/(auth)/login.tsx` (ligne 186)

---

### [UX - P2] Découvrabilité de "Ajouter un joueur à un club" — PlayerPicker toujours visible sans indication

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs/[clubId]`
**Friction :** Le `PlayerPicker` (champ de recherche pour lier un joueur) est affiché en bas de chaque section "Joueurs actuels" et "Joueurs affiliés" sans label action clair. L'utilisateur doit scroller jusqu'en bas de la liste existante pour voir le champ de recherche. Sur mobile ou avec de longues listes, il est hors-champ à l'arrivée sur la page.
**Impact :** L'action principale de la page (ajouter un joueur) n'est pas visible sans scroller. 3 clics pour atteindre la page + scroll non prévisible = friction inattendue.
**Proposition :** Ajouter un bouton flottant ou un bouton "sticky" "+ Lier un joueur" en haut de chaque section qui scroll ou focus automatiquement sur le PlayerPicker.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (lignes 960–1002)

---

### [UX - P2] Aucun bouton retour visible depuis les séances en vue Mois et Année

**Flux concerné :** Flux 1 — Créer une séance / Flux 5 — Navigation générale
**Page :** `/seances` (vue month/year)
**Friction :** En vue Mois et Année, les composants `MonthView` et `YearView` sont délégués à des sous-composants. L'état vide pour ces vues ne déclenche pas le bloc `emptyState` avec le CTA "Créer une séance" (la condition `period !== 'month' && period !== 'year'` l'exclut explicitement, ligne 808). Ces deux vues ont donc zéro état vide avec CTA.
**Impact :** Si aucune séance n'est planifiée sur le mois ou l'année affichés, l'admin voit un calendrier vide sans indication ni action suggérée.
**Proposition :** Implémenter un état vide dans `MonthView` et `YearView` avec message "Aucune séance ce mois" + bouton "+ Créer une séance".
**Fichier :** `aureak/apps/web/app/(admin)/seances/page.tsx` (ligne 808), `aureak/apps/web/app/(admin)/seances/_components/MonthView.tsx`, `aureak/apps/web/app/(admin)/seances/_components/YearView.tsx`

---

### [UX - P2] Raison du blocage du bouton "Suivant" (step 2) non expliquée quand contentRef invalide

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new` (step 2)
**Friction :** En step 2, si `contentRefValid` est false (ex. : séance Décisionnel sans aucun titre de bloc), le bouton "Suivant" est grisé mais aucun message global n'indique pourquoi. Le message d'erreur "Le concept est requis pour les séances stage" (ligne 1570) n'apparaît que pour le cas Technique/stage, pas pour les séances Décisionnel.
**Impact :** L'admin se retrouve bloqué avec un bouton "Suivant" inactif sans savoir quelle validation échoue, surtout si le formulaire est long et le champ problématique hors du viewport.
**Proposition :** Ajouter un message inline au-dessus du bouton "Suivant" du step 2 listant les validations manquantes : "Coach principal requis" et/ou "Contenu pédagogique incomplet".
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx` (lignes 1772–1779)

---

### [UX - P2] Incohérence navigation : `router.back()` vs `router.push('/seances')` mélangés

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/seances/new`, `/seances/[sessionId]`
**Friction :** Le bouton retour de `seances/new.tsx` utilise `router.back()` (ligne 1260), mais la page de détail d'un stage `stages/[stageId]/page.tsx` utilise `router.push('/stages')` (ligne 701). Dans certains cas (navigation depuis search, deep link), `router.back()` peut renvoyer hors de l'app ou vers une page précédente non pertinente.
**Impact :** Comportement du bouton retour imprévisible selon le chemin d'arrivée. Perte de confiance dans le bouton retour.
**Proposition :** Standardiser : utiliser `router.push('/seances')` dans `seances/new.tsx` et `router.push('/[section]')` dans toutes les pages détail, réserver `router.back()` uniquement pour les modales/overlays.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx` (ligne 1260), `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (ligne 385)

---

## Mesures par flux

| Flux | Nb clics minimum | Estimation temps | Friction principale |
|------|-----------------|-----------------|---------------------|
| Créer une séance | 10–12 | ~90s | 6 étapes, duplication non mise en avant |
| Trouver un joueur | 3 | ~15s | Recherche non live, validation manuelle |
| Ajouter joueur à club | 4 + scroll | ~20s | PlayerPicker hors viewport |
| Consulter planning stage | 3 | ~10s | Saisie date texte libre AAAA-MM-JJ |
| Navigation générale | — | — | `router.back()` imprévisible, copyright périmé |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/seances` (vue mois) | État vide avec CTA | Admin voit calendrier vide sans action suggérée |
| `/seances` (vue année) | État vide avec CTA | Idem — aucune guidance |
| `/seances/new` (step 2) | Message global de validation bloquante | Admin bloqué sans explication |

---

## Incohérences de patterns

1. **Saisie de date** : `TextInput` (AAAA-MM-JJ) dans stages/new + stages/[id] vs `<input type="date">` dans exports, dashboard comparison, users/new. Deux patterns pour la même action.
2. **Bouton retour** : `router.back()` dans seances/new et children/[childId] vs `router.push('/section')` dans stages/[stageId]. Comportement différent selon la page.
3. **Recherche** : Recherche live dans le `PlayerPicker` (clubs/[id]) et la `SearchableSelect` (seances/new) vs recherche validée par Entrée/bouton dans children/index. Trois patterns différents pour une action de recherche.

---

## Recommandations prioritaires

1. **Ajouter debounce 300ms sur la recherche joueurs** (`children/index.tsx`) — impact maximal, 1 ligne de code effective.
2. **Remplacer TextInput date par `<input type="date">`** dans stages/new.tsx et stages/[stageId]/page.tsx — consistance immédiate avec le reste de l'app.
3. **Corriger copyright 2025 → dynamique** dans login.tsx — correction 30 secondes.
4. **Ajouter message validation inline au bouton "Suivant" step 2** de seances/new.tsx — réduit les demandes support.
5. **Créer bouton "Dupliquer la séance" visible** sur les cards séances — impact fort sur la fréquence d'usage du flux le plus courant.
