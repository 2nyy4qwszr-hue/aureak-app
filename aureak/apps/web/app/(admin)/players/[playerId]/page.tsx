// Story 97.5 — Redirect legacy /players/[playerId] → /academie/joueurs/[playerId]
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect, useLocalSearchParams } from 'expo-router'
export default function PlayerRedirect() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>()
  return <Redirect href={`/academie/joueurs/${playerId}` as never} />
}
