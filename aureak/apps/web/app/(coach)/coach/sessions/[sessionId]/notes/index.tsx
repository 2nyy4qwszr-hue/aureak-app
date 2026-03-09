'use client'
// Notes de séance coach + feedback contenu pédagogique
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSessionById, getSessionNote, upsertSessionNote } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { Session } from '@aureak/types'

function SessionSubNav({ sessionId, active }: { sessionId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Présences',    href: `/coach/sessions/${sessionId}/attendance`   },
    { label: 'Évaluations',  href: `/coach/sessions/${sessionId}/evaluations`  },
    { label: 'Notes',        href: `/coach/sessions/${sessionId}/notes`        },
  ]
  return (
    <View style={subNavStyles.bar}>
      {tabs.map(tab => (
        <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
          <View style={[subNavStyles.tab, active === tab.label && subNavStyles.tabActive]}>
            <AureakText
              variant="caption"
              style={{
                color     : active === tab.label ? colors.accent.gold : colors.text.muted,
                fontWeight: '600',
              }}
            >
              {tab.label}
            </AureakText>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const subNavStyles = StyleSheet.create({
  bar     : { flexDirection: 'row', gap: space.md, borderBottomWidth: 1, borderBottomColor: colors.border.light, paddingBottom: space.sm },
  tab     : { paddingBottom: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent.gold },
})

export default function NotesPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => s.tenantId)

  const [session,        setSession]        = useState<Session | null>(null)
  const [note,           setNote]           = useState('')
  const [visibleToAdmin, setVisibleToAdmin] = useState(true)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getSessionById(sessionId),
      getSessionNote(sessionId, user.id),
    ]).then(([sessionRes, noteRes]) => {
      setSession(sessionRes.data)
      if (noteRes.data) {
        setNote(noteRes.data.note)
        setVisibleToAdmin(noteRes.data.visibleToAdmin)
      }
      setLoading(false)
    })
  }, [sessionId, user?.id])

  const handleSave = async () => {
    if (!user?.id || !tenantId || !note.trim()) return
    setSaving(true)
    setSaved(false)
    await upsertSessionNote(sessionId, user.id, tenantId, note.trim(), visibleToAdmin)
    setSaving(false)
    setSaved(true)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.push('/coach/sessions' as never)}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Mes séances</AureakText>
      </Pressable>

      {session && (
        <View>
          <AureakText variant="h2">
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
              weekday: 'long', day: '2-digit', month: 'long',
            })}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </AureakText>
        </View>
      )}

      <SessionSubNav sessionId={sessionId} active="Notes" />

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : (
        <View style={styles.noteCard}>
          <AureakText variant="label" style={{ color: colors.text.muted, marginBottom: space.xs }}>
            Note de séance
          </AureakText>
          <TextInput
            style={styles.textarea}
            value={note}
            onChangeText={text => { setNote(text); setSaved(false) }}
            placeholder="Observations générales, points à retenir, incidents..."
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <View style={styles.visibilityRow}>
            <View style={{ flex: 1 }}>
              <AureakText variant="body" style={{ fontWeight: '600' }}>
                Visible par l'administrateur
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Décochez pour une note personnelle uniquement
              </AureakText>
            </View>
            <Switch
              value={visibleToAdmin}
              onValueChange={setVisibleToAdmin}
              trackColor={{ false: colors.border.light, true: colors.status.present }}
              thumbColor={colors.text.dark}
            />
          </View>

          <Pressable
            style={[styles.saveBtn, (saving || !note.trim()) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !note.trim()}
          >
            <AureakText variant="label" style={{ color: colors.light.primary }}>
              {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
            </AureakText>
          </Pressable>
        </View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          Les notes de séance sont sauvegardées par séance. Vous pouvez les modifier jusqu'à la clôture.
        </AureakText>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },
  noteCard     : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.md,
  },
  textarea     : {
    backgroundColor: colors.light.primary,
    color          : colors.text.dark,
    borderRadius   : 6,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    fontSize       : 14,
    minHeight      : 160,
  },
  visibilityRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.md,
    paddingTop     : space.sm,
    borderTopWidth : 1,
    borderTopColor : colors.border.light,
  },
  saveBtn      : {
    backgroundColor: colors.accent.gold,
    borderRadius   : 8,
    paddingVertical: 12,
    alignItems     : 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  infoBox      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 6,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
})
