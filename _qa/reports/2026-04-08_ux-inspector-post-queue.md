# UX Inspector — 2026-04-08 (post-queue)

> APP_STATUS=200 — PLAYWRIGHT_STATUS=ready.
> Audit réalisé par navigation Playwright réelle sur http://localhost:8082.
> 5 flux audités : Créer séance, Trouver joueur, Ajouter joueur à club, Planning stage, Navigation générale.

---

## Résumé

- Flux audités : 5
- Frictions HAUTE priorité (P1) : 4
- Frictions MOYENNE priorité (P2) : 5
- Incohérences : 3

---

## Frictions détectées

### [UX - P1] Keyboard shortcuts globaux interceptent les touches standard

**Flux concerné :** Flux 5 — Navigation générale
**Page :** toutes les pages admin
**Friction :** Les raccourcis clavier globaux (G+D, G+I, G+A…) interceptent des touches standard comme `End`, `Home`, causant des navigations involontaires lors d'actions de scroll, formulaire ou évaluation. Appuyer sur `End` déclenche un changement de route vers `/dashboard` au lieu de scroller la page.
**Impact :** Perte de contexte permanente — l'admin se retrouve ailleurs sans explication. Risque de perte de données dans les formulaires.
**Proposition :** Limiter la capture des raccourcis clavier aux zones non-éditable uniquement (exclure quand un `input`, `textarea`, ou `ScrollView` est en focus).
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx`

---

### [UX - P1] "Supprimer" sur fiche club sans hiérarchie visuelle ni confirmation visible

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs/[clubId]`
**Friction :** Le bouton "Supprimer" est affiché au même niveau visuel que "Modifier" — même taille, même position, aucune couleur danger. Aucun feedback de confirmation n'est visible avant action. La suppression d'un club avec des joueurs liés peut se faire en 1 clic.
**Impact :** Risque de suppression accidentelle d'un club actif avec historique complet.
**Proposition :** Mettre "Supprimer" en `variant=danger` (rouge discret) et déclencher une modale de confirmation avec le nom du club.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`

---

### [UX - P1] "Stages" absent de la sidebar lors de la navigation sur /stages

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages`, `/stages/[stageId]`
**Friction :** Le lien "Stages" dans la sidebar sous "Évènements" ne reçoit pas le style actif lors de la navigation sur `/stages` ou `/stages/[stageId]`. La section Évènements ne se déplie pas automatiquement — "Stages" est invisible sans scroll, seul "Tous les évènements" est visible.
**Impact :** L'admin ne sait pas où il se trouve dans la navigation. Retour arrière ambigu.
**Proposition :** Vérifier le `isActive` du lien `/stages` dans `_layout.tsx` et s'assurer que la section Évènements s'auto-déplie quand un sous-item est actif.
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx`

---

### [UX - P1] Wizard "Nouvelle séance" bloqué dès l'étape 1 sans implantation configurée

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** À l'étape 1 (Contexte), si aucune implantation n'est configurée, le dropdown affiche "Aucune implantation trouvée" et l'admin est bloqué — impossible d'avancer. Le lien "Créer une implantation →" dans le bandeau orange navigue hors du formulaire et fait perdre tout le remplissage.
**Impact :** Flux entier cassé pour un admin dont la configuration initiale est incomplète. 6 étapes inaccessibles.
**Proposition :** Ouvrir "Créer une implantation" dans un modal ou drawer latéral pour ne pas interrompre le flux séance, ou ajouter un message d'onboarding avant même d'ouvrir le wizard.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### [UX - P2] Double breadcrumb sur toutes les fiches détail

**Flux concerné :** Flux 2, 3, 4 — Toutes les fiches
**Page :** `/children/[id]`, `/clubs/[id]`, `/stages/[id]`
**Friction :** Chaque page détail affiche deux breadcrumbs : un dans la barre de titre du layout ("Joueurs › Détail") et un dans le contenu ("Joueurs › ABBENBROECK Adam"). Le premier est redondant et moins précis.
**Impact :** Confusion visuelle, perte d'espace vertical, incohérence entre les pages.
**Proposition :** Supprimer le breadcrumb générique du layout ("Détail") — ne garder que le breadcrumb dans le contenu avec le nom réel de l'entité.
**Fichiers :** `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`, `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`, `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

---

### [UX - P2] Incohérence compteurs filtres joueurs : "774 joueurs" vs "Tous (50)"

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/children`
**Friction :** L'en-tête affiche "774 joueurs" (total DB) mais le tab "Tous" affiche "(50)" — ce qui correspond à la limite de pagination de la page courante. L'utilisateur croit filtrer sur 50 joueurs alors qu'il en existe 774.
**Impact :** Perte de confiance dans les données, impression que la liste est incomplète ou que le filtre est actif par défaut.
**Proposition :** Le compteur du tab "Tous" doit afficher le total réel (774) ou être retiré — ne montrer le count que dans les tabs de filtres sémantiques (Prospect, Académicien…).
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

---

### [UX - P2] Empty state planning stage : CTA trop éloigné du message vide

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/[stageId]`
**Friction :** Quand le planning est vide, le message "Aucune journée planifiée. Ajoutez la première journée." est au centre mais le seul CTA actionnable ("+ Ajouter une journée") est dans le coin supérieur droit de la section.
**Impact :** 2 zones d'attention séparées, friction pour l'action la plus courante sur un stage neuf.
**Proposition :** Ajouter un bouton "+ Ajouter une journée" directement sous le message d'état vide, en plus du bouton existant en haut.
**Fichier :** `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

---

### [UX - P2] Wizard nouvelle séance : 6 étapes pour une action hebdomadaire courante

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** La création d'une séance requiert 6 étapes (Contexte → Détails → Thèmes → Ateliers → Date → Résumé). Pour une séance simple sans thème ni atelier, l'admin passe par 4 écrans intermédiaires avant d'atteindre la date.
**Impact :** Estimation ~4 min pour créer une séance basique. Charge cognitive élevée pour une action hebdomadaire.
**Proposition :** Rendre les étapes 3 (Thèmes) et 4 (Ateliers) skippables avec un bouton "Passer cette étape →" visible dès le haut de l'écran.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### [UX - P2] Erreur console 400 sur club_directory_child_links — section joueurs absente

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs/[clubId]`
**Friction :** La requête `club_directory_child_links?select=child_id,link_type,created_at,child_directory(display_name,statut,niveau_club)` retourne HTTP 400. La section joueurs du club ne se charge pas, sans message d'erreur affiché.
**Impact :** L'admin ne peut pas voir ni ajouter de joueurs depuis la fiche club — flux 3 entièrement cassé.
**Proposition :** Corriger la requête (vérifier que `statut` existe sur `child_directory` ou remplacer par `computed_status` via la vue) et afficher un message d'erreur explicite si la requête échoue.
**Fichier :** `aureak/packages/api-client/src/admin/club-directory.ts`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance | 6+ étapes | ~4 min | Wizard 6 étapes + blocage sans implantation |
| Trouver un joueur | 2 clics | ~10s | Compteur filtre incohérent (50 vs 774) |
| Ajouter joueur à club | N/A | N/A | Erreur 400 — section joueurs absente |
| Consulter planning stage | 2 clics | ~5s | CTA "Ajouter journée" éloigné de l'état vide |
| Navigation générale | — | — | Keyboard shortcuts interceptent End/Home |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/clubs/[clubId]` | Section joueurs en erreur 400 — pas de message d'erreur affiché | L'admin voit une section vide sans savoir pourquoi |
| `/seances/new` | Pas de sauvegarde intermédiaire — retour arrière = perte du formulaire | 6 étapes perdues si navigation accidentelle |
| `/stages/[stageId]` | Pas de skeleton pendant chargement des journées | Flash de contenu vide avant apparition des données |

---

## Incohérences de patterns

1. **Breadcrumb** : Certaines pages ont double breadcrumb (détail joueur, club, stage), d'autres non (dashboard, séances).
2. **CTA dans état vide** : Sur `/seances` le bouton "Créer" est dans l'état vide ET en header. Sur `/stages/[id]` il n'est qu'en header, pas dans l'état vide.
3. **Compteurs de filtres** : `/children` montre "(50)" = limite pagination. `/clubs` montre "882 clubs" = total réel. Standards différents sur des pages identiques en structure.

---

## Recommandations prioritaires

1. **Corriger l'erreur 400 sur `club_directory_child_links`** — rend le flux 3 entièrement inaccessible.
2. **Limiter la capture des keyboard shortcuts aux zones non-éditables** — empêche les navigations involontaires et pertes de formulaire.
3. **Ajouter modale de confirmation + style danger sur "Supprimer"** dans toutes les fiches détail (clubs, coachs, joueurs).
4. **Corriger le compteur filtre "Tous"** sur `/children` pour afficher le total réel, pas la limite de page.
5. **Ajouter CTA dans l'état vide** du planning stage (dupliquer "+ Ajouter une journée" dans la zone centrale).
