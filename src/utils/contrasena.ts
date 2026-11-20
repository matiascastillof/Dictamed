// Reglas de seguridad para contraseñas. Deben coincidir con las configuradas en
// Supabase (Authentication → Sign In / Providers → Email → Password requirements).

export const LARGO_MINIMO = 8

export type Requisito = { id: string; texto: string; cumple: (clave: string) => boolean }

export const REQUISITOS: Requisito[] = [
  { id: 'largo', texto: `Al menos ${LARGO_MINIMO} caracteres`, cumple: (c) => c.length >= LARGO_MINIMO },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (c) => /\p{Lu}/u.test(c) },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (c) => /\p{Ll}/u.test(c) },
  { id: 'numero', texto: 'Un número', cumple: (c) => /\d/.test(c) },
  { id: 'simbolo', texto: 'Un símbolo (ej: ! @ # $ % & * ?)', cumple: (c) => /[^\p{L}\d\s]/u.test(c) },
  { id: 'espacios', texto: 'Sin espacios', cumple: (c) => c.length > 0 && !/\s/.test(c) },
]

/** Devuelve un mensaje de error o undefined si la contraseña es válida. */
export function validarContrasena(clave: string, correo = ''): string | undefined {
  if (!clave) return 'Crea una contraseña.'
  const faltante = REQUISITOS.find((r) => !r.cumple(clave))
  if (faltante) return 'Tu contraseña no cumple todos los requisitos.'
  const usuario = correo.trim().toLowerCase().split('@')[0]
  if (usuario.length >= 4 && clave.toLowerCase().includes(usuario)) {
    return 'Tu contraseña no puede contener tu correo.'
  }
}

export function validarConfirmacion(clave: string, confirmacion: string): string | undefined {
  if (!confirmacion) return 'Repite tu contraseña.'
  if (confirmacion !== clave) return 'Las contraseñas no coinciden.'
}
