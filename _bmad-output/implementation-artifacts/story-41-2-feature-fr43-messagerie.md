# Story 41-2 — Feature: FR43 messagerie admin→coach

**Epic:** 41
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux pouvoir envoyer des messages internes aux coachs directement depuis l'application afin de communiquer sans dépendre d'un outil externe.

## Acceptance Criteria
- [ ] AC1: Une migration crée la table `coach_messages` si elle n'existe pas déjà
- [ ] AC2: La page `/messages` est accessible depuis le menu admin et liste les messages envoyés
- [ ] AC3: Un formulaire "Nouveau message" permet de choisir un coach destinataire, saisir un sujet et un corps
- [ ] AC4: Les messages envoyés sont affichés avec: destinataire, sujet, date d'envoi, statut lu/non-lu
- [ ] AC5: Depuis la vue coach (si applicable), les messages reçus sont visibles
- [ ] AC6: La soumission du formulaire est bloquée si sujet ou corps est vide
- [ ] AC7: Un toast de succès "Message envoyé" apparaît après soumission réussie

## Tasks
- [ ] Vérifier l'existence d'une table `messages` ou `coach_messages` via grep dans `supabase/migrations/`
- [ ] Si absente: créer `supabase/migrations/NNNNN_coach_messages.sql` avec `CREATE TABLE coach_messages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID REFERENCES tenants(id), from_admin_id UUID REFERENCES auth.users(id), to_coach_id UUID REFERENCES auth.users(id), subject TEXT NOT NULL, body TEXT NOT NULL, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ)` + RLS policies
- [ ] Créer `aureak/packages/types/src/entities.ts` entrée `CoachMessage` (ou dans le bon fichier types)
- [ ] Créer `aureak/packages/api-client/src/admin/messages.ts` — `listSentMessages`, `sendMessage`, `markAsRead`
- [ ] Créer `aureak/apps/web/app/(admin)/messages/page.tsx` — liste messages envoyés + formulaire nouveau message
- [ ] Créer `aureak/apps/web/app/(admin)/messages/index.tsx` — re-export `./page`
- [ ] Vérifier que la nav admin `_layout.tsx` a déjà un lien "/messages" — sinon l'ajouter
- [ ] Vérifier QA: try/finally sur submit et fetch, console guards présents

## Dev Notes
- Fichiers à modifier:
  - `supabase/migrations/NNNNN_coach_messages.sql` (nouveau — numéroter après la dernière migration existante)
  - `aureak/packages/types/src/entities.ts`
  - `aureak/packages/api-client/src/admin/messages.ts` (nouveau)
  - `aureak/packages/api-client/src/index.ts`
  - `aureak/apps/web/app/(admin)/messages/page.tsx` (nouveau ou modifier si existant)
  - `aureak/apps/web/app/(admin)/messages/index.tsx` (nouveau ou existant)
  - `aureak/apps/web/app/(admin)/_layout.tsx` (si lien absent)
- RLS policies: admin peut tout lire/écrire dans son tenant, coach peut lire ses messages reçus (to_coach_id = auth.uid())
- Champ `tenant_id` obligatoire pour isolation multi-tenant
- Soft-delete: `deleted_at` nullable — jamais de suppression physique
- ATTENTION: Vérifier le numéro de la dernière migration avant de créer: `ls supabase/migrations/ | tail -3`
