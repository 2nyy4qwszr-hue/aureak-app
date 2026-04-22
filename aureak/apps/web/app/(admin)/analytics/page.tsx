// Story 98.1 — Redirect legacy /analytics → /performance
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function AnalyticsRedirect() {
  return <Redirect href="/performance" />
}
