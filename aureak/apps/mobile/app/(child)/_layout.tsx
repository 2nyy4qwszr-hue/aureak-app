import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'

export default function ChildLayout() {
  const router = useRouter()
  const { role, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && role !== 'child') {
      router.replace('/(auth)/login' as never)
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'child') return null

  return <Stack />
}
