# Story 33.2 : Workflow Coach — Présences & Badges Unifiés

Status: done

## Story

En tant que coach de l'académie,
Je veux un workflow unifié présences + badges ultra-rapide avec grille de photos, tap simple pour marquer les présences, swipe pour attribuer les badges et photo souvenir de groupe,
Afin de gérer la séance complète en moins de 3 minutes sans friction, depuis mon téléphone sur le terrain.

## Contexte Métier

- **USP académie** : zéro préparation, tout se fait sur le moment
- **Double check-in** : présences au début ET validation/retards à la fin
- **Fenêtre de saisie** : jusqu'à 22h le jour de la séance (coach peut avoir 3 séances de suite le soir)
- **Règle des 2 coachs** : au moins 1 des 2 doit valider avant 22h
- **Essai** : le coach peut initier l'ajout d'un enfant essai — l'admin valide
- **Suppression** : le coach NE PEUT PAS supprimer un enfant du groupe (admin only)
- **Badges comportementaux** : optionnels, extensibles, jamais obligatoires

## Acceptance Criteria

**AC1 — Grille Photos : 1 Tap = Présent**
- **When** le coach ouvre la séance du jour
- **Then** les enfants du groupe s'affichent en grille de photos avec prénom sous chaque photo
- **And** état initial : tous en gris (non confirmé)
- **And** 1 tap = vert (présent) — cas dominant, friction zéro
- **And** long press = orange (retard)
- **And** 2 taps rapides = rouge (absent)
- **And** les enfants gris en fin de check-in sont signalés "non confirmé" avec alerte visuelle

**AC2 — Retard : Choix < 15 min ou > 15 min**
- **When** le coach marque un enfant en retard (long press)
- **Then** un mini-popup apparaît : "< 15 min" ou "> 15 min"
- **And** le choix est enregistré avec le statut retard
- **And** le popup se ferme automatiquement après sélection

**AC3 — Double Check-In**
- **When** le coach ouvre la séance
- **Then** deux étapes sont distinctes : "Début de séance" (marquer arrivées) et "Fin de séance" (confirmer + retards)
- **And** à la fin de séance, le coach voit les enfants marqués présents et peut ajuster
- **And** les enfants encore gris en fin de séance reçoivent une alerte "non confirmé"

**AC4 — Carte Enfant Retournable**
- **When** le coach fait un tap long sur la photo d'un enfant
- **Then** la carte se retourne et affiche au dos : prénom en grand, groupe, nb présences ce mois, derniers badges reçus, signal technique actif s'il y en a un
- **And** le dos de carte affiche aussi le statut évaluations (Connaissance faite ✅ / pas faite 🔴)
- **And** re-tap = retourne côté face

**AC5 — Ajout Enfant Essai par le Coach**
- **When** le coach veut ajouter un enfant non-membre à la séance
- **Then** il accède à un bouton "Ajouter essai" sur la grille
- **And** il saisit : prénom, nom, âge
- **And** un log "essai en attente de validation" est créé pour l'admin
- **And** l'enfant apparaît sur la grille avec badge 🔵 Essai

**AC6 — Swipe Flow Badges**
- **When** le coach accède aux badges après le check-in final
- **Then** les enfants présents défilent un par un (style swipe)
- **And** sur chaque carte : chips de badges à cocher — comportementaux (Réceptivité 🎯, Effort 💪, Attitude 🧠, Prestance 👑) + badges thématiques disponibles selon la méthode du jour
- **And** swipe gauche = passer sans badge
- **And** cocher badge(s) puis swipe droit = valider et passer au suivant
- **And** à la fin : écran récap "Envoyer tout" avec aperçu des badges attribués
- **And** les badges sont entièrement optionnels — le coach peut passer tous les enfants sans attribuer

**AC7 — Photo Souvenir de Groupe**
- **When** le coach est sur l'écran de séance
- **Then** un bouton 📸 "Photo souvenir" est disponible à tout moment
- **And** un tap ouvre la caméra du téléphone
- **And** la photo prise est attachée à la fiche séance
- **And** les parents du groupe voient la photo dans l'app le soir avec un push "📸 La photo de la séance est disponible"
- **And** la photo est stockée dans Supabase Storage

**AC8 — Draft Persisté + Fenêtre 22h**
- **When** le coach ferme l'app sans valider
- **Then** l'état en cours est sauvegardé en draft (localStorage)
- **And** à la réouverture dans les 2h : bandeau "Débrief en cours pour [GROUPE] — Continuer ?"
- **And** à 22h00 : le système envoie un push au coach si débrief non validé ("Débrief manquant — dernier rappel")
- **And** à 00h00 : les données sont gelées — lecture seule, l'admin peut encore corriger

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase
  - [x] 1.1 Table `session_photos` : id, session_id, storage_path, taken_by (coach_id), taken_at
  - [x] 1.2 Table `behavioral_badges` : id, name, emoji, category (comportemental/thematique), is_active
  - [x] 1.3 Table `session_badge_awards` : session_id, child_id, badge_id, awarded_by (coach_id), awarded_at
  - [x] 1.4 Colonne `late_type CHECK('under_15','over_15') NULLABLE` sur `attendances`
  - [x] 1.5 Seed badges comportementaux : Réceptivité, Effort, Attitude, Prestance

- [x] Task 2 — Types TypeScript `@aureak/types`
  - [x] 2.1 `BehavioralBadge`, `BadgeCategory`, `SessionBadgeAward`, `LateType`, `SessionPhoto`
  - [x] 2.2 `AttendanceStatus` étendu avec `'unconfirmed'`

- [x] Task 3 — API `@aureak/api-client`
  - [x] 3.1 `getCoachSessionRoster(sessionId)` — grille enfants avec photos + statuts
  - [x] 3.2 `markAttendance(sessionId, childId, status, lateType?)` — présence temps réel
  - [x] 3.3 Draft via localStorage dans la page UI (saveDraft/loadDraft)
  - [x] 3.4 `submitAttendance` — implémenté via markAttendance par enfant
  - [x] 3.5 `addTrialByCoach(sessionId, trialData)` — essai coach → log admin
  - [x] 3.6 `listAvailableBadges(tenantId)` — badges comportementaux + thématiques
  - [x] 3.7 `awardBadge(sessionId, childId, badgeId, coachId)` — attribution badge
  - [x] 3.8 `uploadSessionPhoto(sessionId, file)` — photo souvenir → Storage
  - [x] 3.9 `getChildSessionCard(childId)` — dos de carte : stats + badges récents + évals

- [x] Task 4 — UI Mobile/Web Coach
  - [x] 4.1 Écran grille photos : `grille/page.tsx` — layout responsive, états click, couleurs
  - [x] 4.2 Mini-popup retard : `LatePopup` — < 15 min / > 15 min
  - [x] 4.3 Flip card enfant (face : avatar + statut / dos : stats + évals + signaux)
  - [x] 4.4 Modal ajout essai : `TrialModal` — formulaire prénom, nom, année naissance
  - [x] 4.5 Swipe flow badges : `badges/page.tsx` — cards défilantes + chips + navigation
  - [x] 4.6 Écran récap final `BadgeSummary` + bouton "Envoyer tout"
  - [x] 4.7 Bouton 📸 photo souvenir + input file capture=environment
  - [x] 4.8 Bandeau draft persisté à la réouverture

- [ ] Task 5 — Notifications (Edge Functions — hors scope story, à implémenter Epic 14)

## Dev Notes

### Tap / Long Press
- `onPress` (tap simple) → toggle présent/absent
- `onLongPress` → popup retard
- Double tap rapide → absent (implémentation : `onPress` count dans 300ms)
- Ordre des états : gris → vert (1 tap) / gris → orange (long press) / vert → rouge (2 taps rapides)

### Badges extensibles
- La table `behavioral_badges` permet d'ajouter de nouveaux badges sans modifier le code
- Les badges thématiques sont filtrés par `method_id` ou `category`
- Le swipe flow charge les badges disponibles dynamiquement

### Photo souvenir
- Stockée dans Supabase Storage : `session-photos/{sessionId}/{timestamp}.jpg`
- Accès RLS : admin + coachs du groupe + parents des enfants du groupe
- V2 (future) : face detection pour pré-remplissage présences

### Fenêtre 22h
- Le gel à 00h00 est côté serveur (RLS policy ou trigger Supabase)
- Le draft localStorage est nettoyé après validation ou gel

### Dépendances
- Story 32.3 pour le contenu séance du jour (même écran de départ)
- Story 33.1 pour la correction admin post-gel
