/**
 * Funciones que dependen del envío de correos. Están apagadas hasta configurar
 * un SMTP propio en Supabase; para activarlas, cámbialas a true.
 */

/** Pide confirmar la cuenta por correo. Debe coincidir con "Confirm email" en Supabase. */
export const CONFIRMAR_CORREO = false

/** Muestra "¿Olvidaste tu contraseña?" y las páginas para restablecerla. */
export const RECUPERAR_CONTRASENA = false
