// Story 97.4 — Redirect legacy /developpement/prospection/entraineurs → /prospection/entraineurs
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function EntraineursRedirect() {
  return <Redirect href="/prospection/entraineurs" />
}
