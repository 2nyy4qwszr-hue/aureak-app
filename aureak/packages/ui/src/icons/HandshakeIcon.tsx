import React from 'react'
import Svg, { Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function HandshakeIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 17l-2-2m6-2l-4 4m-2.5-7.5L2 6l3-3 6.5 6.5M17.5 15L22 18l-3 3-4.5-3"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M14 4l6 6-7 7-6-6 7-7z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}
