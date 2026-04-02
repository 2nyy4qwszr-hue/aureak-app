/**
 * cto-review.mjs — Aureak AI Review System v5
 *
 * Architecture multi-agents spécialisée pour Aureak :
 *   1. 🏗️  CTO Review       — qualité, architecture, patterns monorepo
 *   2. 🛡️  Security         — RLS Supabase, multi-tenant, RBAC, RGPD mineurs
 *   3. ⚡  Performance      — re-renders Expo, N+1 Supabase, offline context
 *   4. 🎨  UI/UX            — Tamagui DS, double cible parent/enfant, accessibilité
 *   5. 📊  Business         — conversion académie, parcours parent, engagement enfant
 *   6. 🧪  User Simulator   — simulation réelle parent / enfant / coach
 *   7. 🧑‍🏫 Product Coach    — synthèse globale, plan d'action, next feature
 *
 * Chaque agent produit : analyse + FIX PROPOSÉ concret.
 * Système de blocage : score < 80 OU critique sécurité → PR bloquée.
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'fs'
import { join }                      from 'path'


// ═══════════════════════════════════════════════════════════════════════════
// § 1. CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const MODEL              = 'claude-sonnet-4-6'
const MAX_FILE_CHARS     = 5000   // chars max par fichier
const MAX_FILES          = 10     // fichiers max par agent
const BLOCK_SCORE_THRESHOLD = 80  // score global minimum pour merger

/**
 * Poids pour le score global (/100) — total des 5 agents métier = 100.
 * user-simulator et coach-product ont poids 0 : agents de synthèse, non inclus dans le score pondéré.
 */
const SCORE_WEIGHTS = {
  'cto-review':     35,
  'security':       30,
  'performance':    15,
  'uiux':           15,
  'business':        5,
  'user-simulator':  0,  // simulation — hors score pondéré
  'coach-product':   0,  // synthèse  — hors score pondéré
}

/**
 * Ordre de priorité des agents pour le tri cross-agent des problèmes.
 * Security en premier : une faille bloque tout le reste.
 */
const PRIORITY_ORDER = ['security', 'cto-review', 'performance', 'uiux', 'business', 'user-simulator']

/**
 * Patterns de regroupement des problèmes similaires.
 * Quand plusieurs agents signalent le même anti-pattern, ils sont regroupés.
 * Chaque pattern définit : regex de détection, libellé de catégorie, emoji.
 */
const ISSUE_PATTERNS = [
  { regex: /try.?finally|setLoading|setSaving|setCreating|setSubmit/i,    category: 'État de chargement (try/finally)',  emoji: '⏳' },
  { regex: /RLS|row.level.security|policy|is_active_user|tenant_id/i,      category: 'Sécurité RLS / tenant',            emoji: '🔒' },
  { regex: /N\+1|boucle.*appel|\.in\(|select\s+\*/i,                       category: 'Requêtes Supabase',                emoji: '🗄️' },
  { regex: /console\.(log|error|warn|debug)/i,                              category: 'Logs non guardés',                 emoji: '📝' },
  { regex: /\bany\b|: any|as any/,                                          category: 'TypeScript strict',                emoji: '📐' },
  { regex: /optional.chain|\?\.|null.safety|undefined/i,                   category: 'Null safety',                     emoji: '🛡️' },
  { regex: /re.?render|useMemo|useCallback|memo\(/i,                        category: 'Performance React',               emoji: '⚛️' },
  { regex: /accessib|aria-|contrast|touch.target|44px/i,                   category: 'Accessibilité',                   emoji: '♿' },
  { regex: /hardcod|#[0-9a-f]{3,6}|px"|color.*=.*"/i,                      category: 'Valeurs hardcodées',              emoji: '🎨' },
  { regex: /invalidat|staleTime|refetch|queryKey/i,                         category: 'TanStack Query',                  emoji: '🔄' },
]

/**
 * Conditions de blocage de la PR.
 * Chaque condition est évaluée indépendamment.
 * La première qui retourne true bloque la PR.
 */
const BLOCK_CONDITIONS = [
  {
    id:     'low-score',
    reason: (score) => `Score global ${score}/100 inférieur au seuil requis (${BLOCK_SCORE_THRESHOLD}/100)`,
    test:   (outputs, score) => score < BLOCK_SCORE_THRESHOLD,
  },
  {
    id:     'security-critical',
    reason: (score, outputs) => {
      const sec = outputs.find(o => o.agent.id === 'security' && !o.skipped)
      const n   = sec?.result?.critiques?.length ?? 0
      return `${n} faille(s) de sécurité critique(s) — merge interdit avant correction`
    },
    test:   (outputs) => {
      const sec = outputs.find(o => o.agent.id === 'security' && !o.skipped)
      return (sec?.result?.critiques?.length ?? 0) > 0
    },
  },
  {
    id:     'agent-blocked',
    reason: (score, outputs) => {
      const a = outputs.find(o => !o.skipped && o.result?.verdict === 'BLOCKED')
      return `L'agent "${a?.agent.name}" a retourné un verdict BLOCKED`
    },
    test:   (outputs) => outputs.some(o => !o.skipped && o.result?.verdict === 'BLOCKED'),
  },
]

const REPO_ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd()
const client    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })


// ═══════════════════════════════════════════════════════════════════════════
// § 2. HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function readFile(relativePath) {
  const fullPath = join(REPO_ROOT, relativePath)
  if (!existsSync(fullPath)) return `[fichier supprimé ou introuvable : ${relativePath}]`
  const content = readFileSync(fullPath, 'utf-8')
  if (content.length <= MAX_FILE_CHARS) return content
  return (
    content.slice(0, MAX_FILE_CHARS) +
    `\n\n... [tronqué — ${content.split('\n').length} lignes totales]`
  )
}

function buildFileContents(files) {
  return files.map(f => `### ${f}\n\`\`\`\n${readFile(f)}\n\`\`\``).join('\n\n')
}

function parseClaudeJson(raw) {
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
  const start = stripped.indexOf('{')
  const end   = stripped.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Aucun objet JSON trouvé dans la réponse')
  return JSON.parse(stripped.slice(start, end + 1))
}

function scoreBadge(score) {
  if (score >= 90) return `🟢 **${score}/100**`
  if (score >= 80) return `🟡 **${score}/100**`
  if (score >= 60) return `🟠 **${score}/100**`
  return `🔴 **${score}/100**`
}

function severityIcon(sev) {
  return { high: '🔴', medium: '🟡', low: '🟢' }[sev] ?? '⚪'
}

function verdictBadge(verdict) {
  return {
    APPROVED:   '✅ APPROVED',
    NEEDS_WORK: '⚠️ NEEDS WORK',
    BLOCKED:    '🚨 BLOCKED',
  }[verdict] ?? '❓ INCONNU'
}

/**
 * Indicateur d'évolution entre l'analyse précédente et l'actuelle.
 * Retourne une chaîne vide si aucun historique disponible.
 */
function evolutionIndicator(current, previous) {
  if (previous == null || isNaN(previous)) return ''
  const diff = current - previous
  if (diff > 5)  return ` *(↑ +${diff} pts vs précédent)*`
  if (diff < -5) return ` *(↓ ${diff} pts vs précédent)*`
  if (diff === 0) return ` *(→ stable vs précédent)*`
  return ` *(${diff > 0 ? '+' : ''}${diff} pts vs précédent)*`
}

/**
 * Regroupe les problèmes de tous les agents actifs par pattern commun.
 * Chaque issue est enrichie de : agentName, agentEmoji, isCritique.
 *
 * @returns {{ grouped: Map<string, {meta, items[]}>, ungrouped: item[] }}
 */
function groupIssuesByPattern(outputs) {
  const grouped   = new Map()   // category → { meta: ISSUE_PATTERNS[i], items: [] }
  const ungrouped = []

  const prioritized = [...outputs].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.agent.id)
    const bi = PRIORITY_ORDER.indexOf(b.agent.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  for (const { agent, skipped, result } of prioritized) {
    if (skipped || !result) continue

    const allIssues = [
      ...(result.critiques ?? []).map(i => ({ ...i, isCritique: true })),
      ...(result.alertes   ?? []).map(i => ({ ...i, isCritique: false })),
    ]

    for (const issue of allIssues) {
      const text    = `${issue.message} ${issue.detail ?? ''} ${issue.action ?? ''}`
      const matched = ISSUE_PATTERNS.find(p => p.regex.test(text))
      const enriched = { ...issue, agentName: agent.name, agentEmoji: agent.emoji, agentId: agent.id }

      if (matched) {
        if (!grouped.has(matched.category)) {
          grouped.set(matched.category, { meta: matched, items: [] })
        }
        grouped.get(matched.category).items.push(enriched)
      } else {
        ungrouped.push(enriched)
      }
    }
  }

  return { grouped, ungrouped }
}

/**
 * Rend la section "Problèmes prioritaires" avec tri cross-agent et regroupement.
 * Security > CTO > Performance > UI/UX > Business.
 * Critiques avant alertes, high avant medium avant low.
 */
function renderPrioritizedSection(outputs) {
  // Collecter toutes les issues critiques et high-severity, triées par priorité
  const prioritized = [...outputs].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.agent.id)
    const bi = PRIORITY_ORDER.indexOf(b.agent.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const topIssues = []
  for (const { agent, skipped, result } of prioritized) {
    if (skipped || !result) continue
    for (const c of (result.critiques ?? [])) {
      topIssues.push({ ...c, isCritique: true, agent })
    }
    for (const a of (result.alertes ?? []).filter(a => a.severity === 'high')) {
      topIssues.push({ ...a, isCritique: false, agent })
    }
  }

  if (!topIssues.length) return null

  // Regroupement par pattern
  const { grouped, ungrouped } = groupIssuesByPattern(outputs)

  const lines = [
    `### 🔴 Problèmes prioritaires`,
    '',
    `> ${topIssues.length} problème(s) à traiter — triés par impact (Security → CTO → Performance → UX → Business)`,
    '',
  ]

  // Groupes identifiés
  if (grouped.size > 0) {
    lines.push(`**Problèmes récurrents (pattern détecté)**`)
    lines.push('')
    for (const [category, { meta, items }] of grouped) {
      if (items.length < 2) continue   // un seul item = pas un pattern
      lines.push(`**${meta.emoji} ${category}** — ${items.length} occurrence(s)`)
      items.forEach(item => {
        const tag = item.isCritique ? '🚨' : `${severityIcon(item.severity)}`
        lines.push(`- ${tag} [${item.agentEmoji} ${item.agentName}] **${item.message}**${item.file ? ` — \`${item.file}\`` : ''}`)
      })
      lines.push('')
    }
  }

  // Issues isolées (critiques uniquement hors groupes)
  const critiquesIsolees = topIssues.filter(i => {
    if (!i.isCritique) return false
    const text    = `${i.message} ${i.detail ?? ''}`
    const inGroup = ISSUE_PATTERNS.some(p => p.regex.test(text))
    return !inGroup
  })

  if (critiquesIsolees.length) {
    lines.push(`**Critiques isolées**`)
    critiquesIsolees.forEach(item => {
      lines.push(`- 🚨 [${item.agent.emoji} ${item.agent.name}] **${item.message}**${item.file ? ` — \`${item.file}\`` : ''}`)
      if (item.impact) lines.push(`  > _Impact : ${item.impact}_`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Rend le tableau des patches préparés pour futur auto-fix.
 * Collecte tous les champs `patch` des alertes et critiques de tous les agents.
 */
function renderPatchSummary(outputs) {
  const patches = []

  for (const { agent, skipped, result } of outputs) {
    if (skipped || !result) continue
    const allIssues = [
      ...(result.critiques ?? []),
      ...(result.alertes   ?? []),
    ]
    for (const issue of allIssues) {
      if (!issue.patch) continue
      patches.push({
        agent:       `${agent.emoji} ${agent.name}`,
        type:        issue.patch.type ?? 'manual',
        automated:   issue.patch.automated ?? false,
        file:        issue.patch.file || issue.file || '',
        description: issue.patch.description || issue.message,
        isCritique:  !!issue.impact,
      })
    }
  }

  if (!patches.length) return null

  const typeIcon = { code_change: '🔧', sql_migration: '🗄️', config_change: '⚙️', manual: '✋' }

  const lines = [
    `### 🔧 Patches préparés _(auto-fix futur)_`,
    '',
    `> ${patches.length} patch(es) catalogué(s) — prêts pour automatisation future.`,
    `> _Le champ \`patch\` de chaque issue est structuré pour un runner de patches à venir._`,
    '',
    `| # | Type | Agent | Fichier | Description | Automatisable |`,
    `|---|------|-------|---------|-------------|---------------|`,
  ]

  patches.forEach((p, i) => {
    const icon = typeIcon[p.type] ?? '✋'
    const auto = p.automated ? '🤖 Oui' : '👤 Non'
    const file = p.file ? `\`${p.file.split('/').pop()}\`` : '—'
    const desc = p.description.length > 60 ? p.description.slice(0, 57) + '...' : p.description
    lines.push(`| ${i + 1} | ${icon} ${p.type} | ${p.agent} | ${file} | ${desc} | ${auto} |`)
  })

  lines.push('')
  return lines.join('\n')
}

/**
 * Schéma JSON injecté dans chaque prompt agent.
 * Inclut le champ "fix" pour les suggestions concrètes.
 */
function jsonSchema() {
  return `## Format de réponse obligatoire
Réponds UNIQUEMENT avec un objet JSON valide — aucun texte avant ou après, aucun markdown :

{
  "verdict": "APPROVED" | "NEEDS_WORK" | "BLOCKED",
  "score": <entier 0-100>,
  "score_justification": "<1 phrase expliquant le score>",
  "zone_critique": "<zone de risque principale identifiée dans ce périmètre, ex: 'RLS policies manquantes sur 2 tables' ou 'Re-renders non mémoïsés dans les listes'>",
  "summary": "<résumé de la PR en 1-2 phrases>",
  "positifs": [
    "<observation positive concrète>"
  ],
  "alertes": [
    {
      "message":  "<problème précis et actionnable>",
      "file":     "<chemin/relatif.tsx ou chaîne vide>",
      "severity": "low" | "medium" | "high",
      "detail":   "<contexte ou explication>",
      "fix":      "<correction concrète : snippet de code OU description de solution>",
      "impact_dimensions": {
        "security":    <0-10>,
        "performance": <0-10>,
        "ux":          <0-10>,
        "business":    <0-10>
      },
      "patch": {
        "type":        "code_change" | "sql_migration" | "config_change" | "manual",
        "automated":   false,
        "file":        "<chemin/relatif.tsx ou chaîne vide>",
        "description": "<description courte de la transformation>"
      }
    }
  ],
  "critiques": [
    {
      "message": "<problème critique — doit être corrigé avant merge>",
      "file":    "<chemin/relatif.tsx ou chaîne vide>",
      "impact":  "<conséquence concrète si non corrigé>",
      "action":  "<étape de correction requise>",
      "fix":     "<snippet de code ou solution concrète et complète>",
      "impact_dimensions": {
        "security":    <0-10>,
        "performance": <0-10>,
        "ux":          <0-10>,
        "business":    <0-10>
      },
      "patch": {
        "type":        "code_change" | "sql_migration" | "config_change" | "manual",
        "automated":   false,
        "file":        "<chemin/relatif.tsx ou chaîne vide>",
        "description": "<description courte de la transformation>"
      }
    }
  ]
}

Règles absolues :
- Maximum 4 items par section (positifs, alertes, critiques)
- BLOCKED : uniquement faille sécurité exploitable, perte de données, régression certaine en prod
- NEEDS_WORK : corrections requises avant merge (au moins 1 alerte high ou 1 critique)
- APPROVED : peut merger, suggestions mineures tolerées
- Chaque "fix" doit être un snippet de code fonctionnel OU une description d'action précise
- Pas de généralités — chaque item doit pointer vers quelque chose de spécifique dans le code
- Pour impact_dimensions : évalue chaque dimension de 0 à 10 (0 = pas d'impact, 10 = impact maximal)
- zone_critique : identifie LA zone de risque principale dans ton périmètre (1 phrase courte, concrète)`
}


// ═══════════════════════════════════════════════════════════════════════════
// § 3. REGISTRE DES AGENTS
// ═══════════════════════════════════════════════════════════════════════════

const AGENTS = [

  // ───────────────────────────────────────────────────────────────────────
  // AGENT 1 : CTO Review
  // Focus : architecture monorepo, patterns TypeScript, robustesse
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'cto-review',
    name:  'CTO Review',
    emoji: '🏗️',
    labels: {
      positifs:  '✅ Points forts',
      alertes:   '⚠️ Améliorations',
      critiques: '🚨 Corrections requises',
    },

    filter: (files) =>
      files
        .filter(f => /\.(ts|tsx|js|jsx|mjs|sql)$/.test(f))
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es CTO du projet Aureak — une plateforme de gestion d'académie de gardiens de but (football).

## Architecture Aureak (règles non négociables)
- **Monorepo** Turborepo : apps/web, apps/mobile, packages/{types,theme,ui,api-client,business-logic}
- **Accès Supabase** : UNIQUEMENT via \`@aureak/api-client\` — jamais directement dans apps/ ni business-logic/
- **Styles** : UNIQUEMENT via \`packages/theme/tokens.ts\` — jamais de couleurs/espacements hardcodés
- **Try/finally obligatoire** sur TOUT state setter de loading/saving :
  \`\`\`ts
  setSaving(true)
  try { await apiCall() } finally { setSaving(false) }
  \`\`\`
- **Console guards** obligatoires :
  \`\`\`ts
  if (process.env.NODE_ENV !== 'production') console.error('[Component]', err)
  \`\`\`
- **Routing Expo Router** : \`page.tsx\` = contenu, \`index.tsx\` = re-export uniquement
- **Soft-delete** : \`deleted_at\` nullable — jamais de DELETE physique sauf jobs RGPD
- **Enums** : DB ↔ TypeScript mirroring strict (packages/types/enums.ts)

## Fichiers modifiés (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Ce que tu dois vérifier
1. **Architecture** : respect du monorepo, imports croisés interdits, @aureak/api-client seul accès DB
2. **TypeScript** : types stricts, pas de \`any\`, enums DB/TS synchronisés
3. **Robustesse** : try/finally sur setLoading/setSaving, null safety (\`?.data\` pas \`.data\`), edge cases
4. **Patterns** : TanStack Query invalidation après mutation, Zustand reset sur navigation, React Hook Form + Zod
5. **Maintenabilité** : duplication > 3x mérite abstraction, composants > 400 lignes à découper
6. **Console guards** : pas de console.log/error sans guard NODE_ENV dans apps/ et api-client/

## Calcul du score
Base 100. Déductions : -15 violation règle non-négociable, -10 BLOCKER architecture, -5 WARNING pattern, -2 style mineur.

${jsonSchema()}`
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  // AGENT 2 : Security Auditor (CRITIQUE)
  // Focus : RLS Supabase, multi-tenant, RBAC, données mineurs, RGPD
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'security',
    name:  'Security Audit',
    emoji: '🛡️',
    labels: {
      positifs:  '✅ Bonnes pratiques',
      alertes:   '⚠️ Risques potentiels',
      critiques: '🚨 Failles critiques — MERGE BLOQUÉ',
    },

    filter: (files) =>
      files
        .filter(f =>
          f.endsWith('.sql')            ||
          f.includes('migrations/')     ||
          f.includes('functions/')      ||
          f.includes('api-client/')     ||
          f.includes('auth')            ||
          f.includes('rls')             ||
          /\.(ts|tsx)$/.test(f)
        )
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es expert en sécurité Supabase et en protection de données sensibles.

## Contexte Aureak — données ultra-sensibles
L'application gère des **mineurs** (enfants 8-18 ans) dans le cadre d'une académie sportive.
Données protégées : identité enfants, parents, coaches, photos, blessures, historique médical implicite.
Règles : RGPD strict, multi-tenant (chaque académie = 1 tenant isolé), RBAC 5 rôles.

## Architecture sécurité Aureak
\`\`\`
Rôles JWT app_metadata : { role: 'admin'|'coach'|'parent'|'child'|'club', tenant_id: UUID }

Fonctions RLS helper :
  current_tenant_id() → auth.jwt()->'app_metadata'->>'tenant_id' (UUID)
  current_user_role() → auth.jwt()->'app_metadata'->>'role' (TEXT)
  is_active_user()    → profiles.status = 'active' pour cet utilisateur

Pattern RLS obligatoire sur TOUTE table :
  FOR ALL USING (
    tenant_id = current_tenant_id()   -- isolation multi-tenant
    AND is_active_user()              -- compte actif uniquement
    AND <condition rôle spécifique>   -- ex: current_user_role() IN ('admin','coach')
  )

Accès Supabase : UNIQUEMENT via @aureak/api-client — SERVICE_ROLE_KEY jamais côté client
\`\`\`

## Fichiers à auditer (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Checklist de sécurité OBLIGATOIRE

### RLS Supabase (CRITIQUE)
- [ ] Toute nouvelle table a \`ALTER TABLE x ENABLE ROW LEVEL SECURITY;\` ?
- [ ] Chaque policy utilise \`current_tenant_id()\` en première condition ?
- [ ] \`is_active_user()\` présent dans toutes les policies de lecture/écriture ?
- [ ] Les données enfants (mineurs) ont une policy restrictive (admin/coach only pour données sensibles) ?
- [ ] Pas de policy \`FOR ALL USING (true)\` ou \`USING (1=1)\` sans restriction ?

### Isolation multi-tenant (CRITIQUE)
- [ ] Aucune requête ne peut retourner des données d'un autre tenant ?
- [ ] Les paramètres d'URL (childId, clubId, etc.) sont-ils validés contre le tenant courant ?
- [ ] Pas de join cross-tenant possible ?

### API et clés (CRITIQUE)
- [ ] \`SUPABASE_SERVICE_ROLE_KEY\` jamais dans apps/ ou packages/ (uniquement Edge Functions et scripts) ?
- [ ] Pas de clé API hardcodée dans le code (regex: \`sk-\`, \`eyJ\`, \`Bearer \`) ?
- [ ] \`@aureak/api-client\` utilisé exclusivement — pas d'import direct de \`@supabase/supabase-js\` dans apps/ ?

### Authentification et RBAC
- [ ] Les routes admin vérifient \`current_user_role() = 'admin'\` ?
- [ ] Les actions coach filtrent par coach_id pour leurs propres données ?
- [ ] Un parent ne peut accéder qu'aux enfants liés via \`parent_child_links\` ?
- [ ] Les données club (partenaire) n'exposent pas de données sensibles sans policy ?

### Inputs et validation
- [ ] Toute donnée utilisateur passe par un schéma Zod avant insertion Supabase ?
- [ ] Les UUIDs de paramètre de route sont validés (format, appartenance au tenant) ?
- [ ] Pas de concaténation directe dans des appels Supabase (injection via .filter()) ?

### Données sensibles RGPD
- [ ] Les données de mineurs (photos, blessures, historique) ont une RLS restrictive ?
- [ ] Pas de PII (email, nom, téléphone) dans les logs console ?
- [ ] Le soft-delete (\`deleted_at\`) est respecté — pas de DELETE physique sans job RGPD ?

## Score sécurité
Base 100. Pénalités : -30 absence RLS sur table, -25 cross-tenant possible, -20 clé exposée, -15 RBAC manquant, -10 input non validé.

${jsonSchema()}`
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  // AGENT 3 : Performance
  // Focus : Expo mobile offline, re-renders, Supabase N+1, TanStack Query
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'performance',
    name:  'Performance',
    emoji: '⚡',
    labels: {
      positifs:  '🚀 Optimisations en place',
      alertes:   '⚡ Améliorations suggérées',
      critiques: '🐌 Goulots critiques',
    },

    filter: (files) =>
      files
        .filter(f => /\.(ts|tsx)$/.test(f) || f.includes('api-client/'))
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es expert en performance Expo React Native et Supabase.

## Contexte Aureak — performances critiques
- **Mobile first** : coaches utilisent l'app sur terrain, connexion instable
- **Contrainte offline** : présences doivent s'enregistrer en < 2 secondes même sans réseau
- **Listes longues** : 678 joueurs dans l'annuaire, listes de séances, historiques
- **Mobile bas de gamme** : parents sur Android mid-range
- **Realtime Supabase** : subscriptions actives pendant les séances terrain

## Stack performance Aureak
\`\`\`
State : Zustand (stores globaux) + TanStack Query (server state)
Forms : React Hook Form (évite re-renders par keypress)
Lists : FlatList Expo / map() React Web
Images : expo-image + Supabase Storage signed URLs (cache)
Offline : expo-sqlite + SyncQueue avec operation_id UUID idempotent
\`\`\`

## Fichiers à analyser (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Checklist performance

### React / Re-renders
- [ ] Callbacks passés en prop mémoïsés avec \`useCallback\` ?
- [ ] Calculs coûteux (tri, filtre, agrégation sur 50+ items) mémoïsés avec \`useMemo\` ?
- [ ] Composants de liste (> 20 items) utilisent FlatList/ScrollView virtualisé (pas \`.map()\` naïf) ?
- [ ] Keys stables dans les listes — pas d'index comme key ?
- [ ] Pas de recréation d'objets/arrays inline dans JSX (\`style={{ }}\`, \`value={[]}\`) ?
- [ ] useEffect avec dépendances correctes (pas de \`[]\` suspect sur des closures) ?

### TanStack Query / Supabase
- [ ] \`staleTime\` configuré (évite refetch sur chaque mount) ?
- [ ] Requêtes parallèles avec \`Promise.all\` ou \`useQueries\` quand indépendantes ?
- [ ] Pas de SELECT * — colonnes explicites pour réduire le payload ?
- [ ] Pagination implémentée sur les listes > 50 items (cursor ou range) ?
- [ ] N+1 évité : pas de boucle avec appel API individuel (utiliser un seul appel avec \`.in()\`) ?
- [ ] Mutations suivies d'un \`invalidateQueries\` ciblé (pas global) ?

### Offline / Mobile
- [ ] Les actions terrain (présence, évaluation) passent par la SyncQueue offline ?
- [ ] Les signed URLs Supabase Storage sont mises en cache (éviter refetch à chaque render) ?
- [ ] Pas de chargement bloquant au mount pour des données non critiques ?
- [ ] Les images joueurs utilisent expo-image avec cache ?

## Calcul du score
Base 100. Pénalités : -20 N+1 avéré, -15 liste non virtualisée > 100 items, -10 re-render en cascade, -5 optimisation manquée.

${jsonSchema()}`
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  // AGENT 4 : UI/UX
  // Focus : Tamagui DS, double cible parent/enfant, Expo mobile
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'uiux',
    name:  'UI/UX Review',
    emoji: '🎨',
    labels: {
      positifs:  '✅ Points positifs',
      alertes:   '🎨 Améliorations',
      critiques: '📉 Frictions bloquantes',
    },

    filter: (files) =>
      files.filter(f => f.endsWith('.tsx')).slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es expert UX pour applications mobiles (Expo React Native) et web admin.

## Contexte Aureak — 4 audiences distinctes
\`\`\`
👨‍💼 Admin     : web (bureau), densité élevée, tableaux, gestion
👨‍🏫 Coach     : mobile terrain, gants, connexion faible, 1 main, actions rapides
👨‍👩‍👦 Parent    : mobile, consulte progrès enfant, décideur émotionnel
🧒 Enfant   : mobile, 8-18 ans, quiz/gamification, motivation
\`\`\`

## Design System Aureak — règles strictes
\`\`\`
Thème     : Light Premium — beige #F3EFE7 (fond), blanc #FFFFFF (cards), dark sidebar
Tokens    : packages/theme/tokens.ts — UNIQUEMENT ces valeurs
Couleurs  : colors.light.*, colors.accent.{gold,red,goldLight}, colors.status.{present,absent,pending}
Ombres    : shadows.{sm,md,lg,gold} — pas de boxShadow hardcodé
Radius    : radius.{xs:6, sm:8, md:12, lg:16, xl:20, cardLg:24}
Composants: @aureak/ui — Card (dark/light/gold), Button (primary/secondary/ghost/danger),
            Badge (7 variants), Input (dark/light)
\`\`\`

## Fichiers à analyser (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Checklist UI/UX par audience

### Design System (toutes audiences)
- [ ] Couleurs uniquement depuis \`colors.*\` (tokens.ts) — aucun hex hardcodé ?
- [ ] Composants \`@aureak/ui\` utilisés (Button, Card, Badge, Input) — pas de recréation locale ?
- [ ] Variants corrects : Button primary pour action principale, ghost pour secondaire ?
- [ ] Ombres/radius cohérents avec les tokens ?

### Feedback utilisateur (toutes audiences)
- [ ] État de chargement visible (skeleton ou spinner) pendant les fetches ?
- [ ] Message d'erreur affiché dans l'UI (pas juste console) ?
- [ ] Confirmation visible après une action (toast, badge vert, texte) ?
- [ ] Bouton submit désactivé pendant la soumission (éviter double-tap) ?
- [ ] Empty state : message utile + action suggérée si liste vide ?

### Coach mobile (terrain)
- [ ] Boutons suffisamment grands (min 44px) pour utilisation avec gants ?
- [ ] Prise de présence accessible en ≤ 2 taps depuis la liste ?
- [ ] Pas de modal bloquant pour des actions fréquentes ?
- [ ] État offline visible clairement (indicateur de sync) ?

### Parent mobile (décision)
- [ ] Progrès de l'enfant visible immédiatement sur le dashboard sans scroll ?
- [ ] Informations importantes hiérarchisées (prochaine séance, dernier badge) ?
- [ ] Navigation entre les enfants (si plusieurs) facile et rapide ?

### Enfant (engagement / gamification)
- [ ] Progression et badges visibles dès l'ouverture ?
- [ ] Langage adapté à 8-18 ans (pas de jargon technique) ?
- [ ] Encouragements visuels sur les jalons (premier badge, série) ?

### Accessibilité
- [ ] Icônes seules avec \`accessibilityLabel\` ?
- [ ] Contraste suffisant pour texte sur beige (WCAG AA) ?
- [ ] Tailles de police min 14px pour contenu courant ?

## Calcul du score
Base 100. Pénalités : -20 friction bloquante dans un parcours critique, -10 non-conformité DS, -8 feedback utilisateur manquant, -5 accessibilité.

${jsonSchema()}`
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  // AGENT 5 : Business
  // Focus : conversion académie, engagement parent/enfant, valeur perçue
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'business',
    name:  'Business Review',
    emoji: '📊',
    labels: {
      positifs:  '💰 Opportunités business',
      alertes:   '📊 Suggestions produit',
      critiques: '❌ Blocages de conversion',
    },

    filter: (files) =>
      files
        .filter(f =>
          f.endsWith('.tsx') &&
          (
            f.includes('(parent)') ||
            f.includes('(child)')  ||
            f.includes('(auth)')   ||
            f.includes('(club)')   ||
            f.includes('dashboard') ||
            f.includes('login')    ||
            f.includes('index')
          )
        )
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es Product Manager senior spécialisé en SaaS sportif B2B2C.

## Modèle business Aureak
\`\`\`
Clients payants : clubs / académies de football (abonnement SaaS)
Valeur vendue  : "Les parents voient les progrès de leur enfant en temps réel"
Rétention      : satisfaction parents → renouvellement contrat club
Engagement     : enfants actifs sur quiz/badges → parents satisfaits → clubs fidèles
Expansion      : clubs partenaires (parrainage, visibilité joueurs RBFA)
\`\`\`

## Parcours critiques Aureak
\`\`\`
1. Parent : login → voir progrès enfant → recevoir notification post-séance → rester engagé
2. Enfant : quiz → badge → progression → revenir sans rappel
3. Coach  : créer séance → marquer présences (< 2min pour 20 enfants) → clôturer
4. Admin  : créer saison → configurer groupes → inviter coaches/parents
\`\`\`

## Fichiers à analyser (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Checklist business

### Proposition de valeur (Parent)
- [ ] Le dashboard parent communique clairement "votre enfant progresse" ?
- [ ] Les statistiques clés (présences, évaluations, badges) sont visibles sans chercher ?
- [ ] La prochaine séance est affichée en priorité ?
- [ ] La notification post-séance incite à rouvrir l'app ?

### Conversion et onboarding
- [ ] Le premier écran après login est utile (pas un écran vide ou de configuration) ?
- [ ] Les actions principales accessibles en < 3 clics depuis le dashboard ?
- [ ] Empty states guidants (ex: "Aucune séance — votre coach n'a pas encore créé de séances") ?
- [ ] Les erreurs ont un message humain (pas "Error 400") ?

### Engagement enfant (rétention)
- [ ] La progression (XP, badges, streaks) est visible et motivante ?
- [ ] Un enfant revient-il naturellement après une notification/badge ?
- [ ] Les quiz sont-ils accessibles rapidement (< 2 taps) ?

### Valeur clubs partenaires
- [ ] Les clubs voient clairement leurs joueurs affiliés et leur progression ?
- [ ] La fonctionnalité RBFA (enrichissement matricules) est valorisée ?
- [ ] Les coaches du club peuvent accéder aux données qui les concernent ?

### Friction et abandon
- [ ] Formulaires longs inutilement découpés ou non sauvegardés partiellement ?
- [ ] Confirmations superflues avant des actions non destructives ?
- [ ] Messages d'erreur qui ne proposent pas de solution ?

## Calcul du score
Base 100. Pénalités : -25 parcours critique bloqué, -15 valeur principale non visible, -10 friction d'onboarding, -5 opportunité d'engagement manquée.

${jsonSchema()}`
    },
  },


  // ───────────────────────────────────────────────────────────────────────
  // AGENT 6 : User Simulator
  // Focus : simulation 3 profils réels — parent, enfant, coach terrain
  // ───────────────────────────────────────────────────────────────────────
  {
    id:    'user-simulator',
    name:  'User Reality Check',
    emoji: '🧪',
    labels: {
      positifs:  '✅ Expériences fluides',
      alertes:   '⚠️ Points de friction',
      critiques: '🚫 Blocages utilisateur',
    },

    filter: (files) =>
      files
        .filter(f =>
          f.endsWith('.tsx') &&
          (
            f.includes('(parent)') ||
            f.includes('(child)')  ||
            f.includes('(coach)')  ||
            f.includes('(auth)')   ||
            f.includes('dashboard') ||
            f.includes('login')    ||
            f.includes('index')    ||
            f.includes('page')
          )
        )
        .slice(0, MAX_FILES),

    buildPrompt(files, fileContents) {
      return `Tu es un expert en UX et psychologie utilisateur. Tu simules l'expérience de 3 profils réels sur l'application Aureak (académie de gardiens de but).

## Les 3 profils utilisateurs

\`\`\`
👨 Parent (décideur émotionnel)
  - Âge : 35-45 ans, smartphone, souvent en mode "rapide"
  - Motivation : voir les progrès de son enfant, se sentir rassuré
  - Crainte : ne pas comprendre, perdre du temps, se tromper
  - Seuil d'abandon : 3 clics sans résultat = ferme l'app

🧒 Enfant (8-18 ans)
  - Smartphone, attention courte, cherche du fun
  - Motivation : badges, progression, retour visuel immédiat
  - Crainte : ennui, sentiment de "trop compliqué"
  - Seuil d'abandon : si pas immédiatement clair ou motivant = quitte

🧑‍🏫 Coach (terrain)
  - Smartphone, souvent avec des gants, connexion instable
  - Motivation : rapidité, efficacité, zéro friction
  - Crainte : perdre du temps, bug en plein entraînement
  - Seuil d'abandon : > 3 taps pour une action = cherche une alternative
\`\`\`

## Fichiers à simuler (${files.length})
${files.map(f => `- ${f}`).join('\n')}

## Contenu
${fileContents}

## Mission : simuler chaque profil sur ces fichiers

Pour chaque profil, évalue :
1. **Compréhension** : le profil comprend-il immédiatement ce qu'il voit ?
2. **Clarté** : labels, boutons, messages sont-ils adaptés à ce profil ?
3. **Friction** : y a-t-il des étapes inutiles, des blocages, de la confusion ?
4. **Logique** : le flux d'actions est-il naturel pour ce profil ?

Identifie les confusions, surcharges cognitives et frictions spécifiques à chaque profil.

## Calcul du score
Base 100. Pénalités : -20 parcours bloqué pour un profil, -15 message incompréhensible pour la cible, -10 trop d'étapes pour une action simple, -5 feedback visuel manquant.

${jsonSchema()}`
    },
  },

] // fin AGENTS


// ═══════════════════════════════════════════════════════════════════════════
// § 4. RUNNER — Exécution des agents
// ═══════════════════════════════════════════════════════════════════════════

async function runAgent(agent, allFiles) {
  const files = agent.filter(allFiles)

  if (!files.length) {
    console.log(`  ⏭  ${agent.name} — skipped (aucun fichier correspondant)`)
    return { agent, skipped: true, result: null }
  }

  console.log(`  → ${agent.name} (${files.length} fichier(s))...`)

  const fileContents = buildFileContents(files)
  const prompt       = agent.buildPrompt(files, fileContents)

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].text

  try {
    const result = parseClaudeJson(raw)
    const tag    = result.verdict === 'BLOCKED' ? '🚨' : result.verdict === 'NEEDS_WORK' ? '⚠️' : '✅'
    console.log(`  ${tag} ${agent.name} — ${result.verdict} (${result.score}/100)`)
    return { agent, skipped: false, result }
  } catch (err) {
    console.error(`  ✗ ${agent.name} — JSON invalide (${err.message}) :`, raw.slice(0, 200))
    return {
      agent,
      skipped: false,
      result: {
        verdict:            'NEEDS_WORK',
        score:              50,
        score_justification:'Erreur de parsing de la réponse Claude.',
        summary:            `Agent ${agent.name} : erreur de parsing. Consulter les logs CI.`,
        positifs:           [],
        alertes:            [],
        critiques:          [{
          message: `Réponse Claude non parseable — ${err.message}`,
          file:    '',
          impact:  'Review indisponible pour cet agent',
          action:  'Vérifier les logs GitHub Actions',
          fix:     'Relancer le workflow ou vérifier le quota API',
        }],
      },
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// § 4b. COACH PRODUIT — Synthèse globale post-agents
// ═══════════════════════════════════════════════════════════════════════════

const COACH_PRODUCT_AGENT = {
  id:    'coach-product',
  name:  'Product Coach',
  emoji: '🧑‍🏫',
  labels: {
    positifs:  '✅ Points forts produit',
    alertes:   '📌 Points d\'attention',
    critiques: '🚨 Blocages produit',
  },
}

/**
 * Exécute l'agent Product Coach après tous les autres agents.
 * Reçoit les outputs déjà calculés comme contexte — ne traite pas de fichiers directement.
 */
async function runCoachProductAgent(outputs, prNumber) {
  const active = outputs.filter(o => !o.skipped && o.result)
  if (!active.length) {
    console.log(`  ⏭  Product Coach — skipped (aucun agent actif)`)
    return { agent: COACH_PRODUCT_AGENT, skipped: true, result: null }
  }

  console.log(`  → Product Coach (synthèse de ${active.length} agent(s))...`)

  const agentSummaries = active.map(o =>
    [
      `${o.agent.emoji} ${o.agent.name} (${o.result.score}/100 — ${o.result.verdict})`,
      `  Zone critique : ${o.result.zone_critique ?? 'N/A'}`,
      `  ${o.result.summary}`,
    ].join('\n')
  ).join('\n\n')

  const allCritiques = active
    .flatMap(o => (o.result.critiques ?? []).map(c => ({
      agent:    o.agent.name,
      message:  c.message,
      security: c.impact_dimensions?.security ?? 0,
    })))
    .sort((a, b) => b.security - a.security)

  const allAlertes = active
    .flatMap(o => (o.result.alertes ?? [])
      .filter(a => a.severity === 'high')
      .map(a => `[${o.agent.name}] ${a.message}`)
    )

  const prompt = `Tu es Product Coach senior pour Aureak — plateforme SaaS de gestion d'académie de gardiens de but.

## Contexte Aureak
\`\`\`
Cible      : parents (décideurs) + enfants (utilisateurs) + coaches (terrain)
Objectif   : conversion académie, progression gardien, engagement famille
Style      : simple, premium, efficace
Modèle     : SaaS B2B2C — clubs paient, parents/enfants utilisent
\`\`\`

## Résultats des agents (PR #${prNumber})
${agentSummaries}

${allCritiques.length ? `## Critiques identifiées\n${allCritiques.map(c => `- [${c.agent}] ${c.message}`).join('\n')}` : ''}
${allAlertes.length ? `\n## Alertes high priority\n${allAlertes.map(a => `- ${a}`).join('\n')}` : ''}

## Ta mission : synthèse produit + plan d'action

Ordre de priorité ABSOLU :
1. 🔴 Security — faille = perte de confiance immédiate
2. ⚡ Performance — lenteur = abandon utilisateur
3. 🎨 UX — friction = non-renouvellement contrat
4. 📊 Business — manque = croissance ralentie

Produis ta synthèse en JSON :
{
  "verdict":            "APPROVED" | "NEEDS_WORK" | "BLOCKED",
  "score":              <entier 0-100 — maturité produit globale>,
  "score_justification":"<1 phrase expliquant le score produit>",
  "zone_critique":      "<zone de risque produit principale>",
  "summary":            "<synthèse honnête en 2 phrases — état réel de la PR>",
  "priorites": [
    "<priorité #1 — la plus critique, contextualisée Aureak>",
    "<priorité #2>",
    "<priorité #3>"
  ],
  "plan_action": [
    "<étape concrète 1 — qui fait quoi>",
    "<étape concrète 2>",
    "<étape concrète 3>"
  ],
  "next_step": "<prochaine feature produit à développer après corrections, ex: 'Notifications post-séance parents'>",
  "positifs":  ["<point fort concret de cette PR>"],
  "alertes":   [],
  "critiques": []
}

Règles :
- Maximum 3 priorités, 3 étapes de plan d'action
- next_step : feature produit spécifique à Aureak (pas un conseil générique)
- BLOCKED uniquement si security critique confirmée par l'agent Security
- Réponds UNIQUEMENT avec le JSON`

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  try {
    const result = parseClaudeJson(response.content[0].text)
    const tag    = result.verdict === 'BLOCKED' ? '🚨' : result.verdict === 'NEEDS_WORK' ? '⚠️' : '✅'
    console.log(`  ${tag} Product Coach — ${result.verdict} (${result.score}/100)`)
    return { agent: COACH_PRODUCT_AGENT, skipped: false, result }
  } catch (err) {
    console.error(`  ✗ Product Coach — JSON invalide : ${err.message}`)
    return { agent: COACH_PRODUCT_AGENT, skipped: true, result: null }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// § 5. COACH GLOBAL — Recommandation de synthèse
// ═══════════════════════════════════════════════════════════════════════════

async function generateGlobalRecommendation(outputs, globalScore, blockDecision) {
  const active = outputs.filter(o => !o.skipped && o.result)

  const agentSummaries = active.map(o =>
    `${o.agent.emoji} ${o.agent.name} (${o.result.score}/100 — ${o.result.verdict}) : ${o.result.summary}`
  ).join('\n')

  const allCritiques = active
    .flatMap(o => (o.result.critiques ?? []).map(c => `[${o.agent.name}] ${c.message}`))
    .slice(0, 6)

  const allAlertes = active
    .flatMap(o => (o.result.alertes ?? [])
      .filter(a => a.severity === 'high')
      .map(a => `[${o.agent.name}] ${a.message}`)
    )
    .slice(0, 4)

  const blockContext = blockDecision.blocked
    ? `⚠️ La PR est BLOQUÉE pour la raison suivante : ${blockDecision.reason}`
    : '✅ La PR peut merger après corrections éventuelles.'

  const prompt = `Tu es coach technique et produit senior pour le projet Aureak (académie de gardiens de but).

Score global de cette PR : ${globalScore}/100
${blockContext}

Résumés des agents :
${agentSummaries}

${allCritiques.length ? `Problèmes critiques :\n${allCritiques.map(c => `- ${c}`).join('\n')}` : ''}
${allAlertes.length ? `\nAlertes high priority :\n${allAlertes.map(a => `- ${a}`).join('\n')}` : ''}

Produis une recommandation globale concise en JSON :
{
  "titre": "<titre accrocheur de la PR en 1 ligne>",
  "resume": "<1-2 phrases de synthèse honnête>",
  "priorites": [
    "<action #1 — la plus critique>",
    "<action #2>",
    "<action #3>"
  ],
  "orientation": "<conseil stratégique produit/technique en 1 phrase>",
  "next_step": "<prochaine étape concrète après correction>"
}

Réponds UNIQUEMENT avec le JSON. Maximum 3 priorités. Sois direct et actionnable.`

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: 512,
    messages:   [{ role: 'user', content: prompt }],
  })

  try {
    return parseClaudeJson(response.content[0].text)
  } catch {
    return {
      titre:       'Analyse multi-agents complète',
      resume:      `Score global ${globalScore}/100. ${blockDecision.blocked ? 'Corrections requises avant merge.' : 'PR dans un état acceptable.'}`,
      priorites:   allCritiques.slice(0, 3).map(c => c.replace(/^\[.*?\] /, '')),
      orientation: 'Se concentrer sur les corrections critiques en priorité.',
      next_step:   blockDecision.blocked ? 'Corriger les bloquants puis repousser la branche.' : 'Valider les corrections avec les reviewers humains.',
    }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// § 6. SCORE GLOBAL ET LOGIQUE DE BLOCAGE
// ═══════════════════════════════════════════════════════════════════════════

function computeGlobalScore(outputs) {
  const active = outputs.filter(o => !o.skipped && o.result?.score != null)
  if (!active.length) return 0

  let totalWeight  = 0
  let weightedSum  = 0

  for (const { agent, result } of active) {
    const weight = SCORE_WEIGHTS[agent.id] ?? 10
    weightedSum += result.score * weight
    totalWeight += weight
  }

  return Math.round(weightedSum / totalWeight)
}

function evaluateBlockConditions(outputs, globalScore) {
  for (const cond of BLOCK_CONDITIONS) {
    if (cond.test(outputs, globalScore)) {
      return {
        blocked: true,
        conditionId: cond.id,
        reason: cond.reason(globalScore, outputs),
      }
    }
  }
  return { blocked: false, conditionId: null, reason: null }
}


// ═══════════════════════════════════════════════════════════════════════════
// § 7. ASSEMBLAGE DU COMMENTAIRE PR
// ═══════════════════════════════════════════════════════════════════════════

/** Rend la section détaillée d'un agent avec fixes proposés. */
function renderAgentSection(agent, result) {
  const lines = [
    `### ${agent.emoji} ${agent.name}`,
    '',
    `${verdictBadge(result.verdict)} &nbsp;·&nbsp; ${scoreBadge(result.score)}`,
    '',
    `> ${result.summary}`,
  ]

  if (result.score_justification) {
    lines.push(`> _${result.score_justification}_`)
  }
  if (result.zone_critique) {
    lines.push(`> 🎯 **Zone critique principale :** ${result.zone_critique}`)
  }
  lines.push('')

  // Positifs
  if (result.positifs?.length) {
    lines.push(`**${agent.labels.positifs}**`)
    result.positifs.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  // Alertes + fix
  if (result.alertes?.length) {
    lines.push(`**${agent.labels.alertes}**`)
    result.alertes.forEach(({ message, file, severity, detail, fix, impact_dimensions }) => {
      lines.push(`- ${severityIcon(severity)} **${message}**${file ? ` — \`${file}\`` : ''}`)
      if (detail) lines.push(`  > ${detail}`)
      if (impact_dimensions) {
        const dims = formatImpactDims(impact_dimensions)
        if (dims) lines.push(`  > 📊 _Impact :${dims}_`)
      }
      if (fix) {
        lines.push(`  > 🔧 **Fix :** ${fix.includes('\n') ? `\n  > \`\`\`\n${fix.split('\n').map(l => `  > ${l}`).join('\n')}\n  > \`\`\`` : `\`${fix}\``}`)
      }
    })
    lines.push('')
  }

  // Critiques + fix
  if (result.critiques?.length) {
    lines.push(`**${agent.labels.critiques}**`)
    result.critiques.forEach(({ message, file, impact, action, fix, impact_dimensions }) => {
      lines.push(`- 🚨 **${message}**${file ? ` — \`${file}\`` : ''}`)
      if (impact)  lines.push(`  > **Impact :** ${impact}`)
      if (impact_dimensions) {
        const dims = formatImpactDims(impact_dimensions)
        if (dims) lines.push(`  > 📊 _Dimensions :${dims}_`)
      }
      if (action)  lines.push(`  > **Action :** ${action}`)
      if (fix) {
        const isMultiline = fix.includes('\n')
        if (isMultiline) {
          lines.push(`  >\n  > 🔧 **Fix proposé :**`)
          lines.push(`  > \`\`\``)
          fix.split('\n').forEach(l => lines.push(`  > ${l}`))
          lines.push(`  > \`\`\``)
        } else {
          lines.push(`  > 🔧 **Fix :** \`${fix}\``)
        }
      }
    })
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Formate les dimensions d'impact en badges compacts.
 * @returns {string} ex: " · 🔒8 ⚡3 🎨0 📊5"
 */
function formatImpactDims(dims) {
  if (!dims) return ''
  const parts = []
  if (dims.security    > 0) parts.push(`🔒${dims.security}`)
  if (dims.performance > 0) parts.push(`⚡${dims.performance}`)
  if (dims.ux          > 0) parts.push(`🎨${dims.ux}`)
  if (dims.business    > 0) parts.push(`📊${dims.business}`)
  return parts.length ? ` · ${parts.join(' ')}` : ''
}

/**
 * Génère le plan d'action priorisé global.
 * Collecte toutes les issues de tous les agents, les trie par score d'impact produit total
 * (somme des 4 dimensions), critiques avant alertes, puis par priorité d'agent.
 */
function renderActionPlan(outputs) {
  const allIssues = []

  const prioritized = [...outputs].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.agent.id)
    const bi = PRIORITY_ORDER.indexOf(b.agent.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  for (const { agent, skipped, result } of prioritized) {
    if (skipped || !result) continue

    for (const c of (result.critiques ?? [])) {
      const dims  = c.impact_dimensions ?? {}
      const total = (dims.security ?? 0) + (dims.performance ?? 0) + (dims.ux ?? 0) + (dims.business ?? 0)
      allIssues.push({ ...c, isCritique: true, agent, totalImpact: total, dims })
    }
    for (const a of (result.alertes ?? [])) {
      const dims  = a.impact_dimensions ?? {}
      const total = (dims.security ?? 0) + (dims.performance ?? 0) + (dims.ux ?? 0) + (dims.business ?? 0)
      allIssues.push({ ...a, isCritique: false, agent, totalImpact: total, dims })
    }
  }

  if (!allIssues.length) return null

  // Trier : critiques d'abord → impact total décroissant → priorité agent
  allIssues.sort((a, b) => {
    if (a.isCritique !== b.isCritique) return a.isCritique ? -1 : 1
    if (b.totalImpact !== a.totalImpact) return b.totalImpact - a.totalImpact
    return (PRIORITY_ORDER.indexOf(a.agent.id) ?? 99) - (PRIORITY_ORDER.indexOf(b.agent.id) ?? 99)
  })

  const lines = [
    `### 🗺️ Plan d'action priorisé`,
    '',
    `> ${allIssues.length} issue(s) triées par impact produit — critiques en tête, puis score d'impact décroissant.`,
    '',
  ]

  allIssues.forEach((issue, i) => {
    const tag     = issue.isCritique ? '🚨' : severityIcon(issue.severity)
    const dimStr  = issue.totalImpact > 0
      ? ` _(${issue.totalImpact}/40${formatImpactDims(issue.dims)})_`
      : ''
    const fileStr = issue.file ? ` — \`${issue.file}\`` : ''
    lines.push(`${i + 1}. ${tag} **[${issue.agent.emoji} ${issue.agent.name}]** ${issue.message}${fileStr}${dimStr}`)
    const fixText = issue.fix ?? issue.action
    if (fixText) {
      const short = fixText.includes('\n') ? fixText.split('\n')[0] : fixText
      lines.push(`   > 🔧 ${short.length > 120 ? short.slice(0, 117) + '…' : short}`)
    }
  })

  lines.push('')
  return lines.join('\n')
}

/**
 * Rend la section dédiée au Product Coach.
 * Affiche : verdict, score, zone critique, summary, priorités, plan d'action, next step.
 */
function renderCoachProductSection(result) {
  const lines = [
    `### 🧑‍🏫 Product Coach`,
    '',
    `${verdictBadge(result.verdict)} &nbsp;·&nbsp; ${scoreBadge(result.score)}`,
    '',
  ]

  if (result.score_justification) {
    lines.push(`> _${result.score_justification}_`)
  }
  if (result.zone_critique) {
    lines.push(`> 🎯 **Zone critique produit :** ${result.zone_critique}`)
  }
  lines.push('')
  lines.push(`> ${result.summary}`)
  lines.push('')

  if (result.priorites?.length) {
    lines.push(`**🎯 Priorités avant merge**`)
    result.priorites.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
    lines.push('')
  }

  if (result.plan_action?.length) {
    lines.push(`**📌 Plan d'action**`)
    result.plan_action.forEach((step, i) => lines.push(`${i + 1}. ${step}`))
    lines.push('')
  }

  if (result.next_step) {
    lines.push(`**🚀 Prochaine feature produit :** ${result.next_step}`)
    lines.push('')
  }

  if (result.positifs?.length) {
    lines.push(`**✅ Points forts produit**`)
    result.positifs.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }

  if (result.alertes?.length) {
    lines.push(`**📌 Points d'attention**`)
    result.alertes.forEach(({ message, severity, detail }) => {
      lines.push(`- ${severityIcon(severity)} **${message}**`)
      if (detail) lines.push(`  > ${detail}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Assemble le commentaire PR complet.
 * @param {object|null} coachProductOutput — output de l'agent Product Coach (affiché en premier)
 * @param {number|null} prevScore — score de l'analyse précédente (null si première fois)
 */
function buildPRComment(outputs, allFiles, prNumber, globalScore, blockDecision, recommendation, prevScore = null, coachProductOutput = null) {
  const date       = new Date().toISOString().slice(0, 10)
  const active     = outputs.filter(o => !o.skipped && o.result)
  const skipped    = outputs.filter(o => o.skipped)
  const verdictGlobal = blockDecision.blocked
    ? '🚨 **BLOCKED**'
    : active.some(o => o.result.verdict === 'NEEDS_WORK')
      ? '⚠️ **NEEDS WORK**'
      : '✅ **APPROVED**'

  const lines = []

  // ── Header ─────────────────────────────────────────────────────────────
  lines.push(`## 🤖 Aureak AI Review — PR #${prNumber}`)
  lines.push('')

  // ── Score global ───────────────────────────────────────────────────────
  lines.push(`### 🧠 Score global`)
  lines.push('')
  lines.push(`| Indicateur | Valeur |`)
  lines.push(`|------------|--------|`)

  const evo = evolutionIndicator(globalScore, prevScore)
  lines.push(`| Score | ${scoreBadge(globalScore)}${evo} |`)
  if (prevScore != null) {
    lines.push(`| Score précédent | ${scoreBadge(prevScore)} |`)
  }

  lines.push(`| Verdict | ${verdictGlobal} |`)
  lines.push(`| Fichiers analysés | ${allFiles.length} |`)
  lines.push(`| Date | ${date} |`)
  lines.push('')

  if (blockDecision.blocked) {
    lines.push(`> 🚨 **MERGE BLOQUÉ** — ${blockDecision.reason}`)
    lines.push('')
  }

  // ── Tableau des agents ─────────────────────────────────────────────────
  lines.push(`### 📊 Tableau des agents`)
  lines.push('')
  lines.push(`| Agent | Score | Verdict | Critiques | Alertes |`)
  lines.push(`|-------|-------|---------|-----------|---------|`)

  // Afficher les agents dans l'ordre de priorité
  const orderedOutputs = [...outputs].sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.agent.id)
    const bi = PRIORITY_ORDER.indexOf(b.agent.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  orderedOutputs.forEach(({ agent, skipped: s, result }) => {
    if (s || !result) {
      lines.push(`| ${agent.emoji} ${agent.name} | — | ⏭ skipped | — | — |`)
    } else {
      const v         = verdictBadge(result.verdict)
      const sc        = scoreBadge(result.score)
      const nc        = result.critiques?.length ?? 0
      const na        = result.alertes?.length ?? 0
      const critIcon  = nc > 0 ? `🚨 ${nc}` : '✅ 0'
      const alertIcon = na > 0 ? `⚠️ ${na}` : '✅ 0'
      lines.push(`| ${agent.emoji} ${agent.name} | ${sc} | ${v} | ${critIcon} | ${alertIcon} |`)
    }
  })
  lines.push('')

  if (skipped.length) {
    lines.push(`> ℹ️ Agents non déclenchés : ${skipped.map(o => `${o.agent.emoji} ${o.agent.name}`).join(' · ')}`)
    lines.push('')
  }

  // ── Product Coach (synthèse — affiché avant toutes les autres sections) ─
  if (coachProductOutput && !coachProductOutput.skipped && coachProductOutput.result) {
    lines.push('---')
    lines.push('')
    lines.push(renderCoachProductSection(coachProductOutput.result))
  }

  // ── Recommandation globale ─────────────────────────────────────────────
  if (recommendation) {
    lines.push(`### 🎯 Recommandation globale`)
    lines.push('')
    lines.push(`> **${recommendation.titre}**`)
    lines.push(`> ${recommendation.resume}`)
    lines.push('')
    if (recommendation.priorites?.length) {
      lines.push(`**Priorités avant merge :**`)
      recommendation.priorites.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
      lines.push('')
    }
    if (recommendation.orientation) {
      lines.push(`💡 _${recommendation.orientation}_`)
      lines.push('')
    }
    if (recommendation.next_step) {
      lines.push(`**Prochaine étape :** ${recommendation.next_step}`)
      lines.push('')
    }
  }

  // ── Problèmes prioritaires (vue cross-agent) ───────────────────────────
  const prioritizedSection = renderPrioritizedSection(outputs)
  if (prioritizedSection) {
    lines.push('---')
    lines.push('')
    lines.push(prioritizedSection)
  }

  // ── Patches préparés ───────────────────────────────────────────────────
  const patchSection = renderPatchSummary(outputs)
  if (patchSection) {
    lines.push(patchSection)
  }

  // ── Plan d'action priorisé global ──────────────────────────────────────
  const actionPlan = renderActionPlan(outputs)
  if (actionPlan) {
    lines.push(actionPlan)
  }

  lines.push('---')
  lines.push('')

  // ── Sections détaillées par agent (ordre priorité) ─────────────────────
  const activeOrdered = orderedOutputs.filter(o => !o.skipped && o.result)
  activeOrdered.forEach((o, i) => {
    lines.push(renderAgentSection(o.agent, o.result))
    if (i < activeOrdered.length - 1) lines.push('\n---\n')
  })

  lines.push('---')
  lines.push('')
  const totalAgents = active.length + (coachProductOutput && !coachProductOutput.skipped ? 1 : 0)
  lines.push(`*Généré par Claude \`${MODEL}\` · ${totalAgents} agent(s) · Validation humaine obligatoire avant merge.*`)

  return lines.join('\n')
}


// ═══════════════════════════════════════════════════════════════════════════
// § 8. MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const changedFiles = (process.env.CHANGED_FILES ?? '')
    .split('\n').map(f => f.trim()).filter(Boolean)

  const prNumber = process.env.PR_NUMBER ?? '?'

  // Score de l'analyse précédente sur cette PR (0 = pas d'historique)
  const prevScoreRaw = parseInt(process.env.PREV_SCORE ?? '', 10)
  const prevScore    = isNaN(prevScoreRaw) || prevScoreRaw === 0 ? null : prevScoreRaw

  console.log(`\n🤖 Aureak AI Review v5 — PR #${prNumber}`)
  console.log(`   Agents : ${AGENTS.length} + 1 Product Coach | Fichiers : ${changedFiles.length}`)
  console.log(`   Seuil blocage : ${BLOCK_SCORE_THRESHOLD}/100`)
  console.log(`   Score précédent : ${prevScore != null ? `${prevScore}/100` : 'aucun historique'}\n`)

  if (!changedFiles.length) {
    const msg = '## 🤖 Aureak AI Review\n\n> Aucun fichier à analyser dans cette PR.\n'
    process.stdout.write('\n__COMMENT_START__\n' + msg + '\n__COMMENT_END__\n')
    // Écrire le verdict pour le workflow
    process.stdout.write('\n__BLOCKED__:false\n')
    return
  }

  // Exécution séquentielle des agents
  const outputs = []
  for (const agent of AGENTS) {
    try {
      outputs.push(await runAgent(agent, changedFiles))
    } catch (err) {
      console.error(`  ✗ ${agent.name} — erreur fatale : ${err.message}`)
      outputs.push({ agent, skipped: true, result: null })
    }
  }

  // Score et décision de blocage
  const globalScore   = computeGlobalScore(outputs)
  const blockDecision = evaluateBlockConditions(outputs, globalScore)

  console.log(`\n── Résultats ──────────────────────────────────`)
  console.log(`   Score global  : ${globalScore}/100`)
  console.log(`   Seuil         : ${BLOCK_SCORE_THRESHOLD}/100`)
  console.log(`   Blocage PR    : ${blockDecision.blocked ? `OUI — ${blockDecision.reason}` : 'NON'}`)

  // Product Coach — synthèse après tous les agents
  console.log('\n  → Product Coach (synthèse)...')
  let coachProductOutput = null
  try {
    coachProductOutput = await runCoachProductAgent(outputs, prNumber)
  } catch (err) {
    console.error(`  ✗ Product Coach — erreur fatale : ${err.message}`)
  }

  // Recommandation de synthèse (appel Claude léger)
  console.log('  → Recommandation globale...')
  const recommendation = await generateGlobalRecommendation(outputs, globalScore, blockDecision)

  // Assemblage et émission du commentaire
  const comment = buildPRComment(outputs, changedFiles, prNumber, globalScore, blockDecision, recommendation, prevScore, coachProductOutput)

  process.stdout.write('\n__COMMENT_START__\n')
  process.stdout.write(comment)
  process.stdout.write('\n__COMMENT_END__\n')

  // Signal de blocage lisible par le workflow
  process.stdout.write(`\n__BLOCKED__:${blockDecision.blocked}\n`)
  if (blockDecision.blocked) {
    process.stdout.write(`\n__BLOCK_REASON__:${blockDecision.reason}\n`)
  }

  if (blockDecision.blocked) {
    console.error(`\n🚨 PR BLOQUÉE — ${blockDecision.reason}`)
    process.exit(1)
  }

  console.log('\n✅ Review terminée — aucun blocage.')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Erreur fatale :', err.message)
  process.exit(1)
})
