// @aureak/api-client — Point d'accès unique à Supabase
// RÈGLE : Ce fichier est le SEUL endroit autorisé à importer @supabase/supabase-js
// RÈGLE : apps/mobile et apps/web ne doivent JAMAIS lire process.env.SUPABASE_* directement
// Source: architecture.md#Frontières-Architecturales + Story 1.2 AC7

import { createClient } from '@supabase/supabase-js'

// EXPO_PUBLIC_ prefix = inliné par Metro dans le bundle navigateur (Expo SDK 49+).
// Fallback sur SUPABASE_* pour CI / Node.js (Edge Functions, scripts de migration).
const supabaseUrl =
  process.env['EXPO_PUBLIC_SUPABASE_URL'] ??
  process.env['SUPABASE_URL'] ??
  ''

const supabaseAnonKey =
  process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ??
  process.env['SUPABASE_ANON_KEY'] ??
  ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[api-client] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ne sont pas définis. ' +
    'Vérifiez votre fichier .env.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'placeholder'
)
