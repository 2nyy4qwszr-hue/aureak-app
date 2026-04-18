# Story 53-5 — Séances : Duplication rapide

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-5
- **Status** : done
- **Priority** : P2
- **Type** : Feature
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 19-5 (done — fiche séance), Story 19-4 (done — new.tsx)

---

## User Story

**En tant qu'admin ou coach**, quand je consulte la fiche d'une séance existante, je veux pouvoir la dupliquer en un clic pour créer une nouvelle séance pré-remplie avec la même configuration (groupe, méthode, coaches, terrain), afin de gagner du temps sur les séances récurrentes avec le même contenu.

---

## Contexte technique

### Fichiers cibles
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — bouton "Dupliquer"
- `aureak/apps/web/app/(admin)/seances/new.tsx` — accepter des query params de pré-remplissage

### Mécanisme technique
La duplication ne crée pas directement une séance en DB. Elle navigue vers `/seances/new` avec des query params encodés contenant la config de la séance source. Le formulaire `new.tsx` lit ces params et pré-remplit ses states.

Query params utilisés :
- `?duplicate_from=<sessionId>` — identifiant source (facultatif, pour traçabilité)
- `?prefill=<base64_json>` — config sérialisée (groupe, méthode, coaches, terrain, durée)

---

## Acceptance Criteria

1. **AC1** — Un bouton "↻ Dupliquer" est affiché dans les actions rapides de la fiche séance, visible uniquement si `session.status !== 'annulée'`.

2. **AC2** — Cliquer le bouton navigue vers `/seances/new?prefill=<base64_json>` avec les données de la séance source : `{ groupId, implantationId, sessionType, duration, terrain, coachIds }`.

3. **AC3** — Dans `new.tsx`, si le param `prefill` est présent dans l'URL, les fields correspondants sont pré-remplis au montage du composant (dans un `useEffect` initial).

4. **AC4** — La date n'est PAS pré-remplie (la nouvelle séance doit avoir une nouvelle date choisie par l'utilisateur). Un toast discret indique "Séance pré-remplie depuis la duplication — choisissez la date".

5. **AC5** — Les thèmes pédagogiques et ateliers (blocs de contenu) ne sont PAS dupliqués — seule la configuration structurelle est copiée.

6. **AC6** — Si le param `prefill` est invalide (JSON malformé, base64 incorrect), `new.tsx` ignore silencieusement et démarre un formulaire vide. Un `console.error` dev-only est émis.

7. **AC7** — Le bouton "Dupliquer" affiche un état de chargement pendant la navigation (opacity réduite sur pression).

8. **AC8** — Après duplication réussie (création de la nouvelle séance dans `new.tsx`), la page créée ne mentionne pas la séance source — c'est une nouvelle séance indépendante.

---

## Tasks

- [x] **T1 — Lire la section "actions rapides" dans `[sessionId]/page.tsx`**
  - Identifier les lignes du bloc d'actions existant
  - Identifier les données disponibles : `session.groupId`, `session.sessionType`, `session.duration`, etc.
  - Vérifier si `implantationId` est disponible dans `session` ou à résoudre depuis `groupId`

- [x] **T2 — Encoder les données de duplication**
  - Fonction locale `buildDuplicatePrefill(session: Session, coachIds: string[])`:
    ```typescript
    const payload = {
      groupId: session.groupId,
      implantationId: session.implantationId ?? '',
      sessionType: session.sessionType,
      duration: session.duration,
      terrain: session.terrain ?? '',
      coachIds,
    }
    return btoa(JSON.stringify(payload))
  ```
  - `coachIds` = `coaches.map(c => c.coachId)` (déjà chargés dans la page)

- [x] **T3 — Bouton Dupliquer dans la fiche séance**
  - Ajouter dans la zone actions rapides :
    ```tsx
    {session.status !== 'annulée' && (
      <Pressable
        style={actSt.quickBtn}
        onPress={() => {
          const prefill = buildDuplicatePrefill(session, coaches.map(c => c.coachId))
          router.push(`/seances/new?prefill=${prefill}` as never)
        }}
      >
        <AureakText>↻ Dupliquer</AureakText>
      </Pressable>
    )}
    ```

- [x] **T4 — Lire les query params dans `new.tsx`**
  - `const { prefill } = useLocalSearchParams<{ prefill?: string }>()`
  - `useEffect` au montage : si `prefill` présent, décoder et pré-remplir :
    ```typescript
    try {
      const data = JSON.parse(atob(prefill))
      if (data.groupId) setGroupId(data.groupId)
      if (data.sessionType) setSessionType(data.sessionType)
      // etc.
      setDuplicateToast(true)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/new] prefill decode error:', err)
    }
    ```

- [x] **T5 — Toast duplication dans `new.tsx`**
  - `useState<boolean>` : `duplicateToast`
  - Si `true` : afficher une petite bannière jaune en haut du formulaire
  - Message : "Séance pré-remplie — choisissez la date pour confirmer"
  - Disparaît après 6s ou au clic

- [x] **T6 — QA scan**
  - Console guard sur le catch du décodage
  - Vérifier qu'aucun state de chargement (saving/creating) n'est laissé sans finally
  - Vérifier que la navigation n'introduit pas de state global pollué

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter bouton "Dupliquer" + `buildDuplicatePrefill` |
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Lire param `prefill` + pré-remplissage + toast duplication |

---

## Pas de migration SQL

Cette story est 100% front-end.

---

## Commit

```
feat(epic-53): story 53-5 — duplication rapide de séance avec pré-remplissage formulaire
```
