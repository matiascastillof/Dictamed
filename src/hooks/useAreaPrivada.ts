import { useOutletContext } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { Perfil } from '../services/profesionales'

export type ContextoPrivado = { usuario: User; perfil: Perfil }

/** Datos del usuario para las páginas dentro del área privada (/app). */
export function useAreaPrivada() {
  return useOutletContext<ContextoPrivado>()
}
