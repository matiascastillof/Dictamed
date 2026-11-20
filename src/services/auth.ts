import { clave, supabase, url } from '../lib/supabase'

const SIN_CONEXION = 'El inicio de sesión no está disponible: falta configurar la conexión a la base de datos.'

export class ErrorAuth extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorAuth'
  }
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<void> {
  if (!supabase) throw new ErrorAuth(SIN_CONEXION)

  const { error } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: contrasena,
  })
  if (!error) return

  console.error('Supabase Auth:', error)
  switch (error.code) {
    case 'invalid_credentials':
      throw new ErrorAuth('Correo o contraseña incorrectos.')
    case 'email_not_confirmed':
      throw new ErrorAuth('Debes confirmar tu correo antes de iniciar sesión.')
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      throw new ErrorAuth('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
    default:
      throw new ErrorAuth('No pudimos iniciar sesión. Inténtalo nuevamente en unos minutos.')
  }
}

/** Redirige a Google; al volver, Supabase deja la sesión iniciada en /login. */
export async function iniciarConGoogle(): Promise<void> {
  if (!supabase) throw new ErrorAuth(SIN_CONEXION)

  // Evita mandar al usuario a una página de error si Google no está activado en Supabase.
  if (!(await proveedorActivo('google'))) {
    console.error('Google no está activado en Supabase: Authentication → Sign In / Providers → Google.')
    throw new ErrorAuth('El acceso con Google no está disponible por ahora. Usa tu correo y contraseña.')
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/login` },
  })
  if (error) {
    console.error('Supabase Auth (Google):', error)
    throw new ErrorAuth(
      error.code === 'validation_failed'
        ? 'El acceso con Google no está habilitado todavía.'
        : 'No pudimos conectar con Google. Inténtalo nuevamente.',
    )
  }
}

/** Consulta la configuración pública de Auth. Ante un fallo de red, asume que sí está activo. */
async function proveedorActivo(proveedor: string): Promise<boolean> {
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: clave ?? '' } })
    if (!r.ok) return true
    const ajustes: { external?: Record<string, boolean> } = await r.json()
    return ajustes.external?.[proveedor] !== false
  } catch {
    return true
  }
}

export async function cerrarSesion(): Promise<void> {
  await supabase?.auth.signOut()
}

/** true si el usuario ya completó su ficha de profesional. */
export async function tienePerfil(idUsuario: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('profesionales')
    .select('id')
    .eq('id', idUsuario)
    .maybeSingle()
  if (error) console.error('Supabase:', error)
  return Boolean(data)
}
