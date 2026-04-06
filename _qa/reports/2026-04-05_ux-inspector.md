# UX Inspector — 2026-04-05

## Résumé

- Flux audités : 5
- Frictions HAUTE priorité : 4
- Frictions MOYENNE priorité : 4
- Incohérences : 3
- App vérifiée : ✅ http://localhost:8082 — HTTP 200

---

## Frictions détectées

### ⚡ [UX - P1] Créer une séance — 6 étapes obligatoires

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Le formulaire de création d'une séance est divisé en 6 étapes séquentielles (Contexte → Détails → Thèmes → Ateliers → Date → Résumé). L'admin doit traverser 6 écrans pour valider une seule séance, sans possibilité de sauter les étapes optionnelles (Thèmes, Ateliers).
**Impact :** Le principe UX "max 3 clics pour toute action courante" est violé. Pour une séance simple (groupe existant, date unique, pas de thème), l'admin effectue au minimum 8 clics. Sur la fréquence estimée de plusieurs séances par semaine, la friction s'accumule significativement.
**Proposition :** Fusionner les étapes 3 (Thèmes) et 4 (Ateliers) en une section "Contenu" optionnelle, et rendre la sélection de date accessible dès l'étape 2 — réduire à 3 étapes : Contexte / Contenu (facultatif) / Date + Résumé.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### ⚡ [UX - P1] Suppression de journées et blocs de stage sans confirmation

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/[stageId]`
**Friction :** Les fonctions `handleDeleteDay` et `handleDeleteBlock` suppriment directement la journée ou le bloc sans modale de confirmation. Un clic sur "Supprimer journée" efface immédiatement tout le contenu, sans possibilité d'annuler.
**Impact :** Risque de perte de données irréversible. Une journée entière avec tous ses blocs d'entraînement peut être détruite en 1 clic accidentel. Le composant `ConfirmDialog` existe dans `@aureak/ui` mais n'est pas utilisé ici, contrairement aux pages clubs et entraînements.
**Proposition :** Ajouter un `ConfirmDialog` avant chaque suppression de journée ou de bloc, sur le modèle exact de `clubs/[clubId]/page.tsx` (ligne 1017).
**Fichier :** `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

---

### ⚡ [UX - P1] Dashboard — erreur silencieuse sur `getImplantationStats`

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/dashboard`
**Friction :** Une erreur `400` est loguée en console (`[dashboard] getImplantationStats error: [object Object]`). Les cartes "Taux de présence" et "Taux de maîtrise" affichent un tiret `—` sans aucun indicateur d'erreur visible. L'admin ne peut pas distinguer "données vraiment nulles" de "données non chargées à cause d'une erreur".
**Impact :** Perte de confiance implicite dans les KPI. L'admin peut prendre des décisions opérationnelles sur des données manquantes sans le savoir.
**Proposition :** Afficher un badge "⚠️ Données indisponibles" sur les cartes affectées quand l'appel API échoue, au lieu d'un tiret silencieux.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

### ⚡ [UX - P1] Recherche joueurs non temps-réel — bouton obligatoire

**Flux concerné :** Flux 2 — Trouver un joueur et voir sa fiche
**Page :** `/children`
**Friction :** La recherche par nom nécessite un clic sur le bouton "Chercher" ou la touche Enter. Pas de recherche en temps réel (debounce). Sur 774 joueurs, l'admin qui tape un nom doit valider manuellement pour voir les résultats, créant un pas supplémentaire inattendu.
**Impact :** Parcours complet : Dashboard → Joueurs (clic sidebar) → saisir nom → clic "Chercher" → ouvrir fiche = 3 clics + 1 validation manuelle. Le bouton "Chercher" est une friction inattendue dans une app 2026.
**Proposition :** Ajouter un debounce de 350ms sur `onChangeText` pour déclencher la recherche automatiquement dès 3 caractères, en gardant le bouton "Chercher" comme fallback.
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

---

### ⚡ [UX - P2] État vide "Stages" sans CTA

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages` (liste)
**Friction :** Quand la liste de stages est vide (hors recherche active), le message affiché est "Aucun stage — Créez votre premier stage." sans bouton d'action. L'admin doit repérer le bouton "+ Nouveau stage" dans le coin supérieur droit, loin du contexte visuel du message.
**Impact :** Rupture du flux naturel — le regard suit le message puis cherche l'action à distance. Incohérence avec la page Joueurs qui utilise un `EmptyState` complet avec `ctaLabel` et `onCta`.
**Proposition :** Ajouter un bouton "+ Nouveau stage" directement dans l'état vide, sur le modèle du `EmptyState` de la page Joueurs (`children/index.tsx` ligne 1248).
**Fichier :** `aureak/apps/web/app/(admin)/stages/index.tsx`

---

### ⚡ [UX - P2] Boutons "Supprimer" exposés en permanence sur les cards d'entraînements

**Flux concerné :** Flux 5 — Navigation générale (Méthodologie / Entraînements)
**Page :** `/methodologie/seances`
**Friction :** Chaque card d'entraînement pédagogique affiche un bouton rouge "Supprimer" directement visible, sans interaction préalable. Bien qu'une `ConfirmDialog` soit présente dans le code, le bouton destructeur est visuellement trop proéminent et permanent.
**Impact :** Risque de clic accidentel. Contraste cognitif élevé entre la lecture du contenu des cards et la présence d'un bouton danger rouge en permanence visible.
**Proposition :** Masquer "Supprimer" derrière un menu contextuel (icône `⋯`) ou un mode édition explicite, pour ne pas exposer une action destructrice dans l'état de repos de la liste.
**Fichier :** `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`

---

### ⚡ [UX - P2] Dashboard — ambiguïté entre valeur nulle et donnée indisponible

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/dashboard`
**Friction :** Les cartes "Taux de présence" et "Taux de maîtrise" affichent `—` aussi bien quand la valeur est `null` (aucune séance sur la période) que quand l'API échoue. La carte "Implantations" affiche aussi un tiret au lieu d'un chiffre. L'admin ne distingue pas "0%" de "erreur de chargement".
**Impact :** Ambiguïté opérationnelle — peut induire une fausse lecture de l'activité de l'académie (ex : penser qu'il n'y a pas eu de séances alors que c'est une erreur réseau).
**Proposition :** Utiliser `0%` quand la donnée est vraiment nulle, et réserver `—` accompagné d'un indicateur ⚠️ aux cas d'erreur ou d'indisponibilité.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

### ⚡ [UX - P2] Inaccessibilité — champs de formulaire sans label associé

**Flux concerné :** Tous les flux avec formulaires HTML natifs
**Page :** `/dashboard` et autres pages
**Friction :** La console signale "A form field element should have an id or name attribute" (3 occurrences) et "No label associated with a form field" (2 occurrences). Les `<select>` et `<input>` HTML natifs du dashboard (sélecteurs Implantation, Période) n'ont pas d'attributs `id`/`name` reliés à leurs `<label>`.
**Impact :** Accessibilité réduite (lecteurs d'écran, navigation clavier). Violation WCAG 2.1 niveau A.
**Proposition :** Ajouter un `id` unique sur chaque `<select>` et `<input>` HTML natif, et relier le `<label>` avec `htmlFor`.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance | 8+ | ~90s | 6 étapes séquentielles dont 2 optionnelles non sautables |
| Trouver un joueur | 3 + validation manuelle | ~20s | Recherche non temps-réel — bouton "Chercher" obligatoire |
| Ajouter joueur à club | 4 | ~15s | Aucune friction majeure — PlayerPicker intuitif |
| Consulter planning stage | 3 | ~10s | Suppression journée/bloc sans confirmation |
| Navigation générale | — | — | Erreur silencieuse sur KPI dashboard + icônes dupliquées sidebar |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/dashboard` | Indicateur d'erreur API visible sur les cartes KPI | Admin voit `—` sans savoir si c'est une vraie absence de données ou une erreur |
| `/stages` (liste) | CTA dans l'état vide (résultat de recherche vide) | Admin lit "Aucun résultat." sans bouton pour créer un stage |
| `/stages/[stageId]` | Confirmation avant suppression journée/bloc | Destruction irréversible en 1 clic sans avertissement |
| `/seances` (calendrier) | Message d'état vide différencié | "0 séances sur la période" ne distingue pas "calendrier vide" de "erreur de chargement" |
| `/clubs` (liste) | CTA dans l'état vide après filtrage | "Aucun club ne correspond aux critères" sans bouton d'action ni reset des filtres |

---

## Incohérences de patterns

**1. État vide avec/sans CTA selon la section**
- Page Joueurs : `EmptyState` avec `ctaLabel="Ajouter un joueur"` et `onCta` intégré — CTA présent ✅
- Page Stages : message textuel "Créez votre premier stage." sans bouton — CTA absent ❌
- Page Clubs : message "Aucun club ne correspond aux critères" sans bouton reset ni CTA — CTA absent ❌
- Recommandation : adopter systématiquement le composant `EmptyState` avec `ctaLabel` + `onCta` sur toutes les listes.

**2. Confirmation de suppression inconsistante**
- `clubs/[clubId]/page.tsx` : `ConfirmDialog` pour supprimer un club ✅
- `methodologie/seances/index.tsx` : `ConfirmDialog` pour supprimer un entraînement ✅
- `stages/[stageId]/page.tsx` : PAS de `ConfirmDialog` pour supprimer une journée ou un bloc ❌
- Recommandation : appliquer `ConfirmDialog` systématiquement sur toute action destructrice.

**3. Icônes dupliquées dans la sidebar**
- Les 3 items Méthodologie (Entraînements, Thèmes, Situations) partagent tous l'emoji `📚`.
- "Calendrier scolaire" et "Séances" partagent `📅`.
- "Accès temporaires" et "Permissions grades" partagent `🔐`.
- Ces doublons nuisent à la reconnaissance visuelle rapide, notamment en mode sidebar réduit (collapsed) où seul l'icône est visible.
- Recommandation : affecter un icône unique et sémantiquement distinct à chaque section de navigation.

---

## Recommandations prioritaires

1. **Réduire le wizard de création de séance à 3 étapes** — fusionner Thèmes+Ateliers en "Contenu optionnel" et rapprocher la sélection de date, pour respecter la règle "max 3 clics pour une action courante".
2. **Ajouter `ConfirmDialog` sur les suppressions dans `/stages/[stageId]`** — copier le pattern existant des pages clubs et entraînements (moins de 30 minutes de travail, risque zéro de régression).
3. **Afficher un état d'erreur visible sur le dashboard** — quand `getImplantationStats` échoue (erreur `400` active en prod), les cartes doivent signaler l'indisponibilité avec ⚠️ au lieu d'un tiret silencieux.
4. **Ajouter la recherche en temps réel (debounce 350ms) sur la page Joueurs** — supprimer l'obligation du clic "Chercher", alignant le comportement avec les autres pages de liste de l'app.
5. **Uniformiser les états vides** — adopter le composant `EmptyState` avec CTA systématiquement sur toutes les listes (Stages, Clubs, Séances calendrier), en s'appuyant sur le pattern déjà implémenté dans la page Joueurs.
