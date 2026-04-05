import React from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import type { NavIconProps } from './types'

export function TagIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="7" r="1" fill={color} />
    </Svg>
  )
}
