// Story 97.5 — Redirect legacy /seances → /activites/seances
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function SeancesRedirect() {
  return <Redirect href="/activites/seances" />
}
