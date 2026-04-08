// Story 75.2 — /academie → redirect vers /academie/joueurs
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function AcademieIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/academie/joueurs' as never)
  }, [router])

  return null
}
