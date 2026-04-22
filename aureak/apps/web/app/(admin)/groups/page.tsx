// Story 97.5 — Redirect legacy /groups → /academie/groupes
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function GroupsRedirect() {
  return <Redirect href="/academie/groupes" />
}
