// Story 105.2 — Modal d'ajout d'un gardien à un stage
// 2 modes : recherche dans l'annuaire (par défaut) + création à la volée
import { useCallback, useEffect, useState } from 'react'
import { Modal, View, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native'
import {
  searchChildrenForStageParticipation,
  addChildToStage,
  createChildDirectoryEntry,
  findProspectDuplicates,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'
import { formatDateFR } from '../../../../lib/dates'

type SearchResult = {
  id          : string
  prenom      : string | null
  nom         : string | null
  birthDate   : string | null
  displayName : string
  ageCategory : string | null
}

type Props = {
  visible                : boolean
  stageId                : string
  existingParticipantIds : string[]
  onClose                : () => void
  onChanged              : () => void
}

export function AddParticipantModal({ visible, stageId, existingParticipantIds, onClose, onChanged }: Props) {
  const tenantId = useAuthStore((s) => s.tenantId)
  const [mode, setMode] = useState<'search' | 'create'>('search')

  // ── Reset state on open ────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setMode('search')
      setQuery('')
      setResults([])
      setSearching(false)
      setAdding(null)
      setPrenom('')
      setNom('')
      setBirthDate('')
      setSaving(false)
      setFormError(null)
      setDuplicates([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // ── Search mode ────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    if (!visible || mode !== 'search') return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const found = await searchChildrenForStageParticipation(stageId, trimmed, 20)
        if (!cancelled) {
          const filtered = found.filter((r) => !existingParticipantIds.includes(r.id))
          setResults(filtered)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AddParticipantModal] search error:', err)
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query, mode, visible, stageId, existingParticipantIds])

  const onAddExisting = useCallback(async (childId: string) => {
    setAdding(childId)
    try {
      await addChildToStage(stageId, childId)
      onChanged()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AddParticipantModal] addChildToStage error:', err)
      }
    } finally {
      setAdding(null)
    }
  }, [stageId, onChanged, onClose])

  // ── Create mode ────────────────────────────────────────────────────
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<Array<{ id: string; displayName: string }>>([])

  const validateForm = (): string | null => {
    if (!prenom.trim()) return 'Le prénom est obligatoire.'
    if (!nom.trim()) return 'Le nom est obligatoire.'
    if (!birthDate) return 'La date de naissance est obligatoire.'
    const d = new Date(birthDate)
    if (Number.isNaN(d.getTime())) return 'Date de naissance invalide.'
    if (d.getFullYear() < 1900 || d > new Date()) return 'Date de naissance invalide.'
    return null
  }

  const onSubmitCreate = useCallback(async (forceCreate: boolean) => {
    const err = validateForm()
    if (err) { setFormError(err); return }
    if (!tenantId) { setFormError('Session invalide. Reconnecte-toi.'); return }
    setFormError(null)
    setSaving(true)
    try {
      // 1. Détection doublons
      if (!forceCreate) {
        const birthYear = new Date(birthDate).getFullYear()
        const dups = await findProspectDuplicates({
          tenantId,
          prenom: prenom.trim(),
          nom   : nom.trim(),
          birthYear,
        })
        if (dups.length > 0) {
          setDuplicates(dups.map((d) => ({ id: d.id, displayName: d.displayName ?? `${d.prenom ?? ''} ${d.nom ?? ''}`.trim() })))
          return
        }
      }

      // 2. Création
      const entry = await createChildDirectoryEntry({
        tenantId,
        displayName: `${prenom.trim()} ${nom.trim()}`,
        prenom     : prenom.trim(),
        nom        : nom.trim(),
        birthDate,
        actif      : true,
      })

      // 3. Inscription
      await addChildToStage(stageId, entry.id)

      onChanged()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AddParticipantModal] create error:', err)
      }
      setFormError('Création impossible. Réessaie.')
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenom, nom, birthDate, tenantId, stageId, onChanged, onClose])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => { /* stop propagation */ }}>
          <View style={styles.header}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>
              {mode === 'search' ? 'Ajouter un gardien' : 'Créer un nouveau gardien'}
            </AureakText>
            <Pressable onPress={onClose} hitSlop={8}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
            </Pressable>
          </View>

          {mode === 'search' ? (
            <View style={styles.body}>
              <TextInput
                style={styles.input}
                placeholder="Rechercher par nom ou prénom… (min. 2 caractères)"
                placeholderTextColor={colors.text.muted}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              <ScrollView style={styles.results} contentContainerStyle={{ gap: space.xs }}>
                {searching && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, padding: space.sm }}>
                    Recherche…
                  </AureakText>
                )}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, padding: space.sm }}>
                    Aucun gardien trouvé. Tu peux créer une nouvelle fiche.
                  </AureakText>
                )}
                {results.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.resultRow}
                    onPress={() => onAddExisting(r.id)}
                    disabled={adding !== null}
                  >
                    <View style={{ flex: 1 }}>
                      <AureakText variant="body" style={{ color: colors.text.dark }}>
                        {r.displayName || `${r.prenom ?? ''} ${(r.nom ?? '').toUpperCase()}`.trim()}
                      </AureakText>
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>
                        {formatDateFR(r.birthDate)}
                      </AureakText>
                    </View>
                    <View style={styles.addBtn}>
                      <AureakText variant="caption" style={{ color: colors.text.primary, fontWeight: '700' as never }}>
                        {adding === r.id ? 'Ajout…' : 'Inscrire'}
                      </AureakText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable style={styles.switchBtn} onPress={() => setMode('create')}>
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' as never }}>
                  + Créer un nouveau gardien
                </AureakText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.field}>
                <AureakText variant="caption" style={styles.label}>Prénom *</AureakText>
                <TextInput
                  style={styles.input}
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholder="Lucas"
                  placeholderTextColor={colors.text.muted}
                  autoFocus
                />
              </View>
              <View style={styles.field}>
                <AureakText variant="caption" style={styles.label}>Nom *</AureakText>
                <TextInput
                  style={styles.input}
                  value={nom}
                  onChangeText={setNom}
                  placeholder="Dupont"
                  placeholderTextColor={colors.text.muted}
                />
              </View>
              <View style={styles.field}>
                <AureakText variant="caption" style={styles.label}>Date de naissance *</AureakText>
                {/* Web: input type="date" natif (cohérent avec stages/new — Story 80.1) */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <TextInput
                  style={styles.input}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={colors.text.muted}
                  // @ts-expect-error type only valid on web
                  type="date"
                />
              </View>

              {formError && (
                <View style={styles.errorBox}>
                  <AureakText variant="caption" style={{ color: colors.accent.red }}>{formError}</AureakText>
                </View>
              )}

              {duplicates.length > 0 && (
                <View style={styles.dupBox}>
                  <AureakText variant="caption" style={{ color: colors.accent.red, fontWeight: '700' as never }}>
                    Gardien similaire déjà présent :
                  </AureakText>
                  {duplicates.map((d) => (
                    <AureakText key={d.id} variant="caption" style={{ color: colors.text.dark }}>
                      • {d.displayName}
                    </AureakText>
                  ))}
                  <View style={styles.dupActions}>
                    <Pressable
                      style={styles.dupBtnSecondary}
                      onPress={() => { setDuplicates([]); setMode('search'); setQuery(prenom.trim() || nom.trim()) }}
                    >
                      <AureakText variant="caption" style={{ color: colors.text.dark }}>Inscrire l'existant</AureakText>
                    </Pressable>
                    <Pressable
                      style={styles.dupBtnPrimary}
                      onPress={() => onSubmitCreate(true)}
                      disabled={saving}
                    >
                      <AureakText variant="caption" style={{ color: colors.text.primary, fontWeight: '700' as never }}>
                        {saving ? 'Création…' : 'Créer quand même'}
                      </AureakText>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={() => setMode('search')}>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>← Recherche</AureakText>
                </Pressable>
                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => onSubmitCreate(false)}
                  disabled={saving}
                >
                  <AureakText variant="caption" style={{ color: colors.text.primary, fontWeight: '700' as never }}>
                    {saving ? 'Enregistrement…' : 'Enregistrer & inscrire'}
                  </AureakText>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay   : {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.lg,
  },
  dialog    : {
    width          : '100%',
    maxWidth       : 520,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    gap            : space.md,
  },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  body      : { gap: space.sm },
  field     : { gap: space.xs / 2 },
  label     : { color: colors.text.muted, fontWeight: '600' as never },
  input     : {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.primary,
    color            : colors.text.dark,
    fontSize         : 14,
  },
  results   : { maxHeight: 280 },
  resultRow : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.primary,
    gap              : space.sm,
  },
  addBtn    : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  switchBtn : {
    alignSelf       : 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius    : radius.xs,
    borderWidth     : 1,
    borderColor     : colors.accent.gold,
    backgroundColor : colors.accent.gold + '15',
  },
  errorBox  : {
    padding         : space.sm,
    borderRadius    : radius.xs,
    backgroundColor : colors.accent.red + '15',
    borderWidth     : 1,
    borderColor     : colors.accent.red,
  },
  dupBox    : {
    padding        : space.md,
    borderRadius   : radius.xs,
    backgroundColor: colors.accent.red + '10',
    borderWidth    : 1,
    borderColor    : colors.accent.red,
    gap            : space.xs,
  },
  dupActions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  dupBtnSecondary: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  dupBtnPrimary: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  actions   : { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, marginTop: space.sm },
  cancelBtn : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  confirmBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
})
