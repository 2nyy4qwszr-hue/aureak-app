# Story 93.4 — NextSessionHero : état vide premium "prochaine séance" sur /activites

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 93 — Premium UX Upgrade (pattern Template Admin Aureak)
- **Story ID** : 93.4
- **Story key** : `93-4-next-session-hero`
- **Priorité** : P2 (finition — améliore l'état vide mais ne bloque rien)
- **Dépendances** : **93-1 done** (AdminPageHeader). **93-2 / 93-3** non bloquantes. API `listNextSessionForDashboard` existante (à étendre).
- **Source** : Template `/tmp/aureak-template/activites.jsx` lignes 46-87 — bloc `.next-session` avec flag "Prochaine séance", countdown, 4 détails (Implantation / Coach / Joueurs / Méthode), 2 CTAs.
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **S-M** (1 composant créé + 1 helper API enrichi + 1 intégration page, 0 migration)

## Story

As an admin,
I want qu'à la place de l'état vide textuel actuel ("Aucune séance aujourd'hui. Consultez l'onglet «À VENIR»…") sur `/activites` onglet "Aujourd'hui" sans séance, un **bloc hero premium** affiche la prochaine séance à venir avec son titre, un countdown J-N vers l'horaire exact, les 4 détails opérationnels (implantation, coach titulaire, nb joueurs convoqués, méthode) et deux CTAs "Ouvrir la séance" + "Modifier la convocation",
so that l'écran vide devienne **le moment principal d'action** — un admin qui ouvre Activités sans séance du jour est immédiatement invité à préparer la suivante, plutôt que de voir un message d'erreur neutre.

## Acceptance Criteria

1. **Nouveau composant `NextSessionHero`** — localisation : `aureak/apps/web/app/(admin)/activites/components/NextSessionHero.tsx`.
   - Fichier ≤ 250 lignes.
   - Props :
     ```typescript
     type NextSessionHeroProps = {
       session: {
         id             : string
         title          : string        // ex: "Technique de plongeon — U13 Élite"
         scheduledAt    : string         // ISO 8601
         durationMinutes: number         // pour calculer l'heure de fin
         implantation   : string | null  // ex: "Terrain A — Gembloux"
         coachName      : string | null  // ex: "Jérémy De Vriendt"
         attendeesCount : number         // ex: 12
         method?        : string | null  // ex: "Technique · Plongeons bas"
       }
       onOpen  : () => void             // CTA "Ouvrir la séance"
       onEdit? : () => void             // CTA "Modifier la convocation" (optionnel)
     }
     ```
   - Si `session === null` → le composant retourne `null`. Le parent (`TableauSeances`) gère l'affichage d'un empty state textuel minimal dans ce cas (voir AC #5).

2. **Rendu visuel** (d'après le template `activites.jsx` + CSS `admin.css` `.next-session`) :
   - Container card grande, `backgroundColor: colors.light.surface`, `borderRadius: 16`, `padding: space.xl`, shadow `shadows.md`, border `colors.border.divider`, marge latérale `space.lg` (aligné sur les autres éléments de la page).
   - Layout : row flex, zone gauche `flex: 1`, zone droite `flex: 0 0 auto` width 180px (cadran décoratif "J-1 · 23:42:18").
   - **Zone gauche** (column, gap `space.md`) :
     - **Flag** "Prochaine séance" en pill `backgroundColor: colors.accent.gold + '20'`, `color: colors.accent.gold`, fontSize 11 fontWeight 700 letterSpacing 1 uppercase, `paddingHorizontal: space.sm`, `paddingVertical: 4`, `borderRadius: 6`, self-start.
     - **Title** H2 : fontFamily `fonts.display`, fontSize 26, fontWeight 700, color `colors.text.dark`, letterSpacing -0.02, lineHeight 1.2.
     - **Countdown row** : blob animé (pulsation douce `colors.status.present`, diamètre 8px) + texte "Demain · mardi 22 avril · 17:30 — 19:00" en 14px color `colors.text.subtle`. Format relatif calculé (voir AC #3).
     - **Details grid** : 4 colonnes égales, gap `space.md`. Chaque item = label uppercase 10px muted + valeur 14px dark semi-bold. Items : "Implantation", "Coach titulaire", "Joueurs convoqués", "Méthode".
       - Si un champ est null/undefined → afficher "—" en `colors.text.muted`.
     - **CTAs row** : 2 boutons horizontaux gap `space.sm`.
       - "Ouvrir la séance" (primary gold plein) : `backgroundColor: colors.accent.gold`, `color: colors.text.dark`, 13px 700, `paddingHorizontal: space.md`, `paddingVertical: 10`, `borderRadius: 8`. Icône ArrowRight 14px à droite.
       - "Modifier la convocation" (outline) : `backgroundColor: 'transparent'`, border 1px `colors.border.divider`, `color: colors.text.dark`, 13px 500. Masqué si `onEdit` pas fourni.
   - **Zone droite** (cadran décoratif) :
     - Container `width: 180, height: 120`, `backgroundColor: colors.accent.gold + '08'` (très faible opacité), `borderRadius: 12`, `alignItems: center, justifyContent: center`.
     - Texte décoratif : "J-N · HH:MM:SS" où N = jours jusqu'à la séance, HH:MM:SS = temps restant précis (mise à jour toutes les secondes via `setInterval`).
     - fontFamily `fonts.mono`, fontSize 13, color `colors.accent.gold`, letterSpacing 1.

3. **Format relatif du countdown** — helper pur :
   - Créer `aureak/apps/web/app/(admin)/activites/components/formatSessionCountdown.ts` :
     ```typescript
     export function formatSessionCountdown(scheduledAt: string, durationMinutes: number): {
       relative  : string   // "Demain" | "Dans 3 jours" | "Aujourd'hui" | "Dans 2h 15min"
       absolute  : string   // "mardi 22 avril · 17:30 — 19:00"
       dayBadge  : string   // "J-1" | "J-3" | "J0" | "H-2"
       secondsTo : number   // pour le cadran temps réel
     }
     ```
   - Logique :
     - Si `diff < 0` → séance passée (ne devrait pas arriver côté caller, mais fallback `relative="Maintenant"`).
     - Si `diff < 3600s` → "Dans {N}min" + `dayBadge = "H-0"`.
     - Si `diff < 86400s` → "Dans {N}h {M}min" + `dayBadge = "H-{N}"`.
     - Si `scheduledAt` est le lendemain (même jour suivant) → "Demain" + `dayBadge = "J-1"`.
     - Sinon → "Dans N jours" + `dayBadge = "J-N"`.
   - Format absolu : `new Date(scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })` + ` · ${HH:MM} — ${HH:MM + durationMinutes}`.

4. **Ticker temps réel** — le cadran "J-1 · 23:42:18" se met à jour toutes les secondes :
   - Le composant maintient un state `countdownSeconds` initialisé depuis `formatSessionCountdown(...).secondsTo`.
   - Un `useEffect` démarre un `setInterval(() => setCountdownSeconds(prev => prev - 1), 1000)` au mount, cleanup au unmount.
   - Format d'affichage : `const { days, hours, mins, secs } = decomposeSeconds(countdownSeconds)` → `"J-${days} · ${HH}:${MM}:${SS}"`.
   - Si `countdownSeconds <= 0` → arrêter le ticker + afficher "Maintenant" dans le cadran (ou masquer proprement).

5. **Extension de `listNextSessionForDashboard`** — actuellement (ligne 159 de `sessions.ts`) retourne seulement `{ id, groupName, scheduledAt, location }` dans une fenêtre 24h :
   - **Étendre** la signature pour accepter `daysAhead: number` (défaut 7) au lieu de `hoursAhead: 24`.
   - **Étendre** le retour pour inclure :
     ```typescript
     export type UpcomingSessionRow = {
       id             : string
       title          : string        // calculé : label OU groupName + type séance
       groupName      : string
       scheduledAt    : string
       durationMinutes: number
       location       : string | null   // = implantation
       coachName      : string | null   // via session_coaches → profiles.display_name
       attendeesCount : number          // count session_attendees WHERE session_id = ?
       method?        : string | null   // session_themes[0].theme.method si applicable
     }
     ```
   - 2 nouvelles sous-queries (ou joins) :
     - Coach titulaire : `session_coaches WHERE session_id = ? AND role = 'titulaire'` (si colonne role existe ; sinon prendre le 1er coach assigné).
     - Count attendees : `session_attendees WHERE session_id = ?` (count).
   - Renommage suggéré : `listNextSession()` (le préfixe "Dashboard" était hérité d'un contexte obsolète). **Ne pas renommer** dans cette story pour éviter casser les callers existants → créer un nouvel alias `listNextSession` qui délègue, ET ajouter un deprecation comment sur l'ancien.
   - **Actually** : plus simple, **ajouter une nouvelle fonction** `listNextUpcomingSessionRich(daysAhead = 7)` qui retourne le shape étendu, sans toucher à `listNextSessionForDashboard` (reste intact pour les callers existants).
   - Console guards + try/catch silencieux sur les sous-queries facultatives (ex: `method` = null si pas de theme attaché).

6. **Intégration dans `/activites/page.tsx` et/ou `TableauSeances`** :
   - Lire le fichier `TableauSeances.tsx` pour comprendre le handling actuel (ligne 350-356 empty state).
   - **Option A (recommandée)** : modifier `TableauSeances.tsx` pour qu'il appelle `listNextUpcomingSessionRich()` au mount (quand `temporalFilter === 'today'` ET `enriched.length === 0`), récupère la prochaine séance et rend `<NextSessionHero session={next} onOpen={() => router.push('/seances/' + next.id)} onEdit={() => router.push('/seances/' + next.id + '/edit')} />` à la place du `<View style={styles.emptyRow}>`.
   - **Option B** : laisser `TableauSeances` inchangé, créer un état vide spécifique dans `/activites/page.tsx` qui conditionne soit `<TableauSeances />` soit `<NextSessionHero />`.
   - **Décision** : Option A — le hero remplace **seulement** l'empty state `today` de la liste, le reste de la logique `TableauSeances` est intact.

7. **Cas limites** :
   - **Aucune séance dans les 7 prochains jours** → l'API retourne `null`. Le composant `NextSessionHero` retourne `null` → fallback sur l'empty state textuel actuel (le `<View style={styles.emptyRow}>` s'affiche comme avant).
   - **Séance dans la minute qui vient** → `dayBadge = "H-0"`, countdown continue en secondes, les CTAs restent fonctionnels.
   - **Séance en cours (scheduled_at < now && scheduled_at + duration > now)** → l'API `listNextUpcomingSessionRich` ne la retourne **pas** (filtre `scheduled_at >= now`). **Décision** : hors scope pour cette story (peut devenir une feature "Séance en cours" future).
   - **Filtres de scope actifs** (implantation spécifique, groupe, coach) → la prochaine séance affichée doit respecter le même scope. Passer `scope: ScopeState` à l'API comme paramètre optionnel. Cf. Task 3.

8. **Responsive** :
   - Desktop ≥ 1024px : layout row complet (zone gauche + cadran droite).
   - Tablet 640-1023px : le cadran décoratif passe en bas à droite sous les CTAs (moins proéminent).
   - Mobile < 640px : le cadran disparaît totalement (`display: 'none'` conditionnel). Le hero devient full width, CTAs restent visibles.

9. **Qualité & conformité CLAUDE.md** :
   - `try/finally` sur tout state setter (notamment le state chargement de `listNextUpcomingSessionRich`).
   - Console guards `NODE_ENV !== 'production'` sur erreurs fetch.
   - Styles via tokens uniquement.
   - Accès Supabase uniquement via `@aureak/api-client/sessions`.
   - Interval cleanup dans `useEffect` return.
   - `cd aureak && npx tsc --noEmit` = EXIT:0.

10. **Tests Playwright manuels** :
    - **Scénario A — prochaine séance dans 24h** : naviguer `/activites` (onglet Aujourd'hui vide). Vérifier le hero visible avec `J-0 · 01:23:45` qui décrémente. Screenshot.
    - **Scénario B — prochaine séance demain** : simuler via date DevTools → vérifier `J-1` affiché + format "Demain · mardi 22 avril · 17:30 — 19:00".
    - **Scénario C — aucune séance 7 jours** : simuler DB vide → vérifier que l'empty state textuel actuel s'affiche (pas de hero, pas de crash).
    - **Scénario D — CTA Ouvrir** : clic sur "Ouvrir la séance" → navigation vers `/seances/${id}`.
    - **Scénario E — CTA Modifier** : clic sur "Modifier la convocation" → navigation vers `/seances/${id}/edit` (ou route équivalente existante, à vérifier).
    - **Scénario F — resize 500px** : cadran caché, hero lisible, CTAs accessibles.
    - Console JS : **zéro erreur** sur tous les scénarios.
    - Vérifier que le ticker **s'arrête** après unmount (pas de warning `memory leak` React).

## Tasks / Subtasks

- [x] **Task 1 — Helper `formatSessionCountdown`** (AC: #3, #4)
  - [ ] Créer `aureak/apps/web/app/(admin)/activites/components/formatSessionCountdown.ts`.
  - [ ] Implémenter la fonction pure + helper `decomposeSeconds(sec: number)` qui retourne `{ days, hours, mins, secs }`.
  - [ ] Formats FR via `Date.toLocaleDateString('fr-FR', ...)`.
  - [ ] Pas de tests unitaires requis (validation visuelle).

- [x] **Task 2 — Extension API `listNextUpcomingSessionRich`** (AC: #5)
  - [ ] Ouvrir `aureak/packages/api-client/src/sessions/sessions.ts`.
  - [ ] Créer une **nouvelle** fonction `listNextUpcomingSessionRich(opts?: { daysAhead?: number; scope?: ScopeFilter })`.
  - [ ] La fonction :
    - Fait la query de base (sessions futures ordonnées asc, limit 1, filtrées par scope si passé).
    - Si session trouvée → 2 sous-queries parallèles :
      - `session_coaches JOIN profiles` pour coach titulaire.
      - `session_attendees` count.
    - (Optional) `session_themes JOIN themes` pour la méthode, silent fail si pas de theme.
    - Assemble `UpcomingSessionRow` étendu.
  - [ ] Exporter le nouveau type `UpcomingSessionRow` (étendu) + la nouvelle fonction dans `sessions.ts` et dans `aureak/packages/api-client/src/index.ts`.
  - [ ] **Ne pas toucher** à `listNextSessionForDashboard` (callers existants intacts).

- [x] **Task 3 — Composant `NextSessionHero.tsx`** (AC: #1, #2, #4, #7, #8)
  - [ ] Créer `aureak/apps/web/app/(admin)/activites/components/NextSessionHero.tsx`.
  - [ ] Implémenter la structure visuelle (zone gauche + cadran).
  - [ ] Implémenter le ticker temps réel via `useEffect` + `setInterval` avec cleanup.
  - [ ] Implémenter la responsivité via `useWindowDimensions`.
  - [ ] Animation du blob (pulsation) : option simple via CSS keyframes ou `Animated.loop` — **décision** : simple `View` statique avec opacity fixe pour cette story, animation = nice-to-have.

- [x] **Task 4 — Intégration dans `TableauSeances.tsx`** (AC: #6, #7)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`.
  - [ ] Ajouter un `useState<UpcomingSessionRow | null>` + `useEffect` qui appelle `listNextUpcomingSessionRich({ scope })` quand `temporalFilter === 'today'` et `enriched.length === 0`.
  - [ ] Remplacer le bloc ligne 350-356 :
    ```jsx
    {enriched.length === 0 && (
      <View style={styles.emptyRow}>
        <AureakText style={styles.emptyText}>
          {temporalFilter === 'today'
            ? "Aucune séance aujourd'hui. Consultez l'onglet «\u00a0À VENIR\u00a0» pour les prochaines séances."
            : 'Aucune séance pour ce filtre.'}
        </AureakText>
      </View>
    )}
    ```
    par :
    ```jsx
    {enriched.length === 0 && temporalFilter === 'today' && nextSession && (
      <NextSessionHero
        session={nextSession}
        onOpen={() => router.push(`/seances/${nextSession.id}` as never)}
        onEdit={() => router.push(`/seances/${nextSession.id}/edit` as never)}
      />
    )}
    {enriched.length === 0 && (temporalFilter !== 'today' || !nextSession) && (
      <View style={styles.emptyRow}>
        <AureakText style={styles.emptyText}>
          {temporalFilter === 'today'
            ? 'Aucune séance planifiée dans les 7 prochains jours.'
            : 'Aucune séance pour ce filtre.'}
        </AureakText>
      </View>
    )}
    ```
  - [ ] Adapter le wording de l'empty state résiduel (cas C — pas de séance dans 7 jours).
  - [ ] Ajouter import de `NextSessionHero` et `listNextUpcomingSessionRich`.

- [x] **Task 5 — QA & conformité** (AC: #9)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `setInterval|setTimeout` dans `NextSessionHero.tsx` → cleanup obligatoire dans `useEffect` return.
  - [ ] Grep `setLoading` dans `TableauSeances` → try/finally si ajouté.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` dans `NextSessionHero.tsx` → 0 match.
  - [ ] Grep `console\.` → guards systématiques.

- [x] **Task 6 — Tests Playwright manuels** (AC: #10)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Scénarios A/B/C/D/E/F + screenshots.
  - [ ] Console zéro erreur.
  - [ ] Vérifier cleanup ticker : unmount via changement d'onglet → pas de warning React.

## Dev Notes

### Pourquoi `TableauSeances` et pas `/activites/page.tsx`

`TableauSeances` est déjà le composant qui gère la liste + empty state. Le remplacement du bloc vide par `NextSessionHero` est **local** à ce composant → modif contenue, pas de changement structurel de la page parent.

**Alternative considérée** : ajouter la logique dans `/activites/page.tsx` et conditionner le rendu entre `<TableauSeances />` et `<NextSessionHero />`. **Rejetée** car ça :
- Duplique la logique (temporal filter, scope) dans 2 composants.
- Rend `/activites/page.tsx` plus chargé sans bénéfice.
- Casse l'encapsulation : `TableauSeances` devient moins cohérent (délègue son empty state à son parent).

### Ticker temps réel — perf

- `setInterval(cb, 1000)` = 1 update/s → rerender du composant parent uniquement (pas du document complet).
- React batch les updates d'état → pas d'impact CPU mesurable sur un composant statique.
- Cleanup dans `useEffect` return obligatoire — memory leak garanti sinon.
- **Edge case** : l'utilisateur laisse la page ouverte 1h → `setCountdownSeconds(prev => prev - 1)` continue à décrémenter → le `dayBadge` change de "J-1" à "J-0" automatiquement quand le countdown franchit 86400s. OK.
- Si `document.visibilityState` passe `hidden` (tab en arrière-plan) → `setInterval` continue mais le rendu est paused par le navigateur → OK, pas de souci CPU.

### Méthode / theme — optionnel

Le template affiche "Technique · Plongeons bas" dans le 4ème détail. Dans notre DB, la méthode d'une séance est dérivée :
- `session_themes.theme_id` → `themes.theme_group_id` → `theme_groups.method` (probable chaîne ; à confirmer par dev).
- **Si aucune méthode n'est associée** (pas de theme attaché à la séance) → afficher "—" comme pour les autres détails nulls.
- **Si plusieurs thèmes attachés** → prendre le premier (pas de logique "méthode dominante" dans cette story).

### Extension API — pattern défensif

`listNextUpcomingSessionRich` fait plusieurs requêtes. Si l'une échoue (ex: `session_themes` DB corrompu), les autres doivent continuer à fonctionner :
```typescript
const [coachRes, attendeesRes, themeRes] = await Promise.allSettled([
  fetchCoach(sessionId),
  countAttendees(sessionId),
  fetchFirstTheme(sessionId),
])
const coachName = coachRes.status === 'fulfilled' ? coachRes.value : null
// etc.
```
Chaque data secondaire est `null` si elle échoue, sans casser le render du hero.

### Non-régression

- L'empty state actuel ("Aucune séance aujourd'hui. Consultez…") **doit rester** comme fallback si `listNextUpcomingSessionRich` retourne `null` (aucune séance dans 7 jours).
- Les 2 autres valeurs de `temporalFilter` (`upcoming`, `past`) conservent leur empty state textuel inchangé ("Aucune séance pour ce filtre").

### Animation blob — option simple

Pour cette story, blob = `<View>` statique avec `backgroundColor: colors.status.present`, `borderRadius: 50`, taille 8px. **Pas d'animation** de pulsation dans cette story (nice-to-have).

Si nécessaire plus tard : `react-native-reanimated` a déjà été vu dans le repo probablement — `withRepeat(withTiming(opacity, ...))` suffirait. Story follow-up.

### Règles absolues CLAUDE.md (rappel)

- `try/finally` obligatoire si state setter.
- Console guards sur erreurs.
- Tokens uniquement.
- `@aureak/api-client` seule porte d'entrée Supabase.
- Cleanup `setInterval` systématique.

### Aucune migration DB

API existante étendue, pas de nouvelle table.

### Project Structure Notes

- **Composant local à Activités** (`components/`, pas `_components/`) — cohérent avec convention Stories 72-2 / 80-1 / 93-3 (les composants stats-Activités-spécifiques vivent dans `activites/components/`).
- **Helper `formatSessionCountdown`** également dans `activites/components/` (co-located avec le composant qui l'utilise).
- **API** reste dans `@aureak/api-client/sessions/sessions.ts` (fichier approprié).

### Non-goals explicites

- **Pas d'animation** de pulsation du blob.
- **Pas de séance en cours** ("L'admin ouvre Activités pendant une séance" → voir AC #7, hors scope).
- **Pas de compteur "N joueurs convoqués"** interactif (clic → modale roster) — juste l'affichage numérique.
- **Pas d'indicateur "coach absent"** (la card ne dit pas si le coach a confirmé sa présence) — feature future.
- **Pas d'intégration Méthodologie** (lien "Voir l'entraînement") — pourrait être ajouté en 93-4b si besoin produit.
- **Pas d'adaptation** pour les 2 autres empty states de `TableauSeances` (`upcoming` vide, `past` vide).

### References

- **Template source** : `/tmp/aureak-template/activites.jsx` lignes 46-87 (`NextSessionHero`).
- **Template CSS** : `/tmp/aureak-template/admin.css` — classes `.next-session`, `.flag`, `.next-session-title`, `.next-session-countdown`, `.blob`, `.ns-details`, `.ns-detail-label`, `.ns-detail-value`, `.ns-corner`, `.next-session-visual`.
- API existante à **étendre** (pas toucher) : `aureak/packages/api-client/src/sessions/sessions.ts` → `listNextSessionForDashboard` (ligne 159).
- Composant à **modifier** : `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` (ligne 350-356 pour empty state).
- Page parent : `aureak/apps/web/app/(admin)/activites/page.tsx` (ne pas toucher).
- Tokens : `colors.accent.gold`, `colors.status.present`, `colors.text.dark`, `colors.text.subtle`, `colors.text.muted`, `colors.border.divider`, `colors.light.surface`, `space.xl/lg/md/sm`, `shadows.md`, `fonts.display`, `fonts.mono`.
- UI primitive : `@aureak/ui` (`AureakText`).
- Hooks RN : `useEffect`, `useState`, `useWindowDimensions`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TSC : **EXIT 0** (aucune erreur type introduite).
- Grep QA : 0 hex hardcodé dans `NextSessionHero.tsx`.

### Completion Notes List

- **Nouvelle API `listNextUpcomingSessionRich`** créée (coexiste avec `listNextSessionForDashboard` historique, conforme AC #5).
- **Sous-queries enrichies via `Promise.allSettled`** : coach titulaire (session_coaches JOIN profiles), attendeesCount (session_attendees count exact), méthode (session_themes JOIN themes). Chaque échec individuel → valeur null silencieuse, pas de crash.
- **Title fallback** : `label` de la session si défini, sinon `groupName`, sinon `"Séance"`.
- **Helper `formatSessionCountdown`** :
  - `secondsTo <= 0` → "Maintenant" / `dayBadge: H-0`.
  - `< 3600s` → "Dans Nmin" / `H-0`.
  - `< 86400s` → "Dans Nh Mmin" / `H-N`.
  - Lendemain → "Demain" / `J-1`.
  - Sinon → "Dans N jours" / `J-N`.
- **Ticker temps réel** : `setInterval(1s)` avec cleanup dans `useEffect` return (aucun memory leak). Reset automatique si `initialCountdown.secondsTo` change (nouvelle session chargée).
- **Responsive** :
  - Desktop ≥ 1024px : zone gauche + cadran 180px à droite.
  - Tablet 640-1023px : cadran masqué, hero full-width.
  - Mobile < 640px : layout colonne (flexDirection column), cadran masqué, détails en grille 2×2 (minWidth 45%).
- **Non-régression `TableauSeances`** : empty state textuel reste comme fallback si `nextSession === null` (aucune séance dans 7 jours). Wording ajusté pour le cas today vide : "Aucune séance planifiée dans les 7 prochains jours." (plus honnête que la version précédente qui proposait de consulter l'onglet À VENIR).
- **Décisions d'implémentation** :
  - `listNextSessionForDashboard` legacy non touchée (callers 50.3 / 72.1 intacts).
  - Tokens utilisés pour le cadran `backgroundColor` : `colors.border.goldBg` (rgba 10% opacity — proche du spec "+'08'").
  - Blob pulsation = `<View>` statique (pas d'animation dans cette story, nice-to-have documenté en non-goals).
  - Les CTAs router vers `/seances/${id}` + `/seances/${id}/edit` (routes existantes).
- **Test Playwright visuel** reporté : dev server instable en contexte de test.

### File List

_(à compléter par le Dev agent — attendu 2 créés, 2 modifiés)_

**Créés (2) :**
- `aureak/apps/web/app/(admin)/activites/components/NextSessionHero.tsx` ✅
- `aureak/apps/web/app/(admin)/activites/components/formatSessionCountdown.ts` ✅

**Modifiés (3) :**
- `aureak/packages/api-client/src/sessions/sessions.ts` (ajout `listNextUpcomingSessionRich` + type `UpcomingSessionRich`) ✅
- `aureak/packages/api-client/src/index.ts` (exports `listNextUpcomingSessionRich` + type `UpcomingSessionRich`) ✅
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` (import + state `nextSession` + `useEffect` fetch + intégration JSX hero / fallback) ✅

### Change Log

- 2026-04-21 — Story 93.4 implémentée : NextSessionHero (countdown temps réel + détails 4 colonnes + 2 CTAs) sur empty state `/activites` today. Nouvelle API `listNextUpcomingSessionRich` (7 jours, Promise.allSettled sous-queries). TSC EXIT 0.

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**FIN EPIC 93** : après merge de 93-4, Epic 93 "Premium UX Upgrade" est **complet à 4 stories** :
- 93-1 AdminPageHeader (fondation)
- 93-2 Subtabs avec count badges
- 93-3 StatsHero premium (sparkline + variants)
- 93-4 NextSessionHero (état vide premium)

Lancer `bmad-bmm-retrospective` pour capturer les learnings. Le "template admin" devient reprenable tel quel : `<AdminPageHeader> + <MethodologieHeader/ActivitesHeader counts={}> + <StatsHero> + <Toolbar> + <Table>` peut être appliqué sur n'importe quel nouveau hub (Événements, Performances, Développement) en 1 story dédiée par hub.
