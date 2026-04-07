'use client'
// Story 65-1 — Activités Hub : Filtres Scope (Global / Implantation / Groupe / Joueur)
// Conçu pour être réutilisé dans les stories 65-2 (Présences) et 65-3 (Évaluations)
import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { listImplantations, listGroupsByImplantation, listJoueurs } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { Implantation } from '@aureak/types'
import type { JoueurListItem } from '@aureak/api-client'

export type ScopeState = {
  scope          : 'global' | 'implantation' | 'groupe' | 'joueur'
  implantationId?: string
  groupId?       : string
  childId?       : string
}

type Props = {
  value   : ScopeState
  onChange: (next: ScopeState) => void
}

type GroupOption = { id: string; name: string }

export function FiltresScope({ value, onChange }: Props) {
  const [implantations,      setImplantations]      = useState<Implantation[]>([])
  const [groups,             setGroups]             = useState<GroupOption[]>([])
  const [joueurs,            setJoueurs]            = useState<JoueurListItem[]>([])
  const [joueurSearch,       setJoueurSearch]       = useState('')
  const [showImplDropdown,   setShowImplDropdown]   = useState(false)
  const [showGroupDropdown,  setShowGroupDropdown]  = useState(false)
  const [showJoueurDropdown, setShowJoueurDropdown] = useState(false)

  // Charger les implantations au montage
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await listImplantations()
        setImplantations(data ?? [])
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[FiltresScope] listImplantations error:', err)
      }
    })()
  }, [])

  // Charger les groupes quand une implantation est sélectionnée
  useEffect(() => {
    if (!value.implantationId) {
      setGroups([])
      return
    }
    ;(async () => {
      try {
        const { data } = await listGroupsByImplantation(value.implantationId!)
        setGroups((data ?? []).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[FiltresScope] listGroupsByImplantation error:', err)
      }
    })()
  }, [value.implantationId])

  // Charger joueurs sur ouverture dropdown ou changement de recherche
  useEffect(() => {
    if (!showJoueurDropdown) return
    ;(async () => {
      try {
        const result = await listJoueurs({ search: joueurSearch || undefined, pageSize: 20 })
        setJoueurs(result.data ?? [])
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[FiltresScope] listJoueurs error:', err)
      }
    })()
  }, [showJoueurDropdown, joueurSearch])

  const implantationLabel = value.implantationId
    ? (implantations.find(i => i.id === value.implantationId)?.name ?? 'Implantation')
    : 'Implantation ▾'

  const groupLabel = value.groupId
    ? (groups.find(g => g.id === value.groupId)?.name ?? 'Groupe')
    : 'Groupe ▾'

  const joueurLabel = value.childId
    ? (joueurs.find(j => j.id === value.childId)?.displayName ?? 'Joueur')
    : 'Joueur ▾'

  const isActive        = (s: ScopeState['scope']) => value.scope === s
  const groupPillEnabled = !!(value.implantationId)

  function pillStyle(active: boolean, disabled = false): ViewStyle {
    return {
      paddingHorizontal: 14,
      paddingVertical  : 6,
      borderRadius     : radius.badge,
      backgroundColor  : active ? colors.accent.gold : colors.light.muted,
      borderWidth      : 1,
      borderColor      : active ? colors.accent.gold : colors.border.light,
      opacity          : disabled ? 0.45 : 1,
      cursor           : disabled ? 'not-allowed' : 'pointer',
    } as ViewStyle
  }

  function pillTextStyle(active: boolean): TextStyle {
    return {
      fontSize  : 12,
      fontWeight: '600',
      fontFamily: 'Montserrat',
      color     : active ? colors.text.dark : colors.text.muted,
    }
  }

  return (
    <View style={styles.container}>
      {/* Pill Global */}
      <Pressable style={pillStyle(isActive('global'))} onPress={() => onChange({ scope: 'global' })}>
        <AureakText style={pillTextStyle(isActive('global'))}>Toutes</AureakText>
      </Pressable>

      {/* Pill Implantation */}
      <View style={styles.dropdownWrapper}>
        <Pressable
          style={pillStyle(isActive('implantation'))}
          onPress={() => {
            setShowImplDropdown(v => !v)
            setShowGroupDropdown(false)
            setShowJoueurDropdown(false)
          }}
        >
          <AureakText style={pillTextStyle(isActive('implantation'))}>
            {isActive('implantation') ? implantationLabel : 'Implantation ▾'}
          </AureakText>
        </Pressable>
        {showImplDropdown && (
          <View style={styles.dropdown}>
            <ScrollView style={{ maxHeight: 200 }}>
              {implantations.map(impl => (
                <Pressable
                  key={impl.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onChange({ scope: 'implantation', implantationId: impl.id })
                    setShowImplDropdown(false)
                  }}
                >
                  <AureakText style={styles.dropdownItemText}>{impl.name}</AureakText>
                </Pressable>
              ))}
              {implantations.length === 0 && (
                <AureakText style={styles.dropdownEmpty}>Aucune implantation</AureakText>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Pill Groupe */}
      <View style={styles.dropdownWrapper}>
        <Pressable
          style={pillStyle(isActive('groupe'), !groupPillEnabled)}
          onPress={() => {
            if (!groupPillEnabled) return
            setShowGroupDropdown(v => !v)
            setShowImplDropdown(false)
            setShowJoueurDropdown(false)
          }}
        >
          <AureakText style={pillTextStyle(isActive('groupe'))}>
            {isActive('groupe') ? groupLabel : 'Groupe ▾'}
          </AureakText>
        </Pressable>
        {showGroupDropdown && groupPillEnabled && (
          <View style={styles.dropdown}>
            {groups.length === 0 && (
              <AureakText style={styles.dropdownEmpty}>Aucun groupe</AureakText>
            )}
            <ScrollView style={{ maxHeight: 200 }}>
              {groups.map(g => (
                <Pressable
                  key={g.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onChange({ scope: 'groupe', implantationId: value.implantationId, groupId: g.id })
                    setShowGroupDropdown(false)
                  }}
                >
                  <AureakText style={styles.dropdownItemText}>{g.name}</AureakText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Pill Joueur */}
      <View style={styles.dropdownWrapper}>
        <Pressable
          style={pillStyle(isActive('joueur'))}
          onPress={() => {
            setShowJoueurDropdown(v => !v)
            setShowImplDropdown(false)
            setShowGroupDropdown(false)
          }}
        >
          <AureakText style={pillTextStyle(isActive('joueur'))}>
            {isActive('joueur') ? joueurLabel : 'Joueur ▾'}
          </AureakText>
        </Pressable>
        {showJoueurDropdown && (
          <View style={[styles.dropdown, { width: 260 }]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un joueur…"
              placeholderTextColor={colors.text.muted}
              value={joueurSearch}
              onChangeText={setJoueurSearch}
              autoComplete="off"
              autoCorrect={false}
              {...({ 'data-lpignore': 'true', 'data-form-type': 'other' } as object)}
            />
            <ScrollView style={{ maxHeight: 200 }}>
              {joueurs.map(j => (
                <Pressable
                  key={j.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onChange({ scope: 'joueur', childId: j.id })
                    setShowJoueurDropdown(false)
                  }}
                >
                  <AureakText style={styles.dropdownItemText}>{j.displayName}</AureakText>
                </Pressable>
              ))}
              {joueurs.length === 0 && (
                <AureakText style={styles.dropdownEmpty}>Aucun joueur trouvé</AureakText>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex  : 9999,
  },
  dropdown: {
    position       : 'absolute',
    top            : 38,
    left           : 0,
    zIndex         : 9999,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    width          : 220,
    elevation      : 20,
    // @ts-ignore web
    boxShadow      : '0 8px 24px rgba(0,0,0,0.12)',
  },
  dropdownItem: {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  dropdownItemText: {
    fontSize  : 13,
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
  },
  dropdownEmpty: {
    padding  : space.md,
    fontSize : 13,
    fontFamily: 'Montserrat',
    color    : colors.text.muted,
    textAlign: 'center',
  },
  searchInput: {
    margin           : space.sm,
    paddingHorizontal: space.sm,
    paddingVertical  : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    fontSize         : 13,
    fontFamily       : 'Montserrat',
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
})
