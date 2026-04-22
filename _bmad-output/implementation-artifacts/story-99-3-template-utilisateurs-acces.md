# Story 99.3 — Administration : template + titres groupe "Utilisateurs & accès"

Status: done

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.3
- **Story key** : `99-3-template-utilisateurs-acces`
- **Priorité** : P2
- **Dépendances** : **97.3** + **99.1** + **99.2**
- **Source** : Audit UI 2026-04-22. Uniformisation template sur les 5 pages du groupe Utilisateurs & accès.
- **Effort estimé** : M (~3-5h — 5 pages)

## Story

As an admin,
I want que les 5 pages du groupe "Utilisateurs & accès" (profil, access-grants, grade-permissions, waitlist, onboarding) utilisent le template `<AdminPageHeader />` v2 avec titre = sous-section active,
So that la zone Administration soit visuellement uniforme.

## Contexte

### Pages cibles après 99.2

- `/administration/utilisateurs/profile`
- `/administration/utilisateurs/access-grants`
- `/administration/utilisateurs/grade-permissions`
- `/administration/utilisateurs/waitlist`
- `/administration/utilisateurs/onboarding`

### Titres

| URL | Titre |
|---|---|
| `/administration/utilisateurs/profile` | "Mon profil" |
| `/administration/utilisateurs/access-grants` | "Accès accordés" |
| `/administration/utilisateurs/grade-permissions` | "Permissions par grade" |
| `/administration/utilisateurs/waitlist` | "Liste d'attente" |
| `/administration/utilisateurs/onboarding` | "Onboarding" |

## Acceptance Criteria

1. **Page Profile** : `<AdminPageHeader title="Mon profil" />`.

2. **Page Access grants** : title "Accès accordés".

3. **Page Grade permissions** : title "Permissions par grade".

4. **Page Waitlist** : title "Liste d'attente".

5. **Page Onboarding** : title "Onboarding".

6. **Breadcrumb / retour** : chaque page a un lien "← Administration" en tête ou via breadcrumb (implémentation selon pattern retenu en 99.1). Minimum : le titre AdminPageHeader + un lien textuel retour.

7. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Grep headers custom → remplacer
   - Grep hex → 0 match

8. **try/finally + console guards**.

9. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns.

10. **Test Playwright** :
    - 5 pages chargent avec bons titres
    - Console zéro erreur
    - Screenshots

11. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** de la gestion permissions, onboarding, waitlist
    - **Pas de migration URL** (99.2)
    - **Pas de structure nav intra-groupe complexe** (tabs internes)

## Tasks / Subtasks

- [ ] **T1 — 5 pages : header v2 + cleanup** (AC #1-8)
- [ ] **T2 — Breadcrumb retour** (AC #6)
- [ ] **T3 — QA** (AC #9, #10)

## Dev Notes

### Pattern de référence

Activités + Méthodologie post-97.3 — alignement mécanique.

### References

- Pages (post-99.2) : `app/(admin)/administration/utilisateurs/`
- Composants associés : `components/admin/profiles/` (déjà hors app/ depuis 95.1)
- Header : `components/admin/AdminPageHeader.tsx` (v2)
