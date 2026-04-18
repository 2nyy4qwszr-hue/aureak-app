// Story 88.5 — Page Ressources commerciales : 4 cards prédéfinies + upload admin
'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { listCommercialResources, getResourceDownloadUrl } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { CommercialResource } from '@aureak/types'
import { ResourceCard } from './_components/ResourceCard'
import { UploadModal } from './_components/UploadModal'
import { Linking } from 'react-native'

export default function RessourcesPage() {
  const { role }                             = useAuthStore()
  const [resources, setResources]            = useState<CommercialResource[]>([])
  const [loading, setLoading]                = useState(true)
  const [downloadingId, setDownloadingId]    = useState<string | null>(null)
  const [editResource, setEditResource]      = useState<CommercialResource | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const isAdmin = role === 'admin'

  const loadResources = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCommercialResources()
      setResources(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RessourcesPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const handleDownload = useCallback(async (resource: CommercialResource) => {
    setDownloadingId(resource.id)
    try {
      const url = await getResourceDownloadUrl(resource)
      if (url) {
        if (resource.resourceType === 'webpage') {
          // Ouvrir dans un nouvel onglet
          if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer')
          } else {
            await Linking.openURL(url)
          }
        } else {
          // Télécharger le fichier
          if (typeof window !== 'undefined') {
            const a = document.createElement('a')
            a.href = url
            a.download = ''
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          } else {
            await Linking.openURL(url)
          }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RessourcesPage] download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const handleEdit = useCallback((resource: CommercialResource) => {
    setEditResource(resource)
    setShowUploadModal(true)
  }, [])

  const handleUpdated = useCallback((updated: CommercialResource) => {
    setResources(prev => prev.map(r => r.id === updated.id ? updated : r))
  }, [])

  if (loading && resources.length === 0) {
    return (
      <View style={s.container}>
        <AureakText variant="body" style={s.loadingText}>
          Chargement des ressources...
        </AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <AureakText variant="label" style={s.pageTitle}>
          Documents commerciaux
        </AureakText>
        <AureakText variant="body" style={s.pageSubtitle}>
          Accédez aux dernières versions des documents de présentation.
        </AureakText>
      </View>

      {/* Grid 2x2 */}
      <View style={s.grid}>
        {resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onDownload={handleDownload}
            onEdit={isAdmin ? handleEdit : undefined}
            downloading={downloadingId === resource.id}
          />
        ))}
      </View>

      {resources.length === 0 && !loading ? (
        <View style={s.emptyState}>
          <AureakText variant="body" style={s.emptyText}>
            Aucune ressource configurée.
          </AureakText>
        </View>
      ) : null}

      {/* Modal upload admin */}
      <UploadModal
        visible={showUploadModal}
        resource={editResource}
        onClose={() => {
          setShowUploadModal(false)
          setEditResource(null)
        }}
        onUpdated={handleUpdated}
      />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.lg,
  },
  header: {
    marginBottom: space.lg,
  },
  pageTitle: {
    fontSize  : 20,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  pageSubtitle: {
    fontSize : 14,
    color    : colors.text.muted,
    marginTop: space.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  loadingText: {
    padding  : space.xl,
    textAlign: 'center',
    color    : colors.text.muted,
  },
  emptyState: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
  },
})
