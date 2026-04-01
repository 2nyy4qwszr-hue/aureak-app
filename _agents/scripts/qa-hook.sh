#!/bin/bash
# qa-hook.sh — Hook Claude Code (Stop event)
# Rappel silencieux si des fichiers ont été modifiés sans rapport QA aujourd'hui.
# Ne s'affiche que si : ≥ 4 fichiers .ts/.tsx/.sql modifiés ET aucun rapport créé aujourd'hui.

REPO_ROOT="/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak"
QA_REPORTS="$REPO_ROOT/_qa/reports"
TODAY=$(date +%Y-%m-%d)

# Compter les fichiers modifiés pertinents
MODIFIED=$(git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null | grep -cE '\.(ts|tsx|sql)$' || echo 0)

# Si moins de 4 fichiers modifiés → pas de rappel (session trop courte)
if [ "$MODIFIED" -lt 4 ]; then
  exit 0
fi

# Vérifier si un rapport QA existe déjà aujourd'hui
REPORTS_TODAY=$(ls "$QA_REPORTS"/${TODAY}_*.md 2>/dev/null | wc -l | tr -d ' ')

if [ "$REPORTS_TODAY" -eq 0 ]; then
  echo ""
  echo "── QA REMINDER ─────────────────────────────────────"
  echo "  $MODIFIED fichiers modifiés · aucun rapport QA aujourd'hui"
  echo "  Lance : qa gate1 <story-id>"
  echo "────────────────────────────────────────────────────"
fi
