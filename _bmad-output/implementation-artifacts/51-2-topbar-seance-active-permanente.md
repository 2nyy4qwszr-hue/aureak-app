# Story 51.2 : Topbar — Status bar séance active permanente

Status: done

## Story

En tant qu'administrateur,
Je veux voir en permanence dans la topbar si une séance est actuellement en cours, avec le nom du groupe et le décompte de présents,
Afin de garder le contexte opérationnel visible à tout moment pendant ma navigation dans l'interface admin.

## Contexte & Décisions de Design

### Besoin opérationnel
L'admin supervise potentiellement plusieurs implantations simultanément. Pendant qu'il navigue dans les réglages ou l'audit, il peut manquer qu'une séance est en cours avec un taux de présence anormal. La topbar permanente résout ce problème de surveillance passive.

### Topbar position
La topbar s'insère au-dessus de `<Slot />` dans la zone de contenu principale (fond `colors.light.primary`). Elle est visible uniquement si une séance active existe. Hauteur : 36px. Elle n'est PAS une barre fixe globale — elle apparaît/disparaît selon l'état.

### API `getActiveSession()`
Nouvelle fonction dans `aureak/packages/api-client/src/sessions/sessions.ts`. Elle retourne la première séance dont le statut est `'planifiée'` et dont la fenêtre temporelle `[scheduled_at - 30min .. scheduled_at + duration + 15min]` chevauche `NOW()`.

### Polling
La topbar poll `getActiveSession()` toutes les 60 secondes via `setInterval`. Pas de Realtime subscription pour cette feature (overhead inutile).

### Design
- Fond : `colors.accent.gold + '15'` (très transparent) avec bordure bottom `colors.accent.goldSolid`
- Texte : "Séance en cours — **Groupe U12** · 7/8 présents" — icône pulsante verte à gauche
- CTA optionnel : lien "Voir →" qui navigue vers `/presences?sessionId=xxx`
- Si plusieurs séances simultanées : afficher la première + "(+N autres)"

## Acceptance Criteria

**AC1 — Barre visible si séance active**
- **Given** une séance est dans la fenêtre `[scheduled_at - 30min .. scheduled_at + duration + 15min]` avec statut `'planifiée'`
- **When** l'admin est sur n'importe quelle page admin
- **Then** une barre horizontale dorée s'affiche au-dessus du contenu, avec le nom du groupe et le compteur de présents
- **And** si aucune séance active → la barre n'est pas rendue (zéro espace vide)

**AC2 — Informations affichées**
- **Given** la barre est visible
- **When** l'admin la regarde
- **Then** il voit : indicateur vert pulsant + "Séance en cours" + nom du groupe + `X/Y présents`
- **And** un lien "Voir →" navigue vers `/seances/[sessionId]`

**AC3 — Plusieurs séances simultanées**
- **Given** 2 séances ou plus sont actives en même temps
- **When** la barre est rendue
- **Then** la première séance est affichée + "(+N autres)" cliquable
- **And** le clic sur "(+N autres)" navigue vers `/seances` avec les filtres appropriés

**AC4 — Polling toutes les 60 secondes**
- **Given** la barre est montée
- **When** 60 secondes s'écoulent
- **Then** un nouvel appel `getActiveSession()` est déclenché
- **And** si la séance se termine entre deux polls, la barre disparaît au prochain cycle
- **And** le `setInterval` est clearé au unmount du composant (pas de fuite mémoire)

**AC5 — Try/finally sur le chargement**
- **Given** l'appel API est en cours
- **When** une erreur réseau se produit
- **Then** l'erreur est loggée avec console guard `if (process.env.NODE_ENV !== 'production')`
- **And** la barre reste absente (pas d'état d'erreur visible — dégradation silencieuse)

**AC6 — Compteur de présents**
- **Given** la séance active est chargée
- **When** la barre affiche le compteur
- **Then** le format est `X/Y présents` où X = nb statut `'présent'` et Y = total roster
- **And** si les données de présences ne sont pas disponibles, afficher uniquement le nom du groupe sans compteur

**AC7 — Non visible sur mobile (< 768px)**
- **Given** l'app est sur viewport < 768px
- **When** une séance est active
- **Then** la barre n'est pas rendue (mobile a déjà sa propre topbar)

## Tasks / Subtasks

- [x] Task 1 — API `getActiveSession()` dans sessions.ts
  - [x] 1.1 Ajouter `getActiveSession(): Promise<ActiveSessionInfo[]>` dans `aureak/packages/api-client/src/sessions/sessions.ts`
  - [x] 1.2 La fonction query les sessions avec `status = 'planifiée'` dont la fenêtre temporelle chevauche NOW() (calcul côté client après fetch)
  - [x] 1.3 JOIN sur `session_attendees` pour compter présents et total
  - [x] 1.4 Retourner `ActiveSessionInfo[]` (tableau vide si aucune séance active)
  - [x] 1.5 Exporter `getActiveSession` et le type `ActiveSessionInfo` depuis `@aureak/api-client/src/index.ts`

- [x] Task 2 — Type `ActiveSessionInfo` dans `@aureak/types`
  - [x] 2.1 Ajouté dans `aureak/packages/types/src/entities.ts` — interface `ActiveSessionInfo`

- [x] Task 3 — Composant `ActiveSessionBar` dans `apps/web/components/`
  - [x] 3.1 Créé `aureak/apps/web/components/ActiveSessionBar.tsx`
  - [x] 3.2 Props : `{ sessions: ActiveSessionInfo[] }` (pré-chargé par le layout)
  - [x] 3.3 Design : fond `colors.accent.gold + '15'`, bordure bottom `colors.border.goldSolid`, hauteur 36px
  - [x] 3.4 Indicateur vert pulsant (Animated.loop opacity 1→0.4→1 sur 1.5s)
  - [x] 3.5 Texte : "Séance en cours — {groupName} · {X}/{Y} présents"
  - [x] 3.6 Lien "Voir →" via `useRouter().push('/seances/' + sessionId)`
  - [x] 3.7 Si plusieurs sessions : afficher première + "(+N autres)" → lien `/seances`
  - [x] 3.8 Zéro rendu si `sessions.length === 0`

- [x] Task 4 — Intégration dans `_layout.tsx`
  - [x] 4.1 Ajouter state `activeSessions: ActiveSessionInfo[]`
  - [x] 4.2 Appel initial `getActiveSession()` au mount + `setInterval` de 60s
  - [x] 4.3 Cleanup `clearInterval` dans le return du `useEffect` + flag `cancelled`
  - [x] 4.4 Insérer `<ActiveSessionBar sessions={activeSessions} />` juste avant `<ErrorBoundary><Slot /></ErrorBoundary>`
  - [x] 4.5 Conditionner le rendu à `!isMobile`

- [x] Task 5 — QA
  - [x] 5.1 Vérifier try/finally sur le setter de chargement — PASS
  - [x] 5.2 Vérifier console guard `NODE_ENV !== 'production'` sur l'error log — PASS
  - [x] 5.3 Vérifier cleanup interval — PASS

## Dev Notes

### Requête SQL indicative pour getActiveSession

```typescript
const now = new Date().toISOString()
const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString()
const windowEnd   = new Date(Date.now() + (90 + 15) * 60 * 1000).toISOString() // max durée 90min + buffer

const { data } = await supabase
  .from('sessions')
  .select(`
    id,
    scheduled_at,
    duration_minutes,
    groups ( name ),
    session_attendees ( status )
  `)
  .eq('status', 'planifiée')
  .gte('scheduled_at', windowStart)
  .lte('scheduled_at', windowEnd)
  .order('scheduled_at', { ascending: true })
  .limit(5)
```

Le filtrage précis de la fenêtre se fait côté client après le fetch (plus simple que SQL calculé).

### Indicateur pulsant RN

```typescript
// Animated.loop sur opacity 1→0.4→1 toutes les 1.5s
const pulse = useRef(new Animated.Value(1)).current
useEffect(() => {
  const anim = Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.0, duration: 750, useNativeDriver: true }),
    ])
  )
  anim.start()
  return () => anim.stop()
}, [pulse])
```

## File List

### New Files
- `aureak/apps/web/app/components/ActiveSessionBar.tsx` — barre topbar séance active

### Modified Files
- `aureak/packages/api-client/src/sessions/sessions.ts` — `getActiveSession()`
- `aureak/packages/api-client/src/index.ts` — export `getActiveSession`, `ActiveSessionInfo`
- `aureak/packages/types/src/entities.ts` — interface `ActiveSessionInfo`
- `aureak/apps/web/app/(admin)/_layout.tsx` — state + polling + `<ActiveSessionBar />`

## Dev Agent Record

- [ ] Story créée le 2026-04-04
- [ ] Dépendances : Story 51-1 (optionnel — peuvent être parallèles)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
