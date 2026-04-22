import React from 'react'
import Svg, { Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function TrendingUpIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 7 13.5 15.5 8.5 10.5 2 17"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7h6v6"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
