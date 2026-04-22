# Story 99.5 — Administration : template + titres groupe "Conformité (RGPD & Audit)"

Status: done

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.5
- **Story key** : `99-5-template-conformite`
- **Priorité** : P2
- **Dépendances** : **97.3** + **99.1** + **99.2**
- **Source** : Audit UI 2026-04-22. Uniformisation template sur 4 pages du groupe Conformité.
- **Effort estimé** : M (~3-5h — 4 pages, dont certaines techniques)

## Story

As an admin,
I want que les 4 pages du groupe "Conformité" (RGPD, audit, anomalies, RGPD prospects) utilisent le template `<AdminPageHeader />` v2,
So that la zone Administration soit visuellement uniforme.

## Contexte

### Pages cibles après 99.2

- `/administration/conformite/rgpd`
- `/administration/conformite/audit`
- `/administration/conformite/anomalies`
- `/administration/conformite/rgpd-prospects`

### Titres

| URL | Titre |
|---|---|
| `/administration/conformite/rgpd` | "RGPD" |
| `/administration/conformite/audit` | "Audit" |
| `/administration/conformite/anomalies` | "Anomalies" |
| `/administration/conformite/rgpd-prospects` | "RGPD prospects" |

## Acceptance Criteria

1. **Page RGPD** : `<AdminPageHeader title="RGPD" />`.

2. **Page Audit** : title "Audit".

3. **Page Anomalies** : title "Anomalies".

4. **Page RGPD prospects** : title "RGPD prospects".

5. **Breadcrumb / retour** : lien "← Administration" sur chaque page.

6. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Headers custom inline → AdminPageHeader
   - Hex → 0 match

7. **try/finally + console guards** sur setters (surtout Audit qui peut avoir des requêtes lourdes).

8. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns.

9. **Test Playwright** :
   - 4 pages chargent avec bons titres
   - Console zéro erreur
   - Pages RGPD/Audit : vérifier que les requêtes data lourdes passent en état loading propre

10. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** des features RGPD / audit / anomalies
    - **Pas de changement de policies RLS** ou de logique conformité
    - **Pas de migration URL** (99.2)
    - **Pas d'ajout de nouvelles règles de conformité**

## Tasks / Subtasks

- [ ] **T1 — Page RGPD** (AC #1)
- [ ] **T2 — Page Audit** (AC #2)
- [ ] **T3 — Page Anomalies** (AC #3)
- [ ] **T4 — Page RGPD prospects** (AC #4)
- [ ] **T5 — Breadcrumb retour** (AC #5)
- [ ] **T6 — QA** (AC #8, #9)

## Dev Notes

### Page RGPD

Contient probablement la gestion des demandes RGPD (droit à l'oubli, export perso, etc.). Workflow métier complexe à préserver.

### Page Audit

Liste des logs d'audit système (actions admin, modifs sensibles). Peut être très volumineuse — vérifier pagination / filtre temporel existants, les préserver.

### Page Anomalies

Détection d'anomalies data (FK manquantes, enfants sans parent, etc.). Préserver la logique de scan existante.

### References

- Pages (post-99.2) : `app/(admin)/administration/conformite/`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
- Types et api-client : `@aureak/types`, `@aureak/api-client`
