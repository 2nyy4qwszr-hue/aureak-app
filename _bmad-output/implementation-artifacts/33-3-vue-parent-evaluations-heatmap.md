# Story 33.3 : Vue Parent — Présences, Badges & Heatmap Assiduité

Status: done

## Story

En tant que parent d'un enfant inscrit à l'académie,
Je veux voir les présences de mon enfant avec les badges reçus, pouvoir justifier ses absences et visualiser son assiduité sur la saison,
Afin de suivre sa participation et rester informé de ce que le coach observe lors de chaque séance.

## Contexte Métier

- Le parent voit uniquement les données de SES enfants (RLS)
- Les badges comportementaux sont attribués par le coach — le parent les reçoit en push
- Le motif d'absence est renseigné par le parent — visible par le coach avant la séance
- Les absences justifiées (blessure, match, école, voyage, vacances) ne dégradent pas le score d'assiduité
- Un enfant multi-groupe a plusieurs présences par semaine — toutes visibles

## Acceptance Criteria

**AC1 — Récap Post-Séance par Push**
- **When** une séance se termine et le débrief est validé
- **Then** les parents de chaque enfant présent reçoivent un push :
  "✅ [PRÉNOM] était présent — Séance [MÉTHODE] du [DATE]"
  + badges reçus si applicable : "Il a reçu : 🎯 Réceptivité + 💪 Effort"
- **And** si absent avec motif : "❌ [PRÉNOM] était absent (Match). Prochaine séance : [DATE]"
- **And** si absent sans motif : "❌ [PRÉNOM] était absent. Avez-vous une raison à communiquer ?"

**AC2 — Justification d'Absence**
- **When** un enfant est absent ou va être absent
- **Then** le parent peut renseigner un motif depuis l'app : Blessure / Match-Terrain / École / Voyage scolaire / Vacances / Autre
- **And** le motif est visible par le coach sur la grille de présences (icône 📌 sur la photo de l'enfant)
- **And** les absences avec motif "légitime" (hors Autre) n'impactent pas le score d'assiduité
- **And** le parent peut saisir le motif avant la séance ou jusqu'à 48h après

**AC3 — Heatmap Assiduité Visuelle**
- **When** le parent consulte la fiche de son enfant
- **Then** un calendrier de points colorés affiche l'historique de présences :
  - 🟢 Vert = présent
  - 🔴 Rouge = absent sans motif
  - 🟠 Orange = retard
  - 🔵 Bleu = absent avec motif légitime
  - ⚫ Gris = blessé (absent blessure)
- **And** le taux de présence global et le taux "présences / séances programmées" sont affichés

**AC4 — Historique Badges par Enfant**
- **When** le parent consulte la fiche de son enfant
- **Then** il voit l'historique de tous les badges reçus sur la saison, classés par date
- **And** chaque badge indique : date, séance, coach qui l'a attribué
- **And** un compteur par badge montre la fréquence : "💪 Effort — reçu 8 fois cette saison"

**AC5 — Photo Souvenir Visible**
- **When** un coach a pris une photo souvenir de la séance
- **Then** la photo apparaît dans la fiche de la séance côté parent
- **And** un push est envoyé : "📸 La photo de la séance du [DATE] est disponible"
- **And** la photo n'est visible que par les parents des enfants du groupe concerné

**AC6 — Vue Multi-Groupe**
- **When** un enfant est dans plusieurs groupes
- **Then** le parent voit toutes ses présences de tous les groupes dans une vue unifiée
- **And** chaque séance indique le groupe correspondant
- **And** la heatmap agrège toutes les séances cross-groupes

**AC7 — Connexion Quêtes Epic 12**
- **When** un enfant reçoit des badges comportementaux
- **Then** ces badges alimentent son compteur de quêtes Epic 12
- **And** le badge présence (automatique) génère +1 streak
- **And** le parent voit dans la fiche enfant : "🔥 Streak 5 séances consécutives"

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase
  - [x] 1.1 Table `absence_justifications` : child_id, session_id, reason CHECK, note, submitted_by, submitted_at
  - [x] 1.2 Vue `v_child_attendance_heatmap` : child_id, session_date, heatmap_status (present/absent/justified/injured/unconfirmed)
  - [x] 1.3 Vue `v_child_badge_history` : child_id, badge_id, badge_name, emoji, session_id, session_date, awarded_by_name
  - [x] 1.4 RLS : parent ses propres enfants (via parent_children), admin tout, coach séances associées

- [x] Task 2 — Types TypeScript `@aureak/types`
  - [x] 2.1 `AbsenceReason`, `AbsenceJustification`, `HeatmapStatus`, `AttendanceHeatmapEntry`, `ChildBadgeHistory`

- [x] Task 3 — API `@aureak/api-client`
  - [x] 3.1 `submitAbsenceJustification(params)` — motif absence avec upsert
  - [x] 3.2 `getChildAttendanceHeatmap(childId)` — données heatmap (6 derniers mois)
  - [x] 3.3 `getChildBadgeHistory(childId)` — historique badges complet
  - [x] 3.4 `computeAttendanceStats(entries)` — taux présence + taux qualité (excl. justifiés + blessés)
  - [x] 3.5 `getSessionPhoto(sessionId)` — photo souvenir avec URL publique

- [x] Task 4 — UI Parent `apps/web/app/(parent)/children/[childId]/`
  - [x] 4.1 `presences/page.tsx` — heatmap + stats cards + liste recap
  - [x] 4.2 Composant `AttendanceHeatmap` — grille GitHub-style avec légende
  - [x] 4.3 `JustificationModal` — sélecteur 6 raisons + note pour "Autre"
  - [x] 4.4 `badges/page.tsx` — compteurs fréquence + historique détaillé
  - [x] SubNav dans fiche enfant mis à jour avec onglets Présences + Badges

- [ ] Task 5 — Notifications (Edge Functions — hors scope, à implémenter Epic 14)

## Dev Notes

### Score d'assiduité
- Absences "légitimes" (injury/match/school/school_trip/vacation) = exclues du score négatif
- Absences "other" = comptées comme non justifiées
- Formule : `présences / (total_séances - absences_légitimes - absences_blessure)`

### Heatmap
- Composant `AttendanceHeatmap` : inspiré des contribution graphs GitHub
- Affiche les 6 derniers mois par défaut, filtrable par saison
- Mobile-friendly : points plus grands sur mobile, scroll horizontal

### Motif d'absence
- Le parent peut saisir AVANT la séance (planification) ou jusqu'à 48h après
- Le motif "Blessure" est distinct de l'absence blessure gérée via le module injuries (Story 32.2)
- Si blessure confirmée dans le module injuries → l'absence est automatiquement qualifiée

### Connexion Epic 12
- Le hook badge présence → streak est dans `session_badge_awards` avec badge_id = 'presence'
- L'intégration complète des quêtes est dans Epic 12 — cette story pose juste les données

### Dépendances
- Story 33.2 pour les badges et photos (données créées par le coach)
- Story 33.1 pour les corrections admin (audit trail)
- Epic 12 pour la logique complète des quêtes (optionnel pour cette story)
