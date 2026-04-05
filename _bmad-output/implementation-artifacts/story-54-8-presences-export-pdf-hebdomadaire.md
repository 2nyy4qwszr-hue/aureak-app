# Story 54-8 — Présences : Export rapport PDF hebdomadaire

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-8
- **Status** : done
- **Priority** : P3
- **Type** : Feature / Export
- **Estimated effort** : L (6–9h)
- **Dependencies** : Story 19-4 (done — page séances avec filtres), Story 49-4 (ready — présences enregistrées)

---

## User Story

**En tant qu'admin**, je veux pouvoir exporter un rapport PDF des présences de la semaine par groupe, depuis la page des séances, afin de pouvoir l'envoyer aux parents ou le conserver pour les archives de l'académie.

---

## Contexte technique

### Fichiers cibles
- `aureak/apps/web/app/(admin)/seances/page.tsx` — bouton "Exporter PDF"
- Nouveau utilitaire : `aureak/apps/web/app/(admin)/seances/_utils/generatePresenceReport.ts`

### Génération PDF côté client
Utiliser `window.print()` avec une vue imprimable stylisée via une `<div>` cachée contenant le rapport formaté. Alternative plus robuste : utiliser la librairie `jspdf` + `html2canvas`.

**Décision** : utiliser la **méthode `window.print()` avec CSS `@media print`** pour éviter une dépendance externe. Un `iframe` cachée avec le contenu HTML du rapport est injecté, puis `iframe.contentWindow.print()` est appelé.

### Données du rapport
- Toutes les séances de la semaine sélectionnée
- Pour chaque séance : groupe, date, heure, type, statut
- Pour chaque séance : liste joueurs avec leur statut de présence

---

## Acceptance Criteria

1. **AC1** — Un bouton "⬇ Exporter PDF" est affiché dans le header de `page.tsx`, visible uniquement en vue "Semaine".

2. **AC2** — Cliquer le bouton déclenche la génération et l'ouverture de la boîte de dialogue d'impression du navigateur avec le rapport pré-formaté.

3. **AC3** — Le rapport PDF contient : header avec logo Aureak (texte "AUREAK" stylisé), titre "Rapport de présences — Semaine du DD/MM au DD/MM YYYY", et une section par séance.

4. **AC4** — Chaque section séance affiche : groupe + date + heure + type (couleur méthode), et un tableau des joueurs avec leur statut (présent ✓ / absent ✗ / retard ⏱ / —).

5. **AC5** — Le rapport est filtré selon les filtres actifs (`filterImplantId`, `filterGroupId`) au moment de l'export.

6. **AC6** — Les données de présences sont chargées juste avant la génération du rapport (appel API `listAttendancesBySession` pour chaque séance de la semaine). Un état de chargement "Chargement du rapport…" est affiché pendant cette phase.

7. **AC7** — Le bouton est désactivé si aucune séance n'est affichée (liste vide).

8. **AC8** — Si le chargement des données échoue, un toast d'erreur est affiché et la génération est annulée.

---

## Tasks

- [x] **T1 — Créer `generatePresenceReport.ts` dans `_utils/`**

  ```typescript
  // aureak/apps/web/app/(admin)/seances/_utils/generatePresenceReport.ts

  import type { SessionRowAdmin } from '@aureak/api-client'

  export type PresenceReportData = {
    session   : SessionRowAdmin
    groupName : string
    attendances: { name: string; status: string }[]
  }

  export function buildPresenceReportHTML(
    weekLabel : string,
    sessions  : PresenceReportData[]
  ): string {
    // Retourne une string HTML complète avec styles @media print inline
  }
  ```

  Le HTML généré inclut :
  - `<style>` avec reset print, `@page { size: A4; margin: 20mm; }`
  - Header Aureak
  - Pour chaque séance : une section avec tableau joueurs
  - Couleurs méthode via un mapping CSS inline

- [x] **T2 — Fonction `printReport(html: string): void`**

  ```typescript
  export function printReport(html: string): void {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.contentDocument?.write(html)
    iframe.contentDocument?.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }
  ```

- [x] **T3 — Handler dans `page.tsx`**
  - `useState<boolean>` : `exportLoading`
  - Handler `handleExportPDF` :
    1. `setExportLoading(true)`
    2. Pour chaque séance de `filteredSessions` : charger les présences via `listAttendancesBySession`
    3. Résoudre les noms des joueurs via `childNameMap` (déjà disponible ou à charger)
    4. `buildPresenceReportHTML(range.label, reportData)`
    5. `printReport(html)`
    6. `finally: setExportLoading(false)`

- [x] **T4 — Bouton conditionnel en vue Semaine**
  - Ajouter dans le header de `page.tsx` : `{period === 'week' && <Pressable onPress={handleExportPDF}>…</Pressable>}`
  - Désactivé si `filteredSessions.length === 0` ou `exportLoading`
  - Texte : `exportLoading ? 'Chargement…' : '⬇ Exporter PDF'`

- [x] **T5 — Résolution des noms de joueurs**
  - Pour chaque séance, les présences ont `child_id` mais pas les noms
  - Utiliser `resolveProfileDisplayNames` ou `listChildDirectory` pour mapper les noms
  - Batch : collecter tous les `child_id` uniques de toutes les séances → une seule requête

- [x] **T6 — QA scan**
  - try/finally obligatoire sur `handleExportPDF`
  - Console guard sur les erreurs de chargement
  - Vérifier que l'iframe est bien supprimée après l'impression
  - Vérifier que le bouton ne s'affiche qu'en vue semaine

---

## Design détaillé

### Aperçu du rapport imprimé

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        AUREAK — RAPPORT DE PRÉSENCES
     Semaine du 07 au 13 avril 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚽ U12 Gardiens Liège A
Lundi 07 avril 2026 · 09h00 · 90 min · Goal & Player · ✓ Réalisée

  Jean Dupont            ✓ Présent
  Marie Laurent          ✗ Absent
  Thomas Bernard         ✓ Présent
  Alex Klein             ⏱ Retard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 U10 Liège
Mercredi 09 avril 2026 · 10h00 · 60 min · Technique · ✓ Réalisée
...

Imprimé le 04/04/2026 · aureak.be
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/_utils/generatePresenceReport.ts` | CREATE — HTML report builder |
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Ajouter bouton export + handler |

---

## Pas de migration SQL

Utilise les API existantes.

---

## Commit

```
feat(epic-54): story 54-8 — export rapport PDF présences hebdomadaires par groupe
```
