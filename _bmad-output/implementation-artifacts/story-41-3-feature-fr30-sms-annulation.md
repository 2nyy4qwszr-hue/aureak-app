# Story 41-3 — Feature: FR30 SMS annulation séance

**Epic:** 41
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin ou coach, je veux pouvoir annuler une séance et notifier automatiquement les parents par SMS afin de les prévenir rapidement d'une annulation de dernière minute.

## Acceptance Criteria
- [ ] AC1: Un bouton "Annuler la séance" est visible dans `seances/[sessionId]/page.tsx` pour les séances à venir (status ≠ 'cancelled')
- [ ] AC2: Un clic sur ce bouton ouvre une confirmation modale avec champ optionnel "Motif d'annulation"
- [ ] AC3: La confirmation déclenche l'appel à la Edge Function `cancel-session-notify`
- [ ] AC4: La séance passe en status 'cancelled' dans la DB
- [ ] AC5: Si Twilio SMS est implémenté dans la Edge Function, les parents des enfants de la séance reçoivent un SMS
- [ ] AC6: Si Twilio n'est pas configuré (env vars absentes), la function se rabat sur email/push sans erreur
- [ ] AC7: Un toast "Séance annulée — parents notifiés" s'affiche après succès
- [ ] AC8: La séance annulée affiche un badge "Annulée" rouge dans l'UI

## Tasks
- [ ] Lire `supabase/functions/cancel-session-notify/index.ts` pour vérifier l'implémentation actuelle
- [ ] Si SMS Twilio absent: modifier la Edge Function pour ajouter l'appel Twilio SMS avec env vars `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — avec guard `if (Deno.env.get('TWILIO_ACCOUNT_SID'))` pour ne pas crasher si absent
- [ ] Modifier `aureak/packages/api-client/src/sessions.ts` (ou chemin existant) — ajouter `cancelSession(sessionId, motif?)` qui appelle la Edge Function via `supabase.functions.invoke('cancel-session-notify', { body: { sessionId, motif } })`
- [ ] Modifier `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — ajouter bouton "Annuler la séance" (visible si status ≠ 'cancelled'), modal de confirmation avec champ motif
- [ ] Ajouter badge "Annulée" (variant `danger` de `Badge`) si status = 'cancelled' dans la page détail séance
- [ ] Vérifier QA: try/finally sur cancelSession, console guards présents dans la page et dans api-client

## Dev Notes
- Fichiers à modifier:
  - `supabase/functions/cancel-session-notify/index.ts`
  - `aureak/packages/api-client/src/sessions.ts` (ou équivalent)
  - `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
- Env vars Twilio à documenter dans `.env.example` (ne pas committer les valeurs réelles)
- Format SMS Twilio minimal:
  ```typescript
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const body = new URLSearchParams({
    From: fromNumber,
    To: parentPhone,
    Body: `Séance annulée le ${date}. Motif: ${motif ?? 'Non communiqué'}`
  })
  await fetch(twilioUrl, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}` },
    body
  })
  ```
- Récupérer les numéros des parents: join `attendance` → `children` → `profiles` (champ `phone` dans profiles)
- Si `phone` absent pour un parent, skiper silencieusement (log dev only)
- Pas de nouvelle migration SQL nécessaire si `sessions.status` existe déjà avec valeur 'cancelled'
