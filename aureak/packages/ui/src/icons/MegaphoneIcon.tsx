import React from 'react'
import Svg, { Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function MegaphoneIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m3 11 18-5v12L3 13v-2Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
