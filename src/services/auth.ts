import { clave, supabase, url } from '../lib/supabase'

const SIN_CONEXION = 'El inicio de sesión no está disponible por ahora. Inténtalo más tarde.'

export class ErrorAuth extends Error {
  codigo?: string
  constructor(mensaje: string, codigo?: string) {
    super(mensaje)
    this.name = 'ErrorAuth'
    this.codigo = codigo
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
      throw new ErrorAuth(
        'Aún no confirmas tu cuenta. Presiona “Confirmar cuenta” en el correo que te enviamos.',
        'email_not_confirmed',
      )
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

/**
 * Envía el correo para restablecer la contraseña. Por seguridad no revela si el
 * correo tiene cuenta: la pantalla siempre muestra el mismo mensaje.
 */
export async function enviarRecuperacion(correo: string): Promise<void> {
  if (!supabase) throw new ErrorAuth(SIN_CONEXION)

  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/restablecer`,
  })
  if (!error) return

  console.error('Supabase Auth (recuperación):', error)
  if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit' || error.status === 429) {
    throw new ErrorAuth('Ya enviamos varios correos. Espera unos minutos antes de pedir otro.')
  }
  throw new ErrorAuth('No pudimos enviar el correo. Inténtalo nuevamente en unos minutos.')
}

/** Cambia la contraseña del usuario con sesión (la abre el enlace del correo). */
export async function cambiarContrasena(nueva: string): Promise<void> {
  if (!supabase) throw new ErrorAuth(SIN_CONEXION)

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (!error) {
    // Cierra las demás sesiones abiertas; si falla, el cambio de contraseña igual fue exitoso.
    try {
      const { error: errorOtras } = await supabase.auth.signOut({ scope: 'others' })
      if (errorOtras) console.error('Supabase Auth (cerrar otras sesiones):', errorOtras)
    } catch (err) {
      console.error('Supabase Auth (cerrar otras sesiones):', err)
    }
    return
  }

  console.error('Supabase Auth (cambio de contraseña):', error)
  switch (error.code) {
    case 'same_password':
      throw new ErrorAuth('La nueva contraseña debe ser distinta a la anterior.')
    case 'weak_password':
      throw new ErrorAuth('La contraseña es muy débil. Cumple todos los requisitos.')
    case 'session_not_found':
    case 'session_expired':
      throw new ErrorAuth('El enlace expiró. Solicita uno nuevo.')
    default:
      throw new ErrorAuth('No pudimos cambiar tu contraseña. Inténtalo nuevamente.')
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
  // Borra el lugar de trabajo recordado (clave antigua global y claves por usuario).
  try {
    for (const nombre of Object.keys(localStorage)) {
      if (nombre.startsWith('dictamed-lugar-trabajo')) localStorage.removeItem(nombre)
    }
  } catch {
    // Sin almacenamiento disponible: no hay nada que borrar.
  }
}

/**
 * true si el usuario ya completó su ficha de profesional, false si no existe y
 * null si no se pudo comprobar (error de red o de la base de datos).
 */
export async function tienePerfil(idUsuario: string): Promise<boolean | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profesionales')
    .select('id')
    .eq('id', idUsuario)
    .maybeSingle()
  if (error) {
    console.error('Supabase:', error)
    return null
  }
  return Boolean(data)
}
