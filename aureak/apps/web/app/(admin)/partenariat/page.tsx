// Story 92.1 — Hub Partenariat : redirige vers Sponsors (premier onglet)
import React from 'react'
import { Redirect } from 'expo-router'

export default function PartenariatIndexPage() {
  return <Redirect href="/partenariat/sponsors" />
}
