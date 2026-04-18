// Story 91.1 — Redirect /marketing → /marketing/mediatheque
import { Redirect } from 'expo-router'

export default function MarketingRedirect() {
  return <Redirect href="/marketing/mediatheque" />
}
