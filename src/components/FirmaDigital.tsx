import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { ErrorFirma, MAX_FIRMA_MB, eliminarFirma, guardarFirma, obtenerFirma } from '../services/firma'

type Modo = 'cargando' | 'ver' | 'dibujar'

const TINTA = '#13213f'

export default function FirmaDigital({ idUsuario }: { idUsuario: string }) {
  const [modo, setModo] = useState<Modo>('cargando')
  const [firma, setFirma] = useState<string | null>(null)
  const [vacio, setVacio] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)

  useEffect(() => {
    let activo = true
    obtenerFirma(idUsuario).then((url) => {
      if (!activo) return
      setFirma(url)
      setModo(url ? 'ver' : 'dibujar')
    })
    return () => {
      activo = false
    }
  }, [idUsuario])

  // Libera la imagen anterior de la memoria.
  useEffect(() => {
    return () => {
      if (firma) URL.revokeObjectURL(firma)
    }
  }, [firma])

  // Ajusta el lienzo a su tamaño real en pantalla (nítido en pantallas de alta densidad).
  useEffect(() => {
    if (modo !== 'dibujar') return
    const c = lienzo.current
    if (!c) return
    const escala = window.devicePixelRatio || 1
    const { width, height } = c.getBoundingClientRect()
    c.width = width * escala
    c.height = height * escala
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(escala, escala)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = TINTA
  }, [modo])

  function punto(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function empezarTrazo(e: PointerEvent<HTMLCanvasElement>) {
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dibujando.current = true
    const { x, y } = punto(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
    setVacio(false)
  }

  function seguirTrazo(e: PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    const { x, y } = punto(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function terminarTrazo() {
    dibujando.current = false
  }

  function limpiar() {
    const c = lienzo.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setVacio(true)
  }

  async function guardar(imagen: Blob) {
    setGuardando(true)
    setError(null)
    try {
      await guardarFirma(idUsuario, imagen)
      setFirma(URL.createObjectURL(imagen))
      setModo('ver')
      setVacio(true)
      setAviso('Firma guardada.')
    } catch (err) {
      setError(err instanceof ErrorFirma ? err.message : 'No pudimos guardar tu firma.')
    } finally {
      setGuardando(false)
    }
  }

  function guardarDibujo() {
    lienzo.current?.toBlob((blob) => {
      if (blob) guardar(blob)
    }, 'image/png')
  }

  function subirImagen(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(archivo.type)) {
      setError('La firma debe ser una imagen PNG, JPG o WEBP.')
      return
    }
    guardar(archivo)
  }

  async function eliminar() {
    if (!window.confirm('¿Eliminar tu firma guardada?')) return
    setGuardando(true)
    setError(null)
    try {
      await eliminarFirma(idUsuario)
      setFirma(null)
      setModo('dibujar')
      setAviso('Firma eliminada.')
    } catch (err) {
      setError(err instanceof ErrorFirma ? err.message : 'No pudimos eliminar tu firma.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="registro-tarjeta firma">
      <h2 className="perfil-subtitulo">Firma</h2>
      <p className="firma-bajada">
        Guarda tu firma para usarla en tus informes. Solo tú puedes verla.
      </p>

      {error && (
        <div className="registro-alerta" role="alert">
          <p>{error}</p>
        </div>
      )}
      {aviso && !error && (
        <p className="firma-aviso" role="status">
          ✓ {aviso}
        </p>
      )}

      {modo === 'cargando' && <p className="firma-bajada">Cargando…</p>}

      {modo === 'ver' && firma && (
        <>
          <div className="firma-hoja">
            <img src={firma} alt="Tu firma guardada" />
          </div>
          <div className="firma-acciones">
            <button type="button" className="boton-volver" onClick={eliminar} disabled={guardando}>
              Eliminar
            </button>
            <button
              type="button"
              className="boton-registro"
              onClick={() => {
                setAviso(null)
                setModo('dibujar')
              }}
              disabled={guardando}
            >
              Reemplazar firma
            </button>
          </div>
        </>
      )}

      {modo === 'dibujar' && (
        <>
          <div className="firma-hoja">
            <canvas
              ref={lienzo}
              className="firma-lienzo"
              aria-label="Área para dibujar tu firma"
              onPointerDown={empezarTrazo}
              onPointerMove={seguirTrazo}
              onPointerUp={terminarTrazo}
              onPointerCancel={terminarTrazo}
            />
            {vacio && <span className="firma-guia">Firma aquí con el mouse, el dedo o un lápiz</span>}
          </div>
          <div className="firma-acciones">
            <button type="button" className="boton-volver" onClick={limpiar} disabled={vacio || guardando}>
              Limpiar
            </button>
            {firma && (
              <button type="button" className="boton-volver" onClick={() => setModo('ver')} disabled={guardando}>
                Cancelar
              </button>
            )}
            <button
              type="button"
              className="boton-registro"
              onClick={guardarDibujo}
              disabled={vacio || guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar firma'}
            </button>
          </div>
          <label className="firma-subir">
            ¿Tienes tu firma escaneada? <strong>Sube una imagen</strong> (PNG, JPG o WEBP, hasta{' '}
            {MAX_FIRMA_MB} MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={subirImagen}
              disabled={guardando}
            />
          </label>
        </>
      )}
    </section>
  )
}
