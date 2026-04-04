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
    // Geist Mono — valeurs numériques tabulaires (typography.stat)
    'GeistMono-Regular'      : require('../assets/fonts/Geist/GeistMono-Regular.ttf'),
    // Montserrat — police unique pour display/heading/body (Story 45.1)
    // weights : 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black
    'Montserrat-Regular'     : require('../assets/fonts/Montserrat/Montserrat-Regular.ttf'),
    'Montserrat-Medium'      : require('../assets/fonts/Montserrat/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold'    : require('../assets/fonts/Montserrat/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold'        : require('../assets/fonts/Montserrat/Montserrat-Bold.ttf'),
    'Montserrat-ExtraBold'   : require('../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf'),
    'Montserrat-Black'       : require('../assets/fonts/Montserrat/Montserrat-Black.ttf'),
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
