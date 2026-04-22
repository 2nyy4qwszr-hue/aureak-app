// Story 97.4 — Redirect legacy /developpement/prospection/clubs → /prospection/clubs
// TODO 2026-05-22 : supprimer après 1 mois
import { Redirect } from 'expo-router'
export default function ClubsRedirect() {
  return <Redirect href="/prospection/clubs" />
}
