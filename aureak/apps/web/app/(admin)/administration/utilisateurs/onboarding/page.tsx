'use client'
// Story tbd-onboarding — Wizard d'onboarding administrateur (4 étapes)
// Story 99.3 — AdminPageHeader v2 ("Onboarding")
import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { createImplantation, createGroup } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { GROUP_METHODS } from '@aureak/business-logic'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

// ── Step config ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Bienvenue',      icon: '👋' },
  { id: 2, label: 'Implantation',   icon: '📍' },
  { id: 3, label: 'Groupes',        icon: '👥' },
  { id: 4, label: 'Terminé',        icon: '✅' },
]

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressStepper({ current }: { current: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.xl }}>
      {STEPS.map((step, i) => {
        const done   = step.id < current
        const active = step.id === current
        const color  = done || active ? colors.accent.gold : colors.border.light
        return (
          <React.Fragment key={step.id}>
            <View style={{
              width          : 32,
              height         : 32,
              borderRadius   : 16,
              backgroundColor: done ? colors.accent.gold : active ? colors.accent.gold + '20' : colors.light.muted,
              borderWidth    : 2,
              borderColor    : color,
              alignItems     : 'center',
              justifyContent : 'center',
            }}>
              <AureakText variant="caption" style={{ color: done ? colors.light.primary : color, fontWeight: '700', fontSize: 12 }}>
                {done ? '✓' : step.id}
              </AureakText>
            </View>
            {i < STEPS.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: done ? colors.accent.gold : colors.border.light }} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const router = useRouter()

  const [step,             setStep]             = useState(1)
  const [implantName,      setImplantName]      = useState('')
  const [implantAddress,   setImplantAddress]   = useState('')
  const [createGroups,     setCreateGroups]     = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [implantId,        setImplantId]        = useState<string | null>(null)
  const [error,            setError]            = useState<string | null>(null)
  const [groupsCreated,    setGroupsCreated]    = useState(0)
  const [tenantId,         setTenantId]         = useState('')

  // Récupérer le tenant_id depuis la session Supabase (simplified)
  React.useEffect(() => {
    import('@aureak/api-client').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        const tid = (data.session?.user?.app_metadata?.tenant_id
          ?? data.session?.user?.user_metadata?.tenant_id
          ?? '') as string
        setTenantId(tid)
      })
    })
  }, [])

  const handleCreateImplantation = async () => {
    if (!implantName.trim()) { setError("Le nom de l'implantation est requis."); return }
    if (!tenantId)            { setError("Impossible de déterminer le tenant. Veuillez vous reconnecter."); return }
    setSaving(true)
    setError(null)
    try {
      const implParams: Parameters<typeof createImplantation>[0] = {
        tenantId,
        name    : implantName.trim(),
      }
      if (implantAddress.trim()) implParams.address = implantAddress.trim()
      const { data: impl, error: implErr } = await createImplantation(implParams)
      if (implErr || !impl) throw implErr ?? new Error('Création échouée')
      setImplantId(impl.id)
      setStep(3)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Onboarding] createImplantation:', err)
      setError("Erreur lors de la création de l'implantation.")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateGroups = async () => {
    if (!implantId) { setStep(4); return }
    setSaving(true)
    setError(null)
    try {
      let created = 0
      for (const method of GROUP_METHODS) {
        const { error: grpErr } = await createGroup({
          tenantId,
          implantationId: implantId,
          name          : `${implantName} — ${method}`,
          method,
        })
        if (!grpErr) created++
      }
      setGroupsCreated(created)
      setStep(4)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Onboarding] createGroups:', err)
      setError('Erreur lors de la création des groupes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.3 — AdminPageHeader v2 */}
      <AdminPageHeader title="Onboarding" />

      <ScrollView style={s.container} contentContainerStyle={[s.content, isMobile && { padding: space.md }]}>
      <ProgressStepper current={step} />

      {/* ── Étape 1 : Bienvenue ── */}
      {step === 1 && (
        <View style={s.card}>
          <AureakText variant="h2" style={{ color: colors.accent.gold, marginBottom: space.sm }}>
            Bienvenue dans Aureak
          </AureakText>
          <AureakText variant="body" style={{ color: colors.text.muted, marginBottom: space.md }}>
            Ce wizard va vous aider à configurer votre académie en quelques étapes.
            Vous pourrez toujours modifier ces informations plus tard.
          </AureakText>
          <View style={{ gap: space.sm }}>
            {[
              { icon: '📍', label: "Créer votre première implantation (lieu d'entraînement)" },
              { icon: '👥', label: 'Générer les groupes pédagogiques standard' },
              { icon: '✅', label: 'Votre académie est prête à accueillir les joueurs' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
                <AureakText variant="body">{item.icon}</AureakText>
                <AureakText variant="body" style={{ color: colors.text.dark, flex: 1 }}>{item.label}</AureakText>
              </View>
            ))}
          </View>
          <Pressable style={s.primaryBtn} onPress={() => setStep(2)}>
            <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
              Commencer →
            </AureakText>
          </Pressable>
        </View>
      )}

      {/* ── Étape 2 : Implantation ── */}
      {step === 2 && (
        <View style={s.card}>
          <AureakText variant="h3" style={{ marginBottom: space.sm }}>
            📍 Votre implantation
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.md }}>
            Une implantation est un lieu physique où se déroulent les séances.
          </AureakText>

          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 4 }}>Nom *</AureakText>
          <TextInput
            style={s.input}
            value={implantName}
            onChangeText={setImplantName}
            placeholder="Ex: Terrain de Liège"
            placeholderTextColor={colors.text.muted}
          />

          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 4, marginTop: space.sm }}>Adresse</AureakText>
          <TextInput
            style={s.input}
            value={implantAddress}
            onChangeText={setImplantAddress}
            placeholder="Ex: Rue de la Paix 1, 4000 Liège"
            placeholderTextColor={colors.text.muted}
          />

          {error && (
            <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.sm }}>{error}</AureakText>
          )}

          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Pressable style={s.secondaryBtn} onPress={() => setStep(1)}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>← Retour</AureakText>
            </Pressable>
            <Pressable
              style={[s.primaryBtn, { flex: 1 }, saving && { opacity: 0.5 }]}
              onPress={handleCreateImplantation}
              disabled={saving}
            >
              <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
                {saving ? 'Création…' : 'Créer →'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Étape 3 : Groupes ── */}
      {step === 3 && (
        <View style={s.card}>
          <AureakText variant="h3" style={{ marginBottom: space.sm }}>
            👥 Groupes pédagogiques
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.md }}>
            Voulez-vous créer automatiquement {GROUP_METHODS.length} groupes standard
            (un par méthode pédagogique) pour "{implantName}" ?
          </AureakText>

          <View style={{ backgroundColor: colors.light.muted, borderRadius: 8, padding: space.md, gap: 6, marginBottom: space.md }}>
            {GROUP_METHODS.map(method => (
              <AureakText key={method} variant="caption" style={{ color: colors.text.dark }}>
                · {implantName} — {method}
              </AureakText>
            ))}
          </View>

          {error && (
            <AureakText variant="caption" style={{ color: colors.accent.red, marginBottom: space.sm }}>{error}</AureakText>
          )}

          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Pressable style={s.secondaryBtn} onPress={() => setStep(4)}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Passer</AureakText>
            </Pressable>
            <Pressable
              style={[s.primaryBtn, { flex: 1 }, saving && { opacity: 0.5 }]}
              onPress={handleCreateGroups}
              disabled={saving}
            >
              <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
                {saving ? 'Génération…' : 'Créer les groupes →'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Étape 4 : Terminé ── */}
      {step === 4 && (
        <View style={[s.card, { alignItems: 'center' }]}>
          <AureakText variant="body" style={{ fontSize: 48, marginBottom: space.md }}>🎉</AureakText>
          <AureakText variant="h2" style={{ color: colors.accent.gold, textAlign: 'center', marginBottom: space.sm }}>
            Configuration terminée !
          </AureakText>
          <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center', marginBottom: space.lg }}>
            {implantId && `Implantation "${implantName}" créée.`}
            {groupsCreated > 0 && ` ${groupsCreated} groupe${groupsCreated > 1 ? 's' : ''} généré${groupsCreated > 1 ? 's' : ''}.`}
            {'\n'}Votre académie est prête !
          </AureakText>
          <View style={{ gap: space.sm, width: '100%' }}>
            <Pressable style={s.primaryBtn} onPress={() => router.push('/dashboard' as never)}>
              <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700', textAlign: 'center' }}>
                Aller au tableau de bord →
              </AureakText>
            </Pressable>
            <Pressable style={s.secondaryBtn} onPress={() => router.push('/children' as never)}>
              <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' }}>
                Gérer les joueurs
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, maxWidth: 540, alignSelf: 'center' as never, width: '100%' },
  card       : {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.xl,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  input      : {
    backgroundColor  : colors.light.muted,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    padding          : space.sm,
    color            : colors.text.dark,
    fontSize         : 14,
  },
  primaryBtn : {
    backgroundColor: colors.accent.gold,
    borderRadius   : 8,
    padding        : space.md,
    alignItems     : 'center',
  },
  secondaryBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    alignItems       : 'center',
  },
})
