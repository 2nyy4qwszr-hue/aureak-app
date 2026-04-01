#!/usr/bin/env python3
"""
Summary Generator V3 — Aureak QA
Lit tous les rapports dans _qa/reports/ et reconstruit _qa/summary.md.

Usage: python summary-gen.py
"""

import re
from pathlib import Path
from datetime import date
from collections import defaultdict

REPO_ROOT    = Path(__file__).parent.parent.parent
QA_REPORTS   = REPO_ROOT / "_qa" / "reports"
SUMMARY_FILE = REPO_ROOT / "_qa" / "summary.md"
TODAY        = date.today().strftime("%Y-%m-%d")

GATE1_AGENTS = {"code-review", "migration-validator", "security"}
GATE2_AGENTS = {"ux", "regression", "bugs"}


# ── Parsing ───────────────────────────────────────────────────────────────────

def parse_filename(name):
    """
    Format : YYYY-MM-DD_story-XX-Y_agent.md
             YYYY-MM-DD_migration-000XX_agent.md
    """
    stem   = name.removesuffix(".md")
    parts  = stem.split("_", 2)           # max 3 parts : date, entity, agent
    if len(parts) < 3:
        return None

    report_date = parts[0]
    entity      = parts[1]
    agent       = parts[2]

    story_match = re.search(r"story-(\d+-\d+)", entity)
    story_id    = story_match.group(1) if story_match else None

    return {"date": report_date, "story_id": story_id, "agent": agent, "entity": entity}


def parse_report(filepath):
    content  = filepath.read_text(encoding="utf-8", errors="replace")
    blockers = len(re.findall(r"\[BLOCKER\]", content))
    warnings = len(re.findall(r"\[WARNING\]", content))
    verdict  = "❌ BLOCKED" if blockers > 0 else "✅ PASS"
    return {"blockers": blockers, "warnings": warnings, "verdict": verdict}


# ── Génération ────────────────────────────────────────────────────────────────

def generate():
    if not QA_REPORTS.exists() or not any(QA_REPORTS.glob("*.md")):
        print("Aucun rapport trouvé dans _qa/reports/")
        return

    # Indexer tous les rapports
    stories  = defaultdict(dict)   # story_id → {agent: parsed}
    history  = []

    for filepath in sorted(QA_REPORTS.glob("*.md")):
        info = parse_filename(filepath.name)
        if not info or not info["story_id"]:
            continue

        parsed = parse_report(filepath)
        stories[info["story_id"]][info["agent"]] = parsed
        history.append({**info, **parsed, "file": filepath.name})

    # ── Tableau des stories ───────────────────────────────────────────────────
    story_rows    = []
    warnings_open = []

    for story_id in sorted(stories):
        agents = stories[story_id]

        g1 = {k: v for k, v in agents.items() if k in GATE1_AGENTS}
        g2 = {k: v for k, v in agents.items() if k in GATE2_AGENTS}

        def gate_status(gate_agents):
            if not gate_agents:
                return "—"
            return "❌" if any(v["blockers"] > 0 for v in gate_agents.values()) else "✅"

        total_w = sum(v["warnings"] for v in agents.values())

        story_rows.append(
            f"| story-{story_id} | {gate_status(g1)} | {gate_status(g2)} | {total_w} | — |"
        )

        if total_w > 0:
            for agent, data in agents.items():
                if data["warnings"] > 0:
                    warnings_open.append(
                        f"| story-{story_id} | {agent} — {data['warnings']} warning(s) "
                        f"| voir `_qa/reports/` | — |"
                    )

    # ── Historique (20 derniers) ──────────────────────────────────────────────
    hist_rows = []
    for h in sorted(history, key=lambda x: x["date"], reverse=True)[:20]:
        hist_rows.append(
            f"| {h['date']} | story-{h['story_id']} | {h['agent']} "
            f"| {h['verdict']} | `{h['file']}` |"
        )

    # ── Assemblage du fichier ─────────────────────────────────────────────────
    lines = [
        "# QA Summary — Aureak",
        "",
        f"> Généré automatiquement — `python _agents/scripts/summary-gen.py` — {TODAY}",
        "> Compléter manuellement : colonne 'En prod?' et détail des warnings ouverts.",
        "",
        f"**Dernière mise à jour** : {TODAY}  ",
        f"**Stories suivies** : {len(stories)}  ",
        f"**Rapports analysés** : {len(history)}",
        "",
        "---",
        "",
        "## Stories — État des Gates",
        "",
        "| Story | Gate 1 | Gate 2 | Warnings | En prod? |",
        "|-------|--------|--------|----------|---------|",
        *(story_rows or ["| — | — | — | — | — |"]),
        "",
        "`✅ PASS` `❌ BLOCKED` `—` N/A",
        "",
        "---",
        "",
        "## Warnings Ouverts",
        "",
        "> Warning Gate 1 non traité avant Gate 2 = BLOCKER automatique.",
        "",
        "| Story | Warning | Fichier:ligne | Deadline |",
        "|-------|---------|---------------|----------|",
        *(warnings_open or ["| — | — | — | — |"]),
        "",
        "---",
        "",
        "## Historique des Rapports (20 derniers)",
        "",
        "| Date | Story | Agent | Résultat | Rapport |",
        "|------|-------|-------|----------|---------|",
        *(hist_rows or ["| — | — | — | — | — |"]),
        "",
        "---",
        "",
        "## Mise à jour manuelle",
        "",
        "- Cocher 'En prod?' quand le déploiement est confirmé",
        "- Ajouter le fichier:ligne précis dans Warnings Ouverts",
        "- Relancer ce script après chaque gate : `python _agents/scripts/summary-gen.py`",
    ]

    SUMMARY_FILE.write_text("\n".join(lines), encoding="utf-8")

    print(f"✅ summary.md mis à jour")
    print(f"   {len(stories)} stories · {len(history)} rapports · {len(warnings_open)} warnings ouverts")
    print(f"   → {SUMMARY_FILE}")


if __name__ == "__main__":
    generate()
