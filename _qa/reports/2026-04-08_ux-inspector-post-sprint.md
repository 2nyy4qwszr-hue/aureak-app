# UX Inspector — 2026-04-08

## Résumé

- Flux audités : 5 (Créer séance, Trouver joueur, Ajouter joueur à club, Planning stage, Navigation générale)
- Frictions HAUTE priorité (P1) : 3
- Frictions MOYENNE priorité (P2) : 7
- Incohérences : 3

---

## Frictions détectées

### [UX - P1] Redirections aléatoires lors de la navigation sidebar

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/_layout`
**Friction :** Un `useEffect` dans `_layout.tsx` (ligne 434) déclenche `router.replace('/(auth)/login')` si `role !== 'admin'` — ce guard s'exécute également pendant les re-renders où `isLoading` est encore `true` et `role` est momentanément `undefined`. Résultat observé : cliquer sur "Joueurs" navigue vers `/seances`, cliquer sur "Clubs" atterrit sur `/methodologie`, etc.
**Impact :** L'admin ne peut pas naviguer de manière fiable via la sidebar. Il faut saisir l'URL manuellement pour atteindre une section.
**Proposition :** Conditionner le guard : `if (!isLoading && role !== 'admin')` — le `isLoading` est déjà dans les dépendances mais la condition doit vérifier `!isLoading` en premier pour éviter le redirect pendant le chargement.
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx`

---

### [UX - P1] URL `/joueurs` = Unmatched Route 404

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/joueurs`
**Friction :** La section s'appelle "Joueurs" dans la sidebar et dans tous les intitulés UI, mais la route réelle est `/children`. Toute URL partagée, bookmarkée ou tapée intuitivement avec `/joueurs` retourne une page d'erreur Expo "Unmatched Route — Page could not be found".
**Impact :** Confusion majeure pour l'utilisateur, lien cassé si copié depuis la barre d'adresse, 0 récupération possible (pas de redirection automatique).
**Proposition :** Ajouter une redirection `children/index.tsx → /children` depuis `/joueurs`, ou renommer la route de `/children` à `/joueurs` pour aligner URL et label.
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

---

### [UX - P1] Splash screen déclenché sur chaque navigation inter-page

**Flux concerné :** Flux 1 — Créer une séance / Flux 5 — Navigation générale
**Page :** `/_layout` → `SplashScreen`
**Friction :** Le `SplashScreen` (écran noir AUREAK) s'affiche à chaque changement de page car `isAppReady` est réinitialisé au mount du layout. Délai minimum de 1,5s (`SPLASH_MIN_MS`) bloque la navigation.
**Impact :** Chaque clic dans la sidebar affiche un écran noir pendant 1–2 secondes. Temps total pour naviguer vers 5 sections = ~10s d'écrans noirs.
**Proposition :** Le `SplashScreen` ne doit s'afficher qu'au premier chargement de l'app (session fresh), pas à chaque re-mount du layout. Utiliser un flag global (`sessionStorage` ou module-level singleton) pour ne déclencher le splash qu'une seule fois par session.
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx`, `aureak/apps/web/app/(admin)/SplashScreen.tsx`

---

### [UX - P2] Double système de filtres redondants sur la page Joueurs

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/children`
**Friction :** Deux rangées de filtres distinctes avec des sémantiques qui se chevauchent : (1) chips "Tous / Prospect / Académicien / Confirmé / Elite" et (2) labels "STATUT : Tous / 2025-2026 / Nouveau / Ancien / Stage seul / Prospect". La catégorie "Prospect" apparaît dans les deux systèmes. Un troisième filtre "Filtres avancés ▼" s'y ajoute.
**Impact :** L'admin ne sait pas quelle rangée utiliser, risque d'appliquer des filtres contradictoires.
**Proposition :** Fusionner les deux rangées en un seul système de filtres : chips de statut académique + filtre saison dans la section "Filtres avancés".
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

---

### [UX - P2] CTA "Planifier →" sur les cards de stage = ambigu

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages`
**Friction :** Les cards de stage affichent uniquement "Planifier →" comme action. Ce label suggère une action de création/édition, pas de consultation. Pour un stage "TERMINÉ", "Planifier" n'a aucun sens. De plus, la card elle-même n'est pas cliquable — seul ce lien permet la navigation.
**Impact :** L'admin cherche à "voir le planning" du stage mais le label "Planifier" l'induit en erreur. Pour les stages terminés, l'action semble inappropriée.
**Proposition :** Renommer "Planifier →" en "Voir le planning →" pour les stages terminés/en cours, et "Planifier →" uniquement pour les stages à l'état planifié/brouillon. Rendre la card entière cliquable.
**Fichier :** `aureak/apps/web/app/(admin)/stages/index.tsx`

---

### [UX - P2] Double navigation retour sur la fiche joueur

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/children/[childId]`
**Friction :** La fiche joueur affiche à la fois "← Retour" (bouton) ET "Joueurs › Détail" (breadcrumb) dans la même zone header, les deux redirigeant vers la liste.
**Impact :** Redondance visuelle qui alourdit le header ; le breadcrumb n'apporte pas d'information supplémentaire (pas de sous-pages intermédiaires à naviguer).
**Proposition :** Conserver uniquement le breadcrumb "Joueurs › MARECHAL Gabriel" — supprimer le bouton "← Retour" séparé ou le déplacer dans le breadcrumb comme premier élément cliquable.
**Fichier :** `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`

---

### [UX - P2] Formulaire "Nouvelle séance" en 6 étapes — surcharge cognitive

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Le wizard de création de séance comporte 6 étapes (Contexte → Détails → Thèmes → Ateliers → Date → Résumé). Les étapes 3 (Thèmes) et 4 (Ateliers) sont optionnelles pour une séance basique, mais le formulaire ne le communique pas. L'admin doit cliquer au moins 5 fois "Suivant" avant de pouvoir créer la séance.
**Impact :** Une action courante (créer une séance hebdomadaire classique) prend plus de 3 clics/étapes, en contradiction avec le principe UX max-3-clics.
**Proposition :** Permettre de sauter directement à l'étape "Date" depuis l'étape 2 (Détails) avec un bouton "Créer sans contenu pédagogique". Les étapes Thèmes/Ateliers restent accessibles en édition post-création.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### [UX - P2] Dashboard : métriques "—" au lieu de "0" ou message explicite

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/dashboard`
**Friction :** Les widgets "Présence", "Maîtrise" et "SITES" affichent "—" comme valeur. "—" est ambigu : est-ce une erreur de chargement, une donnée manquante, ou réellement zéro ? Le widget "GROUPES" affiche 0 alors que 96 joueurs sont présents, ce qui semble incorrect.
**Impact :** L'admin ne sait pas si le dashboard est en erreur ou simplement vide. "GROUPES: 0" avec "JOUEURS: 96" génère une contradiction visible.
**Proposition :** Remplacer "—" par "0%" ou "N/A" avec une info-bulle contextuelle. Vérifier la requête derrière "GROUPES" (probablement filtre `is_transient = false` qui exclut les groupes créés).
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

### [UX - P2] Clubs — "Sélectionner" affiché comme élément séparé dans la liste

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs`
**Friction :** Dans la liste des clubs, chaque entrée affiche à la fois un bouton cliquable (nom du club) ET un élément générique "Sélectionner" à côté. Ces deux éléments semblent être deux cibles d'action distinctes pour la même action, ce qui crée une ambiguïté sur laquelle cliquer.
**Impact :** L'admin hésite entre cliquer sur le nom (naviguer vers la fiche) et "Sélectionner" (action inconnue).
**Proposition :** Si "Sélectionner" est un mode de sélection multiple (bulk action), le conditionner à un mode d'activation explicite. Sinon, fusionner avec le clic sur la card.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/page.tsx`

---

### [UX - P2] Champ de formulaire sans attribut id/name (accessibilité + auto-fill cassé)

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** La console signale "A form field element should have an id or name attribute" — un champ du formulaire de séance n'a ni `id` ni `name`, ce qui casse l'accessibilité (label non associé) et désactive l'auto-complétion navigateur.
**Impact :** Accessibilité dégradée, auto-fill désactivé sur ce champ.
**Proposition :** Auditer tous les champs `<TextInput>` dans `new.tsx` et s'assurer qu'ils ont un `nativeID` (équivalent RN de `id`) ou `accessibilityLabel`.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance | 7+ (6 étapes wizard) | ~45s | Wizard 6 étapes, splash screen entre pages |
| Trouver un joueur | 2 (sidebar + card) | ~8s | Double système filtres, splash screen |
| Ajouter joueur à club | 3 (sidebar + club + section) | ~12s | Ambiguïté "Sélectionner" vs clic card |
| Consulter planning stage | 2 (sidebar + "Planifier →") | ~6s | Label "Planifier" ambigu pour stages terminés |
| Navigation générale | — | ~10s overhead | Splash screen + redirects aléatoires sidebar |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/seances/new` étape 1 | Pas de CTA visible pour créer une implantation depuis le dropdown | Admin bloqué si aucune implantation n'existe — le lien "Créer une implantation →" est présent mais peu visible sous le dropdown |
| `/activites` onglet "PASSÉES" | Pas de plage de dates visible par défaut | L'admin ne sait pas quelle période est chargée |
| `/clubs/[clubId]` section joueurs | Pas de retour visuel après ajout d'un joueur (optimistic update silencieux) | L'admin ne sait pas si l'action a réussi |
| `/dashboard` widget GROUPES | Affiche 0 alors qu'il existe des joueurs | Donne l'impression que les données sont corrompues |

---

## Incohérences de patterns

1. **Bouton CTA principal** : `/children` = "AJOUTER UN JOUEUR" (fond noir, tout caps) vs `/clubs` = "+ Nouveau club" (fond transparent, style différent) vs `/stages` = "+ Nouveau stage" (fond or). Trois styles différents pour le même type d'action primaire.

2. **Navigation retour** : `/children/[childId]` = bouton "← Retour" + breadcrumb (deux éléments) vs `/clubs/[clubId]` = breadcrumb seul "← Clubs" + "Clubs › A.C. ANVAING" (pattern different). Pas de standard uniforme.

3. **Filtres liste** : `/children` = chips horizontales + section STATUT séparée vs `/clubs` = chips horizontales + chips actif/inactif + dropdown provinces (trois niveaux) vs `/stages` = chips statut seul. Complexité variable sans logique apparente.

---

## Recommandations prioritaires

1. **Corriger le guard auth dans `_layout.tsx`** : ajouter `!isLoading &&` avant le check `role !== 'admin'` pour éliminer les redirects aléatoires — impact immédiat sur toute la navigation.
2. **Éliminer le splash screen à chaque navigation** : flag `sessionStorage.getItem('splash-shown')` — afficher une seule fois par session.
3. **Ajouter une redirection `/joueurs` → `/children`** dans le routeur Expo pour aligner URL intuitive avec route réelle.
4. **Renommer les CTAs des stages** selon leur statut : "Voir le planning →" pour terminé/en cours, "Planifier →" uniquement pour planifié.
5. **Fusionner les filtres sur `/children`** en un seul système cohérent (chips statut + filtre saison dans section avancée).
