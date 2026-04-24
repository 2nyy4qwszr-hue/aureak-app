'use client'
// Story 75.2 — Stub initial "Bientôt disponible"
// Story 97.7 — Refonte : AdminPageHeader + AcademieNavBar + contenu informatif.
//
// DIAGNOSTIC :
//   - Avant : stub "Bientôt disponible" (pas de header cohérent, nav Académie absente).
//   - Cause : le rôle `scout` n'existe PAS dans l'enum `user_role`
//     (admin|coach|parent|child|club|commercial|manager|marketeur — cf. MEMORY).
//     Le concept "scout" dans Aureak = évaluateur d'un prospect gardien
//     (table `prospect_scout_evaluations`, Story 89.2) — pas un profil utilisateur.
//
// DÉCISION : transformer en page d'orientation propre qui :
//   - respecte le pattern Académie (AdminPageHeader + AcademieNavBar)
//   - explique clairement la nature non-rôle du scout
//   - redirige vers /prospection/gardiens où les observations scout sont saisies
//   - ne crée PAS de fonctionnalité métier nouvelle (AC #11 non-goals)
import { useContext } from 'react'
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { AcademieCountsContext } from '../_layout'

export default function AcademieScoutsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width <= 640

  return (
    <View style={s.page}>
      <AdminPageHeader title="Scouts" />
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView contentContainerStyle={[s.content, isMobile && { padding: 16 }]}>
        <View style={s.card}>
          <AureakText style={s.emoji}>🔍</AureakText>
          <AureakText style={s.heading as never}>Pas de profil scout dédié</AureakText>
          <AureakText style={s.body as never}>
            Dans Aureak, « scout » n'est pas un rôle utilisateur autonome.
            Les observations scout sont saisies par les admins, commerciaux et
            coaches directement depuis la fiche d'un prospect gardien.
          </AureakText>
          <AureakText style={s.body as never}>
            Chaque observation (étoiles 1-5 + commentaire + contexte) est
            enregistrée dans la table dédiée et visible sur la fiche du prospect
            gardien évalué.
          </AureakText>

          <Pressable
            onPress={() => router.push('/prospection/gardiens' as never)}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed] as never}
          >
            <AureakText style={s.ctaLabel as never}>
              Voir les prospects gardiens →
            </AureakText>
          </Pressable>
        </View>

        <View style={s.hint}>
          <AureakText style={s.hintText as never}>
            💡 Pour créer un profil utilisateur dédié au scouting (avec son propre
            rôle, dashboard et permissions), une story d'évolution produit doit
            être ouverte au préalable (ajout d'une valeur à l'enum `user_role`).
          </AureakText>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    gap    : space.lg,
    alignItems: 'center' as never,
  },
  card: {
    width          : '100%' as never,
    maxWidth       : 680,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.xl,
    gap            : space.md,
    alignItems     : 'center' as never,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  emoji: {
    fontSize    : 48,
    marginBottom: space.xs,
  },
  heading: {
    fontSize  : 20,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
    textAlign : 'center',
  },
  body: {
    fontSize  : 14,
    color     : colors.text.muted,
    lineHeight: 22,
    textAlign : 'center',
    maxWidth  : 520,
  },
  cta: {
    marginTop        : space.sm,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
  },
  ctaPressed: { opacity: 0.85 },
  ctaLabel: {
    color     : colors.text.onGold,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  hint: {
    width          : '100%' as never,
    maxWidth       : 680,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : space.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
  },
  hintText: {
    fontSize  : 12,
    color     : colors.text.subtle,
    lineHeight: 18,
    fontStyle : 'italic',
  },
})
