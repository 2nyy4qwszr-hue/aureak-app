'use client'
// Story 87.1 — Fiche détail commercial (onglets Profil / Accès / Activité)
// Story 87.3 — Refactorisé pour utiliser PersonTabLayout
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { getCommercialProfile } from '@aureak/api-client'
import PersonTabLayout, {
  splitName,
  ProfileInfoCard,
  ActivityPlaceholder,
  type PersonTab,
} from '../../../_components/PersonTabLayout'
import SectionPermissionsPanel from '../../../_components/SectionPermissionsPanel'

export default function CommercialDetailPage() {
  const { commercialId } = useLocalSearchParams<{ commercialId: string }>()

  const [displayName, setDisplayName] = useState<string>('')
  const [nom,         setNom]         = useState<string>('—')
  const [prenom,      setPrenom]      = useState<string>('—')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getCommercialProfile(commercialId)
        if (cancelled) return
        if (data) {
          setDisplayName(data.displayName ?? commercialId)
          const { prenom: p, nom: n } = splitName(data.displayName)
          setPrenom(p)
          setNom(n)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CommercialDetailPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [commercialId])

  const tabs: PersonTab[] = [
    {
      key: 'profil',
      label: 'Profil',
      render: () => (
        <ProfileInfoCard
          fields={[
            { label: 'Nom',    value: nom },
            { label: 'Prénom', value: prenom },
            { label: 'Rôle',   value: 'Commercial' },
          ]}
        />
      ),
    },
    {
      key: 'acces',
      label: 'Accès',
      render: () => (
        <SectionPermissionsPanel userId={commercialId} role="commercial" />
      ),
    },
    {
      key: 'activite',
      label: 'Activité',
      render: () => (
        <ActivityPlaceholder
          message="Les données de prospection seront disponibles avec l'epic 88."
          linkLabel="Voir activité prospection →"
          linkRoute="/prospection"
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
