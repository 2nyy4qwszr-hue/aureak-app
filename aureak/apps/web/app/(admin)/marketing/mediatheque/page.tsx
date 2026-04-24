'use client'
// Story 91.2 — Médiathèque : vue role-aware (coach = upload + liste perso ; admin/marketeur = galerie validation)
// Story 97.12 — AdminPageHeader v2 ("Médiathèque") + MarketingNavBar
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native'
import { useAuthStore } from '@aureak/business-logic'
import { listMediaItems } from '@aureak/api-client'
import type { MediaItem } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { useCurrentRole } from '../../../../hooks/admin/useCurrentRole'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { MarketingNavBar } from '../../../../components/admin/marketing/MarketingNavBar'
import { UploadForm } from './_components/UploadForm'
import { MediaGrid } from './_components/MediaGrid'
import { MediaCard } from './_components/MediaCard'

export default function MediathequePage() {
  const { user } = useAuthStore()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const { activeRole } = useCurrentRole()
  const isAdminOrMarketeur = activeRole === 'admin' || activeRole === 'marketeur'
  const isCoach = activeRole === 'coach'

  const [myItems, setMyItems] = useState<MediaItem[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!isCoach || !user?.id) return
    let cancelled = false
    listMediaItems({ uploadedBy: user.id })
      .then(data => { if (!cancelled) setMyItems(data) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[mediatheque] myItems error:', err)
      })
    return () => { cancelled = true }
  }, [isCoach, user?.id, reloadToken])

  if (!activeRole) {
    return (
      <View style={s.stateCenter}>
        <AureakText style={s.muted as never}>Chargement…</AureakText>
      </View>
    )
  }

  return (
    <View style={s.page}>
      <AdminPageHeader title="Médiathèque" />
      <MarketingNavBar />

      {isAdminOrMarketeur ? (
        <ScrollView contentContainerStyle={[s.container, isMobile && { padding: space.md }]}>
          <MediaGrid />
        </ScrollView>
      ) : isCoach ? (
        <ScrollView contentContainerStyle={[s.container, isMobile && { padding: space.md }]}>
          <UploadForm onSuccess={() => setReloadToken(t => t + 1)} />

          <View style={s.section}>
            <AureakText variant="h3" style={s.sectionTitle as never}>Mes envois</AureakText>
            {myItems.length === 0 ? (
              <AureakText style={s.muted as never}>Aucun média envoyé pour l'instant.</AureakText>
            ) : (
              <View style={s.list}>
                {myItems.map(item => (
                  <MediaCard key={item.id} item={item} showActions={false} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={s.stateCenter}>
          <AureakText style={s.muted as never}>
            Accès réservé aux coachs, admins et marketeurs.
          </AureakText>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  page: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  container: {
    padding        : space.xl,
    gap            : space.lg,
    backgroundColor: colors.light.primary,
    flexGrow       : 1,
  },
  section    : { gap: space.md },
  sectionTitle: { color: colors.text.dark, fontWeight: '700' },
  list       : { gap: space.md },
  muted      : { color: colors.text.muted, fontSize: 13 },
  stateCenter: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
})
