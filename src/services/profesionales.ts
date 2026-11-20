import { supabase } from '../lib/supabase'
import { OTRA } from '../data/especialidades'
import { capitalizar } from '../utils/texto'
import type { DatosRegistro } from '../page/Register'

type CampoError = 'rut' | 'correo' | 'contrasena'

/** Error con un mensaje listo para mostrar al usuario y el campo afectado, si se conoce. */
export class ErrorRegistro extends Error {
  campo?: CampoError
  constructor(mensaje: string, campo?: CampoError) {
    super(mensaje)
    this.name = 'ErrorRegistro'
    this.campo = campo
  }
}

export type Perfil = {
  id: string
  nombre: string
  apellidos: string
  rut: string
  correo: string
  profesion: string
  especialidad: string
  region: string
  comuna: string
  creado_en?: string
}

export type ResultadoRegistro = {
  /** true si el usuario debe confirmar su correo antes de entrar. */
  requiereConfirmacion: boolean
}

/** A dónde lleva el botón "Confirmar cuenta" del correo. */
export const urlConfirmacion = () => `${window.location.origin}/app/perfil?bienvenida=1`

const SIN_CONEXION = 'El registro no está disponible: falta configurar la conexión a la base de datos.'

function fichaDesde(datos: DatosRegistro) {
  return {
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    rut: datos.rut,
    profesion: datos.profesion,
    especialidad: datos.especialidad === OTRA ? datos.especialidadOtra.trim() : datos.especialidad,
    region: datos.region,
    comuna: datos.comuna,
  }
}

/**
 * Crea la cuenta y la ficha del profesional.
 * - Registro con correo: los datos viajan con la cuenta y un trigger de la base
 *   crea la ficha. Supabase envía el correo para confirmar la cuenta.
 * - Con sesión iniciada (entró con Google): guarda la ficha directamente.
 */
export async function registrarProfesional(datos: DatosRegistro): Promise<ResultadoRegistro> {
  if (!supabase) throw new ErrorRegistro(SIN_CONEXION)

  const ficha = fichaDesde(datos)
  const usuario = (await supabase.auth.getSession()).data.session?.user ?? null

  if (usuario) {
    const { error } = await supabase
      .from('profesionales')
      .insert({ id: usuario.id, correo: usuario.email ?? datos.correo, ...ficha })
    if (error) lanzarErrorFicha(error)
    return { requiereConfirmacion: false }
  }

  // Revisa el RUT antes de crear la cuenta, para no dejar cuentas sin ficha.
  const { data: rutLibre, error: errorRut } = await supabase.rpc('rut_disponible', { p_rut: datos.rut })
  if (errorRut) console.error('Supabase (rut_disponible):', errorRut)
  if (rutLibre === false) {
    throw new ErrorRegistro('Ya existe una cuenta registrada con este RUT.', 'rut')
  }

  const { data, error } = await supabase.auth.signUp({
    email: datos.correo,
    password: datos.contrasena,
    options: { data: ficha, emailRedirectTo: urlConfirmacion() },
  })

  if (error) {
    console.error('Supabase Auth:', error)
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      throw new ErrorRegistro('Ya existe una cuenta con este correo. Inicia sesión.', 'correo')
    }
    if (error.code === 'weak_password') {
      throw new ErrorRegistro('La contraseña no cumple los requisitos de seguridad.', 'contrasena')
    }
    if (error.code === 'email_address_invalid') {
      throw new ErrorRegistro('Este correo no es válido para crear una cuenta.', 'correo')
    }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      throw new ErrorRegistro('Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.')
    }
    if (error.message.toLowerCase().includes('sending confirmation email')) {
      // El servidor de correo de Supabase no pudo enviar el correo (límite o destinatario no autorizado).
      throw new ErrorRegistro(
        'No pudimos enviar el correo de confirmación. Inténtalo más tarde o usa otro correo.',
        'correo',
      )
    }
    if (error.message.toLowerCase().includes('database error')) {
      // El trigger no pudo crear la ficha (por ejemplo, RUT duplicado).
      throw new ErrorRegistro('No pudimos guardar tus datos. Revisa que tu RUT no esté ya registrado.', 'rut')
    }
    throw new ErrorRegistro('No pudimos crear tu cuenta. Inténtalo nuevamente en unos minutos.')
  }

  // Con confirmación activa, Supabase no revela si el correo ya existía: lo
  // indica devolviendo un usuario sin identidades.
  if (data.user && data.user.identities?.length === 0) {
    throw new ErrorRegistro('Ya existe una cuenta con este correo. Inicia sesión.', 'correo')
  }

  return { requiereConfirmacion: !data.session }
}

/** Reenvía el correo de confirmación de la cuenta. */
export async function reenviarConfirmacion(correo: string): Promise<void> {
  if (!supabase) throw new ErrorRegistro(SIN_CONEXION)
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: correo,
    options: { emailRedirectTo: urlConfirmacion() },
  })
  if (!error) return
  console.error('Supabase Auth (reenviar):', error)
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    throw new ErrorRegistro('Ya enviamos varios correos. Espera unos minutos antes de pedir otro.')
  }
  throw new ErrorRegistro('No pudimos reenviar el correo. Inténtalo nuevamente en unos minutos.')
}

export async function obtenerPerfil(idUsuario: string): Promise<Perfil | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profesionales')
    .select('*')
    .eq('id', idUsuario)
    .maybeSingle<Perfil>()
  if (error) console.error('Supabase:', error)
  // Muestra bien los nombres aunque se hayan guardado en minúsculas.
  return data && { ...data, nombre: capitalizar(data.nombre), apellidos: capitalizar(data.apellidos) }
}

function lanzarErrorFicha(error: { code?: string; message: string; details?: string | null }): never {
  console.error('Supabase:', error)
  // 23505 = valor duplicado en una columna única
  if (error.code === '23505') {
    const texto = `${error.message} ${error.details ?? ''}`.toLowerCase()
    if (texto.includes('rut')) {
      throw new ErrorRegistro('Ya existe una cuenta registrada con este RUT.', 'rut')
    }
    throw new ErrorRegistro('Tu cuenta ya tiene una ficha registrada.')
  }
  // 42501 = bloqueado por las políticas de seguridad (RLS)
  if (error.code === '42501') {
    throw new ErrorRegistro('La base de datos rechazó el registro por permisos. Revisa las políticas RLS.')
  }
  throw new ErrorRegistro('No pudimos completar tu registro. Inténtalo nuevamente en unos minutos.')
}
