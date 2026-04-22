// Story 97.4 — Redirect legacy /developpement/prospection → /prospection
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function ProspectionRedirect() {
  return <Redirect href="/prospection" />
}
