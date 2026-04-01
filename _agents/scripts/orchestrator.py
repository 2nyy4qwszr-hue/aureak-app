#!/usr/bin/env python3
"""
Orchestrator V3 — Aureak QA
Lance tous les agents d'un gate en séquence via l'API Claude.

Usage:
  python orchestrator.py gate1 20-1
  python orchestrator.py gate2 20-1
"""

import sys
import os
import subprocess
import re
from pathlib import Path
from datetime import date

try:
    import anthropic
except ImportError:
    print("❌ Anthropic SDK manquant. Lancer : pip install anthropic")
    sys.exit(1)

REPO_ROOT = Path(__file__).parent.parent.parent
AGENTS_DIR = REPO_ROOT / "_agents"
QA_REPORTS = REPO_ROOT / "_qa" / "reports"
TODAY = date.today().strftime("%Y-%m-%d")
MODEL = "claude-sonnet-4-6"
MAX_FILE_LINES = 250
MAX_FILES_PER_AGENT = 8


# ── Détection des fichiers modifiés ──────────────────────────────────────────

def get_changed_files():
    """Lit git diff pour récupérer les fichiers modifiés.

    Ordre de priorité :
    1. Variable d'environnement CHANGED_FILES (passée par le workflow CI Gate 2)
    2. origin/main...HEAD (Gate 1 — PR context)
    3. HEAD~1..HEAD       (Gate 2 — post-merge context, HEAD == origin/main)
    4. HEAD               (fallback local)
    """
    env_files = os.environ.get("CHANGED_FILES", "").strip()
    if env_files:
        return [f.strip() for f in env_files.split("\n") if f.strip()]

    commands = [
        ["git", "diff", "--name-only", "origin/main...HEAD"],  # Gate 1 / PR
        ["git", "diff", "--name-only", "HEAD~1..HEAD"],         # Gate 2 / post-merge
        ["git", "diff", "--name-only", "HEAD"],                 # local fallback
    ]
    for cmd in commands:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=REPO_ROOT)
        files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
        if files:
            return files
    return []


def filter_files(agent_name, all_files):
    """Filtre les fichiers pertinents pour chaque agent."""
    ts_tsx = [f for f in all_files if f.endswith((".ts", ".tsx"))]
    sql    = [f for f in all_files if f.endswith(".sql")]
    shared = [f for f in all_files if any(x in f for x in
              ["entities", "enums", "api-client", "tokens", "_layout", ".sql"])]

    mapping = {
        "code-reviewer":       [f for f in all_files if f.endswith((".ts", ".tsx", ".sql"))],
        "migration-validator": sql,
        "security-auditor":    [f for f in all_files if any(x in f for x in
                                ["migrations", "functions", "api-client", "auth", "rls"])],
        "ux-auditor":          [f for f in all_files if f.endswith(".tsx")],
        "regression-detector": shared,
        "bug-hunter":          ts_tsx,
    }
    return mapping.get(agent_name, all_files)[:MAX_FILES_PER_AGENT]


# ── Lecture des fichiers ──────────────────────────────────────────────────────

def read_file(filepath):
    full = REPO_ROOT / filepath
    if not full.exists():
        return f"[Fichier introuvable : {filepath}]"
    lines = full.read_text(encoding="utf-8", errors="replace").split("\n")
    if len(lines) > MAX_FILE_LINES:
        truncated = len(lines) - MAX_FILE_LINES
        return "\n".join(lines[:MAX_FILE_LINES]) + f"\n\n... [{truncated} lignes tronquées]"
    return "\n".join(lines)


def find_story(story_id):
    artifacts = REPO_ROOT / "_bmad-output" / "implementation-artifacts"
    matches = list(artifacts.glob(f"*{story_id}*"))
    if matches:
        content = matches[0].read_text()
        return content[:4000]
    return "(story non trouvée)"


# ── Construction du prompt ────────────────────────────────────────────────────

def build_prompt(agent_name, story_id, files):
    prompt_file = AGENTS_DIR / "prompts" / f"{agent_name}.md"
    if not prompt_file.exists():
        raise FileNotFoundError(f"Prompt introuvable : {prompt_file}")

    template = prompt_file.read_text()
    relevant = filter_files(agent_name, files)

    file_list = "\n".join(f"- {f}" for f in relevant) or "(aucun fichier pertinent)"
    file_contents = ""
    for f in relevant:
        content = read_file(f)
        file_contents += f"\n\n### {f}\n```\n{content}\n```"

    story_content = find_story(story_id)

    prompt = (
        template
        .replace("{STORY_ID}", story_id)
        .replace("{LISTE_DES_FICHIERS_MODIFIÉS}", file_list)
        .replace("{LISTE_DES_FICHIERS_TSX_MODIFIÉS}", file_list)
    )
    prompt += f"""

---

## Story {story_id} (contenu)
{story_content}

---

## Contenu des fichiers modifiés
{file_contents or "(aucun contenu disponible)"}

---

Date d'analyse : {TODAY}
Produis le rapport complet maintenant en suivant le format du template.
"""
    return prompt


# ── Exécution d'un agent ──────────────────────────────────────────────────────

def run_agent(agent_name, slug, story_id, files, client):
    print(f"  → {agent_name:<25}", end=" ", flush=True)

    prompt = build_prompt(agent_name, story_id, files)

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    report = response.content[0].text
    blockers = report.count("[BLOCKER]")
    warnings = report.count("[WARNING]")

    # Sauvegarde du rapport
    QA_REPORTS.mkdir(parents=True, exist_ok=True)
    filename = f"{TODAY}_story-{story_id}_{slug}.md"
    (QA_REPORTS / filename).write_text(report)

    status = f"❌ {blockers} BLOCKER(s)" if blockers else "✅ PASS"
    suffix  = f"  ({warnings} warning(s))" if warnings else ""
    print(f"{status}{suffix}")

    return blockers, warnings, filename


# ── Gate runner ───────────────────────────────────────────────────────────────

GATE1_AGENTS = [
    ("code-reviewer",       "code-review",        lambda f: True),
    ("migration-validator", "migration-validator", lambda f: any(x.endswith(".sql") for x in f)),
    ("security-auditor",    "security",            lambda f: any(
        x in " ".join(f) for x in ["migrations", "functions", "api-client", "auth"])),
]

GATE2_AGENTS = [
    ("ux-auditor",          "ux",         lambda f: any(x.endswith(".tsx") for x in f)),
    ("regression-detector", "regression", lambda f: any(
        x in " ".join(f) for x in ["entities", "enums", "api-client", "tokens", "_layout", ".sql"])),
    ("bug-hunter",          "bugs",       lambda f: True),
]


def run_gate(gate, story_id):
    client = anthropic.Anthropic()

    print(f"\n{'─' * 52}")
    print(f"  QA {gate.upper()} — Story {story_id} — {TODAY}")
    print(f"{'─' * 52}\n")

    files = get_changed_files()
    relevant = [f for f in files if f.endswith((".ts", ".tsx", ".sql"))]

    if not relevant:
        print("⚠️  Aucun fichier .ts/.tsx/.sql détecté dans git diff.")
        print("   Vérifier la branche ou utiliser LAUNCH.md pour un lancement manuel.")
        return False

    print(f"Fichiers détectés ({len(relevant)}) :")
    for f in relevant:
        print(f"  {f}")
    print()

    agents = GATE1_AGENTS if gate == "gate1" else GATE2_AGENTS
    agents_to_run = [(name, slug) for name, slug, condition in agents if condition(relevant)]

    print(f"Agents à lancer : {len(agents_to_run)}\n")

    total_blockers = 0
    total_warnings = 0
    reports = []

    for agent_name, slug in agents_to_run:
        try:
            b, w, fname = run_agent(agent_name, slug, story_id, relevant, client)
            total_blockers += b
            total_warnings += w
            reports.append((agent_name, slug, b, w, fname))
        except Exception as e:
            print(f"  ✗ Erreur : {e}")

    # Résumé final
    print(f"\n{'─' * 52}")
    print(f"  RÉSULTAT {gate.upper()}")
    print(f"{'─' * 52}")
    for agent_name, slug, b, w, fname in reports:
        icon = "❌" if b > 0 else "✅"
        print(f"  {icon}  {agent_name:<25}  {fname}")

    print()
    if total_blockers > 0:
        print(f"❌  {total_blockers} BLOCKER(s) — corriger avant de continuer")
    else:
        print(f"✅  Gate franchissable — valider manuellement puis continuer")

    if total_warnings > 0:
        print(f"⚠️   {total_warnings} warning(s) — documenter dans _qa/summary.md")

    print(f"\n   Rapports : _qa/reports/\n")
    return total_blockers == 0


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python orchestrator.py <gate1|gate2> <story-id>")
        print("       python orchestrator.py gate1 20-1")
        sys.exit(1)

    gate     = sys.argv[1]
    story_id = sys.argv[2]

    if gate not in ("gate1", "gate2"):
        print(f"Gate inconnu : {gate}. Utiliser 'gate1' ou 'gate2'.")
        sys.exit(1)

    success = run_gate(gate, story_id)
    sys.exit(0 if success else 1)
