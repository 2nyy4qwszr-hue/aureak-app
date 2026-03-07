import React from 'react'
import { ScrollView, TouchableOpacity, View, StyleSheet, Text } from 'react-native'
import { colors, space, typography } from '@aureak/theme'

export type BreadcrumbItem = {
  label: string
  onPress?: () => void
}

export type HierarchyBreadcrumbProps = {
  items: BreadcrumbItem[]
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.xs,
    flexWrap: 'nowrap',
  },
  item: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.bodySm.size,
    color: colors.text.secondary,
  },
  itemActive: {
    fontFamily: 'Geist-SemiBold',
    fontSize: typography.bodySm.size,
    color: colors.text.primary,
    fontWeight: '600',
  },
  separator: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.bodySm.size,
    color: colors.text.secondary,
    marginHorizontal: space.xs,
  },
})

export function HierarchyBreadcrumb({ items }: HierarchyBreadcrumbProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scrollContainer}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isFirst = index === 0

        return (
          <View key={`${item.label}-${index}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isFirst && (
              <Text style={styles.separator} aria-hidden>
                ›
              </Text>
            )}
            {isLast || !item.onPress ? (
              <Text
                style={isLast ? styles.itemActive : styles.item}
                numberOfLines={1}
                accessibilityRole={isLast ? 'header' : 'text'}
              >
                {item.label}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={item.onPress}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="link"
              >
                <Text style={styles.item} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}
