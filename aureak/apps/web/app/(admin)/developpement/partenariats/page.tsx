// Story 92.1 — Redirect racine partenariats → onglet Sponsors
'use client'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function PartenariatRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/developpement/partenariats/sponsors' as never)
  }, [router])

  return null
}
