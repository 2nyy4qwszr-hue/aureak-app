import React from 'react'
import Svg, { Rect, Line, Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function CalendarDaysIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
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
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
