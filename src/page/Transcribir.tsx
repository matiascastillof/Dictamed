import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAreaPrivada } from '../hooks/useAreaPrivada'

type Audio = { url: string; nombre: string; origen: 'grabacion' | 'archivo' }

const MAX_MB = 100

function duracion(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Transcribir() {
  const { perfil } = useAreaPrivada()
  const [audio, setAudio] = useState<Audio | null>(null)
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const grabadora = useRef<MediaRecorder | null>(null)

  // Cronómetro mientras se graba.
  useEffect(() => {
    if (!grabando) return
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [grabando])

  // Libera la memoria del audio anterior.
  useEffect(() => {
    return () => {
      if (audio) URL.revokeObjectURL(audio.url)
    }
  }, [audio])

  // Si sale de la página grabando, apaga el micrófono.
  useEffect(() => {
    return () => grabadora.current?.stream.getTracks().forEach((t) => t.stop())
  }, [])

  async function empezar() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Tu navegador no permite grabar audio. Sube un archivo en su lugar.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const partes: Blob[] = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => partes.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(partes, { type: rec.mimeType })
        const fecha = new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
        setAudio({ url: URL.createObjectURL(blob), nombre: `Consulta ${fecha}`, origen: 'grabacion' })
      }
      grabadora.current = rec
      rec.start()
      setSegundos(0)
      setGrabando(true)
    } catch {
      setError('No pudimos acceder al micrófono. Revisa los permisos del navegador.')
    }
  }

  function detener() {
    grabadora.current?.stop()
    grabadora.current = null
    setGrabando(false)
  }

  function alSubir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!archivo.type.startsWith('audio/')) {
      setError('El archivo debe ser de audio (MP3, WAV, M4A, OGG…).')
      return
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB.`)
      return
    }
    setError(null)
    setAudio({ url: URL.createObjectURL(archivo), nombre: archivo.name, origen: 'archivo' })
  }

  return (
    <div className="privada-pagina">
      <header className="privada-cabecera">
        <h1>Nueva transcripción</h1>
        <p>Hola, {perfil.nombre}. Graba tu consulta o sube un audio para convertirlo en una nota clínica.</p>
      </header>

      {error && (
        <div className="registro-alerta" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!audio ? (
        <div className="transcribir-opciones">
          <section className="registro-tarjeta transcribir-opcion">
            <button
              type="button"
              className={`transcribir-microfono ${grabando ? 'grabando' : ''}`}
              onClick={grabando ? detener : empezar}
              aria-label={grabando ? 'Detener grabación' : 'Empezar a grabar'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {grabando ? (
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                ) : (
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />
                )}
              </svg>
            </button>
            <h2>{grabando ? 'Grabando…' : 'Grabar consulta'}</h2>
            <p className={grabando ? 'transcribir-tiempo' : ''} aria-live="polite">
              {grabando ? duracion(segundos) : 'Usa el micrófono de tu equipo.'}
            </p>
          </section>

          <label className={`registro-tarjeta transcribir-opcion transcribir-subir ${grabando ? 'inactiva' : ''}`}>
            <span className="transcribir-microfono secundario" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
              </svg>
            </span>
            <h2>Subir audio</h2>
            <p>MP3, WAV, M4A u OGG, hasta {MAX_MB} MB.</p>
            <input type="file" accept="audio/*" className="sr-only" onChange={alSubir} disabled={grabando} />
          </label>
        </div>
      ) : (
        <section className="registro-tarjeta transcribir-listo">
          <p className="perfil-subtitulo">{audio.origen === 'grabacion' ? 'Grabación lista' : 'Archivo listo'}</p>
          <h2>{audio.nombre}</h2>
          <audio controls src={audio.url} />
          <p className="transcribir-nota">
            La transcripción automática se conectará en una próxima etapa. Por ahora puedes escuchar el
            audio para revisarlo.
          </p>
          <div className="transcribir-acciones">
            <button type="button" className="boton-volver" onClick={() => setAudio(null)}>
              Descartar
            </button>
            <button type="button" className="boton-registro" disabled>
              Transcribir (pronto)
            </button>
          </div>
        </section>
      )}

      <p className="privada-pie">
        ¿Buscas una nota anterior? <Link to="../historial">Ve a Mis transcripciones</Link>
      </p>
    </div>
  )
}
