import { Redirect, useLocalSearchParams } from 'expo-router'

export default function ThemeKeyRedirect() {
  const { themeKey } = useLocalSearchParams<{ themeKey: string }>()
  return <Redirect href={`/methodologie/themes/${themeKey ?? ''}` as never} />
}
