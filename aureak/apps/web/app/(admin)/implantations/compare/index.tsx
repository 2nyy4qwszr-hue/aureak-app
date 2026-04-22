// Story 98.3 — Redirect 301 : /implantations/compare → /performance/comparaisons/implantations
'use client'
import { Redirect } from 'expo-router'

export default function ImplantationsCompareRedirect() {
  return <Redirect href="/performance/comparaisons/implantations" />
}
