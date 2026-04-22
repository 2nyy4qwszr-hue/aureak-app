// Story 92.3 — Ancienne route conservée en redirect vers le hub Partenariat
import React from 'react'
import { Redirect } from 'expo-router'

export default function PartnershipsLegacyRedirect() {
  return <Redirect href="/partenariat/clubs" />
}
