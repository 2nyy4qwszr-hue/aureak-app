'use client'
// Story 102.3 — <FormWizard /> — multi-step mobile / accordion desktop
//
// Mobile (<640) : 1 step = 1 écran. Dots progress bar en haut + label step active,
//                 boutons "← Précédent" / "Suivant →" (dernière step = "Enregistrer").
// Desktop (≥640) : accordion — toutes les steps visibles, chacune expandable, bouton
//                  "Enregistrer" en bas (disabled si au moins une step invalide).
//
// Controlled ou uncontrolled via `currentStep` + `onStepChange`.
// Persistence des data entre steps = responsabilité du consommateur (React Hook Form
// avec `shouldUnregister: false`).

import React from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const MOBILE_MAX = 640

export type WizardStep = {
  key     : string
  label   : string
  content : React.ReactNode
  /** Si false, "Suivant" (mobile) et "Enregistrer" (desktop) sont désactivés. Default true. */
  isValid?: boolean
}

export type FormWizardProps = {
  steps         : WizardStep[]
  onFinish      : () => void
  onCancel?     : () => void
  /** Controlled : index de la step active. Si absent, le composant gère son propre state. */
  currentStep?  : number
  onStepChange? : (step: number) => void
  /** Label bouton final (mobile dernière step + desktop). Default "Enregistrer". */
  finishLabel?  : string
  submitting?   : boolean
}

export function FormWizard({
  steps,
  onFinish,
  onCancel,
  currentStep: controlledStep,
  onStepChange,
  finishLabel = 'Enregistrer',
  submitting = false,
}: FormWizardProps) {
  const { width } = useWindowDimensions()
  const isMobile  = width < MOBILE_MAX

  const [uncontrolledStep, setUncontrolledStep] = React.useState(0)
  const current = controlledStep ?? uncontrolledStep

  const safeCurrent = Math.max(0, Math.min(current, steps.length - 1))

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, steps.length - 1))
    if (controlledStep === undefined) setUncontrolledStep(clamped)
    onStepChange?.(clamped)
  }

  if (isMobile) {
    return (
      <WizardMobile
        steps={steps}
        current={safeCurrent}
        onStepChange={goTo}
        onFinish={onFinish}
        onCancel={onCancel}
        finishLabel={finishLabel}
        submitting={submitting}
      />
    )
  }

  return (
    <WizardAccordion
      steps={steps}
      current={safeCurrent}
      onStepChange={goTo}
      onFinish={onFinish}
      onCancel={onCancel}
      finishLabel={finishLabel}
      submitting={submitting}
    />
  )
}

export default FormWizard

// ─────────────────────────────────────────────────────────────────────────────
// Variant MOBILE — 1 écran = 1 step
// ─────────────────────────────────────────────────────────────────────────────

type VariantProps = {
  steps       : WizardStep[]
  current     : number
  onStepChange: (step: number) => void
  onFinish    : () => void
  onCancel?   : () => void
  finishLabel : string
  submitting  : boolean
}

function WizardMobile({
  steps,
  current,
  onStepChange,
  onFinish,
  onCancel,
  finishLabel,
  submitting,
}: VariantProps) {
  const step      = steps[current]
  const isFirst   = current === 0
  const isLast    = current === steps.length - 1
  const canAdvance = step.isValid !== false

  const progressRef = React.useRef<View | null>(null)
  const scrollRef   = React.useRef<ScrollView | null>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [current])

  return (
    <View style={s.mobileRoot}>
      <View
        ref={progressRef as never}
        style={s.progressRow}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: current + 1, min: 1, max: steps.length }}
      >
        {steps.map((st, i) => (
          <View
            key={st.key}
            style={[
              s.dot,
              i === current && s.dotActive,
              i < current && s.dotPast,
            ]}
            accessibilityLabel={`Étape ${i + 1} : ${st.label}`}
            {...(i === current ? { 'aria-current': 'step' as never } : {})}
          />
        ))}
      </View>

      <AureakText variant="label" style={s.stepCounter as TextStyle}>
        {`Étape ${current + 1}/${steps.length}`}
      </AureakText>
      <AureakText variant="h3" style={s.stepTitle as TextStyle}>
        {step.label}
      </AureakText>

      <ScrollView
        ref={scrollRef}
        style={s.mobileBody}
        contentContainerStyle={s.mobileBodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {step.content}
      </ScrollView>

      <View style={s.mobileFooter} accessibilityRole="toolbar">
        {isFirst ? (
          onCancel ? (
            <View style={s.footerButton}>
              <AureakButton label="Annuler" onPress={onCancel} variant="ghost" fullWidth />
            </View>
          ) : (
            <View style={s.footerButton} />
          )
        ) : (
          <View style={s.footerButton}>
            <AureakButton
              label="← Précédent"
              onPress={() => onStepChange(current - 1)}
              variant="ghost"
              fullWidth
            />
          </View>
        )}
        <View style={s.footerButton}>
          {isLast ? (
            <AureakButton
              label={finishLabel}
              onPress={onFinish}
              variant="primary"
              disabled={!canAdvance}
              loading={submitting}
              fullWidth
            />
          ) : (
            <AureakButton
              label="Suivant →"
              onPress={() => onStepChange(current + 1)}
              variant="primary"
              disabled={!canAdvance}
              fullWidth
            />
          )}
        </View>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant DESKTOP — accordion
// ─────────────────────────────────────────────────────────────────────────────

function WizardAccordion({
  steps,
  current,
  onStepChange,
  onFinish,
  onCancel,
  finishLabel,
  submitting,
}: VariantProps) {
  // Desktop : état expand indépendant par step (tous ouverts par défaut = vue d'ensemble)
  const [expanded, setExpanded] = React.useState<boolean[]>(
    () => steps.map(() => true),
  )

  const toggle = (i: number) => {
    setExpanded(prev => prev.map((v, idx) => (idx === i ? !v : v)))
    onStepChange(i)
  }

  const allValid = steps.every(st => st.isValid !== false)

  return (
    <View style={s.desktopRoot}>
      <View style={s.accordion}>
        {steps.map((step, i) => {
          const isOpen = expanded[i]
          const isInvalid = step.isValid === false
          return (
            <View key={step.key} style={s.accordionItem}>
              <Pressable
                onPress={() => toggle(i)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`Étape ${i + 1} : ${step.label}`}
                style={({ pressed }) => [s.accordionHeader, pressed && s.accordionHeaderPressed]}
              >
                <View style={s.accordionLabelWrap}>
                  <View style={[s.stepNumber, i === current && s.stepNumberActive]}>
                    <AureakText
                      variant="label"
                      color={i === current ? colors.text.dark : colors.text.muted}
                    >
                      {String(i + 1)}
                    </AureakText>
                  </View>
                  <AureakText variant="h3" style={s.accordionLabel as TextStyle}>
                    {step.label}
                  </AureakText>
                  {isInvalid && (
                    <AureakText variant="caption" color={colors.status.absent}>
                      {' · incomplet'}
                    </AureakText>
                  )}
                </View>
                <AureakText variant="label" color={colors.text.muted}>
                  {isOpen ? '▾' : '▸'}
                </AureakText>
              </Pressable>
              {isOpen && <View style={s.accordionBody}>{step.content}</View>}
            </View>
          )
        })}
      </View>

      <View style={s.desktopFooter} accessibilityRole="toolbar">
        {onCancel && (
          <AureakButton label="Annuler" onPress={onCancel} variant="ghost" />
        )}
        <AureakButton
          label={finishLabel}
          onPress={onFinish}
          variant="primary"
          disabled={!allValid}
          loading={submitting}
        />
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const DOT_SIZE = 10

const s = StyleSheet.create({
  // Mobile
  mobileRoot: {
    flex           : 1,
    backgroundColor: colors.light.surface,
  } as ViewStyle,
  progressRow: {
    flexDirection   : 'row',
    gap             : space.xs,
    justifyContent  : 'center',
    paddingHorizontal: space.md,
    paddingTop       : space.md,
  } as ViewStyle,
  dot: {
    width          : DOT_SIZE,
    height         : DOT_SIZE,
    borderRadius   : DOT_SIZE / 2,
    backgroundColor: colors.border.light,
  } as ViewStyle,
  dotActive: {
    backgroundColor: colors.accent.gold,
    width          : DOT_SIZE * 2.2,
  } as ViewStyle,
  dotPast: {
    backgroundColor: colors.accent.goldLight,
  } as ViewStyle,
  stepCounter: {
    textAlign        : 'center',
    paddingTop       : space.sm,
    color            : colors.text.muted,
  } as TextStyle,
  stepTitle: {
    textAlign        : 'center',
    paddingHorizontal: space.md,
    paddingBottom    : space.md,
    color            : colors.text.dark,
  } as TextStyle,
  mobileBody: {
    flex: 1,
  },
  mobileBodyContent: {
    paddingHorizontal: space.md,
    paddingBottom    : space.md,
    gap              : space.md,
  } as ViewStyle,
  mobileFooter: {
    flexDirection    : 'row',
    gap              : space.sm,
    paddingHorizontal: space.md,
    paddingTop       : space.sm,
    paddingBottom    : space.md,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    backgroundColor  : colors.light.surface,
  } as ViewStyle,
  footerButton: {
    flex: 1,
  },

  // Desktop accordion
  desktopRoot: {
    gap : space.lg,
  },
  accordion: {
    gap : space.sm,
  },
  accordionItem: {
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.card,
    backgroundColor: colors.light.surface,
    overflow       : 'hidden',
  } as ViewStyle,
  accordionHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.md,
    backgroundColor  : colors.light.muted,
  } as ViewStyle,
  accordionHeaderPressed: {
    backgroundColor: colors.light.hover,
  } as ViewStyle,
  accordionLabelWrap: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flex         : 1,
  } as ViewStyle,
  accordionLabel: {
    color: colors.text.dark,
  } as TextStyle,
  accordionBody: {
    padding      : space.md,
    gap          : space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.divider,
  } as ViewStyle,
  stepNumber: {
    width          : 28,
    height         : 28,
    borderRadius   : 14,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: colors.light.primary,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  } as ViewStyle,
  stepNumberActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  } as ViewStyle,
  desktopFooter: {
    flexDirection  : 'row',
    justifyContent : 'flex-end',
    gap            : space.sm,
    paddingTop     : space.md,
    borderTopWidth : 1,
    borderTopColor : colors.border.divider,
  } as ViewStyle,
})
