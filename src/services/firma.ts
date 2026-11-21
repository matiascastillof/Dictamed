import { supabase } from '../lib/supabase'

// Las firmas se guardan en el bucket privado "firmas" de Supabase Storage,
// en una carpeta por usuario: firmas/<id-del-usuario>/firma
const BUCKET = 'firmas'
const ruta = (idUsuario: string) => `${idUsuario}/firma`

export const MAX_FIRMA_MB = 2

export class ErrorFirma extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorFirma'
  }
}

function mensajeError(error: { message: string; statusCode?: string }): string {
  const texto = error.message.toLowerCase()
  if (texto.includes('bucket not found')) {
    return 'Falta crear el espacio "firmas" en Supabase Storage.'
  }
  if (texto.includes('row-level security') || error.statusCode === '403') {
    return 'Supabase rechazó la firma por permisos. Revisa las políticas del bucket "firmas".'
  }
  return 'No pudimos guardar tu firma. Inténtalo nuevamente.'
}

/** Devuelve la firma guardada como URL local para mostrarla, o null si no tiene. */
export async function obtenerFirma(idUsuario: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from(BUCKET).download(ruta(idUsuario))
  if (error || !data) {
    // "Object not found" es lo normal si todavía no ha guardado una firma.
    if (!/not found/i.test(error?.message ?? '')) console.error('Supabase Storage (firma):', error)
    return null
  }
  return URL.createObjectURL(data)
}

export async function guardarFirma(idUsuario: string, imagen: Blob): Promise<void> {
  if (!supabase) throw new ErrorFirma('Falta configurar la conexión a la base de datos.')
  if (imagen.size > MAX_FIRMA_MB * 1024 * 1024) {
    throw new ErrorFirma(`La imagen supera los ${MAX_FIRMA_MB} MB.`)
  }
  const { error } = await supabase.storage.from(BUCKET).upload(ruta(idUsuario), imagen, {
    upsert: true,
    contentType: imagen.type || 'image/png',
    cacheControl: '0',
  })
  if (error) {
    console.error('Supabase Storage (firma):', error)
    throw new ErrorFirma(mensajeError(error as { message: string; statusCode?: string }))
  }
}

export async function eliminarFirma(idUsuario: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.storage.from(BUCKET).remove([ruta(idUsuario)])
  if (error) {
    console.error('Supabase Storage (firma):', error)
    throw new ErrorFirma('No pudimos eliminar tu firma. Inténtalo nuevamente.')
  }
}
