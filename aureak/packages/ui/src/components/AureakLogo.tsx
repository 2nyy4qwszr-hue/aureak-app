import React from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'

const SOURCE = require('../assets/aureak-logo.png')

type Props = {
  size?: number
  style?: StyleProp<ImageStyle>
}

export function AureakLogo({ size = 48, style }: Props) {
  return (
    <Image
      source={SOURCE}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Aureak"
    />
  )
}
