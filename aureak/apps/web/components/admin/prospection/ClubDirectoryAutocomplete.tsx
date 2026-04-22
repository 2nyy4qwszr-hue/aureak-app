'use client'
// Story 96.1 — Autocomplete sur club_directory
// Recherche debouncée, dropdown résultats, fallback manuel optionnel via callback.
import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { listClubDirectory } from '@aureak/api-client'
import type { ClubDirectoryEntry } from '@aureak/types'

export type ClubDirectorySelection = {
  id        : string
  nom       : string
  ville     : string | null
  matricule : string | null
}

type Props = {
  /** Callback quand un club est sélectionné (null = désélection). */
  onSelect         : (club: ClubDirectorySelection | null) => void
  /** Affiche le bouton "Créer un club absent de l'annuaire" sous les résultats. */
  onManualFallback?: () => void
  /** Affichage initial (club déjà sélectionné). */
  initialSelected? : ClubDirectorySelection | null
  disabled?        : boolean
}

export function ClubDirectoryAutocomplete({
  onSelect, onManualFallback, initialSelected, disabled,
}: Props) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<ClubDirectoryEntry[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState<ClubDirectorySelection | null>(initialSelected ?? null)
  const [open, setOpen]         = useState(false)
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (disabled) return
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await listClubDirectory({ search: query.trim(), pageSize: 15 })
        setResults(res.data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ClubDirectoryAutocomplete] search error:', err)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, disabled])

  function handlePick(club: ClubDirectoryEntry) {
    const sel: ClubDirectorySelection = {
      id: club.id, nom: club.nom, ville: club.ville, matricule: club.matricule,
    }
    setSelected(sel)
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(sel)
  }

  function handleReset() {
    setSelected(null)
    setQuery('')
    setResults([])
    onSelect(null)
  }

  if (selected) {
    return (
      <View style={s.selectedCard}>
        <View style={{ flex: 1 }}>
          <AureakText style={s.selectedName as never}>{selected.nom}</AureakText>
          <AureakText style={s.selectedMeta as never}>
            {[selected.matricule, selected.ville].filter(Boolean).join(' · ') || '—'}
          </AureakText>
        </View>
        {!disabled && (
          <Pressable onPress={handleReset} style={s.resetBtn}>
            <AureakText style={s.resetLabel as never}>Changer</AureakText>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View>
      <TextInput
        style={s.input}
        value={query}
        onChangeText={t => { setQuery(t); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Chercher un club dans l'annuaire (nom ou matricule)…"
        autoCapitalize="words"
        editable={!disabled}
      />

      {open && query.trim().length >= 2 && (
        <View style={s.dropdown}>
          {loading ? (
            <View style={s.hintRow}>
              <ActivityIndicator size="small" color={colors.accent.gold} />
              <AureakText style={s.hint as never}>Recherche…</AureakText>
            </View>
          ) : results.length === 0 ? (
            <View style={s.hintRow}>
              <AureakText style={s.hint as never}>
                Aucun club trouvé pour "{query}".
              </AureakText>
              {onManualFallback && (
                <Pressable onPress={onManualFallback} style={s.fallbackBtn}>
                  <AureakText style={s.fallbackLabel as never}>
                    + Créer un club absent de l'annuaire
                  </AureakText>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              {results.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => handlePick(c)}
                  style={({ pressed }) => [s.resultRow, pressed && s.resultRowPressed] as never}
                >
                  <View style={{ flex: 1 }}>
                    <AureakText style={s.resultNom as never}>{c.nom}</AureakText>
                    <AureakText style={s.resultMeta as never}>
                      {[c.matricule, c.ville, c.province].filter(Boolean).join(' · ') || '—'}
                    </AureakText>
                  </View>
                </Pressable>
              ))}
              {onManualFallback && (
                <Pressable onPress={onManualFallback} style={s.fallbackInline}>
                  <AureakText style={s.fallbackLabel as never}>
                    Pas le bon club ? + Créer un club absent de l'annuaire
                  </AureakText>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  dropdown: {
    marginTop      : 4,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.xs,
    backgroundColor: colors.light.surface,
    maxHeight      : 320,
    overflow       : 'hidden',
  },
  hintRow: { padding: space.md, gap: space.sm, alignItems: 'flex-start' },
  hint   : { color: colors.text.muted, fontSize: 12, fontStyle: 'italic' },

  resultRow: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  resultRowPressed: { backgroundColor: colors.accent.gold + '15' },
  resultNom       : { color: colors.text.dark, fontSize: 14, fontWeight: '600' },
  resultMeta      : { color: colors.text.muted, fontSize: 11, marginTop: 2 },

  selectedCard: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
    borderRadius   : radius.xs,
    backgroundColor: colors.accent.gold + '15',
  },
  selectedName: { color: colors.text.dark, fontSize: 14, fontWeight: '700' },
  selectedMeta: { color: colors.text.muted, fontSize: 11, marginTop: 2 },
  resetBtn    : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  resetLabel: { color: colors.text.dark, fontSize: 11, fontWeight: '600' },

  fallbackBtn   : {
    marginTop        : space.xs,
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    backgroundColor  : colors.light.surface,
    alignSelf        : 'flex-start',
  },
  fallbackInline: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    alignItems       : 'center',
  },
  fallbackLabel : { color: colors.accent.gold, fontSize: 12, fontWeight: '700' },
})
