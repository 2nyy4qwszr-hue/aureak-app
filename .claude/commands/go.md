---
name: 'go'
description: 'Reprend la queue de stories du jour et lance la prochaine implémentation. Utiliser si la session a été interrompue après /morning.'
---

Tu es le Day Conductor d'Aureak. Jeremy tape `/go` — il veut reprendre la queue.

---

## 1. Lire l'état de la queue

Lire `_qa/gates/day-queue.md`
- Si absent → `Aucune queue active. Lance /morning pour démarrer.`
- Si toutes `done` → `🎉 Queue terminée. Lance /morning pour une nouvelle journée.`

## 2. Contexte rapide

```bash
# Activité récente (ce qui a changé depuis la dernière session)
git log --oneline --since="12 hours ago" | head -5

# Cleanup Chromium zombies (prévention Playwright)
pkill -f "chromium.*--headless" 2>/dev/null
pkill -f "chrome.*--headless" 2>/dev/null
rm -rf /tmp/playwright-* 2>/dev/null
```

## 3. Trouver la prochaine story

Première story `pending` ou `in-progress`.
Si `in-progress` → lire le fichier story, trouver la dernière task cochée, reprendre à la suivante.

```
▶️ Reprise — {date}
Story : story-{X}-{Y} — {titre}
({N} restantes)
```

Mettre `day-queue.md` → `in-progress`.

---

## 3bis. Référence visuelle design

- PNG dans la story → `🖼️ Ref : {nom}`
- Aucun PNG + story UI → sous-agent Stitch (skip silencieux si échec)

---

## 4. Sanity check + complexité

```bash
ac_count=$(awk '/## Acceptance Criteria/,/^## [^A]/' {story} | grep -cE "^[0-9]+\.|^- ")
task_count=$(awk '/## Tasks/,/^## [^T]/' {story} | grep -c "^- \[ \]")
devnotes=$(grep -c "## Dev Notes" {story})
```
Si `ac_count < 3` ou `task_count < 2` ou `devnotes = 0` → `⚠️ Story incomplète. Continuer ? (GO/SKIP)`

```bash
file_count=$(awk '/### Fichiers à créer/,/### Fichiers à NE PAS/' {story} | grep -c "aureak/")
has_migration=$(awk '/### Fichiers à créer/,/### Fichiers à NE PAS/' {story} | grep -ci "\.sql")
complexity=$((task_count + has_migration * 3 + file_count))
```
- `< 5` → **EXPRESS** · `5-10` → **NORMAL** · `> 10` → **DEEP**

---

## 5. Dev (sous-agent)

Construire contexte inter-story : stories `done` dans `day-queue.md` → lire leurs "File List" → fichiers partagés.

```
Lis et exécute `_agents/prompts/pipeline-dev.md`. Mode autonome.
STORY : {chemin}
COMPLEXITÉ : {EXPRESS|NORMAL|DEEP}
REPRISE : {dernière task cochée ou "début"}
{CONTEXTE INTER-STORY : {fichiers partagés}}
{ATTENTION RENFORCÉE : {patterns récurrents si boucle d'apprentissage active}}
```

Attendre la fin.

---

## 6. Code Review (sous-agent)

```
Lis et exécute `_agents/prompts/pipeline-review.md`. Mode autonome.
STORY : {chemin}
```
**FAIL** → signaler. FIX ou SKIP.

---

## 7. TypeScript check

```bash
cd aureak && npx tsc --noEmit 2>&1 | head -40
```
Si erreurs → sous-agent correcteur. Relancer tsc.

---

## 8. Gate 1 + Gate 2

**Parallélisation** :
```bash
gate1_touches_tsx=$(awk '/### Fichiers à créer/,/### Fichiers à NE PAS/' {story} | grep -ci "\.tsx")
```
- `== 0` → Gate 1 + Gate 2 **en parallèle**
- `> 0` → Gate 1 d'abord, micro-commit, puis Gate 2

**Gate 1** :
```
Lis et exécute `_agents/prompts/pipeline-gate1.md`. Mode autonome.
STORY : {chemin}
```

**Gate 2** :
```
Lis et exécute `_agents/prompts/pipeline-gate2.md`. Mode autonome.
STORY : {chemin}
```

Day Conductor : lire `_qa/gates/gate1-*.txt` et `gate2-*.txt`.
Si corrections → micro-commits `fix(qa-gate1)` / `fix(qa-gate2)`.
FAIL → signaler, `blocked`. FIX ou SKIP.

---

## 9. DoD + commit

```bash
grep "Status: done" {story}
grep "{story_id}" _bmad-output/implementation-artifacts/sprint-status.yaml | grep "done"
git status --short | head -10
```
Si check échoue → corriger. Commit feature. `day-queue.md` → `done`.

---

## 10. Boucle d'apprentissage

```bash
cat _qa/gates/gate*-*.txt 2>/dev/null | tail -10
```
Extraire `types:`. Si un type ≥ 3×/10 → ajouter dans `project-context.md` + `ATTENTION RENFORCÉE` au prochain Dev.

---

## 11. Story suivante

Retenir fichiers partagés. `Story {X}.{Y} ✅ — {N} restantes.`
Si dernière → `🎉 Queue terminée. Patrouille ?`

---

## Règles

- `/go` = GO implicite — ne rien demander avant de lancer
- Ne jamais coder directement — déléguer au Dev sous-agent
- Ne jamais skipper un gate
- 1 commit feature + micro-commits QA si corrections Gate
- FAIL non corrigeable → signaler. FIX ou SKIP.
