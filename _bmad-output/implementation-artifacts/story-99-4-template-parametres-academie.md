# Story 99.4 — Administration : template + titres groupe "Paramètres académie"

Status: done

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.4
- **Story key** : `99-4-template-parametres-academie`
- **Priorité** : P2
- **Dépendances** : **97.3** + **99.1** + **99.2**
- **Source** : Audit UI 2026-04-22. Uniformisation template sur 2 pages du groupe Paramètres académie.
- **Effort estimé** : S (~2-3h — 2 pages seulement)

## Story

As an admin,
I want que les 2 pages du groupe "Paramètres académie" (permissions, calendrier scolaire) utilisent le template `<AdminPageHeader />` v2,
So that la zone Administration soit visuellement uniforme sur tous les groupes.

## Contexte

### Pages cibles après 99.2

- `/administration/parametres/permissions`
- `/administration/parametres/calendrier-scolaire`

### Titres

| URL | Titre |
|---|---|
| `/administration/parametres/permissions` | "Permissions" |
| `/administration/parametres/calendrier-scolaire` | "Calendrier scolaire" |

## Acceptance Criteria

1. **Page Permissions** : `<AdminPageHeader title="Permissions" />`.

2. **Page Calendrier scolaire** : title "Calendrier scolaire".

3. **Breadcrumb / retour** : chaque page a lien retour "← Administration" selon pattern 99.1.

4. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Headers custom inline → AdminPageHeader
   - Hex → 0 match

5. **try/finally + console guards**.

6. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns.

7. **Test Playwright** : 2 pages chargent avec bon titre, console zéro erreur.

8. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** du calendrier scolaire ni de la matrice permissions
    - **Pas de migration URL** (99.2)

## Tasks / Subtasks

- [ ] **T1 — Page Permissions** (AC #1)
- [ ] **T2 — Page Calendrier scolaire** (AC #2)
- [ ] **T3 — Breadcrumb retour** (AC #3)
- [ ] **T4 — QA** (AC #6, #7)

## Dev Notes

### Page Permissions

Probablement la matrice `section_permissions` (Epic 86 — multi-rôle). UI complexe possible avec grille rôle × section. Ne pas la refondre — juste changer le header.

### Page Calendrier scolaire

Si contient un calendrier visuel interactif, le conserver tel quel.

### References

- Pages (post-99.2) : `app/(admin)/administration/parametres/`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
