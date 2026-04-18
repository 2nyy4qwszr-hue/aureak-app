'use client'
// Story 86.3 — Panneau de permissions granulaires par section
// Composant réutilisable : onglet "Accès" dans les fiches utilisateur (coach, manager, etc.)
// Affiche un toggle par section avec indicateur "par défaut" vs "personnalisé"
// + bouton "Réinitialiser aux défauts du rôle"

import { useEffect, useState, useCallback } from 'react'
import {
  getUserPermissions,
  setUserSectionOverride,
  removeUserSectionOverride,
  resetUserSectionOverrides,
} from '@aureak/api-client'
import type { UserSectionPermission } from '@aureak/types'
import type { UserRole, AppSection } from '@aureak/types'
import { APP_SECTION_LABELS } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

// ── Section icons (emoji) ─────────────────────────────────────────────────
const SECTION_ICONS: Record<AppSection, string> = {
  dashboard    : '\u{1F4CA}',
  activites    : '\u{26BD}',
  methodologie : '\u{1F4D6}',
  academie     : '\u{1F3EB}',
  evenements   : '\u{1F4C5}',
  prospection  : '\u{1F50D}',
  marketing    : '\u{1F4E3}',
  partenariat  : '\u{1F91D}',
  performances : '\u{2B50}',
}

type Props = {
  userId : string
  role   : UserRole
}

export default function SectionPermissionsPanel({ userId, role }: Props) {
  const [permissions, setPermissions] = useState<UserSectionPermission[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState<AppSection | null>(null)
  const [resetting, setResetting]     = useState(false)

  const loadPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await getUserPermissions(userId, role)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] load error:', error)
      }
      setPermissions(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] load exception:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, role])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const handleToggle = async (section: AppSection, currentEnabled: boolean, isDefault: boolean) => {
    const newEnabled = !currentEnabled

    // Si la nouvelle valeur = la valeur par défaut du rôle, supprimer l'override
    const perm = permissions.find(p => p.sectionKey === section)
    const defaultVal = perm?.defaultValue ?? false

    setSaving(section)
    try {
      if (newEnabled === defaultVal && !isDefault) {
        // Retour au défaut : supprimer l'override
        const { error } = await removeUserSectionOverride(userId, section)
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] remove override error:', error)
          return
        }
      } else {
        // Créer/modifier l'override
        const { error } = await setUserSectionOverride(userId, section, newEnabled)
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] set override error:', error)
          return
        }
      }
      await loadPermissions()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] toggle exception:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const { error } = await resetUserSectionOverrides(userId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] reset error:', error)
        return
      }
      await loadPermissions()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionPermissionsPanel] reset exception:', err)
    } finally {
      setResetting(false)
    }
  }

  const hasOverrides = permissions.some(p => !p.isDefault)

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: colors.text.muted, fontSize: 13 }}>
        Chargement des permissions...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text.dark }}>
            Sections accessibles
          </div>
          <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
            Les sections actives par defaut pour le role "{role}" sont indiquees. Vous pouvez personnaliser les acces.
          </div>
        </div>
        {hasOverrides && (
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{
              padding     : '6px 14px',
              background  : resetting ? colors.light.muted : 'transparent',
              color       : resetting ? colors.text.muted : colors.accent.red,
              border      : `1px solid ${resetting ? colors.border.divider : colors.accent.red}`,
              borderRadius: radius.xs,
              fontSize    : 12,
              fontWeight  : 600,
              cursor      : resetting ? 'not-allowed' : 'pointer',
              transition  : `all ${transitions.fast}`,
            }}
          >
            {resetting ? 'Reinitialisation...' : 'Reinitialiser aux defauts'}
          </button>
        )}
      </div>

      {/* Section toggles */}
      <div style={{
        background  : colors.light.surface,
        borderRadius: radius.card,
        boxShadow   : shadows.sm,
        border      : `1px solid ${colors.border.divider}`,
        overflow    : 'hidden',
      }}>
        {permissions.map((perm, i) => {
          const isSaving = saving === perm.sectionKey
          return (
            <div
              key={perm.sectionKey}
              style={{
                display     : 'flex',
                alignItems  : 'center',
                padding     : '12px 20px',
                borderTop   : i > 0 ? `1px solid ${colors.border.divider}` : undefined,
                gap         : 12,
                opacity     : isSaving ? 0.6 : 1,
                transition  : `opacity ${transitions.fast}`,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                {SECTION_ICONS[perm.sectionKey]}
              </span>

              {/* Label + badge */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                    {APP_SECTION_LABELS[perm.sectionKey]}
                  </span>
                  {!perm.isDefault && (
                    <span style={{
                      fontSize       : 9,
                      fontWeight     : 700,
                      color          : colors.accent.gold,
                      background     : colors.accent.gold + '18',
                      padding        : '1px 6px',
                      borderRadius   : 10,
                      textTransform  : 'uppercase',
                      letterSpacing  : '0.05em',
                    }}>
                      personnalise
                    </span>
                  )}
                  {perm.isDefault && perm.defaultValue && (
                    <span style={{
                      fontSize       : 9,
                      fontWeight     : 700,
                      color          : colors.text.subtle,
                      background     : colors.light.muted,
                      padding        : '1px 6px',
                      borderRadius   : 10,
                      textTransform  : 'uppercase',
                      letterSpacing  : '0.05em',
                    }}>
                      par defaut
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(perm.sectionKey, perm.enabled, perm.isDefault)}
                disabled={isSaving}
                style={{
                  position    : 'relative',
                  width       : 44,
                  height      : 24,
                  borderRadius: 12,
                  border      : 'none',
                  cursor      : isSaving ? 'not-allowed' : 'pointer',
                  background  : perm.enabled ? colors.accent.gold : colors.border.divider,
                  transition  : `background ${transitions.fast}`,
                  padding     : 0,
                  flexShrink  : 0,
                }}
              >
                <div style={{
                  position    : 'absolute',
                  top         : 2,
                  left        : perm.enabled ? 22 : 2,
                  width       : 20,
                  height      : 20,
                  borderRadius: 10,
                  background  : colors.light.surface,
                  boxShadow   : shadows.sm,
                  transition  : `left ${transitions.fast}`,
                }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
