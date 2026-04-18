'use client'
// Story 87.1 — Fiche détail commercial (onglets Profil / Accès / Activité)
import { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getCommercialProfile } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import SectionPermissionsPanel from '../../../_components/SectionPermissionsPanel'

// ── Types ────────────────────────────────────────────────────────────────────────
type TabKey = 'profil' | 'acces' | 'activite'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profil',   label: 'Profil'   },
  { key: 'acces',    label: 'Accès'    },
  { key: 'activite', label: 'Activité' },
]

// ── Helper ───────────────────────────────────────────────────────────────────────
function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(' ')
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function CommercialDetailPage() {
  const { commercialId } = useLocalSearchParams<{ commercialId: string }>()
  const router = useRouter()

  const [displayName, setDisplayName] = useState<string>('')
  const [nom,         setNom]         = useState<string>('—')
  const [prenom,      setPrenom]      = useState<string>('—')
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<TabKey>('profil')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getCommercialProfile(commercialId)
        if (cancelled) return
        if (data) {
          setDisplayName(data.displayName ?? commercialId)
          const { prenom: p, nom: n } = splitName(data.displayName)
          setPrenom(p)
          setNom(n)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CommercialDetailPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [commercialId])

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <AureakText style={s.backLabel as TextStyle}>← Retour</AureakText>
          </Pressable>
          <AureakText style={s.pageTitle as TextStyle}>
            {loading ? 'Chargement…' : displayName}
          </AureakText>
        </View>

        {/* ── Onglets ── */}
        <View style={s.tabsRow}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}>
                <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
                  {tab.label}
                </AureakText>
                {isActive && <View style={s.tabUnderline} />}
              </Pressable>
            )
          })}
        </View>

        {/* ── Contenu onglet ── */}
        {activeTab === 'profil' && (
          <View style={s.section}>
            <View style={s.infoCard as never}>
              <View style={s.infoRow}>
                <AureakText style={s.infoLabel as TextStyle}>Nom</AureakText>
                <AureakText style={s.infoValue as TextStyle}>{nom}</AureakText>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <AureakText style={s.infoLabel as TextStyle}>Prénom</AureakText>
                <AureakText style={s.infoValue as TextStyle}>{prenom}</AureakText>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <AureakText style={s.infoLabel as TextStyle}>Rôle</AureakText>
                <AureakText style={s.infoValue as TextStyle}>Commercial</AureakText>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'acces' && (
          <View style={s.section}>
            <SectionPermissionsPanel userId={commercialId} role="commercial" />
          </View>
        )}

        {activeTab === 'activite' && (
          <View style={s.section}>
            <View style={s.infoCard as never}>
              <AureakText variant="body" style={s.emptyText}>
                Les données de prospection seront disponibles avec l'epic 88.
              </AureakText>
              <View style={{ height: space.md }} />
              <Pressable
                onPress={() => router.push('/prospection' as never)}
                style={({ pressed }) => [s.prospectionLink, pressed && { opacity: 0.7 }] as never}
              >
                <AureakText style={s.prospectionLinkText as TextStyle}>
                  Voir activité prospection →
                </AureakText>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // ── Header ──
  headerBlock: { gap: 8 },
  backBtn    : { alignSelf: 'flex-start', marginBottom: 4 },
  backLabel  : { fontSize: 13, color: colors.accent.gold, fontWeight: '600' },
  pageTitle  : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },

  // ── Tabs ──
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline  : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // ── Section ──
  section: { gap: space.md },

  // ── InfoCard ──
  infoCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  infoRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel  : { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  infoValue  : { fontSize: 13, fontWeight: '500', color: colors.text.dark },
  infoDivider: { height: 1, backgroundColor: colors.border.divider },

  // ── Prospection link ──
  prospectionLink: {
    alignSelf       : 'flex-start',
    paddingVertical : 8,
    paddingHorizontal: 12,
    backgroundColor : colors.accent.gold,
    borderRadius    : radius.xs,
  },
  prospectionLinkText: { fontSize: 13, fontWeight: '700', color: colors.text.dark },

  emptyText: { color: colors.text.muted, textAlign: 'center' },
})
