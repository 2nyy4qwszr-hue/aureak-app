'use client'
// Story 93.4 — NextSessionHero : état vide premium pour /activites (onglet Aujourd'hui, liste vide)
// Affiche la prochaine séance avec countdown temps réel, détails 4 colonnes, 2 CTAs.
import React, { useEffect, useMemo, useState } from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, radius, shadows, space } from '@aureak/theme'
import type { UpcomingSessionRich } from '@aureak/api-client'
import { decomposeSeconds, formatSessionCountdown } from './formatSessionCountdown'

export type NextSessionHeroProps = {
  session: UpcomingSessionRich
  onOpen : () => void
  onEdit?: () => void
}

const MOBILE_BREAKPOINT = 640
const TABLET_BREAKPOINT = 1024

export function NextSessionHero({ session, onOpen, onEdit }: NextSessionHeroProps) {
  const { width }  = useWindowDimensions()
  const isMobile   = width < MOBILE_BREAKPOINT
  const isCompact  = width < TABLET_BREAKPOINT

  const initialCountdown = useMemo(
    () => formatSessionCountdown(session.scheduledAt, session.durationMinutes),
    [session.scheduledAt, session.durationMinutes],
  )

  const [secondsLeft, setSecondsLeft] = useState<number>(initialCountdown.secondsTo)

  // Ticker 1s — cleanup obligatoire au unmount
  useEffect(() => {
    if (initialCountdown.secondsTo <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [initialCountdown.secondsTo])

  // Reset si la prop session change (ex: nouvelle fetch)
  useEffect(() => {
    setSecondsLeft(initialCountdown.secondsTo)
  }, [initialCountdown.secondsTo])

  const { days, hours, mins, secs } = decomposeSeconds(secondsLeft)
  const cadranBadge = secondsLeft <= 0
    ? 'Maintenant'
    : days > 0
      ? `J-${days} · ${pad(hours)}:${pad(mins)}:${pad(secs)}`
      : `H-${hours} · ${pad(mins)}:${pad(secs)}`

  const details: { label: string; value: string }[] = [
    { label: 'Implantation',     value: session.location       ?? '—' },
    { label: 'Coach titulaire',  value: session.coachName      ?? '—' },
    { label: 'Joueurs convoqués', value: session.attendeesCount > 0 ? `${session.attendeesCount} joueur${session.attendeesCount > 1 ? 's' : ''}` : '—' },
    { label: 'Méthode',          value: session.method         ?? '—' },
  ]

  return (
    <View style={[s.card, isMobile && s.cardMobile] as never}>
      <View style={s.left}>
        {/* Flag "Prochaine séance" */}
        <View style={s.flag}>
          <AureakText style={s.flagText as TextStyle}>Prochaine séance</AureakText>
        </View>

        {/* Title */}
        <AureakText style={s.title as TextStyle}>{session.title}</AureakText>

        {/* Countdown row */}
        <View style={s.countdownRow}>
          <View style={s.blob} />
          <AureakText style={s.countdownText as TextStyle}>
            {initialCountdown.relative} · {initialCountdown.absolute}
          </AureakText>
        </View>

        {/* Details grid (4 colonnes desktop, 2×2 mobile) */}
        <View style={[s.detailsGrid, isMobile && s.detailsGridMobile] as never}>
          {details.map((d, i) => (
            <View key={i} style={[s.detailItem, isMobile && s.detailItemMobile] as never}>
              <AureakText style={s.detailLabel as TextStyle}>{d.label}</AureakText>
              <AureakText style={s.detailValue as TextStyle}>{d.value}</AureakText>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctaRow}>
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => [s.ctaPrimary, pressed && s.pressed] as never}
          >
            <AureakText style={s.ctaPrimaryLabel as TextStyle}>
              Ouvrir la séance {'›'}
            </AureakText>
          </Pressable>
          {onEdit && (
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [s.ctaSecondary, pressed && s.pressed] as never}
            >
              <AureakText style={s.ctaSecondaryLabel as TextStyle}>
                Modifier la convocation
              </AureakText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Cadran décoratif (masqué en mobile) */}
      {!isCompact && (
        <View style={s.right}>
          <View style={s.cadran}>
            <AureakText style={s.cadranText as TextStyle}>{cadranBadge}</AureakText>
          </View>
        </View>
      )}
    </View>
  )
}

export default NextSessionHero

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

const s = StyleSheet.create({
  card: {
    flexDirection : 'row',
    backgroundColor: colors.light.surface,
    borderRadius  : radius.card,
    padding       : space.xl,
    borderWidth   : 1,
    borderColor   : colors.border.divider,
    marginHorizontal: space.lg,
    marginVertical: space.md,
    gap           : space.lg,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow supporté sur web
    boxShadow     : shadows.md,
  },
  cardMobile: {
    flexDirection  : 'column',
    padding        : space.lg,
    marginHorizontal: space.md,
  },
  left: {
    flex: 1,
    gap : space.md,
  },
  flag: {
    alignSelf        : 'flex-start',
    backgroundColor  : colors.border.gold, // rgba(193,172,92,0.25) — pill doré subtil
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 6,
  },
  flagText: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color        : colors.accent.gold,
    fontFamily   : fonts.body,
  },
  title: {
    fontSize     : 26,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: -0.5,
    lineHeight   : 32,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  blob: {
    width          : 8,
    height         : 8,
    borderRadius   : 4,
    backgroundColor: colors.status.present,
  },
  countdownText: {
    fontSize  : 14,
    color     : colors.text.subtle,
    fontFamily: fonts.body,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    marginTop    : space.xs,
  },
  detailsGridMobile: {
    gap: space.sm,
  },
  detailItem: {
    flex    : 1,
    minWidth: 120,
    gap     : 2,
  },
  detailItemMobile: {
    minWidth: '45%',
  },
  detailLabel: {
    fontSize     : 10,
    fontWeight   : '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color        : colors.text.muted,
    fontFamily   : fonts.body,
  },
  detailValue: {
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.sm,
    marginTop    : space.sm,
  },
  ctaPrimary: {
    // Story 93.7 — pill template (radius 999, label weight 600)
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  ctaPrimaryLabel: {
    color     : colors.text.onGold,
    fontWeight: '600',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  ctaSecondary: {
    // Story 93.7 — pill outline template
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.text.faint,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  ctaSecondaryLabel: {
    color     : colors.text.dark,
    fontWeight: '600',
    fontSize  : 13,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.7,
  },
  right: {
    width         : 180,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  cadran: {
    width          : '100%',
    height         : 120,
    backgroundColor: colors.border.goldBg, // rgba(193,172,92,0.10)
    borderRadius   : radius.card,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  cadranText: {
    fontSize     : 14,
    fontFamily   : fonts.mono,
    color        : colors.accent.gold,
    letterSpacing: 1,
    fontWeight   : '500',
  },
})
