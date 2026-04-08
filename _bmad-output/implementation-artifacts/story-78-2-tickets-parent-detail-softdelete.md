# Story 78.2 : Module Tickets — Page détail parent + soft-delete

Status: done

## Story

En tant que Parent,
je veux consulter le fil de réponses d'un ticket et pouvoir fermer ma demande,
afin de suivre l'évolution de ma demande et clore le dialogue une fois résolu.

## Acceptance Criteria

1. **AC1 — Page détail ticket parent** : la route `/parent/tickets/[ticketId]` affiche le corps du ticket (sujet, catégorie, date, statut) + la liste ordonnée des réponses (auteur, horodatage, corps) dans un fil chronologique.

2. **AC2 — Navigation depuis la liste** : dans `/parent/tickets`, chaque ticket de la liste est cliquable (`Pressable`) et navigue vers `/parent/tickets/[ticketId]`.

3. **AC3 — Réponse parent** : si le statut du ticket est `open` ou `in_progress`, un champ textarea + bouton "Envoyer" permettent au parent d'ajouter une réponse via `replyToTicket()` (API existante). Try/finally obligatoire sur l'état `replying`.

4. **AC4 — Soft-delete ticket** : le parent peut clore sa demande via "Fermer ma demande" → `softDeleteTicket(ticketId)` → `deleted_at = now()` dans la table `tickets`. Le ticket disparaît de `listMyTickets()` (filtre `deleted_at IS NULL`).

5. **AC5 — Migration idempotente** : la migration `00144_tickets_softdelete.sql` ajoute `deleted_at TIMESTAMPTZ` à `tickets` avec `IF NOT EXISTS` et met à jour `listMyTickets` (filtre côté API) sans rupture.

6. **AC6 — API softDeleteTicket exportée** : `softDeleteTicket(ticketId)` est exportée depuis `@aureak/api-client` et utilisable dans l'UI parent.

7. **AC7 — Design tokens** : aucune couleur hardcodée — uniquement `colors.*`, `space.*`, `radius.*`, `shadows.*` de `@aureak/theme`. Console guards présents sur tous les `catch`.

## Tasks / Subtasks

- [x] T1 — Migration soft-delete tickets (AC: 4, 5)
  - [x] T1.1 — Créer `supabase/migrations/00144_tickets_softdelete.sql` avec `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`
  - [x] T1.2 — Mettre à jour la RLS policy `tickets_parent_own` pour filtrer `deleted_at IS NULL` dans la vue parent (recreate policy)

- [x] T2 — API softDeleteTicket (AC: 4, 6)
  - [x] T2.1 — Ajouter `softDeleteTicket(ticketId: string)` dans `aureak/packages/api-client/src/parent/tickets.ts`
  - [x] T2.2 — Mettre à jour `listMyTickets()` : ajouter `.is('deleted_at', null)` dans la requête
  - [x] T2.3 — Exporter `softDeleteTicket` depuis `aureak/packages/api-client/src/index.ts`

- [x] T3 — Page détail ticket parent (AC: 1, 3)
  - [x] T3.1 — Créer `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/page.tsx` — affichage ticket + fil réponses + formulaire réponse parent + bouton "Fermer ma demande"
  - [x] T3.2 — Créer `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/index.tsx` — re-export de `./page`

- [x] T4 — Navigation depuis la liste (AC: 2)
  - [x] T4.1 — Dans `aureak/apps/web/app/(parent)/parent/tickets/page.tsx`, encapsuler chaque ticket card dans `Pressable` → `router.push(`/parent/tickets/${ticket.id}`)` (remplace le `View` actuel)

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Vérifier que `/parent/tickets` affiche la liste et que chaque ligne navigue vers `/parent/tickets/[ticketId]`
  - [x] T5.2 — Vérifier que le fil de réponses s'affiche (réponses admin visibles côté parent)
  - [x] T5.3 — Vérifier que "Fermer ma demande" → ticket disparaît de la liste
  - [x] T5.4 — Vérifier grep try/finally sur `setReplying` et `setClosing` dans `[ticketId]/page.tsx`
  - [x] T5.5 — Vérifier grep console guards dans tous les fichiers modifiés

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, ScrollView) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Migration 00144_tickets_softdelete.sql

```sql
-- Migration 00144 : Soft-delete sur table tickets (Story 78.2)
-- Ajoute deleted_at pour RGPD. Filtre appliqué côté API (listMyTickets).

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tickets_deleted_at_idx ON tickets (deleted_at) WHERE deleted_at IS NULL;

-- Recréer la policy parent pour exclure les tickets supprimés
DROP POLICY IF EXISTS "tickets_parent_own" ON tickets;
CREATE POLICY "tickets_parent_own" ON tickets
  FOR ALL
  USING (
    deleted_at IS NULL
    AND (parent_id = auth.uid() OR current_user_role() IN ('admin','coach'))
  );
```

Contraintes :
- IF NOT EXISTS sur la colonne
- Soft-delete uniquement — jamais de DELETE physique
- Index partiel pour performance des requêtes `WHERE deleted_at IS NULL`

---

### T2 — API softDeleteTicket

Ajouter dans `aureak/packages/api-client/src/parent/tickets.ts` :

```typescript
export async function softDeleteTicket(
  ticketId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('tickets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ticketId)

  return { error }
}
```

Mettre à jour `listMyTickets` :
```typescript
export async function listMyTickets(): Promise<{ data: Ticket[]; error: unknown }> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .is('deleted_at', null)           // ← ajout de cette ligne
    .order('created_at', { ascending: false })

  return { data: (data as Ticket[]) ?? [], error }
}
```

---

### T3 — Page détail ticket parent

Pattern de référence : `aureak/apps/web/app/(admin)/tickets/[ticketId]/page.tsx` (fil réponses admin)

```tsx
// aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/page.tsx
// Story 78.2 — Fil de réponses ticket (côté parent)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getTicketWithReplies, replyToTicket, softDeleteTicket } from '@aureak/api-client'
import type { Ticket, TicketReply, TicketStatus } from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'

const STATUS_LABELS: Record<TicketStatus, string> = {
  open       : 'Ouvert',
  in_progress: 'En cours',
  resolved   : 'Résolu',
  closed     : 'Fermé',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open       : colors.accent.gold,
  in_progress: colors.status.info,
  resolved   : colors.status.present,
  closed     : colors.text.muted,
}

export default function ParentTicketDetailPage() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>()
  const router = useRouter()

  const [ticket,   setTicket]   = useState<Ticket | null>(null)
  const [replies,  setReplies]  = useState<TicketReply[]>([])
  const [loading,  setLoading]  = useState(true)
  const [replyBody, setReplyBody] = useState('')
  const [replying,  setReplying]  = useState(false)
  const [closing,   setClosing]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const { ticket: t, replies: r } = await getTicketWithReplies(ticketId)
      setTicket(t)
      setReplies(r)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [ticketId])

  const handleReply = async () => {
    if (!replyBody.trim() || !ticketId) return
    setReplying(true)
    setError(null)
    try {
      const { error: err } = await replyToTicket(ticketId, replyBody.trim())
      if (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] replyToTicket error:', err)
        setError('Erreur lors de l\'envoi.')
        return
      }
      setReplyBody('')
      await fetchData()
    } finally {
      setReplying(false)
    }
  }

  const handleClose = async () => {
    if (!ticketId) return
    setClosing(true)
    try {
      const { error: err } = await softDeleteTicket(ticketId)
      if (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] softDeleteTicket error:', err)
        return
      }
      router.replace('/parent/tickets')
    } finally {
      setClosing(false)
    }
  }

  // ... JSX (voir pattern admin/tickets/[ticketId]/page.tsx)
}
```

---

### T4 — Navigation dans la liste parent

Dans `aureak/apps/web/app/(parent)/parent/tickets/page.tsx`, remplacer le `View` wrappant chaque ticket card par un `Pressable` :

```tsx
// AVANT
{tickets.map((ticket) => (
  <View key={ticket.id} style={styles.card}>

// APRÈS
{tickets.map((ticket) => (
  <Pressable
    key={ticket.id}
    onPress={() => router.push(`/parent/tickets/${ticket.id}` as never)}
    style={styles.card}
  >
```

Ajouter `useRouter` depuis `expo-router` dans les imports.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius } from '@aureak/theme'

// Card ticket
backgroundColor : colors.light.surface
borderRadius    : radius.md        // ou 8
boxShadow       : shadows.sm
borderColor     : colors.border.light

// Reply card (bulle réponse staff)
backgroundColor : colors.light.muted
borderRadius    : radius.sm

// Statut badge
color (open)    : colors.accent.gold
color (resolved): colors.status.present
color (closed)  : colors.text.muted
```

Principes design à respecter :
- Profondeur obligatoire — box-shadow sm sur les cards, jamais flat
- Fond clair — `colors.light.primary` (#F3EFE7) comme background page
- Panel dans panel — le fil de réponses = contenu contextuel sans quitter la vue

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00144_tickets_softdelete.sql` | Créer | Ajout `deleted_at` + recreation policy |
| `aureak/packages/api-client/src/parent/tickets.ts` | Modifier | Ajouter `softDeleteTicket()` + filtre `deleted_at IS NULL` dans `listMyTickets` |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter `softDeleteTicket` |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/page.tsx` | Créer | Fil réponses + réponse parent + fermeture |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/index.tsx` | Créer | Re-export de `./page` |
| `aureak/apps/web/app/(parent)/parent/tickets/page.tsx` | Modifier | Cards → Pressable + navigation vers détail |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/parent/tickets.ts` fonctions `listAllTickets`, `replyToTicket`, `updateTicketStatus`, `getTicketWithReplies` — signatures inchangées (consommées par admin)
- `aureak/apps/web/app/(admin)/tickets/page.tsx` — non impacté
- `aureak/apps/web/app/(admin)/tickets/[ticketId]/page.tsx` — non impacté
- `supabase/migrations/00092_support_tickets.sql` — ne jamais modifier une migration existante

---

### Dépendances à protéger

- Story 7.4 (done) fournit les tables `tickets` + `ticket_replies`, l'API de base et les pages admin — ne pas modifier les signatures existantes
- `listAllTickets` côté admin ne doit PAS filtrer `deleted_at` (les admins voient tous les tickets, y compris fermés par les parents)

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Types Ticket/TicketReply/TicketStatus : `aureak/packages/api-client/src/parent/tickets.ts` lignes 1–37
- Pattern fil réponses admin : `aureak/apps/web/app/(admin)/tickets/[ticketId]/page.tsx`
- Pattern liste tickets parent : `aureak/apps/web/app/(parent)/parent/tickets/page.tsx`
- Story parente : `_bmad-output/implementation-artifacts/7-4-systeme-de-tickets-parent-minimal-trace.md`

---

### Multi-tenant

La colonne `tenant_id` est déjà présente sur `tickets` et `ticket_replies`. La RLS via `current_tenant_id()` assure l'isolation. La migration 00144 recrée la policy `tickets_parent_own` avec le filtre `deleted_at IS NULL` supplémentaire — les coaches/admins voient toujours tous les tickets (y compris soft-deleted) via la policy `tickets_staff_all`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — implémentation propre, 0 erreur TypeScript.

### Completion Notes List

- Tous les fichiers étaient déjà implémentés avant cette session (reprise). Vérification QA complète effectuée.
- radius.card et radius.xs utilisés (radius.md et radius.sm n'existent pas dans le thème).
- Try/finally sur setLoading (l.109), setReplying (l.129), setClosing (l.144).
- Console guards présents sur tous les catch.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00144_tickets_softdelete.sql` | Créé |
| `aureak/packages/api-client/src/parent/tickets.ts` | Modifié |
| `aureak/packages/api-client/src/index.ts` | Modifié |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/page.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/index.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/tickets/page.tsx` | Modifié |
| `supabase/migrations/00144_tickets_softdelete.sql` | Créé |
| `aureak/packages/api-client/src/parent/tickets.ts` | Modifié |
| `aureak/packages/api-client/src/index.ts` | Modifié |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/page.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/tickets/[ticketId]/index.tsx` | Créé |
| `aureak/apps/web/app/(parent)/parent/tickets/page.tsx` | Modifié |
