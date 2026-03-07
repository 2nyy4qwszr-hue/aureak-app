import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput } from 'react-native'
import {
  listTaxonomies, listNodesByTaxonomy, createTaxonomy, createTaxonomyNode, deleteTaxonomy,
} from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Taxonomy, TaxonomyNode } from '@aureak/types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    gap: space.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeItem: {
    marginLeft: space.md,
    paddingVertical: space.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    borderRadius: 6,
    padding: space.sm,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
})

export default function TaxonomiesPage() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const load = async () => {
    const { data } = await listTaxonomies()
    setTaxonomies(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return
    await createTaxonomy({ tenantId: '', name: newName.trim(), slug: newSlug.trim() })
    setNewName('')
    setNewSlug('')
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteTaxonomy(id)
    load()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Taxonomies</AureakText>
      </View>

      <View style={styles.card}>
        <AureakText variant="label">Nouvelle taxonomie</AureakText>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Nom (ex: Méthode GK)"
            placeholderTextColor={colors.text.secondary}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Slug (ex: gk-methode)"
            placeholderTextColor={colors.text.secondary}
            value={newSlug}
            onChangeText={setNewSlug}
            autoCapitalize="none"
          />
        </View>
        <AureakButton label="Créer" onPress={handleCreate} variant="primary" />
      </View>

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      )}

      {taxonomies.map((taxonomy) => (
        <TaxonomyCard key={taxonomy.id} taxonomy={taxonomy} onDelete={handleDelete} onRefresh={load} />
      ))}

      {!loading && taxonomies.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucune taxonomie configurée.
        </AureakText>
      )}
    </ScrollView>
  )
}

function TaxonomyCard({
  taxonomy,
  onDelete,
}: {
  taxonomy: Taxonomy
  onDelete: (id: string) => void
  onRefresh: () => void
}) {
  const [nodes, setNodes] = useState<TaxonomyNode[]>([])
  const [expanded, setExpanded] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeSlug, setNewNodeSlug] = useState('')

  const loadNodes = async () => {
    const { data } = await listNodesByTaxonomy(taxonomy.id)
    setNodes(data)
  }

  useEffect(() => {
    if (expanded) loadNodes()
  }, [expanded])

  const handleAddNode = async () => {
    if (!newNodeName.trim() || !newNodeSlug.trim()) return
    await createTaxonomyNode({
      taxonomyId: taxonomy.id,
      tenantId  : taxonomy.tenantId,
      name      : newNodeName.trim(),
      slug      : newNodeSlug.trim(),
    })
    setNewNodeName('')
    setNewNodeSlug('')
    loadNodes()
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <AureakText variant="label">{taxonomy.name}</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>
            {taxonomy.slug}
          </AureakText>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <AureakButton
            label={expanded ? 'Fermer' : 'Gérer nœuds'}
            onPress={() => setExpanded(!expanded)}
            variant="secondary"
          />
          <AureakButton
            label="Supprimer"
            onPress={() => onDelete(taxonomy.id)}
            variant="secondary"
          />
        </View>
      </View>

      {expanded && (
        <View style={{ gap: space.sm }}>
          {nodes.map((node) => (
            <View key={node.id} style={styles.nodeItem}>
              <View>
                <AureakText variant="body">{node.name}</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                  {node.slug}{node.parentId ? ' (enfant)' : ' (racine)'}
                </AureakText>
              </View>
            </View>
          ))}

          <View style={{ gap: space.xs }}>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>
              Ajouter un nœud racine
            </AureakText>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor={colors.text.secondary}
                value={newNodeName}
                onChangeText={setNewNodeName}
              />
              <TextInput
                style={styles.input}
                placeholder="Slug"
                placeholderTextColor={colors.text.secondary}
                value={newNodeSlug}
                onChangeText={setNewNodeSlug}
                autoCapitalize="none"
              />
            </View>
            <AureakButton label="Ajouter nœud" onPress={handleAddNode} variant="secondary" />
          </View>
        </View>
      )}
    </View>
  )
}
