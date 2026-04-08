# Story 69.6 : UX — Filtre "Mes séances" dans /seances pour les coachs

Status: done

## Story
En tant que coach, je veux pouvoir filtrer la liste des séances pour n'afficher que celles où je suis assigné, afin de trouver rapidement mes séances sans scroller dans toute l'académie.

## Acceptance Criteria
1. Dans `/seances`, ajouter un toggle pill "Toutes les séances / Mes séances" visible en haut des filtres
2. En mode "Mes séances" : filtrer la liste sur `session_coaches.coach_id = user.id` (via `useAuthStore`)
3. En mode "Toutes" : comportement actuel inchangé
4. Le filtre est persisté en mémoire locale (state) — pas de localStorage
5. Le toggle est visible par tous les utilisateurs (admin peut aussi filtrer ses séances)
6. Aucune migration DB — la jointure `session_coaches` existe

## Dev Notes
La page séances réelle est `aureak/apps/web/app/(admin)/seances/page.tsx` (l'`index.tsx` ne fait que re-exporter `./page`).

La page utilise `listSessionsAdminView` depuis `@aureak/api-client`. Vérifier si cette fonction accepte un filtre `coachId` — si oui l'utiliser. Sinon filtrer post-fetch sur les données `session.coaches` déjà chargées.

L'import `useAuthStore` provient de `@aureak/business-logic`.

Style toggle pills : reprendre le style des chips filtres existants dans `seances/page.tsx` (fond `colors.light.muted`, bordure `colors.border.light`, texte `colors.text.dark`). Pill active : fond `colors.accent.gold`, texte `colors.text.dark`, bordure `colors.border.goldSolid`.

## Tasks
- [ ] T1 — Dans `seances/page.tsx`, importer `useAuthStore` depuis `@aureak/business-logic`
- [ ] T2 — Ajouter state `const [mySessionsOnly, setMySessionsOnly] = useState(false)`
- [ ] T3 — Ajouter le toggle pill UI (2 pills : "Toutes" / "Mes séances") dans la zone filtres, en haut des autres filtres existants
- [ ] T4 — Modifier le filtrage : si `mySessionsOnly && user?.id` → filtrer les sessions affichées par coach (post-fetch ou paramètre API si disponible)
- [ ] T5 — Vérifier que le toggle n'affecte pas les autres filtres (méthode, implantation, période, etc.)
- [ ] T6 — QA scan : try/finally sur tout state loader, console guards

## Dépendances
Aucune — story indépendante.

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | À modifier |
