'use client'
// Story 87.2 — Fiche détail marketeur (onglets Profil / Accès / Activité)
// Story 87.3 — Refactorisé pour utiliser PersonTabLayout
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { getMarketerProfile } from '@aureak/api-client'
import PersonTabLayout, {
  splitName,
  ProfileInfoCard,
  ActivityPlaceholder,
  type PersonTab,
} from '../../../_components/PersonTabLayout'
import SectionPermissionsPanel from '../../../_components/SectionPermissionsPanel'

export default function MarketerDetailPage() {
  const { marketerId } = useLocalSearchParams<{ marketerId: string }>()

  const [displayName, setDisplayName] = useState<string>('')
  const [nom,         setNom]         = useState<string>('—')
  const [prenom,      setPrenom]      = useState<string>('—')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getMarketerProfile(marketerId)
        if (cancelled) return
        if (data) {
          setDisplayName(data.displayName ?? marketerId)
          const { prenom: p, nom: n } = splitName(data.displayName)
          setPrenom(p)
          setNom(n)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MarketerDetailPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [marketerId])

  const tabs: PersonTab[] = [
    {
      key: 'profil',
      label: 'Profil',
      render: () => (
        <ProfileInfoCard
          fields={[
            { label: 'Nom',    value: nom },
            { label: 'Prénom', value: prenom },
            { label: 'Rôle',   value: 'Marketeur' },
          ]}
        />
      ),
    },
    {
      key: 'acces',
      label: 'Accès',
      render: () => (
        <SectionPermissionsPanel userId={marketerId} role="marketeur" />
      ),
    },
    {
      key: 'activite',
      label: 'Activité',
      render: () => (
        <ActivityPlaceholder
          message="Les données marketing seront disponibles avec l'epic 91."
          linkLabel="Voir activité marketing →"
          linkRoute="/marketing"
        />
      ),
    },
  ]

  return (
    <PersonTabLayout
      displayName={displayName}
      loading={loading}
      tabs={tabs}
    />
  )
}
