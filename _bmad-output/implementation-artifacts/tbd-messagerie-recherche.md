# Story: Recherche dans la messagerie admin

**ID:** tbd-messagerie-recherche
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Ajouter un champ de recherche dans la page messagerie admin pour filtrer les messages.

## Changements effectués
- Champ recherche `TextInput` dans `messages/index.tsx`
- Filtrage client-side sur `message.message` (contenu) et nom du destinataire
- Bouton clear (✕) pour réinitialiser la recherche
- Compteur `(filtré/total)` dans le header HISTORIQUE

## Acceptance Criteria
- [x] Champ recherche visible dans la section historique
- [x] Filtrage par contenu du message
- [x] Filtrage par nom du destinataire
- [x] Bouton clear
- [x] Compteur filtré/total

## Commit
`feat(messagerie): recherche par expéditeur/contenu`
