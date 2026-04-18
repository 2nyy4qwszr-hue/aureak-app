// Story 88.1 — Redirect racine prospection → onglet Clubs
'use client'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function ProspectionRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/developpement/prospection/clubs' as never)
  }, [router])

  return null
}
