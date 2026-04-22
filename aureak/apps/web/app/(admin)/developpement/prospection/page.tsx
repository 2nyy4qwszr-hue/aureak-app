// Story 88.1 — Hub Prospection : redirige vers l'onglet Clubs par défaut
'use client'
import { Redirect } from 'expo-router'

export default function ProspectionHubIndex() {
  return <Redirect href="/developpement/prospection/clubs" />
}
