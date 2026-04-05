# Story 53-2 — Séances : Fiche séance header Match Report

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-2
- **Status** : ready-for-dev
- **Priority** : P2
- **Type** : UX / Design
- **Estimated effort** : S (2–4h)
- **Dependencies** : Story 19-5 (done — fiche séance existante)

---

## User Story

**En tant qu'admin ou coach**, quand j'ouvre la fiche d'une séance, je veux voir un header premium de style "Match Report" avec le nom du groupe en grande typographie, la date formatée, un badge méthode coloré grand format, et une pill de statut visible, afin d'identifier immédiatement les informations clés sans devoir parcourir la page.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### État actuel
Le header actuel (lignes ~100–160 de la page) affiche :
- Breadcrumb "Séances › Fiche séance"
- Une `View card` avec nom du groupe, date, type, statut sous forme de lignes de texte compactes
- Badge statut standard via composant `Badge`

### Ce qui est demandé
Refactorisation du header en un bloc premium "Match Report" : fond dark (sidebar color `#1A1A1A`), stripe or en haut, nom groupe en H1 bold 28px blanc, date en sous-titre, badge méthode avec couleur TYPE_COLOR grand format (36px de hauteur), et pill statut en haut à droite.

---

## Acceptance Criteria

1. **AC1** — Le header premium est affiché en haut de la fiche séance, avant les cards de contenu. Il remplace l'ancienne zone nom/date/statut qui était dans la première card.

2. **AC2** — Le header a un fond `#1A1A1A` (dark) avec une stripe horizontale en haut de 3px couleur `colors.accent.gold`, et un border-radius de 12px en bas seulement (`borderBottomLeftRadius: 12, borderBottomRightRadius: 12`).

3. **AC3** — Le nom du groupe (ou label de la séance ponctuelle) est affiché en typographie `fontSize: 28, fontWeight: '900', color: '#FFFFFF'`.

4. **AC4** — La date est affichée en dessous en format long : "Mercredi 07 avril 2026 · 09h00" avec `color: colors.text.muted`.

5. **AC5** — Le badge méthode pédagogique utilise `TYPE_COLOR[session.sessionType]` : fond coloré à 20% d'opacité, bordure colorée, texte coloré, hauteur 36px, `SESSION_TYPE_LABELS[session.sessionType]` comme label, et une icône contextuelle devant (⚽ Goal & Player, 🎯 Technique, 📐 Situationnel, 🧠 Décisionnel, 💎 Perfectionnement, 🔗 Intégration).

6. **AC6** — La pill statut est positionnée en haut à droite du header en `position: absolute, top: 16, right: 16`. Elle utilise les variants `STATUS_VARIANT` du composant `Badge` existant.

7. **AC7** — Sur les séances annulées, le header a une opacity de 0.7 et un bandeau diagonal "ANNULÉE" en overlay subtil.

8. **AC8** — Le header est responsive : sur écran étroit (<768px), le badge méthode passe sous la date.

---

## Tasks

- [x] **T1 — Lire le header actuel**
  - Identifier les lignes exactes dans `page.tsx` qui constituent l'actuel bloc nom/date/statut
  - Noter tous les states utilisés : `session.groupId`, `groupNameMap`, `session.sessionType`, `session.status`, etc.

- [x] **T2 — Créer composant `MatchReportHeader`**
  - Composant local dans `page.tsx` (pas de fichier séparé)
  - Props : `{ session: Session; groupName: string }`
  - Inclut la date formatée : extraire depuis `session.sessionDate` + `session.startTime`

- [x] **T3 — Icônes méthode**
  - Map local `SESSION_TYPE_ICON: Record<SessionType, string>` :
    ```typescript
    const SESSION_TYPE_ICON: Partial<Record<SessionType, string>> = {
      goal_and_player: '⚽', technique: '🎯', situationnel: '📐',
      decisionnel: '🧠', perfectionnement: '💎', integration: '🔗',
    }
    ```

- [x] **T4 — Overlay "ANNULÉE"**
  - Si `session.status === 'annulée'` : ajouter `View` en `position: absolute` avec texte rotatif `-30deg` et `opacity: 0.12`
  - Utiliser `overflow: hidden` sur le header pour masquer le débordement

- [x] **T5 — Remplacer l'ancien header**
  - Supprimer le bloc JSX actuel (breadcrumb + card nom/date)
  - Intégrer `<MatchReportHeader>` en premier élément de la ScrollView content
  - Conserver le breadcrumb au-dessus (avant le header)

- [x] **T6 — QA scan**
  - Vérifier qu'aucune `console.log` non-guardée n'est introduite
  - Vérifier que les couleurs du header (#1A1A1A, #FFFFFF) sont des constantes nommées localement (pas inline)

---

## Design détaillé

```
┌─────────────────────────────────────────────────────────────┐  ← stripe or 3px
│                                                  [● Planif.] │
│  ⚽ Goal & Player                                             │
│                                                              │
│  U12 Gardiens Liège A                                        │
│  Mercredi 07 avril 2026 · 09h00 · 90 min                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘  fond #1A1A1A
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Refacto header : nouveau composant `MatchReportHeader` |

---

## Pas de migration SQL

Cette story est 100% front-end. Aucune table ni API nouvelle.

---

## Commit

```
feat(epic-53): story 53-2 — header Match Report premium sur fiche séance
```
