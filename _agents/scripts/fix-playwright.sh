#!/bin/bash
# fix-playwright.sh — Nettoie l'état Playwright pour que le MCP fonctionne
# Usage : bash _agents/scripts/fix-playwright.sh

echo "🔧 Fix Playwright MCP..."

# 1. Tuer les processus Chromium zombies (souvent la cause des échecs)
pkill -f "chromium" 2>/dev/null
pkill -f "chrome.*--headless" 2>/dev/null
pkill -f "Google Chrome.*--remote-debugging" 2>/dev/null
sleep 1

# 2. Nettoyer le profil temporaire Playwright (cache corrompu)
rm -rf /tmp/playwright-* 2>/dev/null
rm -rf /tmp/.org.chromium.* 2>/dev/null

# 3. Vérifier que le binaire Playwright est accessible
if command -v npx &>/dev/null; then
  PLAYWRIGHT_PATH=$(npx playwright --version 2>/dev/null)
  if [ -z "$PLAYWRIGHT_PATH" ]; then
    echo "⚠️  Playwright CLI non trouvé. Essaye : npx playwright install chromium"
    exit 1
  fi
  echo "✅ Playwright CLI: $PLAYWRIGHT_PATH"
fi

# 4. Vérifier que Chromium est installé
CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright"
if [ -d "$CHROMIUM_PATH" ]; then
  BROWSERS=$(ls "$CHROMIUM_PATH" 2>/dev/null | head -5)
  echo "✅ Browsers installés: $BROWSERS"
else
  echo "⚠️  Aucun browser Playwright trouvé. Lance : npx playwright install chromium"
  exit 1
fi

echo ""
echo "✅ Nettoyage terminé."
echo ""
echo "Pour que le MCP Playwright fonctionne dans Claude Code :"
echo "  1. Quitte Claude Code (Ctrl+C)"
echo "  2. Relance : claude"
echo "  → Les MCP servers redémarrent automatiquement à chaque session"
echo ""
echo "Si ça ne suffit pas :"
echo "  npx playwright install chromium"
