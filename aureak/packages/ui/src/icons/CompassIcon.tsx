import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function CompassIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
