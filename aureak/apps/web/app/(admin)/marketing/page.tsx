// Story 91.1 — Hub Marketing : redirige vers Médiathèque (premier onglet)
import React from 'react'
import { Redirect } from 'expo-router'

export default function MarketingIndexPage() {
  return <Redirect href="/marketing/mediatheque" />
}
