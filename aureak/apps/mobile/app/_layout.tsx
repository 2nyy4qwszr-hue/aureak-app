import { useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'
import { supabase } from '@aureak/api-client'
import { initLocalDB } from '../src/db/schema'

// Prévenir la disparition du splash avant que les fonts soient chargées
SplashScreen.preventAutoHideAsync()

async function registerPushToken(userId: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    const token = (await Notifications.getExpoPushTokenAsync()).data
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS, tenant_id: '' },
      { onConflict: 'user_id,token' }
    )
  } catch {
    // Silently ignore push token registration errors (e.g. in simulator)
  }
}

export default function RootLayout() {
  const authState = useAuthStore()

  // Initialiser le store auth UNE SEULE FOIS à la racine de l'app
  useEffect(() => {
    useAuthStore.getState()._init()
    // Initialiser la base SQLite locale (Story 5.1)
    initLocalDB().catch(() => {/* silent — degraded mode si SQLite indisponible */})
  }, [])

  // Enregistrer le token push après connexion (Story 7.1)
  useEffect(() => {
    if (authState.user?.id) {
      registerPushToken(authState.user.id)
    }
  }, [authState.user?.id])

  const [fontsLoaded, fontError] = useFonts({
    // Rajdhani — headings, stats (Google Fonts) — conservé pour compatibilité composants existants
    'Rajdhani-Regular' : require('../assets/fonts/Rajdhani/Rajdhani-Regular.ttf'),
    'Rajdhani-SemiBold': require('../assets/fonts/Rajdhani/Rajdhani-SemiBold.ttf'),
    'Rajdhani-Bold'    : require('../assets/fonts/Rajdhani/Rajdhani-Bold.ttf'),
    // Geist — body, labels (Vercel) — conservé pour compatibilité composants existants
    'Geist-Regular'    : require('../assets/fonts/Geist/Geist-Regular.otf'),
    'Geist-Medium'     : require('../assets/fonts/Geist/Geist-Medium.otf'),
    'Geist-SemiBold'   : require('../assets/fonts/Geist/Geist-SemiBold.otf'),
    // Geist Mono — valeurs numériques, données tabulaires
    'GeistMono-Regular': require('../assets/fonts/Geist/GeistMono-Regular.otf'),
    // Montserrat — display / heading (titres, stats, mots forts) — aligné DS
    // weights : 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black
    'Montserrat-Regular'  : require('../assets/fonts/Montserrat/Montserrat-Regular.ttf'),
    'Montserrat-Medium'   : require('../assets/fonts/Montserrat/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold' : require('../assets/fonts/Montserrat/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold'     : require('../assets/fonts/Montserrat/Montserrat-Bold.ttf'),
    'Montserrat-ExtraBold': require('../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf'),
    'Montserrat-Black'    : require('../assets/fonts/Montserrat/Montserrat-Black.ttf'),
    // Poppins — body / UI / CTA / labels (aligné site marketing Aureak) — aligné DS
    // weights : 400 Regular, 500 Medium, 600 SemiBold
    'Poppins-Regular'     : require('../assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium'      : require('../assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold'    : require('../assets/fonts/Poppins/Poppins-SemiBold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // Afficher null jusqu'au chargement des fonts (splash écran actif)
  if (!fontsLoaded && !fontError) return null

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="(parent)" options={{ headerShown: false }} />
        <Stack.Screen name="(child)" options={{ headerShown: false }} />
        <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
      </Stack>
    </TamaguiProvider>
  )
}
