import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // Initialiser le store auth UNE SEULE FOIS à la racine de l'app
  useEffect(() => {
    useAuthStore.getState()._init()
  }, [])

  // Timeout fallback : si les fontes ne chargent pas en 3s, on affiche quand même l'app
  const [fontTimeout, setFontTimeout] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const [fontsLoaded, fontError] = useFonts({
    'Rajdhani-Regular'    : require('../assets/fonts/Rajdhani/Rajdhani-Regular.ttf'),
    'Rajdhani-SemiBold'   : require('../assets/fonts/Rajdhani/Rajdhani-SemiBold.ttf'),
    'Rajdhani-Bold'       : require('../assets/fonts/Rajdhani/Rajdhani-Bold.ttf'),
    'Geist-Regular'       : require('../assets/fonts/Geist/Geist-Regular.ttf'),
    'Geist-Medium'        : require('../assets/fonts/Geist/Geist-Medium.ttf'),
    'Geist-SemiBold'      : require('../assets/fonts/Geist/Geist-SemiBold.ttf'),
    'GeistMono-Regular'   : require('../assets/fonts/Geist/GeistMono-Regular.ttf'),
    // Story 25.1 — Police Montserrat pour cartes joueur premium
    'Montserrat-Regular'  : require('../assets/fonts/Montserrat/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold' : require('../assets/fonts/Montserrat/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold'     : require('../assets/fonts/Montserrat/Montserrat-Bold.ttf'),
    'Montserrat-ExtraBold': require('../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError && !fontTimeout) return null

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Stack>
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(club)"  options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
      </Stack>
    </TamaguiProvider>
  )
}
