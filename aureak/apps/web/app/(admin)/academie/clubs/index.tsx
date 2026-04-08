// Story 75.2 — Onglet Clubs → redirect vers /clubs (contenu existant)
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function AcademieClubsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/clubs' as never)
  }, [router])

  return null
}
