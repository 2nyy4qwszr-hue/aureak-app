// Story 97.5 — Redirect legacy /seances/[sessionId] → /activites/seances/[sessionId]
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect, useLocalSearchParams } from 'expo-router'
export default function SessionRedirect() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  return <Redirect href={`/activites/seances/${sessionId}` as never} />
}
