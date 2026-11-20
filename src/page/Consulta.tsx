import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/Consulta.css'
import { useAreaPrivada } from '../hooks/useAreaPrivada'
import LugarTrabajo, { type Lugar } from '../components/LugarTrabajo'

type Estado = 'inactivo' | 'grabando' | 'pausado' | 'terminado'

// Reconocimiento de voz del navegador (Chrome, Edge y Safari).
type ResultadoVoz = { isFinal: boolean; 0: { transcript: string } }
type EventoVoz = { resultIndex: number; results: ArrayLike<ResultadoVoz> }
type ReconocimientoVoz = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: EventoVoz) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type ConstructorVoz = new () => ReconocimientoVoz
const ventana = window as unknown as { SpeechRecognition?: ConstructorVoz; webkitSpeechRecognition?: ConstructorVoz }
const Reconocimiento = ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition

const CLAVE_LUGAR = 'dictamed-lugar-trabajo'

function leerLugar(): Lugar | null {
  try {
    const guardado = localStorage.getItem(CLAVE_LUGAR)
    return guardado ? (JSON.parse(guardado) as Lugar) : null
  } catch {
    return null
  }
}

function duracion(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Agrega una frase al texto, empezando con mayúscula. */
function agregarFrase(texto: string, frase: string) {
  const limpia = frase.trim()
  if (!limpia) return texto
  const conMayuscula = limpia[0].toLocaleUpperCase('es-CL') + limpia.slice(1)
  const base = texto.trimEnd()
  return base ? `${base} ${conMayuscula}` : conMayuscula
}

export default function Consulta() {
  const { perfil } = useAreaPrivada()
  const [lugar, setLugar] = useState<Lugar | null>(leerLugar)
  const [estado, setEstado] = useState<Estado>('inactivo')
  const [segundos, setSegundos] = useState(0)
  const [texto, setTexto] = useState('')
  const [parcial, setParcial] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const grabadora = useRef<MediaRecorder | null>(null)
  const reconocimiento = useRef<ReconocimientoVoz | null>(null)
  const estadoRef = useRef<Estado>('inactivo')

  function cambiarEstado(nuevo: Estado) {
    estadoRef.current = nuevo
    setEstado(nuevo)
  }

  // Cronómetro mientras se graba.
  useEffect(() => {
    if (estado !== 'grabando') return
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [estado])

  // Al salir de la página apaga el micrófono y el reconocimiento.
  useEffect(() => {
    return () => {
      estadoRef.current = 'terminado'
      reconocimiento.current?.stop()
      grabadora.current?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  useEffect(() => {
    if (!copiado) return
    const id = window.setTimeout(() => setCopiado(false), 2000)
    return () => window.clearTimeout(id)
  }, [copiado])

  function elegirLugar(nuevo: Lugar | null) {
    setLugar(nuevo)
    try {
      if (nuevo) localStorage.setItem(CLAVE_LUGAR, JSON.stringify(nuevo))
      else localStorage.removeItem(CLAVE_LUGAR)
    } catch {
      // Sin almacenamiento disponible: solo no se recuerda para la próxima vez.
    }
  }

  function escuchar() {
    if (!Reconocimiento) return
    const rec = new Reconocimiento()
    rec.lang = 'es-CL'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let enCurso = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) setTexto((t) => agregarFrase(t, r[0].transcript))
        else enCurso += r[0].transcript
      }
      setParcial(enCurso)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('El navegador no permitió la transcripción en vivo. El audio se sigue grabando.')
      }
    }
    // El navegador corta el reconocimiento tras unos segundos de silencio: lo reanuda.
    rec.onend = () => {
      setParcial('')
      if (estadoRef.current === 'grabando') {
        try {
          rec.start()
        } catch {
          // Ya estaba iniciado.
        }
      }
    }
    reconocimiento.current = rec
    rec.start()
  }

  async function iniciar() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Tu navegador no permite grabar audio. Prueba con Chrome o Edge actualizados.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const partes: Blob[] = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => partes.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setAudioUrl(URL.createObjectURL(new Blob(partes, { type: rec.mimeType })))
      }
      grabadora.current = rec
      rec.start()
      setSegundos(0)
      setAudioUrl(null)
      cambiarEstado('grabando')
      escuchar()
    } catch {
      setError('No pudimos acceder al micrófono. Revisa los permisos del navegador.')
    }
  }

  function pausar() {
    grabadora.current?.pause()
    cambiarEstado('pausado')
    reconocimiento.current?.stop()
  }

  function reanudar() {
    grabadora.current?.resume()
    cambiarEstado('grabando')
    try {
      reconocimiento.current?.start()
    } catch {
      // Ya estaba iniciado.
    }
  }

  function finalizar() {
    cambiarEstado('terminado')
    reconocimiento.current?.stop()
    reconocimiento.current = null
    grabadora.current?.stop()
    grabadora.current = null
  }

  function nuevaConsulta() {
    setTexto('')
    setParcial('')
    setAudioUrl(null)
    setSegundos(0)
    cambiarEstado('inactivo')
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setError('No pudimos copiar el texto. Selecciónalo y usa Ctrl + C.')
    }
  }

  const palabras = texto.trim() ? texto.trim().split(/\s+/).length : 0
  const activo = estado === 'grabando' || estado === 'pausado'

  return (
    <div className="privada-pagina consulta">
      <header className="privada-cabecera">
        <Link to="../transcribir" className="consulta-volver">
          ← Nueva transcripción
        </Link>
        <h1>Grabar consulta</h1>
      </header>

      {error && (
        <div className="registro-alerta" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="consulta-grid">
        <div className="consulta-columna">
          <section className="registro-tarjeta consulta-grabadora">
            <h2 className="perfil-subtitulo">Grabación</h2>
            <button
              type="button"
              className={`transcribir-microfono ${estado === 'grabando' ? 'grabando' : ''}`}
              onClick={estado === 'grabando' ? pausar : estado === 'pausado' ? reanudar : iniciar}
              aria-label={
                estado === 'grabando' ? 'Pausar' : estado === 'pausado' ? 'Reanudar' : 'Empezar a grabar'
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {estado === 'grabando' ? (
                  <path d="M9 6v12M15 6v12" />
                ) : (
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />
                )}
              </svg>
            </button>
            <p className="transcribir-tiempo" aria-live="polite">
              {duracion(segundos)}
            </p>
            <p className="consulta-estado">
              {
                {
                  inactivo: 'Presiona el micrófono para comenzar',
                  grabando: 'Grabando… presiona para pausar',
                  pausado: 'En pausa — presiona para continuar',
                  terminado: 'Grabación finalizada',
                }[estado]
              }
            </p>

            {activo && (
              <button type="button" className="boton-registro consulta-finalizar" onClick={finalizar}>
                Finalizar consulta
              </button>
            )}
            {estado === 'terminado' && (
              <>
                {audioUrl && <audio controls src={audioUrl} />}
                <button type="button" className="boton-volver" onClick={nuevaConsulta}>
                  Nueva consulta
                </button>
              </>
            )}
            {!Reconocimiento && (
              <p className="consulta-aviso">
                Tu navegador no transcribe en vivo. Usa Chrome o Edge, o escribe la nota a mano.
              </p>
            )}
          </section>

          <section className="registro-tarjeta">
            <h2 className="perfil-subtitulo">Lugar de trabajo</h2>
            <LugarTrabajo
              regionInicial={perfil.region}
              comunaInicial={perfil.comuna}
              valor={lugar}
              alCambiar={elegirLugar}
            />
          </section>
        </div>

        <section className="registro-tarjeta consulta-transcripcion">
          <div className="consulta-barra">
            <h2 className="perfil-subtitulo">Transcripción</h2>
            <span className="consulta-palabras">
              {palabras} {palabras === 1 ? 'palabra' : 'palabras'}
            </span>
            <button type="button" className="consulta-copiar" onClick={copiar} disabled={!texto.trim()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {copiado ? (
                  <path d="m5 12 5 5L20 7" />
                ) : (
                  <path d="M9 9h10v12H9zM5 15H4V3h12v1" />
                )}
              </svg>
              {copiado ? 'Copiado' : 'Copiar texto'}
            </button>
          </div>

          <label className="sr-only" htmlFor="transcripcion">
            Transcripción editable
          </label>
          <textarea
            id="transcripcion"
            className="consulta-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              Reconocimiento
                ? 'Aquí aparecerá la transcripción mientras grabas. Puedes editar el texto en cualquier momento.'
                : 'Escribe aquí la nota de la consulta.'
            }
          />
          {parcial && (
            <p className="consulta-parcial" aria-live="polite">
              {parcial}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
