// Story 98.1 — Redirect legacy /analytics/clubs → /performance/clubs
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function ClubsRedirect() {
  return <Redirect href="/performance/clubs" />
}
