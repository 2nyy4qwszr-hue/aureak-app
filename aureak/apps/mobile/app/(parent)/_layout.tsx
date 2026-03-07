import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'

export default function ParentLayout() {
  const router = useRouter()
  const { role, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && role !== 'parent') {
      router.replace('/(auth)/login' as never)
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'parent') return null

  return <Stack />
}
