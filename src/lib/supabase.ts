import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// La URL debe ser la base del proyecto (https://xxxx.supabase.co). Si se pegó la URL
// de la API REST (.../rest/v1/), se recorta para no duplicar la ruta.
export const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
export const clave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// Si faltan las claves, el resto de la web sigue funcionando; solo falla lo que usa la BD.
export const supabase: SupabaseClient | null = url && clave ? createClient(url, clave, { auth: { flowType: 'pkce' } })
  : null

if (!supabase) {
  console.error(
    'Supabase no está configurado: agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY ' +
      'en .env.local y reinicia "npm run dev".',
  )
}
