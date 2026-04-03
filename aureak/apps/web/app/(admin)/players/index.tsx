// Redirect players/ → children/ (canonical route)
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function PlayersIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/children' as never)
  }, [router])

  return null
}
