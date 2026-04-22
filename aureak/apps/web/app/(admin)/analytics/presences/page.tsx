// Story 98.1 — Redirect legacy /analytics/presences → /performance/presences
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function PresencesRedirect() {
  return <Redirect href="/performance/presences" />
}
