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
  const msg =
    '[api-client] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ne sont pas définis. ' +
    'Vérifiez votre fichier .env (copiez .env.example et renseignez les valeurs).'
  // En développement : erreur explicite pour détecter immédiatement le problème
  // En production : warning pour éviter un crash dur (valeurs manquantes = app dégradée)
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(msg)
  } else {
    console.warn(msg)
  }
}

// Fallback localhost uniquement pour le dev local — jamais en production sans .env
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7b9PG0CkZjb0bV0eMRUkqMDY5QSmN7nIkZs'
  // ↑ anon key locale standard Supabase CLI (supabase start) — valide pour dev uniquement
)
