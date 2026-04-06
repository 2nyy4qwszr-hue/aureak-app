# Story 65.2 : Activités — Onglet Présences (vue transversale)

Status: done

Epic: 65 — Activités Hub Unifié (Séances · Présences · Évaluations)

## Référence visuelle

Figma : https://www.figma.com/design/HFoTEXwV01khcWelhoUtD1/Untitled?node-id=0-1
Écran "Activités - Présences" centre — onglet Présences actif

## Story

En tant qu'admin Aureak supervisant l'assiduité,
je veux un onglet Présences dans la page Activités qui affiche les données de présence de façon transversale avec une vue adaptée selon le filtre actif,
afin d'identifier instantanément les groupes sous-performants et les joueurs à surveiller.

## Acceptance Criteria

1. Route `(admin)/activites/presences/` — onglet PRÉSENCES actif (underline gold)
2. Même filtres scope que 65-1 : **Global** · **Implantation ▾** · **Groupe ▾** · **Joueur ▾** (conservés pour cohérence entre les 3 pages)
3. 4 stat cards adaptées aux présences :
   - **Moyenne Générale** : "84.5 %" Geist Mono 32px + barre progress gold dessous
   - **Groupes sous 70%** : "3" Geist Mono 32px + "X implantations concernées" sous-texte — badge rouge si >0
   - **Total Séances** : "128" + delta "↓ -13% vs mois précédent" (rouge si baisse)
   - **Tendance Globale** : card fond dark #1A1A1A, texte gold "+2.1 ↗" grand format + "Progression vs Septembre 2024" sous-texte
4. **Vue Global / Implantation — Tableau groupes × séances** :
   - Titre "Registre des Présences" + légende dots : ● Présent ● Absent ● Retard
   - Header colonnes : GROUPE · [5 dernières dates] · ASSIDUITÉ MOYENNE
   - Lignes = groupes, cellules = taux de présence coloré :
     - Fond vert #D1FAE5, texte #065F46 si ≥ 80%
     - Fond orange #FFF7ED, texte #9A3412 si 60–79%
     - Fond rouge #FEF2F2, texte #B91C1C si < 60%
   - Colonne ASSIDUITÉ = moyenne sur la période, affichée en bold
   - Pagination : "Affichage de 1 sur N groupes" + flèches
   - Note cliquable sous le tableau : "Cliquer sur un groupe pour voir le détail joueurs"
5. **Vue Groupe — Heatmap joueurs × séances** :
   - Lignes = joueurs du groupe : avatar initiales 32px + nom cliquable
   - Colonnes = 5 dernières séances (date + méthode)
   - Dots 20px : vert présent · rouge absent · orange retard · violet #CE93D8 blessé · gris non convoqué
   - Section "🔴 À surveiller" épinglée en haut si ≥ 2 absences consécutives
   - Colonne ASSIDUITÉ % à droite, triable (desc par défaut)
   - Clic nom joueur → `(admin)/children/[childId]/`
6. **Vue Joueur** — redirige vers la fiche joueur `(admin)/children/[childId]/` (le filtre Joueur est maintenu pour la cohérence des 3 pages)
7. Pas de sous-titre descriptif — uniquement le header onglets commun

## Tasks / Subtasks

- [x] T1 — Route
  - [x] T1.1 — Créer `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
  - [x] T1.2 — Créer `aureak/apps/web/app/(admin)/activites/presences/index.tsx`

- [x] T2 — Réutilisation layout ActivitesHeader + FiltresScope
  - [x] T2.1 — Importer `ActivitesHeader` depuis `../components/ActivitesHeader`
  - [x] T2.2 — Importer `FiltresScope` depuis `../components/FiltresScope` (créé en 65-1)
  - [x] T2.3 — Onglet PRÉSENCES actif détecté via `usePathname()` (géré dans ActivitesHeader)

- [x] T3 — Stat Cards Présences
  - [x] T3.1 — Appel `listSessionsWithAttendance()` + `listAttendancesBySession()` batch
  - [x] T3.2 — Calcul : taux moyen · nb groupes sous 70% · total séances + delta · tendance
  - [x] T3.3 — Card "Tendance Globale" : fond #1A1A1A (`colors.dark.surface`), texte gold `colors.accent.gold`, delta grand format, sous-texte gris
  - [x] T3.4 — try/finally sur setLoading

- [x] T4 — Vue Global/Implantation : tableau groupes × séances
  - [x] T4.1 — Appel `listAllGroups()` ou `listGroupsByImplantation(id)` selon filtre
  - [x] T4.2 — Pour chaque groupe : 5 dernières séances + taux de présence par séance
  - [x] T4.3 — Construction matrice `{ groupId × sessionId → presenceRate% }`
  - [x] T4.4 — Header colonnes = 5 dernières dates (format "MER 25 OCT")
  - [x] T4.5 — Cellules colorées selon seuils (fond + texte) via tokens `colors.status.*Bg/Text`
  - [x] T4.6 — Colonne ASSIDUITÉ = moyenne des taux, bold
  - [x] T4.7 — Pagination 10 groupes/page
  - [x] T4.8 — Légende ● Présent ● Absent ● Retard en haut du tableau
  - [x] T4.9 — Clic sur une ligne groupe → passe le filtre scope sur ce groupe

- [x] T5 — Vue Groupe : heatmap joueurs × séances
  - [x] T5.1 — Appel `listGroupMembersWithProfiles(groupId)`
  - [x] T5.2 — Appel `listAttendancesBySession()` batch sur les 5 dernières séances du groupe
  - [x] T5.3 — Matrix `{ childId × sessionId → AttendanceStatus }`
  - [x] T5.4 — Section "🔴 À surveiller" : joueurs avec `absent` ≥ 2 fois sur les 3 dernières séances
  - [x] T5.5 — Dot 20px coloré par statut via `colors.status.*`
  - [x] T5.6 — Avatar initiales 32px gold + nom cliquable → fiche joueur
  - [x] T5.7 — Colonne ASSIDUITÉ % triable desc
  - [x] T5.8 — try/finally sur setLoading

- [x] T6 — Vue Joueur
  - [x] T6.1 — Si `childId` dans les filtres → `router.push('/(admin)/children/' + childId)`

- [x] T7 — QA
  - [x] T7.1 — `npx tsc --noEmit` zéro erreur
  - [x] T7.2 — console guards sur tous les catch
  - [ ] T7.3 — Playwright : onglet Présences, vue Global visible, switch Groupe → heatmap (app non démarrée)

## Dev Notes

### Logique vue selon filtre scope
```typescript
if (scope === 'joueur' && childId) {
  router.push('/(admin)/children/' + childId)
  return
}
if (scope === 'global' || scope === 'implantation') {
  // Tableau groupes × séances
}
if (scope === 'groupe' && groupId) {
  // Heatmap joueurs × séances
}
```

### Calcul "À surveiller"
```typescript
const isAtRisk = (attendances: Attendance[]) => {
  const lastThree = attendances.slice(-3)
  return lastThree.filter(a => a.status === 'absent').length >= 2
}
```

### API
```typescript
import { listAllGroups, listGroupsByImplantation, listGroupMembersWithProfiles } from '@aureak/api-client'
import { listAttendancesBySession, listActiveAbsenceAlerts } from '@aureak/api-client'
import { listSessionsAdminView } from '@aureak/api-client'
```

### Migration DB
Aucune — calculs côté frontend depuis données existantes.

### Dépendances
- Dépend de 65-1 (composants ActivitesHeader + FiltresScope)

## File List

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/activites/presences/index.tsx` | Créer |
