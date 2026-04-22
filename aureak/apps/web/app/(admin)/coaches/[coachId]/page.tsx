// Story 97.5 — Redirect legacy /coaches/[coachId] → /academie/coachs/[coachId]
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect, useLocalSearchParams } from 'expo-router'
export default function CoachRedirect() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>()
  return <Redirect href={`/academie/coachs/${coachId}` as never} />
}
