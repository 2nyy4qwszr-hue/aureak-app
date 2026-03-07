// Story 6.3 + 6.4 — Double validation coach + clôture de séance
import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { closeSession } from '@aureak/api-client'
import { useSessionValidation } from '@aureak/business-logic'
import { Text } from '@aureak/ui'
import { colors } from '@aureak/theme'

const STATUS_LABEL: Record<string, string> = {
  pending        : 'En attente de validation',
  validated_lead : 'Coach lead validé — en attente du co-coach',
  validated_both : 'Double validation complète ✓',
}

export default function ValidationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const { validationStatus, validate, wsConnected } = useSessionValidation(sessionId)
  const [closing, setClosing]   = useState(false)
  const [closed, setClosed]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleValidate = async () => {
    try {
      await validate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de validation')
    }
  }

  const handleClose = async () => {
    setClosing(true)
    setError(null)
    try {
      const operationId = crypto.randomUUID()
      const { data, error: err } = await closeSession(sessionId, operationId)
      if (err) throw err
      if (data?.idempotent) {
        setClosed(true)
        Alert.alert('Information', 'Séance déjà clôturée')
      } else if (data?.closed) {
        setClosed(true)
        router.replace('/(coach)')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de clôture')
    } finally {
      setClosing(false)
    }
  }

  const canClose = validationStatus === 'validated_lead' || validationStatus === 'validated_both'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validation de séance</Text>

      {/* Indicateur WebSocket */}
      <View style={styles.wsIndicator}>
        <View style={[styles.wsDot, wsConnected ? styles.wsConnected : styles.wsDisconnected]} />
        <Text style={styles.wsLabel}>{wsConnected ? 'Temps réel actif' : 'Mode polling (9s)'}</Text>
      </View>

      {/* État de validation */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>{STATUS_LABEL[validationStatus] ?? validationStatus}</Text>
      </View>

      {/* Bouton valider */}
      {validationStatus !== 'validated_both' && (
        <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
          <Text style={styles.validateBtnText}>
            {validationStatus === 'pending' ? 'Valider en tant que lead' : 'Valider en tant que co-coach'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Bouton clôturer */}
      {canClose && !closed && (
        <TouchableOpacity
          style={[styles.closeBtn, closing && styles.closeBtnDisabled]}
          onPress={handleClose}
          disabled={closing}
        >
          {closing ? (
            <ActivityIndicator color={colors.background.primary} />
          ) : (
            <Text style={styles.closeBtnText}>Clôturer la séance</Text>
          )}
        </TouchableOpacity>
      )}

      {closed && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedText}>Séance clôturée ✓</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.background.primary, padding: 24 },
  title           : { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  wsIndicator     : { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  wsDot           : { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  wsConnected     : { backgroundColor: colors.status.present },
  wsDisconnected  : { backgroundColor: colors.accent.gold },
  wsLabel         : { color: colors.text.secondary, fontSize: 12 },
  statusCard      : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 20, marginBottom: 24 },
  statusLabel     : { color: colors.text.primary, fontSize: 16, textAlign: 'center' },
  validateBtn     : { backgroundColor: colors.accent.gold, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  validateBtnText : { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  closeBtn        : { backgroundColor: colors.accent.gold, borderRadius: 8, padding: 16, alignItems: 'center' },
  closeBtnDisabled: { opacity: 0.5 },
  closeBtnText    : { color: colors.background.primary, fontSize: 16, fontWeight: '700' },
  closedBanner    : { backgroundColor: colors.status.present, borderRadius: 8, padding: 16, alignItems: 'center' },
  closedText      : { color: colors.status.present, fontSize: 16, fontWeight: '700' },
  errorText       : { color: colors.status.absent, fontSize: 14, marginTop: 12, textAlign: 'center' },
})
