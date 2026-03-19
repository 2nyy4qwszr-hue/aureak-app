'use client'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getThemeByKey, listCriteriaByTheme, listThemeGroups, listSequencesByTheme, listMetaphorsByTheme } from '@aureak/api-client'
import type { Theme, Criterion, ThemeGroup, ThemeSequence, ThemeMetaphor } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

// Import des sections
import SectionIdentite from './sections/SectionIdentite'
import SectionVisionPedagogique from './sections/SectionVisionPedagogique'
import SectionCriteres from './sections/SectionCriteres'
import SectionSequences from './sections/SectionSequences'
import SectionMetaphores from './sections/SectionMetaphores'
import SectionMiniExercices from './sections/SectionMiniExercices'
import SectionOrganisation from './sections/SectionOrganisation'
import SectionPedagogiePlaceholder from './sections/SectionPedagogiePlaceholder'
import SectionSavoirFaire from './sections/SectionSavoirFaire'
import SectionEvalVideo from './sections/SectionEvalVideo'
import SectionBadge from './sections/SectionBadge'
import SectionRessources from './sections/SectionRessources'
import SectionPageTerrain from './sections/SectionPageTerrain'
import SectionQuiz from './sections/SectionQuiz'

type TabId =
  | 'terrain'
  | 'identite-pedagogique'
  | 'sequences-pedagogiques'
  | 'organisation'
  | 'quiz-connaissances'
  | 'savoir-faire-eval'
  | 'badges-progression'
  | 'ressources'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'terrain',                label: 'Terrain',                   icon: '🖨️' },
  { id: 'identite-pedagogique',   label: 'Identité pédagogique',      icon: '📋' },
  { id: 'sequences-pedagogiques', label: 'Séquences pédagogiques',    icon: '📖' },
  { id: 'organisation',           label: 'Organisation',              icon: '🗂' },
  { id: 'quiz-connaissances',     label: 'Quiz & Connaissances',      icon: '🧠' },
  { id: 'savoir-faire-eval',      label: 'Savoir-faire & Évaluation', icon: '🏠' },
  { id: 'badges-progression',     label: 'Badges & Progression',      icon: '🏅' },
  { id: 'ressources',             label: 'Ressources',                icon: '📁' },
]

export default function ThemeDossierPage() {
  const { themeKey } = useLocalSearchParams<{ themeKey: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('terrain')
  const [theme, setTheme] = useState<Theme | null>(null)
  const [groups, setGroups]       = useState<ThemeGroup[]>([])
  const [criteria, setCriteria]   = useState<Criterion[]>([])
  const [sequences, setSequences] = useState<ThemeSequence[]>([])
  const [metaphors, setMetaphors] = useState<ThemeMetaphor[]>([])
  const [freeCount, setFreeCount] = useState(0)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      if (!themeKey) return
      setLoading(true)
      const [{ data: t }, { data: g }] = await Promise.all([
        getThemeByKey(themeKey),
        listThemeGroups(),
      ])
      setTheme(t ?? null)
      setGroups(g)
      if (t) {
        const [crits, { data: seqs }, metas] = await Promise.all([
          listCriteriaByTheme(t.id),
          listSequencesByTheme(t.id),
          listMetaphorsByTheme(t.id),
        ])
        setCriteria(crits ?? [])
        setSequences(seqs ?? [])
        setMetaphors(metas ?? [])
      }
      setLoading(false)
    }
    load()
  }, [themeKey])

  // Preliminary freeCount from already-loaded data (before Organisation tab is visited).
  // Counts free criteria + free metaphors. Mini-exercises and faults are not pre-loaded here;
  // the exact count is updated by SectionOrganisation via onFreeCountChange once visited.
  useEffect(() => {
    const freeCrits = criteria.filter(c => !c.sequenceId && !c.metaphorId).length
    const freeMetas = metaphors.filter(m => !m.sequenceId).length
    setFreeCount(freeCrits + freeMetas)
  }, [criteria, metaphors])

  if (loading) return <DossierSkeleton />
  if (!theme) return <div style={{ padding: 32, color: colors.text.muted }}>Thème introuvable.</div>

  const tenantId = theme.tenantId

  const renderSection = () => {
    switch (activeTab) {
      case 'terrain':
        return <SectionPageTerrain theme={theme} criteria={criteria} tenantId={tenantId} />

      case 'identite-pedagogique':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SectionIdentite theme={theme} groups={groups} onUpdate={t => setTheme(t)} />
            <SectionVisionPedagogique themeId={theme.id} tenantId={tenantId} />
            <SectionPedagogiePlaceholder />
          </div>
        )

      case 'sequences-pedagogiques':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SectionSequences themeId={theme.id} tenantId={tenantId} criteria={criteria} />
            <SectionMetaphores themeId={theme.id} tenantId={tenantId} sequences={sequences} />
            <SectionCriteres themeId={theme.id} tenantId={tenantId} criteria={criteria} onCriteriaChange={setCriteria} sequences={sequences} metaphors={metaphors} />
            <SectionMiniExercices themeId={theme.id} tenantId={tenantId} criteria={criteria} sequences={sequences} />
          </div>
        )

      case 'organisation':
        return <SectionOrganisation themeId={theme.id} onFreeCountChange={setFreeCount} />

      case 'quiz-connaissances':
        return <SectionQuiz themeKey={themeKey ?? ''} themeId={theme.id} />

      case 'savoir-faire-eval':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SectionSavoirFaire themeId={theme.id} tenantId={tenantId} criteria={criteria} />
            <SectionEvalVideo themeId={theme.id} tenantId={tenantId} criteria={criteria} />
          </div>
        )

      case 'badges-progression':
        return <SectionBadge themeId={theme.id} tenantId={tenantId} />

      case 'ressources':
        return <SectionRessources themeId={theme.id} tenantId={tenantId} />

      default:
        return null
    }
  }

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => router.push('/methodologie/themes' as never)}>
          ← Thèmes
        </button>
        <div style={S.headerMeta}>
          <h1 style={S.themeTitle}>{theme.name}</h1>
          <span style={S.versionChip}>v{theme.version}</span>
          {theme.level && <span style={S.levelChip}>{theme.level}</span>}
        </div>
        {theme.description && (
          <p style={S.objectif}>{theme.description}</p>
        )}
      </div>

      {/* Body: sidebar + content */}
      <div style={S.body}>
        {/* Sidebar */}
        <nav style={S.sidebar}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...S.sidebarTab,
                  ...(isActive ? S.sidebarTabActive : {}),
                }}
              >
                <span style={S.tabIcon}>{tab.icon}</span>
                <span style={S.tabLabel}>{tab.label}</span>
                {tab.id === 'organisation' && freeCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, backgroundColor: colors.accent.red, color: '#fff', borderRadius: 999, padding: '1px 5px', lineHeight: 1.4 }}>
                    {freeCount}
                  </span>
                )}
                {isActive && <div style={S.activeBar} />}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <main style={S.content}>
          {renderSection()}
        </main>
      </div>
    </div>
  )
}

function DossierSkeleton() {
  return (
    <div style={{ padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh' }}>
      <div style={{ height: 24, width: 200, backgroundColor: colors.border.divider, borderRadius: 6, marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 210, height: 400, backgroundColor: colors.border.divider, borderRadius: 12 }} />
        <div style={{ flex: 1, height: 400, backgroundColor: colors.border.divider, borderRadius: 12 }} />
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    backgroundColor: colors.light.primary,
    minHeight: '100vh',
    fontFamily: 'Geist, system-ui, sans-serif',
    color: colors.text.dark,
  },
  header: {
    padding: '20px 28px 16px',
    borderBottom: `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    boxShadow: shadows.sm,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.muted,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'Geist, sans-serif',
    padding: 0,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  themeTitle: {
    fontSize: 22,
    fontWeight: 900,
    fontFamily: 'Rajdhani, sans-serif',
    letterSpacing: 0.4,
    margin: 0,
    color: colors.text.dark,
  },
  versionChip: {
    fontSize: 10,
    color: colors.text.muted,
    backgroundColor: colors.light.muted,
    padding: '2px 8px',
    borderRadius: 4,
    fontFamily: 'Geist Mono, monospace',
  },
  levelChip: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    backgroundColor: colors.accent.gold + '22',
    color: colors.accent.gold,
    padding: '3px 10px',
    borderRadius: radius.xs,
    border: `1px solid ${colors.border.gold}`,
  },
  objectif: {
    margin: '8px 0 0',
    fontSize: 13,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  body: {
    display: 'flex',
    height: 'calc(100vh - 110px)',
  },
  sidebar: {
    width: 210,
    flexShrink: 0,
    backgroundColor: colors.light.surface,
    borderRight: `1px solid ${colors.border.light}`,
    overflowY: 'auto' as const,
    padding: '12px 0',
  },
  sidebarTab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'Geist, sans-serif',
    fontSize: 12,
    color: colors.text.muted,
    position: 'relative' as const,
    transition: `all ${transitions.fast}`,
  },
  sidebarTabActive: {
    backgroundColor: colors.accent.gold + '15',
    color: colors.accent.gold,
    fontWeight: 600,
  },
  tabIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  tabLabel: {
    flex: 1,
    lineHeight: 1.3,
  },
  activeBar: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent.gold,
    borderRadius: '0 2px 2px 0',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px 28px',
    backgroundColor: colors.light.primary,
  },
}
