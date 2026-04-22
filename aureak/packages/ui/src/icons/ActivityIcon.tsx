import React from 'react'
import Svg, { Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function ActivityIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12h3l3-9 4 18 3-9h5"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
