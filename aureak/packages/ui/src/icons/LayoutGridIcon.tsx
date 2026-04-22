import React from 'react'
import Svg, { Rect } from 'react-native-svg'
import type { NavIconProps } from './types'

export function LayoutGridIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
