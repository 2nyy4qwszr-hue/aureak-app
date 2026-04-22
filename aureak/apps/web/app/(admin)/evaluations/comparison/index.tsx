// Story 98.3 — Redirect 301 : /evaluations/comparison → /performance/comparaisons/evaluations
'use client'
import { Redirect } from 'expo-router'

export default function EvaluationsComparisonRedirect() {
  return <Redirect href="/performance/comparaisons/evaluations" />
}
