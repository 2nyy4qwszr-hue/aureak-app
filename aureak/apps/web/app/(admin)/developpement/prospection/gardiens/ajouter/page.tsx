// Story 89.1 — Page ajout rapide gardien prospect terrain (mobile-first)
// Route: /developpement/prospection/gardiens/ajouter
// Accès: admin | commercial (AC #1)
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { searchChildDirectoryByName } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { ChildDirectoryEntry } from '@aureak/types'

import ProspectSearchResults from './_ProspectSearchResults'
import ProspectQuickForm     from './_ProspectQuickForm'

// ── Page ────────────────────────────────────────────────────────────────────

export default function AddProspectPage() {
  const router   = useRouter()
  const role     = useAuthStore(s => s.role)
  const tenantId = useAuthStore(s => s.tenantId)

  // ── Recherche ────────────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('')
  const [results,       setResults]       = useState<ChildDirectoryEntry[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchDone,    setSearchDone]    = useState(false)  // passe à true après 1er appel terminé

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const genRef      = useRef(0)

  // ── Formulaire visible après "Ajouter comme nouveau prospect" ────────────
  const [showForm,   setShowForm]   = useState(false)
  const [prefillName, setPrefillName] = useState('')

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // Debounce 300 ms + min 2 caractères (AC #3)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setSearchLoading(false)
      setSearchDone(false)
      return
    }

    const gen = ++genRef.current
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchChildDirectoryByName(query, { limit: 10 })
        if (gen === genRef.current) {
          setResults(data)
          setSearchDone(true)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AddProspectPage] search:', err)
        if (gen === genRef.current) {
          setResults([])
          setSearchDone(true)
        }
      } finally {
        if (gen === genRef.current) setSearchLoading(false)
      }
    }, 300)
  }, [query])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectExisting = (entry: ChildDirectoryEntry) => {
    router.push(`/children/${entry.id}` as never)
  }

  const handleStartAdd = () => {
    // Pré-remplit le prénom avec ce que le scout a tapé s'il s'agit d'un seul mot
    const trimmed = query.trim()
    setPrefillName(trimmed)
    setShowForm(true)
  }

  // ── Access gate ──────────────────────────────────────────────────────────
  if (role !== 'admin' && role !== 'commercial') {
    return (
      <View style={st.deniedRoot}>
        <View style={st.deniedCard}>
          <AureakText style={st.deniedTitle as never}>Accès refusé</AureakText>
          <AureakText style={st.deniedBody as never}>
            Cette page est réservée aux commerciaux et administrateurs.
          </AureakText>
        </View>
      </View>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const canShowAddCTA = !searchLoading && searchDone && results.length === 0 && query.trim().length >= 2 && !showForm

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <AureakText style={st.backText as never}>← Retour</AureakText>
        </Pressable>
        <AureakText style={st.title as never}>Ajouter un prospect</AureakText>
        <AureakText style={st.sub as never}>
          Cherchez d'abord le gardien dans l'annuaire. S'il n'existe pas, créez-le en quelques secondes.
        </AureakText>
      </View>

      {/* Barre de recherche */}
      <View style={st.searchBlock}>
        <AureakText style={st.label as never}>Rechercher un gardien</AureakText>
        <View style={st.searchRow}>
          <AureakText style={st.searchIcon as never}>🔍</AureakText>
          <TextInput
            style={st.searchInput as never}
            value={query}
            onChangeText={setQuery}
            placeholder="Nom ou prénom (min. 2 caractères)"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={st.clearBtn} accessibilityLabel="Effacer la recherche">
              <AureakText style={st.clearText as never}>✕</AureakText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Résultats */}
      {(query.trim().length >= 2 || searchLoading) && !showForm && (
        <ProspectSearchResults
          results={results}
          loading={searchLoading}
          query={query}
          onSelect={handleSelectExisting}
        />
      )}

      {/* CTA "Ajouter comme nouveau prospect" */}
      {canShowAddCTA && (
        <Pressable style={st.addCta} onPress={handleStartAdd}>
          <AureakText style={st.addCtaText as never}>+ Ajouter « {query.trim()} » comme nouveau prospect</AureakText>
        </Pressable>
      )}

      {/* Bouton fallback : ajouter un nouveau prospect sans recherche */}
      {!showForm && query.trim().length < 2 && (
        <Pressable style={st.addCtaSecondary} onPress={handleStartAdd}>
          <AureakText style={st.addCtaSecondaryText as never}>+ Ajouter un nouveau prospect</AureakText>
        </Pressable>
      )}

      {/* Formulaire */}
      {showForm && tenantId && (
        <ProspectQuickForm tenantId={tenantId} initialFirstName={prefillName} />
      )}

      {/* Fallback sans tenantId (ne devrait pas arriver vu la gate) */}
      {showForm && !tenantId && (
        <View style={st.errorBox}>
          <AureakText style={st.errorText as never}>
            Session invalide. Veuillez vous reconnecter.
          </AureakText>
        </View>
      )}
    </ScrollView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : {
    padding       : space.md,
    gap           : space.md,
    paddingBottom : space.xxl,
    maxWidth      : 600,
    width         : '100%',
    alignSelf     : 'center',
  },

  // Header
  header: { gap: 6 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: space.xs, paddingRight: space.sm, minHeight: 32 },
  backText: { color: colors.accent.gold, fontSize: 13, fontWeight: '600' },
  title: {
    color     : colors.text.dark,
    fontSize  : 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sub: {
    color   : colors.text.muted,
    fontSize: 13,
    lineHeight: 19,
  },

  // Search
  searchBlock: { gap: 6 },
  label: {
    color        : colors.text.muted,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 48,
    paddingHorizontal: space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    gap              : space.xs,
    // @ts-ignore RN Web
    boxShadow        : shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    color   : colors.text.muted,
  },
  searchInput: {
    flex     : 1,
    fontSize : 14,
    color    : colors.text.dark,
    minHeight: 44,
    outlineStyle: 'none' as never,
  },
  clearBtn: {
    minWidth : 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.text.muted, fontSize: 14 },

  // CTAs
  addCta: {
    minHeight        : 48,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignItems       : 'center',
    justifyContent   : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    // @ts-ignore RN Web
    boxShadow        : shadows.md,
  },
  addCtaText: {
    color      : colors.text.dark,
    fontSize   : 14,
    fontWeight : '700',
    textAlign  : 'center',
  },
  addCtaSecondary: {
    minHeight        : 48,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    backgroundColor  : colors.light.surface,
    alignItems       : 'center',
    justifyContent   : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
  },
  addCtaSecondaryText: {
    color     : colors.accent.gold,
    fontSize  : 14,
    fontWeight: '700',
  },

  // Access denied
  deniedRoot: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.md,
  },
  deniedCard: {
    maxWidth       : 420,
    width          : '100%',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
    alignItems     : 'center',
    // @ts-ignore RN Web
    boxShadow      : shadows.sm,
  },
  deniedTitle: {
    color     : colors.text.dark,
    fontSize  : 18,
    fontWeight: '700',
  },
  deniedBody: {
    color     : colors.text.muted,
    fontSize  : 13,
    textAlign : 'center',
  },

  // Error fallback
  errorBox: {
    backgroundColor: colors.status.errorBg,
    borderWidth    : 1,
    borderColor    : colors.status.errorBorder,
    borderRadius   : radius.xs,
    padding        : space.sm,
  },
  errorText: {
    color   : colors.status.errorText,
    fontSize: 12,
  },
})
