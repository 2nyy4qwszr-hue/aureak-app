/**
 * cto-review.mjs
 * Runner multi-agents pour la CTO Review automatique des Pull Requests.
 *
 * Architecture :
 *   Chaque agent est un objet { id, name, emoji, filter, buildPrompt }.
 *   Pour ajouter un agent : l'enregistrer dans AGENTS et il tourne automatiquement.
 *
 * Variables d'environnement requises :
 *   ANTHROPIC_API_KEY   — clé API Claude
 *   CHANGED_FILES       — liste des fichiers modifiés, séparés par \n
 *   GITHUB_WORKSPACE    — racine du repo (injecté automatiquement par Actions)
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ── Configuration ──────────────────────────────────────────────────────────
const MODEL          = 'claude-sonnet-4-6'
const MAX_FILE_CHARS = 6000   // tronque les gros fichiers pour rester dans le contexte
const MAX_FILES      = 12     // fichiers max envoyés par agent

const REPO_ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd()
const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })


// ── Helpers ────────────────────────────────────────────────────────────────

/** Lit un fichier depuis la racine du repo, tronqué si trop grand. */
function readFile(relativePath) {
  const fullPath = join(REPO_ROOT, relativePath)
  if (!existsSync(fullPath)) return `[fichier supprimé ou introuvable : ${relativePath}]`
  const content = readFileSync(fullPath, 'utf-8')
  if (content.length > MAX_FILE_CHARS) {
    const lines   = content.split('\n')
    const kept    = Math.floor(MAX_FILE_CHARS / (content.length / lines.length))
    return content.slice(0, MAX_FILE_CHARS) + `\n\n... [tronqué — ${lines.length - kept} lignes omises]`
  }
  return content
}

/** Parse la réponse JSON de Claude. Robuste aux délimiteurs markdown. */
function parseClaudeJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  return JSON.parse(cleaned)
}

/** Formate le résultat d'un agent en bloc markdown pour la PR. */
function formatAgentSection(agent, result) {
  const verdictBadge = {
    APPROVED:   '✅ **APPROVED**',
    NEEDS_WORK: '⚠️ **NEEDS WORK**',
    BLOCKED:    '🚨 **BLOCKED**',
  }[result.verdict] ?? '❓ **INCONNU**'

  const lines = [
    `### ${agent.emoji} ${agent.name}`,
    '',
    `**Verdict : ${verdictBadge}**`,
    '',
    `> ${result.summary}`,
    '',
  ]

  if (result.points_forts?.length) {
    lines.push('#### ✅ Points forts')
    result.points_forts.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  if (result.ameliorations?.length) {
    lines.push('#### ⚠️ Améliorations suggérées')
    result.ameliorations.forEach(({ message, file, severity }) => {
      const sev = severity === 'high' ? ' 🔴' : severity === 'medium' ? ' 🟡' : ' 🟢'
      lines.push(`- ${message}${sev}${file ? ` — \`${file}\`` : ''}`)
    })
    lines.push('')
  }

  if (result.problemes_critiques?.length) {
    lines.push('#### 🚨 Problèmes critiques')
    result.problemes_critiques.forEach(({ message, file, impact }) => {
      lines.push(`- **${message}**${file ? ` — \`${file}\`` : ''}`)
      if (impact) lines.push(`  > Impact : ${impact}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}


// ── Registre des agents ────────────────────────────────────────────────────
// Pour ajouter un agent : créer un objet ci-dessous et l'ajouter à AGENTS.
// Il sera automatiquement exécuté si son filtre retourne des fichiers.

const AGENTS = [

  // ── Agent 1 : CTO Review (qualité, architecture, bonnes pratiques) ───────
  {
    id:    'cto-review',
    name:  'CTO Review',
    emoji: '🏗️',

    // Fichiers analysés : tout le code applicatif
    filter: (files) =>
      files
        .filter(f => /\.(ts|tsx|js|jsx|mjs|sql|py)$/.test(f))
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es CTO d'une application React/Supabase/TypeScript en production.
Analyse les fichiers de cette Pull Request avec un regard expert.

## Fichiers modifiés (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu des fichiers
${fileContents}

## Critères d'analyse
- Qualité du code : lisibilité, nommage, complexité
- Architecture : séparation des responsabilités, dépendances, couplage
- Robustesse : gestion d'erreurs, edge cases, null safety
- Performance : re-renders inutiles, requêtes non optimisées, N+1
- Sécurité : injections, données exposées, secrets hardcodés
- Maintenabilité : dette technique, duplication, abstractions prématurées

## Format de réponse
Réponds UNIQUEMENT avec un objet JSON valide (aucun texte autour) :
{
  "verdict": "APPROVED" | "NEEDS_WORK" | "BLOCKED",
  "summary": "résumé de la PR en 1-2 phrases",
  "points_forts": [
    "point fort 1",
    "point fort 2"
  ],
  "ameliorations": [
    { "message": "description", "file": "chemin/fichier.tsx", "severity": "low" | "medium" | "high" }
  ],
  "problemes_critiques": [
    { "message": "description du problème", "file": "chemin/fichier.tsx", "impact": "description de l'impact" }
  ]
}

Règles :
- BLOCKED uniquement si faille de sécurité grave, perte de données, ou régression certaine
- NEEDS_WORK si des corrections sont requises avant merge
- APPROVED si la PR peut merger (avec ou sans suggestions mineures)
- Chaque problème doit être actionnable et précis (pas de généralités)
- Maximum 5 points par section`
    },
  },

  // ── Agent 2 : Security Auditor (désactivé — décommenter pour activer) ────
  // {
  //   id:    'security',
  //   name:  'Security Auditor',
  //   emoji: '🔐',
  //   filter: (files) =>
  //     files.filter(f =>
  //       f.includes('api-client') || f.includes('migrations') ||
  //       f.includes('auth') || f.includes('rls') || f.endsWith('.sql')
  //     ).slice(0, MAX_FILES),
  //   buildPrompt(files, fileContents) { return `...` },
  // },

  // ── Agent 3 : Performance Auditor (désactivé — décommenter pour activer) ─
  // {
  //   id:    'performance',
  //   name:  'Performance Auditor',
  //   emoji: '⚡',
  //   filter: (files) => files.filter(f => f.endsWith('.tsx')).slice(0, MAX_FILES),
  //   buildPrompt(files, fileContents) { return `...` },
  // },
]


// ── Exécution d'un agent ───────────────────────────────────────────────────

async function runAgent(agent, allFiles) {
  const files = agent.filter(allFiles)

  if (!files.length) {
    return { agent, skipped: true }
  }

  console.log(`  → ${agent.name} (${files.length} fichier(s))`)

  const fileContents = files
    .map(f => `### ${f}\n\`\`\`\n${readFile(f)}\n\`\`\``)
    .join('\n\n')

  const prompt = agent.buildPrompt(files, fileContents)

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].text

  try {
    const result = parseClaudeJson(raw)
    return { agent, result, skipped: false }
  } catch {
    console.error(`  ✗ JSON invalide pour ${agent.name} — réponse brute :`, raw.slice(0, 200))
    return {
      agent,
      skipped: false,
      result: {
        verdict:            'NEEDS_WORK',
        summary:            'Erreur de parsing — voir les logs CI.',
        points_forts:       [],
        ameliorations:      [],
        problemes_critiques: [{ message: 'Le format de réponse Claude était invalide.', file: '', impact: 'Review non disponible' }],
      },
    }
  }
}


// ── Assemblage du commentaire PR ───────────────────────────────────────────

function buildPRComment(outputs, allFiles, prNumber) {
  const date    = new Date().toISOString().slice(0, 10)
  const active  = outputs.filter(o => !o.skipped)
  const skipped = outputs.filter(o => o.skipped)

  const overallVerdict = active.some(o => o.result.verdict === 'BLOCKED')
    ? '🚨 BLOCKED'
    : active.some(o => o.result.verdict === 'NEEDS_WORK')
      ? '⚠️ NEEDS WORK'
      : '✅ APPROVED'

  const sections = active.map(o => formatAgentSection(o.agent, o.result)).join('\n---\n\n')

  const skippedNote = skipped.length
    ? `\n> Agents non déclenchés (aucun fichier correspondant) : ${skipped.map(o => o.agent.name).join(', ')}`
    : ''

  return [
    `## 🤖 CTO Review — PR #${prNumber}`,
    '',
    `**Verdict global : ${overallVerdict}** · ${allFiles.length} fichier(s) analysé(s) · ${date}`,
    skippedNote,
    '',
    '---',
    '',
    sections,
    '---',
    '',
    `*Généré par Claude ${MODEL} · Les agents automatiques ne remplacent pas la validation humaine.*`,
  ].join('\n')
}


// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Récupération des fichiers modifiés (injectés par le workflow)
  const changedFiles = (process.env.CHANGED_FILES ?? '')
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean)

  const prNumber = process.env.PR_NUMBER ?? '?'

  console.log(`\n🏗️  CTO Review — PR #${prNumber}`)
  console.log(`   ${changedFiles.length} fichier(s) modifié(s)\n`)

  if (!changedFiles.length) {
    console.log('⚠️  Aucun fichier détecté — CHANGED_FILES vide.')
    // Écrire un commentaire minimal plutôt que de ne rien faire
    process.stdout.write('\n__COMMENT_START__\n')
    process.stdout.write('## 🤖 CTO Review\n\n> Aucun fichier à analyser dans cette PR.\n')
    process.stdout.write('\n__COMMENT_END__\n')
    return
  }

  // Exécution de tous les agents en séquence
  const outputs = []
  for (const agent of AGENTS) {
    try {
      const output = await runAgent(agent, changedFiles)
      outputs.push(output)
      const verdict = output.skipped ? 'skipped' : output.result.verdict
      console.log(`  ✓ ${agent.name} → ${verdict}`)
    } catch (err) {
      console.error(`  ✗ ${agent.name} → erreur : ${err.message}`)
      outputs.push({ agent, skipped: true })
    }
  }

  // Génération du commentaire PR
  const comment = buildPRComment(outputs, changedFiles, prNumber)

  // Écriture dans stdout balisé — lu par le workflow pour poster le commentaire
  process.stdout.write('\n__COMMENT_START__\n')
  process.stdout.write(comment)
  process.stdout.write('\n__COMMENT_END__\n')

  // Exit code selon verdict global
  const hasBlocked = outputs.some(o => !o.skipped && o.result?.verdict === 'BLOCKED')
  process.exit(hasBlocked ? 1 : 0)
}

main().catch(err => {
  console.error('Erreur fatale :', err)
  process.exit(1)
})
