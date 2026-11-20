import { useEffect, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAreaPrivada } from '../hooks/useAreaPrivada'

type Audio = { url: string; nombre: string }

const MAX_MB = 100

export default function Transcribir() {
  const { perfil } = useAreaPrivada()
  const [audio, setAudio] = useState<Audio | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Libera la memoria del audio anterior.
  useEffect(() => {
    return () => {
      if (audio) URL.revokeObjectURL(audio.url)
    }
  }, [audio])

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
    setAudio({ url: URL.createObjectURL(archivo), nombre: archivo.name })
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
          <Link to="../consulta" className="registro-tarjeta transcribir-opcion transcribir-subir">
            <span className="transcribir-microfono" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </span>
            <h2>Grabar consulta</h2>
            <p>Graba y mira la transcripción en vivo mientras atiendes.</p>
          </Link>

          <label className="registro-tarjeta transcribir-opcion transcribir-subir">
            <span className="transcribir-microfono secundario" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
              </svg>
            </span>
            <h2>Subir audio</h2>
            <p>MP3, WAV, M4A u OGG, hasta {MAX_MB} MB.</p>
            <input type="file" accept="audio/*" className="sr-only" onChange={alSubir} />
          </label>
        </div>
      ) : (
        <section className="registro-tarjeta transcribir-listo">
          <p className="perfil-subtitulo">Archivo listo</p>
          <h2>{audio.nombre}</h2>
          <audio controls src={audio.url} />
          <p className="transcribir-nota">
            La transcripción de archivos subidos se conectará en una próxima etapa. Para transcribir en
            vivo, usa “Grabar consulta”.
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
