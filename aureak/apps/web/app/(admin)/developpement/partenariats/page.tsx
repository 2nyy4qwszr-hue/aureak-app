// Story 92.1 — Redirect /developpement/partenariats → /developpement/partenariats/sponsors
import { Redirect } from 'expo-router'

export default function PartenariatRedirect() {
  return <Redirect href="/developpement/partenariats/sponsors" />
}
