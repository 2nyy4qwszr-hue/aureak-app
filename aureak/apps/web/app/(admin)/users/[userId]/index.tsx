'use client'
// Story 87.5 — /users/[userId] → redirect silencieux vers /profiles/[userId]
// La fiche universelle (/profiles/[userId]) créée en 87.2 couvre 100% des
// fonctionnalités de l'ancienne fiche DOM inline. L'URL historique reste
// valide pour préserver les bookmarks.
import { Redirect, useLocalSearchParams } from 'expo-router'

export default function UsersUserIdRedirect() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  if (!userId) return <Redirect href="/users" />
  return <Redirect href={`/profiles/${userId}` as never} />
}
