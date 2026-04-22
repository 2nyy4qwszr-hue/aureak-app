// Story 97.4 — Redirect legacy /developpement/prospection/attribution → /prospection/attribution
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function AttributionRedirect() {
  return <Redirect href="/prospection/attribution" />
}
