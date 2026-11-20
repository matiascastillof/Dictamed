import { supabase } from '../lib/supabase'
import { OTRA } from '../data/especialidades'
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

/**
 * Crea la cuenta (correo + contraseña) y guarda la ficha del profesional.
 * Si ya hay una sesión iniciada (por ejemplo, entró con Google), solo guarda la ficha.
 */
export async function registrarProfesional(datos: DatosRegistro): Promise<void> {
  if (!supabase) {
    throw new ErrorRegistro('El registro no está disponible: falta configurar la conexión a la base de datos.')
  }

  let usuario = (await supabase.auth.getSession()).data.session?.user ?? null

  if (!usuario) {
    const { data, error } = await supabase.auth.signUp({
      email: datos.correo,
      password: datos.contrasena,
      options: { data: { nombre: datos.nombre, apellidos: datos.apellidos } },
    })

    if (error) {
      console.error('Supabase Auth:', error)
      if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        throw new ErrorRegistro('Ya existe una cuenta con este correo. Inicia sesión.', 'correo')
      }
      if (error.code === 'weak_password') {
        throw new ErrorRegistro('La contraseña es muy débil. Usa una más larga o variada.', 'contrasena')
      }
      if (error.code === 'email_address_invalid') {
        throw new ErrorRegistro('Este correo no es válido para crear una cuenta.', 'correo')
      }
      throw new ErrorRegistro('No pudimos crear tu cuenta. Inténtalo nuevamente en unos minutos.')
    }

    if (!data.session) {
      // Ocurre cuando "Confirm email" está activado en Supabase.
      console.error(
        'Supabase no inició sesión tras el registro. Desactiva "Confirm email" en ' +
          'Authentication → Sign In / Providers → Email.',
      )
      throw new ErrorRegistro(
        'Tu cuenta fue creada, pero debes confirmar tu correo antes de completar el registro.',
      )
    }
    usuario = data.user
  }

  if (!usuario) {
    throw new ErrorRegistro('No pudimos crear tu cuenta. Inténtalo nuevamente en unos minutos.')
  }

  const { error } = await supabase.from('profesionales').insert({
    id: usuario.id,
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    rut: datos.rut,
    correo: usuario.email ?? datos.correo,
    profesion: datos.profesion,
    especialidad: datos.especialidad === OTRA ? datos.especialidadOtra.trim() : datos.especialidad,
    region: datos.region,
    comuna: datos.comuna,
  })

  if (!error) return

  console.error('Supabase:', error)

  // 23505 = valor duplicado en una columna única
  if (error.code === '23505') {
    const texto = `${error.message} ${error.details ?? ''}`.toLowerCase()
    if (texto.includes('rut')) {
      throw new ErrorRegistro('Ya existe una cuenta registrada con este RUT.', 'rut')
    }
    if (texto.includes('correo')) {
      throw new ErrorRegistro('Ya existe una cuenta con este correo electrónico.', 'correo')
    }
    throw new ErrorRegistro('Tu cuenta ya tiene una ficha registrada.')
  }
  // 42501 = bloqueado por las políticas de seguridad (RLS)
  if (error.code === '42501') {
    throw new ErrorRegistro(
      'La base de datos rechazó el registro por permisos. Revisa las políticas RLS de la tabla.',
    )
  }
  throw new ErrorRegistro('No pudimos completar tu registro. Inténtalo nuevamente en unos minutos.')
}
