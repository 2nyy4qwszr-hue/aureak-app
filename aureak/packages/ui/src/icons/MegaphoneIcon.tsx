import React from 'react'
import Svg, { Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function MegaphoneIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a6 6 0 0 0-6-6H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1l2 4h2l-2-4h3a6 6 0 0 0 6-6Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M20 8h2M18 2l1.5 1.5M18 14l1.5-1.5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}
