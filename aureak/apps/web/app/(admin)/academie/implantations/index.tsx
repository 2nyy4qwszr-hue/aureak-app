// Story 75.2 — Onglet Implantations → redirect vers /implantations (contenu existant)
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function AcademieImplantationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/implantations' as never)
  }, [router])

  return null
}
