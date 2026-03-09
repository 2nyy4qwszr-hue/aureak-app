# Story 13.3 : Sessions — Mode Séance Coach Mobile & Gestion des Remplacements

Status: ready-for-dev

## Story

En tant que Coach,
Je veux une interface mobile dédiée qui s'ouvre automatiquement sur ma séance en cours, me permette de consulter le contenu pédagogique, de marquer les présences et d'évaluer les joueurs en 2 étapes, et de signaler mon absence pour déclencher un remplacement,
Afin d'animer chaque entraînement efficacement depuis le terrain, sans friction administrative.

## Contexte & Décisions de Design

### Mobile-first strict
Toute l'UX de cette story est **mobile first**. Les éléments UI doivent être conçus pour un usage à une main, sur terrain, potentiellement en mouvement. L'admin web existe mais est secondaire pour ces écrans.

### Phases d'une séance coach (3 états UI)
```
AVANT LA SÉANCE (> 30 min avant scheduled_at)
  → Consulter le contenu pédagogique (PDF entraînement, plateau)
  → Voir le roster attendu

PENDANT LA SÉANCE (dans la fenêtre [scheduled_at - 30min .. scheduled_at + duration + 15min])
  → Accès rapide aux blocs d'exercice du content_ref
  → Notes rapides par joueur (texte libre, 1-3 mots)
  → Marquer présences en temps réel

APRÈS LA SÉANCE (fenêtre passée — bouton clôture toujours accessible)
  → Compléter présences si pas encore fait
  → Évaluations par joueur (critères : goût à l'effort, réceptivité, etc.)
  → Push clôture = séance "réalisée"
```

### Push de clôture (2 étapes obligatoires)
1. **Étape 1 — Présences** : tous les joueurs du roster doivent avoir un statut (présent / absent / blessé / tardif / essai). Le coach ne peut pas avancer si un joueur n'a pas de statut.
2. **Étape 2 — Évaluations** : pour chaque joueur présent, noter les critères (goût à l'effort, réceptivité, etc.). Une fois validé → `status = 'réalisée'`, `closed_at = now()`.

La séance peut être clôturée **sans évaluations** (skip possible) avec un warning : "Sans évaluations, les parents ne verront pas de retour."

### Nouveau joueur capturé pendant la séance
Si un joueur se présente sans être dans le roster :
1. Coach tape son prénom + première lettre du nom → recherche dans `child_directory`
2. Résultat trouvé → ajout direct comme `is_guest = true, status = 'trial'`
3. Résultat non trouvé → formulaire minimal : prénom, nom, email parent OU numéro de téléphone, date de naissance (facultatif)
4. L'enfant est créé dans `child_directory` (pas dans `auth.users`) + ajouté à la séance
5. Si le parent ne donne pas ses coordonnées → bouton "Parent n'a pas souhaité donner ses infos" → enregistré quand même avec flag `contact_declined = true`

### Workflow de remplacement coach (absence)
```
Coach appuie "Je suis absent aujourd'hui" sur la séance
       ↓
Notification push → Admin + Responsable implantation
Notifications push → Liste des remplaçants (staff du groupe : order = assistant → remplaçant)
       ↓ (attente max 60 minutes)
Premier remplaçant à accepter → assigné sur la séance, autres notifiés "Hugo a accepté"
       ↓
Si 0 acceptation après 60 min → alerte escaladée aux admins
       ↓
Si J-2h avant la séance sans remplaçant → ALERTE ROUGE (push prioritaire)
Admins doivent valider : "Annuler la séance" avec raison
       ↓
Si séance annulée → notification aux parents de tous les joueurs du groupe
```

Toutes les notifications passent par les Edge Functions existantes (`send-notification`).

### Notes par joueur (during session)
- Champ texte libre par joueur, 140 caractères max
- Stocké dans `session_attendees.coach_notes TEXT`
- Visible uniquement par admin et coaches du groupe (pas par parents)
- Destiné au coach pour se souvenir ce sur quoi il doit travailler avec chaque joueur

### PDF Contenu pédagogique
- Les séances pédagogiques dans `methodology_sessions` peuvent avoir des fichiers PDF attachés (stockés dans Supabase Storage, bucket `methodology-content`)
- Le coach voit ces PDFs dans la vue "Avant la séance"
- Sur mobile : ouverture dans un viewer PDF in-app ou fallback WebView
- Le plateau (schéma de mise en place) est un PDF ou une image dans ce même bucket, référencé dans `methodology_sessions.plateau_url TEXT`

## Acceptance Criteria

**AC1 — Auto-surface de la séance en cours**
- **Given** un coach connecté ouvre l'app mobile dans la fenêtre [scheduled_at - 30min .. scheduled_at + duration + 15min]
- **When** il arrive sur l'écran d'accueil coach (`/coach/dashboard`)
- **Then** une bannière proéminente "Séance en cours" s'affiche avec le nom du groupe, l'heure et un CTA "Animer →"
- **And** si plusieurs séances simultanées (rare mais possible), une liste est affichée

**AC2 — Vue pré-séance (contenu pédagogique)**
- **Given** le coach ouvre la fiche séance avant l'heure de début
- **When** il est dans l'onglet "Contenu"
- **Then** il voit : la référence du contenu (ex: "GP-08A — Module 2, Séance 3"), un lien vers le PDF entraînement, un lien vers l'image/PDF plateau de mise en place
- **And** si `session_type = 'decisionnel'`, il voit la liste des blocs qu'il a définis lors de la création

**AC3 — Vue pendant la séance (référence rapide)**
- **Given** le coach est dans la fenêtre de séance
- **When** il est dans l'onglet "En cours"
- **Then** les blocs d'exercice du content_ref s'affichent en liste verticale scrollable avec le titre de chaque bloc
- **And** un champ "Note rapide" par joueur est accessible (tap sur le nom du joueur)
- **And** les notes sont sauvegardées automatiquement (debounce 2s)

**AC4 — Marquer les présences (Étape 1 de la clôture)**
- **Given** le coach ouvre l'onglet "Présences"
- **When** il swipe ou tape sur chaque joueur
- **Then** le statut change cycliquement : présent → absent → blessé → tardif (ou via sélecteur tap-and-hold)
- **And** un compteur en haut de page affiche "X / Y joueurs statués"
- **And** le bouton "Passer aux évaluations →" est disabled tant que tous les joueurs n'ont pas de statut

**AC5 — Ajouter un joueur invité pendant la séance**
- **Given** le coach est dans l'onglet "Présences"
- **When** il tape le bouton "+ Ajouter un joueur"
- **Then** une recherche rapide s'ouvre sur `child_directory` (top 8 résultats par nom)
- **And** si trouvé → il est ajouté avec `is_guest = true, status = 'trial'`
- **And** si non trouvé → formulaire minimal (prénom, nom, email OU téléphone, date naissance optionnelle) → création dans `child_directory` + ajout à `session_attendees`
- **And** bouton "Parent n'a pas souhaité donner ses infos" disponible → `contact_declined = true` sur l'entrée `child_directory` créée

**AC6 — Évaluations par joueur (Étape 2 de la clôture)**
- **Given** toutes les présences sont statués et le coach passe à l'étape 2
- **When** il évalue chaque joueur présent
- **Then** pour chaque joueur une carte affiche les critères configurés (goût à l'effort, réceptivité, …) avec un sélecteur signal : positif / attention / aucun (valeurs `EvaluationSignal`)
- **And** il peut passer un joueur sans l'évaluer (bouton "Ignorer")
- **And** le bouton "Clôturer la séance" devient actif dès que l'étape 1 est complète (évaluations = optionnelles mais avec warning)

**AC7 — Push clôture = séance réalisée**
- **Given** le coach clique "Clôturer la séance"
- **When** la requête aboutit
- **Then** `sessions.status = 'réalisée'`, `sessions.closed_at = now()`, toutes les `evaluations` INSERT, tout en batch atomique via une RPC `close_session()`
- **And** un toast "Séance clôturée ✓" s'affiche
- **And** la bannière "Séance en cours" disparaît du dashboard

**AC8 — Rappels si clôture non effectuée**
- **Given** une séance planifiée dont `scheduled_at + duration` est passé depuis 5 minutes
- **When** le coach n'a pas encore clôturé
- **Then** une notification push "N'oubliez pas de clôturer votre séance de [groupe]" est envoyée
- **And** un second rappel est envoyé à +15 minutes si toujours pas clôturé
- **And** ces rappels sont gérés par une Edge Function `session-close-reminder` déclenchée par un cron Supabase

**AC9 — Workflow absence coach**
- **Given** le coach ouvre sa séance et appuie "Je suis absent aujourd'hui"
- **When** il confirme
- **Then** une notification push est envoyée à l'admin + au responsable de l'implantation + aux remplaçants du groupe (dans l'ordre : assistant → remplaçant)
- **And** si un remplaçant accepte dans les 60 min → `session_coaches` est mis à jour (nouveau lead), les autres remplaçants reçoivent "X a accepté"
- **And** si aucune réponse après 60 min → alerte push escaladée aux admins
- **And** si J-2h avant séance sans remplaçant → ALERTE ROUGE push + email aux admins
- **And** seul un admin peut valider "Annuler la séance" suite à l'alerte rouge → déclenchement notification parents

**AC10 — Nouvelles colonnes DB**
- **Given** la migration `00059_session_coach_ux.sql` appliquée
- **Then** `session_attendees` a les colonnes : `coach_notes TEXT NULL`, `contact_declined BOOLEAN DEFAULT false`
- **And** `sessions` a la colonne : `closed_at TIMESTAMPTZ NULL`
- **And** RLS respecté sur toutes les nouvelles colonnes

## Tasks / Subtasks

- [ ] Task 1 — Migration `00059_session_coach_ux.sql` (AC: #10)
  - [ ] 1.1 ALTER `session_attendees` ADD COLUMN `coach_notes TEXT NULL`
  - [ ] 1.2 ALTER `session_attendees` ADD COLUMN `contact_declined BOOLEAN NOT NULL DEFAULT false`
  - [ ] 1.3 ALTER `sessions` ADD COLUMN `closed_at TIMESTAMPTZ NULL`
  - [ ] 1.4 ALTER `child_directory` ADD COLUMN `contact_declined BOOLEAN NOT NULL DEFAULT false` (si pas déjà présent)

- [ ] Task 2 — RPC `close_session` (AC: #7)
  - [ ] 2.1 Créer `close_session(session_id UUID)` RPC en PostgreSQL : UPDATE sessions + INSERT evaluations (batch) + validation que toutes présences sont statués + retourne erreur si déjà clôturée
  - [ ] 2.2 Exposer via `api-client/src/sessions/sessions.ts` : `closeSession(sessionId, evaluations[])`

- [ ] Task 3 — Edge Function `session-close-reminder` (AC: #8)
  - [ ] 3.1 Créer `supabase/functions/session-close-reminder/index.ts`
  - [ ] 3.2 Logique : SELECT sessions WHERE status = 'planifiée' AND scheduled_at + duration < now() - '5 minutes'::interval AND closed_at IS NULL → push notification au coach lead
  - [ ] 3.3 Créer cron Supabase : toutes les 5 minutes (ou via pg_cron sur le projet)
  - [ ] 3.4 Guard anti-double-notif : vérifier `notification_send_logs` avant d'envoyer

- [ ] Task 4 — Edge Function `coach-absence-handler` (AC: #9)
  - [ ] 4.1 Créer `supabase/functions/coach-absence-handler/index.ts`
  - [ ] 4.2 POST `/coach-absence-handler` avec `{ sessionId, coachId }` → send-notification admin + remplaçants
  - [ ] 4.3 Endpoint `accept-replacement` : `{ sessionId, coachId }` → UPDATE session_coaches + notifier les autres
  - [ ] 4.4 Cron ou delayed function pour escalade à +60min (pg_cron ou Supabase Scheduled Functions)
  - [ ] 4.5 Alerte rouge J-2h : cron vérifie séances dans les 2h sans coach confirmé

- [ ] Task 5 — API client nouvelles fonctions (AC: #5, #9)
  - [ ] 5.1 `addGuestToSession(sessionId, childId)` — existant dans Story 13-1, utiliser ici
  - [ ] 5.2 `captureNewChildDuringSession(sessionId, childData): Promise<string>` — INSERT child_directory + INSERT session_attendees
  - [ ] 5.3 `saveCoachNote(sessionId, childId, note: string): Promise<void>` — UPDATE session_attendees.coach_notes
  - [ ] 5.4 `reportCoachAbsence(sessionId, coachId): Promise<void>` — appel Edge Function coach-absence-handler
  - [ ] 5.5 `acceptReplacement(sessionId, coachId): Promise<void>` — appel Edge Function accept-replacement

- [ ] Task 6 — UX Coach Mobile : auto-surface séance en cours (AC: #1)
  - [ ] 6.1 Dans `coach/dashboard/index.tsx` : calculer si une séance est "en cours" ou "commence dans 30 min"
  - [ ] 6.2 Afficher bannière `<ActiveSessionBanner session />` avec CTA "Animer →" → navigue vers `coach/sessions/[sessionId]`
  - [ ] 6.3 Gérer le cas multi-séances simultanées (liste scrollable)

- [ ] Task 7 — UX Coach Mobile : fiche séance (AC: #2, #3, #4, #5, #6, #7)
  - [ ] 7.1 Refonte `coach/sessions/[sessionId]/` avec navigation par onglets : Contenu | Présences | Évaluations | Notes
  - [ ] 7.2 **Onglet Contenu** : affichage content_ref décodé, lien PDF entraînement, image plateau
  - [ ] 7.3 **Onglet Présences** : liste joueurs avec swipe gesture (présent/absent/blessé/tardif), compteur, bouton "+ Ajouter joueur"
  - [ ] 7.4 **Modal Ajouter joueur** : recherche child_directory → résultats → tap = ajout, ou formulaire nouveau joueur si non trouvé
  - [ ] 7.5 **Onglet Évaluations** : cards joueurs présents, critères EvaluationSignal, bouton "Ignorer", barre de progression
  - [ ] 7.6 **Onglet Notes** : liste joueurs avec input texte libre (140 chars), sauvegarde auto-debounce 2s
  - [ ] 7.7 **Bouton "Clôturer"** : sticky en bas de page, disabled si présences incomplètes, warning si évals manquantes
  - [ ] 7.8 **Bouton "Je suis absent"** : uniquement si coach est lead ou assistant de la séance, confirme → appel `reportCoachAbsence()`

- [ ] Task 8 — Viewer PDF in-app (AC: #2)
  - [ ] 8.1 Utiliser `expo-file-system` + `expo-sharing` OU `react-native-pdf` pour afficher les PDFs
  - [ ] 8.2 Fallback : bouton "Ouvrir dans le navigateur" si le viewer ne fonctionne pas
  - [ ] 8.3 Ajouter `methodology_sessions.plateau_url TEXT NULL` si pas déjà présent (migration mineure dans 00059)

## Dev Notes

### Migration `00059_session_coach_ux.sql`

```sql
-- Nouvelles colonnes session_attendees
ALTER TABLE session_attendees
  ADD COLUMN IF NOT EXISTS coach_notes      TEXT NULL,
  ADD COLUMN IF NOT EXISTS contact_declined BOOLEAN NOT NULL DEFAULT false;

-- Nouvelle colonne sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL;

-- Nouvelle colonne child_directory
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS contact_declined BOOLEAN NOT NULL DEFAULT false;

-- Colonne plateau_url sur methodology_sessions si nécessaire
ALTER TABLE methodology_sessions
  ADD COLUMN IF NOT EXISTS plateau_url TEXT NULL;

-- Index pour le cron session-close-reminder
CREATE INDEX IF NOT EXISTS sessions_close_reminder_idx
  ON sessions (tenant_id, scheduled_at)
  WHERE status = 'planifiée' AND closed_at IS NULL;
```

### RPC `close_session`

```sql
CREATE OR REPLACE FUNCTION close_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que toutes les présences sont statués
  IF EXISTS (
    SELECT 1 FROM session_attendees
    WHERE session_id = p_session_id AND status IS NULL
  ) THEN
    RAISE EXCEPTION 'PRESENCES_INCOMPLETE: All attendees must have a status before closing';
  END IF;

  -- Marquer la séance comme réalisée
  UPDATE sessions
  SET status = 'réalisée', closed_at = now()
  WHERE id = p_session_id
    AND status != 'réalisée'  -- idempotent guard
    AND tenant_id = current_tenant_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND_OR_ALREADY_CLOSED';
  END IF;
END;
$$;
```

### Gestion du state "séance en cours" côté client

```typescript
// Dans coach/dashboard/index.tsx
function getActiveSession(sessions: Session[]): Session | null {
  const now = new Date()
  return sessions.find(s => {
    const start = new Date(s.scheduledAt)
    const end = addMinutes(start, s.durationMinutes + 15)
    const preWindow = subMinutes(start, 30)
    return s.status === 'planifiée' && now >= preWindow && now <= end
  }) ?? null
}
```

### Notifications absence coach

Les notifications utilisent le système `send-notification` existant (Edge Function).

Types de notification à ajouter dans le système :
- `coach_absence_alert` → envoyée à admin + remplaçants
- `replacement_accepted` → envoyée aux remplaçants non-retenus
- `replacement_escalation` → envoyée aux admins après 60 min
- `red_alert_no_coach` → envoyée aux admins J-2h
- `session_cancelled_no_coach` → envoyée aux parents

### Règles de priorité remplaçant

```
group_staff WHERE group_id = session.group_id
  ORDER BY CASE role WHEN 'assistant' THEN 1 WHEN 'remplacant' THEN 2 ELSE 3 END
```

Le premier de la liste est contacté en priorité. Si plusieurs répondent en même temps, le premier timestamp d'acceptation gagne.

### Notes vocales
❌ **Hors scope de cette story** — planifié pour une itération future. Pour le MVP, uniquement notes texte 140 caractères.

## File List

### New Files
- `supabase/migrations/00059_session_coach_ux.sql`
- `supabase/functions/session-close-reminder/index.ts`
- `supabase/functions/coach-absence-handler/index.ts`

### Modified Files
- `aureak/packages/api-client/src/sessions/sessions.ts` — closeSession, captureNewChildDuringSession, saveCoachNote, reportCoachAbsence, acceptReplacement
- `aureak/packages/types/src/entities.ts` — Session (closed_at), SessionAttendee (coach_notes, contact_declined)
- `aureak/apps/web/app/(coach)/coach/dashboard/index.tsx` — bannière ActiveSession
- `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx` — refonte présences mobile
- `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx` — refonte évals mobile
- `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/notes/index.tsx` — notes par joueur + coach_notes
- `aureak/apps/web/app/(coach)/coach/sessions/index.tsx` — ajout statut "en cours"

### New Screen Files (à créer)
- `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/index.tsx` — hub onglets (Contenu | Présences | Évals | Notes) + boutons Clôturer / Je suis absent

## Dev Agent Record

- [ ] Story créée le 2026-03-09 — dépend de Stories 13-1 et 13-2
- [ ] Précondition : migrations 00057, 00058 et 00059 appliquées
- [ ] Notes vocales : hors scope, à planifier en Story 13-4 ou Epic 14
- [ ] L'Edge Function `session-close-reminder` utilise pg_cron ou Supabase Scheduled Triggers (à vérifier selon plan Supabase du projet)
- [ ] PDF viewer : tester `expo-file-system` + `expo-sharing` en priorité avant d'importer une lib lourde comme `react-native-pdf`
