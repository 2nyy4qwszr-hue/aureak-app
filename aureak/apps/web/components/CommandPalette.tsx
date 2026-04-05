'use client'
// Story 51.3 — Command Palette ⌘K
// Overlay modal centré, recherche unifiée joueurs/clubs/séances + navigation statique.
// Utilise Pressable/View (pas className), tokens @aureak/theme.

import React, { useRef, useEffect } from 'react'
import { Pressable, View, TextInput, ScrollView, ActivityIndicator } from 'react-native'
import { Text } from 'tamagui'
import { useRouter } from 'expo-router'
import { colors, shadows, radius } from '@aureak/theme'
import { useCommandPalette } from '../hooks/useCommandPalette'
import type { CommandResult, CommandResultType } from '@aureak/types'

// ── Constantes visuelles ──────────────────────────────────────────────────────

const TYPE_LABEL: Record<CommandResultType, string> = {
  navigation: 'NAVIGATION',
  player    : 'JOUEURS',
  club      : 'CLUBS',
  session   : 'SÉANCES',
}

const TYPE_ORDER: CommandResultType[] = ['navigation', 'player', 'club', 'session']

// ── Groupement des résultats ──────────────────────────────────────────────────

type GroupedResults = Array<{ type: CommandResultType; items: CommandResult[]; startIndex: number }>

function groupResults(results: CommandResult[]): GroupedResults {
  const groups: GroupedResults = []
  let cursor = 0

  for (const type of TYPE_ORDER) {
    const items = results.filter(r => r.type === type)
    if (items.length > 0) {
      groups.push({ type, items, startIndex: cursor })
      cursor += items.length
    }
  }

  return groups
}

// ── CommandResultItem ─────────────────────────────────────────────────────────

interface ResultItemProps {
  result       : CommandResult
  isSelected   : boolean
  onPress      : () => void
  onHoverIn?   : () => void
  onHoverOut?  : () => void
}

function CommandResultItem({ result, isSelected, onPress, onHoverIn, onHoverOut }: ResultItemProps) {
  return (
    <Pressable
      onPress={onPress}
      // @ts-ignore — web-only hover events via React Native Web
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection   : 'row',
            alignItems      : 'center',
            paddingVertical : 10,
            paddingHorizontal: 16,
            backgroundColor : (isSelected || pressed)
              ? (colors.accent.gold + '20')
              : 'transparent',
            borderLeftWidth : 2,
            borderLeftColor : isSelected ? colors.accent.gold : 'transparent',
          }}
        >
          {/* Icône */}
          {result.icon && (
            <Text
              style={{
                fontSize   : 16,
                marginRight: 12,
                width      : 20,
                textAlign  : 'center',
              } as never}
            >
              {result.icon}
            </Text>
          )}

          {/* Labels */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              fontFamily="$body"
              fontSize={13}
              fontWeight={isSelected ? '700' : '500'}
              color={colors.text.dark}
              numberOfLines={1}
              style={{ overflow: 'hidden' } as never}
            >
              {result.label}
            </Text>
            {result.sublabel && (
              <Text
                fontFamily="$body"
                fontSize={11}
                color={colors.text.muted}
                numberOfLines={1}
                style={{ overflow: 'hidden', marginTop: 1 } as never}
              >
                {result.sublabel}
              </Text>
            )}
          </View>

          {/* Badge type (navigation uniquement, pour différencier visuellement) */}
          {result.type !== 'navigation' && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical  : 2,
                borderRadius     : radius.xs,
                backgroundColor  : colors.accent.gold + '18',
                marginLeft       : 8,
                flexShrink       : 0,
              }}
            >
              <Text
                fontFamily="$body"
                fontSize={9}
                fontWeight="700"
                color={colors.accent.gold}
                style={{ textTransform: 'uppercase', letterSpacing: 0.8 } as never}
              >
                {TYPE_LABEL[result.type]}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  )
}

// ── Composant principal CommandPalette ────────────────────────────────────────

export function CommandPalette() {
  const {
    isOpen, query, results, selectedIndex, isLoading,
    close, setQuery, executeResult,
  } = useCommandPalette()

  const inputRef   = useRef<TextInput | null>(null)
  const scrollRef  = useRef<ScrollView | null>(null)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)

  // Focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Scroll pour garder l'item sélectionné visible
  useEffect(() => {
    if (isOpen && scrollRef.current && results.length > 0) {
      // Chaque item fait ~40px (10 paddingV × 2 + 20 contenu)
      scrollRef.current.scrollTo({ y: selectedIndex * 40, animated: true })
    }
  }, [isOpen, selectedIndex, results.length])

  if (!isOpen) return null

  const grouped = groupResults(results)
  const showEmpty = query.length >= 2 && !isLoading && results.length === 0

  return (
    // ── Backdrop ────────────────────────────────────────────────────────────
    <Pressable
      onPress={close}
      style={{
        position       : 'fixed' as never,
        top            : 0,
        left           : 0,
        right          : 0,
        bottom         : 0,
        zIndex         : 100,
        backgroundColor: colors.overlay.modal,
        alignItems     : 'center',
        justifyContent : 'flex-start',
        paddingTop     : 80,
      } as never}
    >
      {/* ── Card ────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={e => e.stopPropagation()}
        style={{
          width          : '100%',
          maxWidth       : 560,
          backgroundColor: colors.light.surface,
          borderRadius   : 16,
          boxShadow      : shadows.gold,
          overflow       : 'hidden',
          marginHorizontal: 16,
        } as never}
      >
        {/* ── Input ──────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection  : 'row',
            alignItems     : 'center',
            paddingHorizontal: 16,
            paddingVertical : 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.divider,
            backgroundColor: colors.light.surface,
          }}
        >
          {/* Icône loupe */}
          <Text
            style={{ fontSize: 16, marginRight: 10, color: colors.text.muted } as never}
          >
            🔍
          </Text>

          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher joueurs, clubs, séances…"
            placeholderTextColor={colors.text.subtle}
            style={{
              flex      : 1,
              fontSize  : 15,
              color     : colors.text.dark,
              fontFamily: 'Montserrat',
              outline   : 'none',
              border    : 'none',
              background: 'transparent',
            } as never}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* Loading indicator */}
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={colors.accent.gold}
              style={{ marginLeft: 8 }}
            />
          )}

          {/* Hint Esc */}
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical  : 3,
              borderRadius     : 4,
              borderWidth      : 1,
              borderColor      : colors.border.light,
              backgroundColor  : colors.light.muted,
              marginLeft       : 8,
            }}
          >
            <Text
              fontFamily="$body"
              fontSize={10}
              color={colors.text.subtle}
            >
              esc
            </Text>
          </View>
        </View>

        {/* ── Résultats scrollables ───────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          style={{ maxHeight: 320 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Empty state */}
          {showEmpty && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical  : 24,
                alignItems       : 'center',
              }}
            >
              <Text
                fontFamily="$body"
                fontSize={13}
                color={colors.text.muted}
                style={{ textAlign: 'center' } as never}
              >
                {`Aucun résultat pour «\u00a0${query}\u00a0»`}
              </Text>
              <Text
                fontFamily="$body"
                fontSize={11}
                color={colors.text.subtle}
                style={{ textAlign: 'center', marginTop: 4 } as never}
              >
                Essayez un autre terme ou consultez la liste complète
              </Text>
            </View>
          )}

          {/* Groupes */}
          {!showEmpty && grouped.map(({ type, items, startIndex }) => (
            <View key={type}>
              {/* Header de groupe */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop       : 10,
                  paddingBottom    : 4,
                }}
              >
                <Text
                  fontFamily="$body"
                  fontSize={10}
                  fontWeight="700"
                  color={colors.text.subtle}
                  style={{ textTransform: 'uppercase', letterSpacing: 1.2 } as never}
                >
                  {TYPE_LABEL[type]}
                </Text>
              </View>

              {/* Items */}
              {items.map((result, i) => {
                const absoluteIdx = startIndex + i
                return (
                  <CommandResultItem
                    key={result.id}
                    result={result}
                    isSelected={absoluteIdx === selectedIndex || absoluteIdx === hoverIdx}
                    onPress={() => executeResult(result)}
                    onHoverIn={() => setHoverIdx(absoluteIdx)}
                    onHoverOut={() => setHoverIdx(null)}
                  />
                )
              })}
            </View>
          ))}

          {/* Padding bas */}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── Footer hint ─────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection    : 'row',
            alignItems       : 'center',
            justifyContent   : 'flex-end',
            paddingHorizontal: 16,
            paddingVertical  : 8,
            borderTopWidth   : 1,
            borderTopColor   : colors.border.divider,
            backgroundColor  : colors.light.muted,
            gap              : 12,
          }}
        >
          <Text fontFamily="$body" fontSize={10} color={colors.text.subtle}>
            ↑↓ naviguer
          </Text>
          <Text fontFamily="$body" fontSize={10} color={colors.text.subtle}>
            ↵ sélectionner
          </Text>
          <Text fontFamily="$body" fontSize={10} color={colors.text.subtle}>
            esc fermer
          </Text>
        </View>
      </Pressable>
    </Pressable>
  )
}
