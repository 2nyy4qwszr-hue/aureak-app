'use client'
// /methodologie → redirect to Entraînements (first item in Méthodologie nav)
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function MethodologieRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/methodologie/seances' as never)
  }, [router])
  return null
}
