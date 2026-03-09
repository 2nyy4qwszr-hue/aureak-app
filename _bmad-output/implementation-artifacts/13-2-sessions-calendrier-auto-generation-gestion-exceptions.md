# Story 13.2 : Sessions — Calendrier, Auto-génération & Gestion des Exceptions

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux générer automatiquement toutes les séances d'un groupe pour l'année scolaire en tenant compte du calendrier belge, et gérer les reports/annulations avec un décalage automatique du contenu,
Afin de ne jamais recréer manuellement 30+ séances par groupe et de maintenir la cohérence pédagogique malgré les imprévus.

## Contexte & Décisions de Design

### Logique de numérotation pédagogique
La numérotation du contenu est **par groupe** (pas par implantation ni par method globale). Chaque groupe a sa propre séquence de contenu, indépendante des autres groupes.

Goal & Player spécifiquement :
- 15 entraînements (module 1-5, module 6-10, module 11-15), chaque bloc répété 2× dans l'année
- Séquence annuelle : entraînement 1A → 2A → ... → 15A → 1B → 2B → ... → 15B (30 séances totales)

Technique (académie) : 8 modules × 4 séances = 32 séances (30 actuellement, objectif 32)

Situationnel : 2 séances par module, rotation des blocs (TAB→1V1→BAL_AER→...)

### Auto-génération d'une année scolaire
- **Déclencheur** : action admin explicite "Générer l'année [saison]" par groupe
- **Inputs** : date de début de saison, date de fin, jour de la semaine du groupe, heure/durée hérités du groupe
- **Calendrier belge** : les semaines de vacances scolaires sont exclues automatiquement (mais overridable)
- **Output** : N séances `status = 'planifiée'` avec `content_ref` pré-assigné séquentiellement
- **Idempotent** : si des séances existent déjà pour ce groupe × saison, l'admin voit un warning et doit confirmer

### Calendrier scolaire belge (approximatif, configurable)
Périodes de vacances typiques par défaut (à confirmer/ajuster en settings) :
- Toussaint : fin octobre - début novembre (1 semaine)
- Noël : fin décembre - début janvier (2 semaines)
- Carnaval : février (1 semaine)
- Pâques : avril (2 semaines)
- Été : mi-juin → début septembre

> Implémentation : table `school_calendar_exceptions` (tenant-level) permettant à l'admin d'ajouter/modifier/supprimer des exceptions. Pré-remplie avec les dates belges par défaut.

### Logique de Report (postponement)
Quand une séance planifiée est **reportée** à une nouvelle date :
1. La séance garde son `content_ref` (le contenu ne bouge pas, c'est la date qui change)
2. Le slot original dans le calendrier reste visible avec `status = 'reportée'` + nouvelle date affichée
3. La nouvelle date ne doit pas déjà avoir une séance (validation)

### Logique d'Annulation avec Décalage de Contenu
Quand une séance est **annulée** (définitivement, pas reportée) :
- Le contenu qui lui était assigné **glisse en avant** : toutes les séances suivantes du même groupe (même méthode) décalent leur `content_ref` d'un cran
- Exemple : Séances 21(contenu#21), 22(#22), 23(#23). Si séance 22 est annulée → séance 22 reçoit contenu#21 (déjà fait) MAIS séance 22 est annulée → le contenu#22 glisse sur la prochaine séance planifiée → Slot 22 = annulée, Slot 23 = contenu#22, Slot 24 = contenu#23
- Si c'est la **dernière** séance de l'année qui est annulée → le dernier contenu (#30 ou #32) est simplement perdu pour cette saison
- Le décalage ne s'applique qu'aux types avec contenu séquentiel : `goal_and_player`, `technique`, `situationnel`
- Types non affectés par le décalage : `decisionnel`, `perfectionnement`, `integration`, `equipe`

### Vue Calendrier Admin
- Vue mensuelle par défaut, filtrable par implantation (obligatoire) et groupe
- Chaque "card séance" dans le calendrier affiche :
  - Nom du groupe + type pédagogique (color-coded par méthode via `methodologyMethodColors`)
  - Heure + durée
  - Référence de contenu (ex: "GP-08A", "TAB-01", "Technique #12")
  - Statut (planifiée / réalisée / annulée / reportée) avec badge couleur
  - Compteur présence si réalisée : `X / Y` (présents / roster attendu)
- Navigation mois précédent / suivant
- Clic sur card → page détail `sessions/[sessionId]`

## Acceptance Criteria

**AC1 — Table `school_calendar_exceptions`**
- **Given** la migration `00058_school_calendar_auto_gen.sql` appliquée
- **When** on consulte le calendrier des exceptions
- **Then** la table existe avec : `id UUID, tenant_id UUID FK tenants, date DATE NOT NULL, label TEXT, is_no_session BOOLEAN DEFAULT true, UNIQUE(tenant_id, date)`
- **And** elle est pré-remplie avec les vacances scolaires belges typiques pour la saison 2025-2026 dans la seed/migration

**AC2 — API : auto-génération d'une année**
- **Given** un groupe configuré (jour, heure, durée, méthode, `session_type`)
- **When** l'admin appelle `generateYearSessions(groupId, seasonStart, seasonEnd)`
- **Then** les séances sont créées pour chaque occurrence du jour de la semaine du groupe entre `seasonStart` et `seasonEnd`, en excluant les dates dans `school_calendar_exceptions` où `is_no_session = true`
- **And** chaque séance reçoit un `content_ref` séquentiel calculé automatiquement selon le type de méthode du groupe
- **And** si des séances existent déjà pour ce groupe × [seasonStart..seasonEnd], l'API retourne une erreur `SESSIONS_ALREADY_EXIST` avec le count existant

**AC3 — Calendrier admin : vue mensuelle**
- **Given** l'admin est sur `/sessions`
- **When** il sélectionne une implantation et un mois
- **Then** les séances du mois s'affichent dans une grille calendrier (colonnes = jours de la semaine ou jours du mois)
- **And** chaque card affiche : groupe, type (color-coded), heure, content_ref label, statut, compteur présence
- **And** les séances `annulée` restent visibles avec badge rouge + raison (tooltip ou texte court)

**AC4 — Report d'une séance**
- **Given** une séance `status = 'planifiée'`
- **When** l'admin choisit "Reporter" et saisit une nouvelle date
- **Then** `sessions.scheduled_at` est mis à jour, `status = 'reportée'`, la séance reste visible dans le calendrier à sa date d'origine avec mention "→ reportée au [date]"
- **And** si la nouvelle date tombe en conflit avec une autre séance du même groupe, un warning est affiché (non-bloquant)
- **And** le `content_ref` ne change pas

**AC5 — Annulation avec décalage de contenu**
- **Given** une séance `status = 'planifiée'` avec `session_type ∈ [goal_and_player, technique, situationnel]`
- **When** l'admin choisit "Annuler" et saisit une raison
- **Then** la séance passe à `status = 'annulée'`, `cancellation_reason` rempli
- **And** toutes les séances suivantes planifiées du même groupe (même session_type) reçoivent le `content_ref` de la séance précédente (décalage d'un cran en avant)
- **And** une confirmation est demandée à l'admin avant exécution : "Cette annulation va décaler le contenu pédagogique de X séances suivantes. Confirmer ?"
- **And** si c'est la dernière séance de la séquence, le dernier contenu est marqué comme perdu (log dans `audit_logs` avec `action = 'session_content_lost'`)

**AC6 — UI génération d'année**
- **Given** l'admin est sur `/groups/[groupId]` ou `/sessions`
- **When** il clique "Générer les séances [saison]"
- **Then** un modal s'ouvre avec : champ date début (défaut = 1er septembre), champ date fin (défaut = 30 juin), aperçu du nombre de séances qui seront créées, liste des dates exclues (vacances), case à cocher "Inclure malgré les vacances" par date
- **And** après confirmation, les séances sont créées et l'admin voit le calendrier mis à jour

**AC7 — Override calendrier scolaire**
- **Given** une page settings admin `Calendrier scolaire`
- **When** l'admin ajoute/modifie/supprime une exception
- **Then** la table `school_calendar_exceptions` est mise à jour
- **And** les générations futures utilisent les exceptions mises à jour
- **And** les séances déjà générées ne sont pas affectées (historique figé)

## Tasks / Subtasks

- [ ] Task 1 — Migration `00058_school_calendar_auto_gen.sql` (AC: #1)
  - [ ] 1.1 Créer `school_calendar_exceptions` + RLS (`admin` peut tout, autres SELECT)
  - [ ] 1.2 Seed : INSERT des vacances scolaires belges 2025-2026 par défaut
  - [ ] 1.3 Ajouter index `(tenant_id, date)` pour lookup rapide lors de la génération

- [ ] Task 2 — API : auto-génération (AC: #2)
  - [ ] 2.1 Créer `generateYearSessions(groupId, seasonStart, seasonEnd, options?): Promise<{ created: number, skipped: string[] }>` dans `api-client/src/sessions/sessions.ts`
  - [ ] 2.2 Fonction helper `buildSessionSequence(group, seasonStart, seasonEnd, exceptions): SessionDraft[]` — calcule les dates + `content_ref` séquentiels
  - [ ] 2.3 Fonction `computeContentRef(sessionType, sequenceIndex, groupContext): SessionContentRef`
  - [ ] 2.4 INSERT batch (utiliser `supabase.from('sessions').insert(batch)` en chunks de 50)
  - [ ] 2.5 Gestion idempotency : SELECT COUNT avant INSERT, retourner erreur si > 0

- [ ] Task 3 — API : report et annulation (AC: #4, #5)
  - [ ] 3.1 `postponeSession(sessionId, newDate): Promise<void>` — UPDATE scheduled_at + status
  - [ ] 3.2 `cancelSession(sessionId, reason: string): Promise<{ contentShiftCount: number }>` — UPDATE status + reason + décalage des content_refs suivants
  - [ ] 3.3 Fonction `shiftContentRefs(groupId, fromSessionId): Promise<number>` — UPDATE séquentiel des séances suivantes
  - [ ] 3.4 Log `audit_logs` si dernier contenu perdu

- [ ] Task 4 — Vue calendrier admin (AC: #3)
  - [ ] 4.1 Créer composant `<SessionCalendar implantationId sessions month />` dans `apps/web/app/(admin)/sessions/page.tsx`
  - [ ] 4.2 Grille mensuelle : 7 colonnes (lundi→dimanche), rows = semaines du mois
  - [ ] 4.3 Composant `<SessionCard session />` : affiche groupe, type color-coded, heure, content label, statut badge, compteur présence
  - [ ] 4.4 Filtre par implantation (obligatoire, sélecteur en haut de page) + optionnellement par groupe
  - [ ] 4.5 Navigation mois avec `<` `>` + affichage "Mars 2026"
  - [ ] 4.6 Séances annulées : visibles avec fond rouge pâle + icône "annulé" + tooltip raison

- [ ] Task 5 — UI génération d'année (AC: #6)
  - [ ] 5.1 Bouton "Générer les séances" sur page groupe (`/groups/[groupId]` onglet Séances)
  - [ ] 5.2 Modal `<GenerateYearModal groupId />` : date début/fin, preview count, exceptions listées avec toggles
  - [ ] 5.3 Appel `generateYearSessions()` + toast "X séances créées" ou error handling si déjà existantes

- [ ] Task 6 — UI report et annulation (AC: #4, #5)
  - [ ] 6.1 Sur `sessions/[sessionId]/page.tsx` : boutons "Reporter" et "Annuler" (visible si status = planifiée, admin only)
  - [ ] 6.2 Modal "Reporter" : DatePicker + validation conflits
  - [ ] 6.3 Modal "Annuler" : champ raison (requis) + warning "X séances suivantes seront décalées" + bouton confirmer
  - [ ] 6.4 Afficher dans le détail : si reportée → "Reportée au [date]" badge, si annulée → raison + "Contenu décalé"

- [ ] Task 7 — Settings calendrier scolaire (AC: #7)
  - [ ] 7.1 Page `app/(admin)/settings/school-calendar/index.tsx` : liste des exceptions, formulaire ajout, suppression
  - [ ] 7.2 API : `listSchoolCalendarExceptions()`, `addException()`, `removeException()`
  - [ ] 7.3 Ajouter lien "Calendrier scolaire" dans settings admin

## Dev Notes

### Migration `00058_school_calendar_auto_gen.sql`

```sql
CREATE TABLE school_calendar_exceptions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  date          DATE        NOT NULL,
  label         TEXT        NOT NULL,
  is_no_session BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, date)
);

ALTER TABLE school_calendar_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON school_calendar_exceptions
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "all_select" ON school_calendar_exceptions
  FOR SELECT USING (tenant_id = current_tenant_id());

-- Seed vacances scolaires belges 2025-2026 (réseau libre, Belgique francophone)
-- À adapter : dates approximatives, l'admin peut les modifier
INSERT INTO school_calendar_exceptions (tenant_id, date, label) VALUES
-- Toussaint 2025 (27 oct - 2 nov)
(current_tenant_id(), '2025-10-27', 'Vacances Toussaint'),
(current_tenant_id(), '2025-10-28', 'Vacances Toussaint'),
(current_tenant_id(), '2025-10-29', 'Vacances Toussaint'),
(current_tenant_id(), '2025-10-30', 'Vacances Toussaint'),
(current_tenant_id(), '2025-10-31', 'Vacances Toussaint'),
(current_tenant_id(), '2025-11-01', 'Toussaint (férié)'),
-- Noël 2025-2026 (22 déc - 4 jan)
(current_tenant_id(), '2025-12-22', 'Vacances Noël'),
-- ... (continuer pour toutes les semaines de vacances)
-- Carnaval 2026 (16 - 22 fév)
(current_tenant_id(), '2026-02-16', 'Vacances Carnaval'),
-- Pâques 2026 (6 - 19 avr)
(current_tenant_id(), '2026-04-06', 'Vacances Pâques');
-- Note : seed complet à écrire avec toutes les dates semaine par semaine
```

### Algorithme `computeContentRef`

```typescript
function computeContentRef(
  sessionType: SessionType,
  index: number,        // 0-based position dans la séquence annuelle du groupe
  groupContext: { method: MethodologyMethod }
): SessionContentRef {
  switch (sessionType) {
    case 'goal_and_player': {
      // 15 entraînements répétés 2× = 30 séances par an
      // index 0-14 = repeat 1 (A), index 15-29 = repeat 2 (B)
      const repeat = index < 15 ? 1 : 2
      const pos = index % 15          // 0-14
      const module = Math.floor(pos / 5) + 1  // 1-3
      const sequence = (pos % 5) + 1           // 1-5
      return { method: 'goal_and_player', module, sequence, globalNumber: pos + 1, half: 'A', repeat }
    }
    case 'technique': {
      // 32 séances académie : 8 modules × 4 séances
      const module = Math.floor(index / 4) + 1
      const sequence = (index % 4) + 1
      return { method: 'technique', context: 'academie', module, sequence, globalNumber: index + 1 }
    }
    case 'situationnel': {
      // 7 blocs, 2 séances par bloc, rotation
      const blocCodes: SituationalBlocCode[] = ['TAB','1V1','BAL_AER','BAL_PROF','REL','PHA_ARR','COMM']
      const blocIndex = Math.floor(index / 2) % blocCodes.length
      const blocCode = blocCodes[blocIndex]
      const sequence = (Math.floor(index / (2 * blocCodes.length)) * 2) + (index % 2) + 1
      const label = `${blocCode}-${String(sequence).padStart(2, '0')}`
      return { method: 'situationnel', blocCode, sequence, label }
    }
    default:
      return { method: sessionType as any }
  }
}
```

### Algorithme `shiftContentRefs`

```typescript
// Décale content_ref de toutes les séances planifiées après fromSessionId
// pour le même groupe et le même session_type
async function shiftContentRefs(groupId: string, cancelledSession: Session) {
  // 1. Récupérer toutes les séances suivantes planifiées du même groupe/type
  const nextSessions = await supabase
    .from('sessions')
    .select('id, content_ref, scheduled_at')
    .eq('group_id', groupId)
    .eq('session_type', cancelledSession.session_type)
    .eq('status', 'planifiée')
    .gt('scheduled_at', cancelledSession.scheduled_at)
    .order('scheduled_at', { ascending: true })

  if (!nextSessions.data?.length) return 0

  // 2. Décaler : chaque séance[i] reçoit content_ref de séance[i-1]
  // La première séance suivante garde son content_ref inchangé
  // (le contenu annulé est perdu, pas "ramené" en arrière)
  // → On ne change rien en fait : les séances gardent leur content_ref.
  // Ce qui change : la séance annulée disparaît de la séquence numérique,
  // donc le "gap" visuel est comblé. On NE recalcule PAS les numéros
  // car c'est trop complexe. On log juste la perte.
  // Implémentation simplifiée MVP : log audit + afficher gap dans l'UI.
  await supabase.from('audit_logs').insert({
    entity_type: 'session',
    entity_id: cancelledSession.id,
    action: 'session_content_lost',
    metadata: { contentRef: cancelledSession.content_ref, groupId }
  })
  return 0
}
```

> **Note architecturale** : Le "décalage réel" des content_refs est complexe. En MVP, on adopte une approche conservatrice : les séances gardent leur `content_ref` original, et le gap est visible dans l'UI. Un recalcul complet peut être fait manuellement par l'admin via "Recalculer la séquence". Cela évite des bugs dans un système critique.

## File List

### New Files
- `supabase/migrations/00058_school_calendar_auto_gen.sql`
- `aureak/apps/web/app/(admin)/sessions/page.tsx` — remplacement complet par vue calendrier
- `aureak/apps/web/app/(admin)/settings/school-calendar/index.tsx` — gestion exceptions

### Modified Files
- `aureak/packages/api-client/src/sessions/sessions.ts` — generateYearSessions, postponeSession, cancelSession, shiftContentRefs, listSchoolCalendarExceptions, addException, removeException
- `aureak/apps/web/app/(admin)/sessions/[sessionId]/page.tsx` — boutons reporter/annuler + modals
- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` — bouton "Générer les séances" dans onglet Séances
- `aureak/apps/web/app/(admin)/_layout.tsx` — lien Settings > Calendrier scolaire

## Dev Agent Record

- [ ] Story créée le 2026-03-09 — dépend de Story 13-1 (session_type + content_ref)
- [ ] Précondition : migration 00057 appliquée
- [ ] Point de vigilance : l'algorithme de décalage de content_ref est simplifié en MVP (log + gap visible). Un recalcul automatique complet est une amélioration future.
- [ ] Les dates de vacances belges dans la seed sont approximatives et doivent être validées par l'admin avant la première génération
