// Story 97.5 — Redirect legacy /players → /academie/joueurs
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function PlayersRedirect() {
  return <Redirect href="/academie/joueurs" />
}
