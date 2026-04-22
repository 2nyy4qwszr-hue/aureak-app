// Story 97.5 — Redirect legacy /coaches → /academie/coachs
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function CoachesRedirect() {
  return <Redirect href="/academie/coachs" />
}
