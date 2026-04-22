// Story 97.5 — Redirect legacy /groups/[groupId] → /academie/groupes/[groupId]
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect, useLocalSearchParams } from 'expo-router'
export default function GroupRedirect() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  return <Redirect href={`/academie/groupes/${groupId}` as never} />
}
