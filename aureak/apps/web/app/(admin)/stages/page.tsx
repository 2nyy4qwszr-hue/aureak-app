// Story 97.5 — Redirect legacy /stages → /evenements/stages
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function StagesRedirect() {
  return <Redirect href="/evenements/stages" />
}
