// Story 98.1 — Redirect legacy /analytics/charge → /performance/charge
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function ChargeRedirect() {
  return <Redirect href="/performance/charge" />
}
