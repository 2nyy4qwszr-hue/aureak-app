import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'
import { Platform } from 'react-native'

SplashScreen.preventAutoHideAsync()

// Story 62.6 — Injection balises PWA/favicon dans <head> (web uniquement)
let pwaHeadInjected = false
function injectPWAHead() {
  if (pwaHeadInjected || typeof document === 'undefined') return
  pwaHeadInjected = true

  const addLink = (attrs: Record<string, string>) => {
    const link = document.createElement('link')
    Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v))
    document.head.appendChild(link)
  }
  const addMeta = (name: string, content: string) => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', name)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }

  addLink({ rel: 'icon',             href: '/favicon.svg',          type: 'image/svg+xml' })
  addLink({ rel: 'icon',             href: '/favicon-32x32.png',    sizes: '32x32',   type: 'image/png' })
  addLink({ rel: 'icon',             href: '/favicon-16x16.png',    sizes: '16x16',   type: 'image/png' })
  addLink({ rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' })
  addLink({ rel: 'manifest',         href: '/manifest.json' })
  addMeta('theme-color', '#C9A84C')
}

export default function RootLayout() {
  // Initialiser le store auth UNE SEULE FOIS à la racine de l'app
  useEffect(() => {
    useAuthStore.getState()._init()
  }, [])

  // Story 62.6 — Injecter les balises PWA/favicon dans le <head> au montage (web uniquement)
  useEffect(() => {
    if (Platform.OS === 'web') injectPWAHead()
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
