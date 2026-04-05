import React from 'react'
import Svg, { Rect, Line, Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function CalendarIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="2" x2="16" y2="6"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  )
}
