import React from 'react'
import Svg, { Line, Rect } from 'react-native-svg'
import type { NavIconProps } from './types'

export function BarChartIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  )
}
