// Story 97.5 — Redirect legacy /stages/[stageId] → /evenements/stages/[stageId]
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect, useLocalSearchParams } from 'expo-router'
export default function StageRedirect() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>()
  return <Redirect href={`/evenements/stages/${stageId}` as never} />
}
