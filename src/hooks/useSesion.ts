import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** Sesión actual de Supabase Auth, actualizada al iniciar o cerrar sesión. */
export function useSesion() {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let activo = true
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setSesion(data.session)
      setCargando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva)
      setCargando(false)
    })
    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { sesion, usuario: sesion?.user ?? null, cargando }
}
