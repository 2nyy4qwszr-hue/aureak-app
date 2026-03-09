'use client'
// Fiche entraînement pédagogique — détail, édition inline, thèmes/situations liés
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getMethodologySession, updateMethodologySession, toggleMethodologySession,
  listMethodologySessionThemes, listMethodologySessionSituations,
  listMethodologyThemes, listMethodologySituations,
  linkMethodologySessionTheme, unlinkMethodologySessionTheme,
  linkMethodologySessionSituation, unlinkMethodologySessionSituation,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_CONTEXT_TYPES, METHODOLOGY_LEVELS,
  METHODOLOGY_CONTEXT_LABELS, METHODOLOGY_LEVEL_LABELS,
  type MethodologyMethod, type MethodologyContextType, type MethodologyLevel,
} from '@aureak/types'
import type { MethodologySession, MethodologyTheme, MethodologySituation } from '@aureak/types'

// ── Shared components ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return (
    <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, marginBottom: 6, textTransform: 'uppercase' as never }}>
      {children}
    </AureakText>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[sc.card, style]}>{children}</View>
}
const sc = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : 4,
  },
})

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return null
  const color = methodologyMethodColors[method as MethodologyMethod] ?? colors.border.light
  return (
    <View style={{ backgroundColor: color + '18', borderColor: color, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 11 }}>{method}</AureakText>
    </View>
  )
}

function ChipSelect<T extends string>({
  options, value, onSelect, label, color,
}: {
  options : T[]
  value   : T | null
  onSelect: (v: T | null) => void
  label?  : (v: T) => string
  color?  : (v: T) => string
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const active = value === opt
        const c = color ? color(opt) : colors.accent.gold
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(active ? null : opt)}
            style={{ borderWidth: 1, borderColor: active ? c : colors.border.light, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: active ? c + '20' : 'transparent' }}
          >
            <AureakText variant="caption" style={{ color: active ? c : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
              {label ? label(opt) : opt}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Linked blocs tabs ─────────────────────────────────────────────────────────

function LinkedBlocsPanel({
  sessionId,
  linkedThemes,
  linkedSituations,
  allThemes,
  allSituations,
  onRefresh,
}: {
  sessionId       : string
  linkedThemes    : MethodologyTheme[]
  linkedSituations: MethodologySituation[]
  allThemes       : MethodologyTheme[]
  allSituations   : MethodologySituation[]
  onRefresh       : () => void
}) {
  const [addingTheme, setAddingTheme]       = useState(false)
  const [addingSit,   setAddingSit]         = useState(false)
  const [themeSearch, setThemeSearch]       = useState('')
  const [sitSearch,   setSitSearch]         = useState('')

  const linkedThemeIds = new Set(linkedThemes.map(t => t.id))
  const linkedSitIds   = new Set(linkedSituations.map(s => s.id))

  const availThemes = allThemes.filter(t =>
    !linkedThemeIds.has(t.id) &&
    (!themeSearch || t.title.toLowerCase().includes(themeSearch.toLowerCase()))
  )
  const availSits = allSituations.filter(s =>
    !linkedSitIds.has(s.id) &&
    (!sitSearch || s.title.toLowerCase().includes(sitSearch.toLowerCase()))
  )

  const handleLinkTheme = async (themeId: string) => {
    await linkMethodologySessionTheme(sessionId, themeId)
    setAddingTheme(false)
    setThemeSearch('')
    onRefresh()
  }
  const handleUnlinkTheme = async (themeId: string) => {
    await unlinkMethodologySessionTheme(sessionId, themeId)
    onRefresh()
  }
  const handleLinkSit = async (situationId: string) => {
    await linkMethodologySessionSituation(sessionId, situationId)
    setAddingSit(false)
    setSitSearch('')
    onRefresh()
  }
  const handleUnlinkSit = async (situationId: string) => {
    await unlinkMethodologySessionSituation(sessionId, situationId)
    onRefresh()
  }

  return (
    <View style={{ gap: space.md }}>

      {/* Thèmes liés */}
      <SectionCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
            THÈMES ASSOCIÉS ({linkedThemes.length})
          </AureakText>
          {!addingTheme && (
            <Pressable style={bl.addBtn} onPress={() => setAddingTheme(true)}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>+ Lier</AureakText>
            </Pressable>
          )}
        </View>

        {linkedThemes.length === 0 && !addingTheme && (
          <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>Aucun thème associé.</AureakText>
        )}

        {linkedThemes.map(t => (
          <View key={t.id} style={bl.linkedRow}>
            <View style={[bl.dot, { backgroundColor: '#4FC3F7' }]} />
            <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>{t.title}</AureakText>
            <Pressable onPress={() => handleUnlinkTheme(t.id)}>
              <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>✕</AureakText>
            </Pressable>
          </View>
        ))}

        {addingTheme && (
          <View style={bl.addPanel}>
            <TextInput
              style={bl.searchInput}
              value={themeSearch}
              onChangeText={setThemeSearch}
              placeholder="Rechercher un thème…"
              placeholderTextColor={colors.text.muted}
              autoFocus
            />
            {availThemes.slice(0, 8).map(t => (
              <Pressable key={t.id} style={bl.availRow} onPress={() => handleLinkTheme(t.id)}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 12 }}>{t.title}</AureakText>
                {t.method && <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>{t.method}</AureakText>}
              </Pressable>
            ))}
            {availThemes.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, padding: 8 }}>Aucun thème disponible.</AureakText>
            )}
            <Pressable onPress={() => { setAddingTheme(false); setThemeSearch('') }}>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 6 }}>Annuler</AureakText>
            </Pressable>
          </View>
        )}
      </SectionCard>

      {/* Situations liées */}
      <SectionCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
            SITUATIONS ASSOCIÉES ({linkedSituations.length})
          </AureakText>
          {!addingSit && (
            <Pressable style={bl.addBtn} onPress={() => setAddingSit(true)}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>+ Lier</AureakText>
            </Pressable>
          )}
        </View>

        {linkedSituations.length === 0 && !addingSit && (
          <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>Aucune situation associée.</AureakText>
        )}

        {linkedSituations.map(s => (
          <View key={s.id} style={bl.linkedRow}>
            <View style={[bl.dot, { backgroundColor: '#66BB6A' }]} />
            <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>{s.title}</AureakText>
            <Pressable onPress={() => handleUnlinkSit(s.id)}>
              <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>✕</AureakText>
            </Pressable>
          </View>
        ))}

        {addingSit && (
          <View style={bl.addPanel}>
            <TextInput
              style={bl.searchInput}
              value={sitSearch}
              onChangeText={setSitSearch}
              placeholder="Rechercher une situation…"
              placeholderTextColor={colors.text.muted}
              autoFocus
            />
            {availSits.slice(0, 8).map(s => (
              <Pressable key={s.id} style={bl.availRow} onPress={() => handleLinkSit(s.id)}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 12 }}>{s.title}</AureakText>
                {s.method && <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>{s.method}</AureakText>}
              </Pressable>
            ))}
            {availSits.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, padding: 8 }}>Aucune situation disponible.</AureakText>
            )}
            <Pressable onPress={() => { setAddingSit(false); setSitSearch('') }}>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 6 }}>Annuler</AureakText>
            </Pressable>
          </View>
        )}
      </SectionCard>

    </View>
  )
}

const bl = StyleSheet.create({
  addBtn    : { backgroundColor: colors.accent.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  linkedRow : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  dot       : { width: 8, height: 8, borderRadius: 4 },
  addPanel  : { gap: 4, padding: space.sm, backgroundColor: colors.light.muted, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, marginTop: 6 },
  searchInput: { backgroundColor: colors.light.primary, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: colors.text.dark, fontSize: 12 },
  availRow  : { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border.divider, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeanceDetailPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()

  const [session,          setSession]          = useState<MethodologySession | null>(null)
  const [linkedThemes,     setLinkedThemes]     = useState<MethodologyTheme[]>([])
  const [linkedSituations, setLinkedSituations] = useState<MethodologySituation[]>([])
  const [allThemes,        setAllThemes]        = useState<MethodologyTheme[]>([])
  const [allSituations,    setAllSituations]    = useState<MethodologySituation[]>([])
  const [loading,          setLoading]          = useState(true)
  const [editing,          setEditing]          = useState(false)
  const [saving,           setSaving]           = useState(false)

  // Edit form state
  const [title,       setTitle]       = useState('')
  const [method,      setMethod]      = useState<MethodologyMethod | null>(null)
  const [contextType, setContextType] = useState<MethodologyContextType | null>(null)
  const [moduleName,  setModuleName]  = useState('')
  const [trainingRef, setTrainingRef] = useState('')
  const [description, setDescription] = useState('')
  const [pdfUrl,      setPdfUrl]      = useState('')
  const [videoUrl,    setVideoUrl]    = useState('')
  const [audioUrl,    setAudioUrl]    = useState('')
  // Legacy fields (kept in DB, hidden in new form but editable if already set)
  const [level,       setLevel]       = useState<MethodologyLevel | null>(null)
  const [objective,   setObjective]   = useState('')
  const [notes,       setNotes]       = useState('')

  const loadBlocsLinks = useCallback(async () => {
    if (!sessionId) return
    const [themes, situations] = await Promise.all([
      listMethodologySessionThemes(sessionId),
      listMethodologySessionSituations(sessionId),
    ])
    setLinkedThemes(themes)
    setLinkedSituations(situations)
  }, [sessionId])

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    const [s, themes, situations, allT, allS] = await Promise.all([
      getMethodologySession(sessionId),
      listMethodologySessionThemes(sessionId),
      listMethodologySessionSituations(sessionId),
      listMethodologyThemes({ activeOnly: false }),
      listMethodologySituations({ activeOnly: false }),
    ])
    if (s) {
      setSession(s)
      setTitle(s.title)
      setMethod(s.method as MethodologyMethod | null)
      setContextType(s.contextType as MethodologyContextType | null)
      setModuleName(s.moduleName ?? '')
      setTrainingRef(s.trainingRef ?? '')
      setDescription(s.description ?? '')
      setPdfUrl(s.pdfUrl ?? '')
      setVideoUrl(s.videoUrl ?? '')
      setAudioUrl(s.audioUrl ?? '')
      setLevel(s.level as MethodologyLevel | null)
      setObjective(s.objective ?? '')
      setNotes(s.notes ?? '')
    }
    setLinkedThemes(themes)
    setLinkedSituations(situations)
    setAllThemes(allT)
    setAllSituations(allS)
    setLoading(false)
  }, [sessionId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!sessionId || !title.trim()) return
    setSaving(true)
    await updateMethodologySession(sessionId, {
      title      : title.trim(),
      method     : method      ?? null,
      contextType: contextType ?? null,
      moduleName : moduleName.trim()  || null,
      trainingRef: trainingRef.trim() || null,
      description: description.trim() || null,
      pdfUrl     : pdfUrl.trim()    || null,
      videoUrl   : videoUrl.trim()  || null,
      audioUrl   : audioUrl.trim()  || null,
      level      : level       ?? null,
      objective  : objective.trim()   || null,
      notes      : notes.trim()       || null,
    })
    setSaving(false)
    setEditing(false)
    load()
  }

  const handleToggleActive = async () => {
    if (!session || !sessionId) return
    await toggleMethodologySession(sessionId, !session.isActive)
    load()
  }

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
    </View>
  }

  if (!session) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <AureakText variant="h3" style={{ color: colors.text.muted }}>Entraînement introuvable</AureakText>
      <Pressable onPress={() => router.back()} style={{ marginTop: space.md }}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
      </Pressable>
    </View>
  }

  const methodColor = session.method ? (methodologyMethodColors[session.method as MethodologyMethod] ?? colors.border.light) : colors.border.light

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Back ── */}
      <Pressable onPress={() => router.push('/methodologie/seances' as never)}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Entraînements pédagogiques</AureakText>
      </Pressable>

      {/* ── Hero ── */}
      <View style={[s.hero, { borderTopColor: methodColor }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <AureakText variant="h2" style={{ lineHeight: 32 }}>{session.title}</AureakText>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <MethodBadge method={session.method} />
            {session.contextType && (
              <View style={s.chip}>
                <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
                  {METHODOLOGY_CONTEXT_LABELS[session.contextType as MethodologyContextType] ?? session.contextType}
                </AureakText>
              </View>
            )}
            {session.moduleName && (
              <View style={s.chip}>
                <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
                  {session.moduleName}
                </AureakText>
              </View>
            )}
            {session.trainingRef && (
              <View style={[s.chip, { borderColor: colors.accent.gold + '60' }]}>
                <AureakText variant="caption" style={{ fontSize: 11, color: colors.accent.gold, fontWeight: '700' }}>
                  #{session.trainingRef}
                </AureakText>
              </View>
            )}
            {!session.isActive && (
              <View style={[s.chip, { borderColor: colors.status.attention + '60' }]}>
                <AureakText variant="caption" style={{ fontSize: 11, color: colors.status.attention }}>Inactif</AureakText>
              </View>
            )}
          </View>
        </View>

        <View style={{ gap: 8, alignItems: 'flex-end' }}>
          <Pressable style={s.editBtn} onPress={() => setEditing(v => !v)}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 12 }}>
              {editing ? 'Annuler' : 'Modifier'}
            </AureakText>
          </Pressable>
          <Pressable onPress={handleToggleActive}>
            <AureakText variant="caption" style={{ color: session.isActive ? colors.status.attention : '#66BB6A', fontSize: 11 }}>
              {session.isActive ? 'Désactiver' : 'Activer'}
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Edit form ── */}
      {editing && (
        <SectionCard>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never, marginBottom: 8 }}>MODIFIER</AureakText>

          <FieldLabel>Titre</FieldLabel>
          <TextInput style={si.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.text.muted} />

          <FieldLabel>Méthode</FieldLabel>
          <ChipSelect options={METHODOLOGY_METHODS} value={method} onSelect={setMethod} color={m => methodologyMethodColors[m]} />

          <FieldLabel>Contexte</FieldLabel>
          <ChipSelect options={METHODOLOGY_CONTEXT_TYPES} value={contextType} onSelect={setContextType} label={c => METHODOLOGY_CONTEXT_LABELS[c]} />

          <FieldLabel>Module</FieldLabel>
          <TextInput style={si.input} value={moduleName} onChangeText={setModuleName} placeholder="Ex : Module Tir au but…" placeholderTextColor={colors.text.muted} />

          <FieldLabel>Référence / Numéro</FieldLabel>
          <TextInput style={si.input} value={trainingRef} onChangeText={setTrainingRef} placeholder="Ex : 22" placeholderTextColor={colors.text.muted} keyboardType="numeric" />

          <FieldLabel>Description</FieldLabel>
          <TextInput style={[si.input, si.textarea]} value={description} onChangeText={setDescription} multiline placeholderTextColor={colors.text.muted} />

          <FieldLabel>URL PDF</FieldLabel>
          <TextInput style={si.input} value={pdfUrl} onChangeText={setPdfUrl} placeholder="https://…" placeholderTextColor={colors.text.muted} autoCapitalize="none" keyboardType="url" />

          <FieldLabel>URL Vidéo</FieldLabel>
          <TextInput style={si.input} value={videoUrl} onChangeText={setVideoUrl} placeholder="https://…" placeholderTextColor={colors.text.muted} autoCapitalize="none" keyboardType="url" />

          <FieldLabel>URL Audio</FieldLabel>
          <TextInput style={si.input} value={audioUrl} onChangeText={setAudioUrl} placeholder="https://…" placeholderTextColor={colors.text.muted} autoCapitalize="none" keyboardType="url" />

          <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: 8 }}>
            <Pressable style={si.cancelBtn} onPress={() => setEditing(false)}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
            </Pressable>
            <Pressable style={[si.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </AureakText>
            </Pressable>
          </View>
        </SectionCard>
      )}

      {/* ── Infos ── */}
      {!editing && (
        <View style={{ gap: space.md }}>
          <SectionCard>
            {session.objective && (
              <>
                <FieldLabel>Objectif pédagogique</FieldLabel>
                <AureakText variant="body" style={{ fontSize: 14, lineHeight: 22 }}>{session.objective}</AureakText>
              </>
            )}
            {session.description && (
              <>
                <FieldLabel>Description</FieldLabel>
                <AureakText variant="body" style={{ fontSize: 13, color: colors.text.muted, lineHeight: 20 }}>{session.description}</AureakText>
              </>
            )}
            {session.notes && (
              <>
                <FieldLabel>Notes internes</FieldLabel>
                <AureakText variant="caption" style={{ fontSize: 12, color: colors.text.muted, fontStyle: 'italic' as never, lineHeight: 18 }}>{session.notes}</AureakText>
              </>
            )}
            {!session.objective && !session.description && !session.notes && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>Aucune description renseignée.</AureakText>
            )}
          </SectionCard>

          {/* Médias */}
          {(session.pdfUrl || session.videoUrl || session.audioUrl) && (
            <SectionCard>
              <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never, marginBottom: 8 }}>MÉDIAS</AureakText>
              {session.pdfUrl && (
                <View style={{ gap: 4 }}>
                  <FieldLabel>Document PDF</FieldLabel>
                  <Pressable style={s.mediaBtn} onPress={() => Linking.openURL(session.pdfUrl!)}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 12 }}>📄 Ouvrir le PDF →</AureakText>
                  </Pressable>
                </View>
              )}
              {session.videoUrl && (
                <View style={{ gap: 4, marginTop: session.pdfUrl ? 8 : 0 }}>
                  <FieldLabel>Vidéo</FieldLabel>
                  <Pressable style={[s.mediaBtn, { backgroundColor: '#4FC3F7' }]} onPress={() => Linking.openURL(session.videoUrl!)}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 12 }}>▶ Ouvrir la vidéo →</AureakText>
                  </Pressable>
                </View>
              )}
              {session.audioUrl && (
                <View style={{ gap: 4, marginTop: (session.pdfUrl || session.videoUrl) ? 8 : 0 }}>
                  <FieldLabel>Audio</FieldLabel>
                  <Pressable style={[s.mediaBtn, { backgroundColor: '#CE93D8' }]} onPress={() => Linking.openURL(session.audioUrl!)}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 12 }}>🔊 Écouter l'audio →</AureakText>
                  </Pressable>
                </View>
              )}
            </SectionCard>
          )}
        </View>
      )}

      {/* ── Blocs de savoir liés ── */}
      <LinkedBlocsPanel
        sessionId={sessionId!}
        linkedThemes={linkedThemes}
        linkedSituations={linkedSituations}
        allThemes={allThemes}
        allSituations={allSituations}
        onRefresh={loadBlocsLinks}
      />

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.lg, gap: space.md, maxWidth: 860, alignSelf: 'center', width: '100%' },
  hero     : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderTopWidth : 3,
    padding        : space.md,
    flexDirection  : 'row',
    gap            : space.md,
    alignItems     : 'flex-start',
  },
  chip   : { borderWidth: 1, borderColor: colors.border.light, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  editBtn: { borderWidth: 1, borderColor: colors.accent.gold + '60', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  pdfBtn   : { backgroundColor: colors.accent.gold, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 10, alignSelf: 'flex-start' },
  mediaBtn : { backgroundColor: colors.accent.gold, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 10, alignSelf: 'flex-start' },
})
const si = StyleSheet.create({
  input    : { backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: colors.text.dark, fontSize: 13 },
  textarea : { minHeight: 80, textAlignVertical: 'top' as never, paddingTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light },
  saveBtn  : { backgroundColor: colors.accent.gold, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
})
