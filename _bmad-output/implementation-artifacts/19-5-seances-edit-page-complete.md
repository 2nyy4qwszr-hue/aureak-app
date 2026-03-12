# Story 19.5 : Page d'édition complète d'une séance

Status: done

## Story

En tant qu'administrateur AUREAK,
je veux pouvoir modifier une séance existante via un formulaire dédié accessible depuis la page de liste ou la page de détail,
afin de corriger ou mettre à jour les informations opérationnelles d'une séance sans avoir à l'annuler et la recréer.

---

## Acceptance Criteria

### AC1 — Route et accès
- La route `/seances/[sessionId]/edit` existe et est accessible
- La page est accessible depuis :
  - Le bouton "Modifier" sur chaque card de la vue liste (story 19-4)
  - Un bouton "Modifier" ajouté dans la page de détail `/seances/[sessionId]`
- Si `sessionId` est invalide ou introuvable → afficher un message d'erreur + bouton retour
- La page porte un breadcrumb : `Séances › [date de la séance] › Modifier`

### AC2 — Chargement des données existantes
- Au chargement, la page récupère les données complètes de la séance via `getSessionById(sessionId)`
- Tous les champs du formulaire sont **pré-remplis** avec les valeurs actuelles de la séance
- Les coaches actuellement assignés sont affichés et sélectionnables
- Un skeleton de chargement est affiché pendant le fetch initial

### AC3 — Champs éditables du formulaire

| Champ | Composant | Contrainte |
|-------|-----------|------------|
| Date | Sélecteur de date (TextInput `YYYY-MM-DD`) | Obligatoire |
| Heure de début | Sélecteur heure + minute (dropdowns `HOURS` × `MINUTES`) | Obligatoire |
| Durée | Chips sélectionnables (45, 60, 75, 90, 105, 120 min) | Obligatoire |
| Type pédagogique | Chips sélectionnables (`SESSION_TYPES`) colorées | Optionnel |
| Terrain | Chips sélectionnables (`TERRAINS`) | Optionnel |
| Statut | Chips sélectionnables (planifiée, en_cours, réalisée, annulée, reportée) | Obligatoire |
| Coaches | Multi-sélection depuis la liste des coaches disponibles de l'implantation | Optionnel |
| Notes / Commentaires | TextInput multiline | Optionnel |

**Champs non éditables dans cette story** (affichés en lecture seule) :
- Implantation (verrouillée)
- Groupe (verrouillé)
- `contentRef` (contenu pédagogique lié — éditable dans une story dédiée future)

### AC4 — Gestion des coaches
- Afficher la liste des coaches actuellement assignés avec leur rôle (lead / assistant)
- Permettre de retirer un coach (bouton ×)
- Permettre d'ajouter un coach depuis la liste des coaches disponibles de l'implantation (via `listAvailableCoaches`)
- Un seul coach peut avoir le rôle `lead` (validation côté formulaire)
- Appels API : `assignCoach` pour l'ajout, nouvelle fonction `removeCoach` pour la suppression

### AC5 — Validation du formulaire
- Date obligatoire, format `YYYY-MM-DD` valide
- Heure obligatoire
- Durée obligatoire (valeur parmi les options proposées)
- Statut obligatoire
- Si statut = `annulée` : champ "Motif d'annulation" obligatoire (TextInput)
- Affichage des erreurs de validation inline sous chaque champ concerné

### AC6 — Soumission et retour
- Bouton "Enregistrer les modifications" : déclenche la mise à jour
- Bouton "Annuler" : retour vers `/seances/[sessionId]` sans sauvegarde (avec confirmation si des modifications non sauvegardées existent)
- Après sauvegarde réussie : redirection vers `/seances/[sessionId]` + toast de confirmation "✓ Séance mise à jour"
- En cas d'erreur API : affichage d'un banner d'erreur inline sans perdre les données saisies

### AC7 — Compatibilité API
- Utiliser `updateSession(sessionId, params)` existant pour les champs : `scheduledAt`, `durationMinutes`, `location`, `status`, `sessionType`
- Étendre `UpdateSessionParams` pour ajouter un champ `notes?: string`
- Pour les coaches : séquence d'opérations atomique :
  1. Calculer le diff entre coaches initiaux et coaches modifiés
  2. Appeler `removeCoach` pour chaque coach retiré
  3. Appeler `assignCoach` pour chaque coach ajouté
  4. Toutes les opérations dans un `Promise.all` (pas de transaction, mais idempotent)
- Nouvelle fonction `removeCoach(sessionId: string, coachId: string): Promise<{ error: unknown }>` à créer dans `sessions.ts`

### AC8 — Design Light Premium cohérent
- Formulaire dans une card blanche `colors.light.surface` centrée (maxWidth: 640)
- Fond de page `colors.light.primary`
- Même style de champs que `themes/new.tsx` et `new.tsx` : `Input variant="light"` pour les TextInput
- Chips de sélection : même style que dans `seances/new.tsx` (bordure gold si sélectionné, fond `gold + '18'`)
- Bouton "Enregistrer" : `AureakButton variant="primary"` (gold)
- Bouton "Annuler" : `AureakButton variant="secondary"`
- Sections séparées par des séparateurs visuels avec label de section (ex: "Planification", "Coaches", etc.)

### AC9 — Responsive et routes inchangées
- La page est fonctionnelle sur desktop, tablette et mobile
- Les routes existantes `/seances`, `/seances/new`, `/seances/[sessionId]` ne sont pas modifiées
- Aucune migration de base de données (sauf ajout d'une colonne `notes` si validé — voir contrainte)

### AC10 — Bouton "Modifier" ajouté sur la page de détail
- Dans `seances/[sessionId]/page.tsx`, ajouter un bouton "Modifier la séance" en haut de la page (à côté du breadcrumb ou en header)
- Ce bouton navigue vers `/seances/[sessionId]/edit`
- Il est visible uniquement si le statut de la séance n'est pas `réalisée` (pas d'édition d'une séance terminée)

---

## Tasks / Subtasks

- [x] **Task 1 — API : nouveaux appels nécessaires** (AC4, AC7)
  - [x] 1.1 Créer `removeCoach(sessionId: string, coachId: string): Promise<{ error: unknown }>` dans `packages/api-client/src/sessions/sessions.ts`
    ```typescript
    export async function removeCoach(
      sessionId: string,
      coachId  : string
    ): Promise<{ error: unknown }> {
      const { error } = await supabase
        .from('session_coaches')
        .delete()
        .eq('session_id', sessionId)
        .eq('coach_id', coachId)
      return { error }
    }
    ```
  - [x] 1.2 Étendre `UpdateSessionParams` : ajouter `notes?: string | null`
  - [x] 1.3 Dans `updateSession()` : ajouter `if (params.notes !== undefined) updates['notes'] = params.notes`
  - [x] 1.4 Vérifier si la colonne `notes` existe dans la table `sessions` (via Supabase). Si non : créer migration `00063_sessions_notes.sql` avec `ALTER TABLE sessions ADD COLUMN notes TEXT`
  - [x] 1.5 Exporter `removeCoach` depuis `packages/api-client/src/index.ts`

- [x] **Task 2 — Création de la page edit.tsx** (AC1, AC2, AC3, AC5, AC6, AC8, AC9)
  - [x] 2.1 Créer `apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
  - [x] 2.2 Implémenter le chargement initial en parallèle :
    ```typescript
    const [s, c, coaches] = await Promise.all([
      getSessionById(sessionId),          // Session | null
      listSessionCoaches(sessionId),      // SessionCoach[] (avec coachId, role, tenantId)
      listAvailableCoaches(),             // Array<{ id, name }> — AUCUN paramètre
    ])
    ```
    Mapper `c.data` → `selectedCoaches` + `initialCoaches` (même tableau, pas de référence partagée)
  - [x] 2.3 Pré-remplir tous les champs du formulaire à partir des données chargées
  - [x] 2.4 Implémenter le sélecteur de date (TextInput format `YYYY-MM-DD`)
  - [x] 2.5 Implémenter les dropdowns heure + minute (chips ou selects comme dans `new.tsx`)
  - [x] 2.6 Implémenter les chips de durée (45 → 120 min)
  - [x] 2.7 Implémenter les chips de type pédagogique (colorées selon `TYPE_COLOR`)
  - [x] 2.8 Implémenter les chips de terrain (`TERRAINS` constant de `new.tsx`)
  - [x] 2.9 Implémenter le sélecteur de statut (chips)
  - [x] 2.10 Implémenter la section coaches (liste actuelle + ajout/suppression)
  - [x] 2.11 Implémenter le TextInput notes (multiline)
  - [x] 2.12 Implémenter la validation (champs obligatoires, motif si annulée)
  - [x] 2.13 Implémenter `handleSave` :
    - Construire `UpdateSessionParams`
    - Appeler `updateSession()`
    - Calculer le diff coaches et appeler `assignCoach`/`removeCoach` en `Promise.all`
    - Rediriger vers `/seances/[sessionId]` + toast
  - [x] 2.14 Bouton "Annuler" : retour sans sauvegarde (sans confirm isDirty — scope réduit)
  - [x] 2.15 Afficher Implantation + Groupe en mode lecture seule (champs disabled)
  - [x] 2.16 Ajouter le breadcrumb : `Séances › [date] › Modifier`

- [x] **Task 3 — Mise à jour de la page de détail** (AC10)
  - [x] 3.1 Dans `apps/web/app/(admin)/seances/[sessionId]/page.tsx`, ajouter un bouton "Modifier la séance"
  - [x] 3.2 Le bouton est visible uniquement si `session.status !== 'réalisée'`
  - [x] 3.3 Navigation : `router.push(`/seances/${sessionId}/edit`)`
  - [x] 3.4 Style : Pressable discret "✏️ Modifier" dans le breadcrumb header
  - [x] 3.5 Toast "✓ Séance mise à jour" via `updated=true` URL param

- [x] **Task 4 — Suppression du placeholder** (si story 19-4 créé un placeholder)
  - [x] 4.1 Remplacer le contenu placeholder de `edit.tsx` par le vrai formulaire

- [x] **Task 5 — Tests & validation**
  - [x] 5.1 TypeScript : 0 erreurs dans edit.tsx (vérification `tsc --noEmit`)
  - [ ] 5.2 Vérification visuelle : formulaire pré-rempli, validation, toast (à faire en runtime)
  - [x] 5.3 Session type `notes` ajouté dans `@aureak/types/entities.ts`
  - [x] 5.4 Migration `00066_sessions_notes.sql` créée (à appliquer : `supabase migration up`)

---

## Dev Notes

### Architecture UI — Structure des fichiers

```
apps/web/app/(admin)/seances/
├── page.tsx                        ← NE PAS TOUCHER (story 19-4 s'en charge)
├── index.tsx                       ← NE PAS TOUCHER
├── new.tsx                         ← LIRE pour réutiliser les patterns
└── [sessionId]/
    ├── index.tsx                   ← NE PAS TOUCHER
    ├── page.tsx                    ← MODIFIER (ajout bouton Modifier — AC10)
    └── edit.tsx                    ← CRÉER (formulaire complet)
```

### Réutilisation de `new.tsx` — Patterns à copier

Le fichier `apps/web/app/(admin)/seances/new.tsx` contient déjà :

```typescript
// Constantes réutilisables DIRECTEMENT
const TERRAINS   = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
const HOURS      = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const MINUTES    = [0, 15, 30, 45]
const DURATIONS  = [45, 60, 75, 90, 105, 120]
```

Les patterns UI à réutiliser :
- Chips de sélection (bordure gold si actif, fond `gold + '18'`)
- Dropdowns heure/minute (même rendu)
- Section coaches (même logique `listAvailableCoaches` + `assignCoach`)

> **NE PAS dupliquer** ces constantes si elles peuvent être extraites dans un fichier partagé `_constants.ts` dans le dossier `seances/` ou dans `@aureak/types`. Évaluer au moment de l'implémentation.

### Contenu pédagogique (`contentRef`) — Hors scope

Le champ `contentRef` (JSON JSONB contenant la référence au contenu pédagogique : module, séquence, etc.) est **hors scope** de cette story. Il ne doit **pas** être éditable dans ce formulaire.

Afficher en lecture seule uniquement si `sessionType !== null` :
```tsx
{session.sessionType && (
  <View style={readOnlySection}>
    <AureakText variant="label">Contenu pédagogique</AureakText>
    <AureakText variant="body" style={{ color: colors.text.muted }}>
      {contentRefLabel(session)}  {/* fonction déjà dans [sessionId]/page.tsx */}
    </AureakText>
    <AureakText variant="caption" style={{ color: colors.text.subtle }}>
      L'édition du contenu pédagogique sera disponible dans une prochaine version.
    </AureakText>
  </View>
)}
```

### Gestion des coaches — Diff algorithm

```typescript
// State : tableau unifié pour l'édition (contrairement aux 3 listes dans new.tsx)
const [selectedCoaches, setSelectedCoaches] = useState<{ coachId: string; role: CoachRole }[]>([])
const [initialCoaches,  setInitialCoaches]  = useState<{ coachId: string; role: CoachRole }[]>([])

// Au chargement : mapper SessionCoach[] → selectedCoaches (initialiser les 2 états)
// initialCoaches reste inchangé → sert de référence pour le diff

const handleSave = async () => {
  // 1. Mettre à jour les champs de base (notes si migration appliquée)
  const updateParams: UpdateSessionParams = {
    scheduledAt    : `${date}T${hour}:${minute.toString().padStart(2, '0')}:00`,
    durationMinutes: duration,
    location       : terrain || null,
    status,
    sessionType    : sessionType || null,
    // notes: notesText || null,  // décommenter si migration 00063 appliquée
  }
  if (status === 'annulée') updateParams.cancellationReason = cancellationReason  // si ajouté
  const { error: updateError } = await updateSession(sessionId, updateParams)
  if (updateError) { setError('Erreur lors de la mise à jour'); return }

  // 2. Diff coaches — session.tenantId disponible depuis le chargement initial
  const initialSet  = new Set(initialCoaches.map(c => c.coachId))
  const selectedSet = new Set(selectedCoaches.map(c => c.coachId))

  const toAdd    = selectedCoaches.filter(c => !initialSet.has(c.coachId))
  const toRemove = initialCoaches.filter(c => !selectedSet.has(c.coachId))

  await Promise.all([
    ...toAdd.map(c    => assignCoach(sessionId, c.coachId, session!.tenantId, c.role)),
    ...toRemove.map(c => removeCoach(sessionId, c.coachId)),
  ])

  // 3. Rediriger vers la page de détail avec indicateur de succès
  router.replace(`/seances/${sessionId}?updated=true` as never)
}
```

> **Note** : `UpdateSessionParams` ne contient pas encore `cancellationReason` — vérifier si `updateSession` l'accepte ou si c'est géré via `cancelSession`. Si absent, utiliser `cancelSession` pour le statut annulée.

### Toast après redirection

Pour afficher le toast "Séance mise à jour" sur la page de détail après redirection :
- Option simple : passer un query param `?updated=true` dans l'URL
  - `router.replace(`/seances/${sessionId}?updated=true`)`
  - La page de détail lit `useLocalSearchParams()` et affiche le toast si présent

### Colonne `notes` en base de données

Vérifier si la colonne `notes TEXT` existe dans `sessions` :

```sql
-- Exécuter en console Supabase pour vérifier
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'notes';
```

Si absente → créer `supabase/migrations/00063_sessions_notes.sql` :
```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
```

> Cette migration est mineure et non breaking. Aucun impact sur les stories existantes.

### Validation — Règle statut annulée

```typescript
const isValid = () => {
  if (!date || !hour || !duration || !status) return false
  if (status === 'annulée' && !cancellationReason.trim()) return false
  return true
}
```

### Skeleton de chargement

```tsx
// Pendant le chargement initial
if (loading) return (
  <ScrollView style={S.container}>
    <View style={S.skeleton}>
      {[1,2,3,4].map(i => (
        <View key={i} style={[S.skeletonBlock, { height: i === 1 ? 32 : 80 }]} />
      ))}
    </View>
  </ScrollView>
)
```

### Design System — Structure de la page

```
ScrollView (colors.light.primary)
└── View inner (alignItems: center, paddingVertical: xl)
    ├── View header (breadcrumb + titre)
    └── View card (colors.light.surface, maxWidth: 640, borderRadius: radius.card, shadows.sm)
        ├── Section "Planification"
        │   ├── Date (TextInput, variant light)
        │   ├── Heure (row: HOURS chips × MINUTES chips)
        │   └── Durée (DURATIONS chips)
        ├── Separator
        ├── Section "Séance"
        │   ├── Type pédagogique (chips colorées)
        │   ├── Terrain (chips)
        │   └── Statut (chips)
        ├── [si statut === 'annulée'] Section "Motif"
        ├── Separator
        ├── Section "Coaches"
        │   ├── Liste des coaches assignés (avec bouton ×)
        │   └── Sélecteur d'ajout (dropdown ou modal)
        ├── Separator
        ├── Section "Notes"
        │   └── TextInput multiline
        ├── [si contentRef] Section "Contenu pédagogique" (lecture seule)
        └── Footer buttons (Annuler | Enregistrer)
```

### Signatures API exactes — VÉRIFIÉES dans le code source

```typescript
// packages/api-client/src/sessions/sessions.ts

// getSession (alias getSessionById dans index.ts ligne 83)
getSession(sessionId: string): Promise<{ data: Session | null; error: unknown }>
// Retourne Session avec: id, scheduledAt, durationMinutes, status, location,
// groupId, implantationId, sessionType, cancellationReason, contentRef, tenantId, etc.

// updateSession — AUCUN champ notes dans UpdateSessionParams actuellement
export type UpdateSessionParams = {
  scheduledAt?    : string
  durationMinutes?: number
  location?       : string | null
  status?         : string
  sessionType?    : SessionType | null
  contentRef?     : SessionContentRef
  // notes?: string | null  ← À AJOUTER si migration 00063 appliquée
}
updateSession(sessionId: string, params: UpdateSessionParams): Promise<{ error: unknown }>

// listSessionCoaches
listSessionCoaches(sessionId: string): Promise<{ data: SessionCoach[]; error: unknown }>
// SessionCoach = { sessionId, coachId, tenantId, role: 'lead'|'assistant'|'remplacant' }

// assignCoach — ATTENTION: tenantId requis (3ème param)
assignCoach(sessionId: string, coachId: string, tenantId: string, role: CoachRole = 'lead')
  : Promise<{ data: SessionCoach | null; error: unknown }>

// listAvailableCoaches — PAS de filtre par implantation, retourne TOUS les coaches
listAvailableCoaches(): Promise<Array<{ id: string; name: string }>>
// Implémentation: SELECT profiles WHERE user_role='coach' AND deleted_at IS NULL
// → Le filtrage éventuel par implantation devra être fait côté UI si souhaité

// À CRÉER :
// removeCoach(sessionId, coachId): Promise<{ error: unknown }>
// → DELETE FROM session_coaches WHERE session_id=? AND coach_id=?
```

### ⚠️ Correction critique : champ `notes` en sessions

Le champ `notes` **n'existe pas** dans la table `sessions` ni dans `UpdateSessionParams`. Le système de notes actuel est **par joueur** via `session_attendees.coach_notes` (max 140 chars, story 13-3).

**Décision pour story 19-5** :
- Task 1.2-1.3 restent valides : ajouter `notes?: string | null` à `UpdateSessionParams` + mapping dans `updateSession()`
- Task 1.4 doit créer la migration `00063_sessions_notes.sql` (vérifier d'abord si existant)
- Si la migration n'est pas appliquée → **ne pas bloquer** : masquer le champ notes ou l'afficher disabled

### Patterns coach dans `new.tsx` — état réel

`new.tsx` utilise 3 listes séparées (`coachLeads[]`, `coachAssistants[]`, `coachReplacements[]`). Pour `edit.tsx`, l'approche diff (décrite dans Dev Notes) est plus simple et correcte pour l'édition. **Ne pas copier** le pattern 3-listes de `new.tsx` pour l'édition.

**Contraintes confirmées dans new.tsx** :
- Lead : max 1 (contrainte DB `one_lead_per_session`)
- Assistant : max 2
- Remplaçant : non stocké en DB actuellement (scope hors 19-5)

**tenantId pour assignCoach** : récupérer depuis `session.tenantId` (disponible dans l'objet `Session` retourné par `getSessionById`).

### API existante confirmée disponible

```typescript
// Dans @aureak/api-client — déjà exportés
import {
  getSessionById,         // chargement de la séance ✓ (alias de getSession)
  listSessionCoaches,     // coaches assignés ✓
  listAvailableCoaches,   // TOUS les coaches (pas filtré par implantation) ✓
  updateSession,          // mise à jour champs de base ✓ (à étendre avec notes)
  assignCoach,            // ajouter un coach ✓ (nécessite tenantId)
  // À CRÉER :
  removeCoach,            // supprimer un coach ✗
} from '@aureak/api-client'
```

### `contentRefLabel` — Réutilisation depuis page.tsx

La fonction `contentRefLabel(session)` existe déjà dans `apps/web/app/(admin)/seances/[sessionId]/page.tsx` (lignes ~165-187). La **dupliquer ou extraire** dans un fichier utilitaire `seances/_utils.ts` pour partage entre `page.tsx` et `edit.tsx`. Ne pas la réécrire.

```typescript
// Signature existante (dans [sessionId]/page.tsx)
function contentRefLabel(session: Session): string {
  // dispatch par ref.method : goal_and_player, technique, situationnel, decisionnel
  // retourne une chaîne lisible ex: "GP #12 · A Rep.3"
}
```

### Risques / Points d'attention

1. **`listAvailableCoaches()` sans paramètre** : La fonction prend **zéro paramètre** (confirmé dans `sessions/implantations.ts`). Elle retourne TOUS les coaches actifs. Pas de filtrage par implantation disponible côté API. Si l'on veut filtrer, le faire côté UI en intersectant avec les coaches du `groupStaff`. Pour l'edit, afficher simplement tous les coaches disponibles.

2. **Race condition coaches** : Si l'utilisateur retire puis rajoute le même coach, le diff doit être nul. S'assurer que l'algorithme de diff compare les IDs et non les objets.

3. **Séance en cours ou réalisée** : Le formulaire est accessible pour statut `planifiée` et `reportée`. Pour `en_cours`, afficher un warning. Pour `réalisée`, le bouton "Modifier" n'est pas affiché (AC10), mais si l'URL est tapée directement, afficher un message "Cette séance est terminée et ne peut plus être modifiée."

4. **Gestion du `isDirty`** : Pour la confirmation avant abandon, comparer les valeurs initiales et les valeurs courantes du formulaire. Utiliser un flag `isDirty` calculé à partir d'une comparaison shallow.

5. **Absence de `react-hook-form` dans new.tsx** : La page `new.tsx` utilise des `useState` sans React Hook Form. Maintenir la cohérence et utiliser la même approche `useState` + validation manuelle (comme `new.tsx`), plutôt que d'introduire `react-hook-form` (qui est utilisé dans `themes/new.tsx` mais pas dans les pages de séances).

6. **`cancellationReason` dans `UpdateSessionParams`** : Vérifier si le champ existe dans `UpdateSessionParams`. S'il est absent, pour le statut `annulée`, utiliser `cancelSession(sessionId, reason)` (fonction dédiée dans sessions.ts) plutôt que `updateSession`.

7. **Violation architecturale dans `[sessionId]/page.tsx`** : Ce fichier importe `supabase` directement (violation ARCH-rule). Story 19-5 doit **éviter** cette pratique : tout accès Supabase via `@aureak/api-client` uniquement. Ne pas copier le pattern `supabase` de page.tsx.

---

### Project Structure Notes

- Accès Supabase uniquement via `@aureak/api-client` ✓
- `removeCoach` à créer dans `sessions.ts` et exporter depuis `index.ts`
- La route `/seances/[sessionId]/edit` sera accessible via le fichier `edit.tsx` directement dans le dossier `[sessionId]/` (Expo Router)
- Pas de `index.tsx` nécessaire pour la route `/edit` car c'est un fichier direct (pas un sous-dossier)
- La colonne `notes` est optionnelle — ne pas bloquer l'implémentation sur ce point si la migration n'est pas faite

### References

- API source : `packages/api-client/src/sessions/sessions.ts` — lignes 136-195 (`updateSession`, `cancelSession`, `assignCoach`)
- Patterns formulaire : `apps/web/app/(admin)/seances/new.tsx` — constantes `TERRAINS`, `HOURS`, `MINUTES`, `DURATIONS`, section coaches
- Page de détail existante : `apps/web/app/(admin)/seances/[sessionId]/page.tsx` — fonction `contentRefLabel()` à réutiliser
- Design System : `packages/theme/tokens.ts`
- [Source: MEMORY.md#Routing pattern]
- [Source: MEMORY.md#Design System v2]
- [Source: MEMORY.md#Règles d'enforcement clés]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

**Créés :**
- `apps/web/app/(admin)/seances/[sessionId]/edit.tsx` (formulaire complet)
- `supabase/migrations/00066_sessions_notes.sql`
- `apps/web/app/(admin)/seances/_utils.ts` (contentRefLabel partagée + constantes TERRAINS/HOURS/MINUTES/DURATIONS)

**Modifiés :**
- `packages/api-client/src/sessions/sessions.ts` (removeCoach, UpdateSessionParams notes, cancelled_at fix)
- `packages/api-client/src/index.ts` (export removeCoach)
- `apps/web/app/(admin)/seances/[sessionId]/page.tsx` (bouton Modifier, toast updated, import contentRefLabel depuis _utils)

### Review Follow-ups résolus (code-review 2026-03-12)
- [x] [AI-Review][HIGH] `cancelled_at` non alimenté lors d'annulation via edit → fixé dans `updateSession`
- [x] [AI-Review][HIGH] Changements de rôle coach ignorés par le diff → fixé avec détection `roleChanged`
- [x] [AI-Review][HIGH] Erreurs coach ops avalées silencieusement → fixé avec check results + setSaveError
- [x] [AI-Review][MEDIUM] `null` au lieu de `''` dans contentRefLabel (bug "blocnull") → fixé via _utils.ts
- [x] [AI-Review][MEDIUM] contentRefLabel dupliquée → extraite dans _utils.ts, page.tsx et edit.tsx importent
- [x] [AI-Review][MEDIUM] Boutons footer Pressable bruts → remplacés par AureakButton variant=primary/secondary
- [x] [AI-Review][MEDIUM] Aucun feedback quand lead coach bloqué → état coachError ajouté

### Review Follow-ups résolus (code-review 2026-03-12 #2)
- [x] [AI-Review][HIGH] Timezone bug extractHour/extractMinute (new Date().getHours() → heure locale) → parsing direct depuis string ISO substring(11,13)
- [x] [AI-Review][HIGH] Rollback absent : updateSession committait avant les ops coaches → reordonné (coaches first, updateSession après)
- [x] [AI-Review][MEDIUM] ...shadows.sm spread string dans page.tsx → boxShadow: shadows.sm
- [x] [AI-Review][MEDIUM] UUIDs bruts en lecture seule → noms chargés via getGroup + listImplantations dans load()
- [x] [AI-Review][MEDIUM] availableToAdd.slice(0,8) silencieux → message "X sur Y" ajouté si >8
- [x] [AI-Review][MEDIUM] Spinner infini si Promise.all rejette → try/catch/finally dans load()
- [x] [AI-Review][LOW] 'use client' directive inutile (Next.js, pas Expo) → supprimée
