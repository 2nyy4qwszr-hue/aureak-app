'use client'
// Story 92.2 — Modale d'ajout d'un enfant parrainé par un sponsor
import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { linkChildToSponsor, searchChildrenForSponsor } from '@aureak/api-client'
import type { SponsorCandidateChild } from '@aureak/api-client'

type Props = {
  visible   : boolean
  sponsorId : string
  onClose   : () => void
  onSuccess : () => void
}

function formatBirth(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR')
}

export function LinkChildModal({ visible, sponsorId, onClose, onSuccess }: Props) {
  const [query,      setQuery]      = useState('')
  const [candidates, setCandidates] = useState<SponsorCandidateChild[]>([])
  const [selected,   setSelected]   = useState<SponsorCandidateChild | null>(null)
  const [searching,  setSearching]  = useState(false)
  const [startedAt,  setStartedAt]  = useState('')
  const [endedAt,    setEndedAt]    = useState('')
  const [euros,      setEuros]      = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) return
    setQuery('')
    setCandidates([])
    setSelected(null)
    setStartedAt('')
    setEndedAt('')
    setEuros('')
    setServerError(null)
  }, [visible])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (selected) return
    if (query.trim().length < 2) {
      setCandidates([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await searchChildrenForSponsor(query, 20)
        setCandidates(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[LinkChildModal] search error:', err)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected])

  const handleSubmit = async () => {
    if (!selected) {
      setServerError('Sélectionne un enfant dans la liste.')
      return
    }
    const eurosTrim = euros.trim()
    const cents = eurosTrim
      ? Math.round(Number(eurosTrim.replace(',', '.').replace(/\s/g, '')) * 100)
      : null
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) {
      setServerError('Montant invalide.')
      return
    }
    setSubmitting(true)
    setServerError(null)
    try {
      const { error } = await linkChildToSponsor({
        sponsorId,
        childId              : selected.userId,
        startedAt            : startedAt || undefined,
        endedAt              : endedAt   || null,
        allocatedAmountCents : cents,
      })
      if (error) {
        setServerError(error instanceof Error ? error.message : 'Erreur inconnue')
        return
      }
      onSuccess()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[LinkChildModal] submit exception:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title}>Ajouter un enfant parrainé</AureakText>

            {selected ? (
              <View style={s.selectedBox}>
                <View style={{ flex: 1 }}>
                  <AureakText style={s.selectedName}>{selected.displayName}</AureakText>
                  {selected.birthDate ? (
                    <AureakText style={s.selectedMeta}>Né(e) le {formatBirth(selected.birthDate)}</AureakText>
                  ) : null}
                </View>
                <Pressable onPress={() => { setSelected(null); setQuery('') }}>
                  <AureakText style={s.changeLink}>Changer</AureakText>
                </Pressable>
              </View>
            ) : (
              <View style={s.field}>
                <AureakText style={s.label}>Enfant *</AureakText>
                <TextInput
                  style={s.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Tape au moins 2 caractères du nom…"
                  placeholderTextColor={colors.text.muted}
                  autoFocus
                />
                {searching && <AureakText style={s.helper}>Recherche…</AureakText>}
                {!searching && query.trim().length >= 2 && candidates.length === 0 && (
                  <AureakText style={s.helper}>Aucun enfant ne correspond.</AureakText>
                )}
                {candidates.length > 0 && (
                  <View style={s.suggestions}>
                    {candidates.map(c => (
                      <Pressable
                        key={c.userId}
                        style={s.suggestion}
                        onPress={() => { setSelected(c); setCandidates([]); setQuery('') }}
                      >
                        <AureakText style={s.suggestionName}>{c.displayName}</AureakText>
                        {c.birthDate && (
                          <AureakText style={s.suggestionMeta}>Né(e) le {formatBirth(c.birthDate)}</AureakText>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={s.row}>
              <View style={s.fieldFlex}>
                <AureakText style={s.label}>Début</AureakText>
                <TextInput style={s.input} value={startedAt} onChangeText={setStartedAt}
                  placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.muted} />
                <AureakText style={s.helper}>Laisser vide = aujourd'hui</AureakText>
              </View>
              <View style={s.fieldFlex}>
                <AureakText style={s.label}>Fin</AureakText>
                <TextInput style={s.input} value={endedAt} onChangeText={setEndedAt}
                  placeholder="YYYY-MM-DD" placeholderTextColor={colors.text.muted} />
                <AureakText style={s.helper}>Optionnel</AureakText>
              </View>
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Montant alloué (€)</AureakText>
              <TextInput style={s.input} value={euros} onChangeText={setEuros}
                placeholder="Ex : 500" placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad" />
            </View>

            {serverError && <AureakText style={s.error}>{serverError}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={submitting}>
                <AureakText style={s.btnCancelLabel}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={(submitting || !selected) ? { ...s.btnSubmit, ...s.btnDisabled } : s.btnSubmit}
                onPress={handleSubmit}
                disabled={submitting || !selected}
              >
                <AureakText style={s.btnSubmitLabel}>
                  {submitting ? 'Enregistrement…' : 'Ajouter l\'enfant'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.md,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    width          : '100%',
    maxWidth       : 560,
    maxHeight      : '92%',
  },
  body: {
    padding: space.lg,
    gap    : space.md,
  },
  title: {
    color     : colors.text.dark,
    fontWeight: '700',
  },
  field: {
    gap: space.xs,
  },
  fieldFlex: {
    flex: 1,
    gap : space.xs,
  },
  row: {
    flexDirection: 'row',
    gap          : space.md,
  },
  label: {
    color        : colors.text.muted,
    fontWeight   : '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize     : 10,
    fontFamily   : fonts.body,
  },
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
    fontFamily       : fonts.body,
  },
  helper: {
    color     : colors.text.muted,
    fontSize  : 11,
    fontFamily: fonts.body,
  },
  suggestions: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.primary,
    maxHeight        : 200,
  },
  suggestion: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  suggestionName: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  suggestionMeta: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  selectedBox: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.sm,
    padding          : space.md,
    borderRadius     : radius.xs,
    backgroundColor  : colors.border.goldBg,
    borderWidth      : 1,
    borderColor      : colors.border.gold,
  },
  selectedName: {
    color     : colors.text.dark,
    fontSize  : 15,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  selectedMeta: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  changeLink: {
    color     : colors.accent.gold,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  error: {
    color     : colors.status.errorText,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  actions: {
    flexDirection : 'row',
    gap           : space.sm,
    justifyContent: 'flex-end',
    marginTop     : space.md,
  },
  btnCancel: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  btnCancelLabel: {
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  btnSubmit: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnSubmitLabel: {
    color     : colors.text.onGold,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
})
