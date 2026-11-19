import { useEffect, useState } from 'react'
import '../css/Inicio.css'

type Hablante = 'Médico' | 'Paciente'
type Linea = { quien: Hablante; texto: string }

// Conversación de ejemplo para la demo. Los términos entre [[ ]] se resaltan
// como vocabulario clínico reconocido.
const CONSULTA: Linea[] = [
  { quien: 'Médico', texto: '¿Qué la trae hoy por la consulta?' },
  {
    quien: 'Paciente',
    texto: 'Hace tres días tengo dolor en el pecho cuando subo escaleras, y me falta el aire.',
  },
  {
    quien: 'Médico',
    texto: '¿Toma algún medicamento? Veo que tiene antecedente de [[hipertensión arterial]].',
  },
  { quien: 'Paciente', texto: 'Sí, [[losartán 50 mg]] una vez al día.' },
  {
    quien: 'Médico',
    texto:
      'Presión [[145/92 mmHg]], frecuencia cardíaca [[88 lpm]]. Solicitaremos un [[electrocardiograma]] y [[troponinas]].',
  },
]

const NOTA = [
  {
    letra: 'S',
    titulo: 'Subjetivo',
    texto: 'Dolor torácico de esfuerzo de 3 días de evolución, asociado a disnea.',
  },
  {
    letra: 'O',
    titulo: 'Objetivo',
    texto: 'PA 145/92 mmHg · FC 88 lpm. Antecedente de HTA en tratamiento.',
  },
  {
    letra: 'A',
    titulo: 'Evaluación',
    texto: 'Angina de esfuerzo a descartar.',
    codigo: 'CIE-10 I20.9',
  },
  {
    letra: 'P',
    titulo: 'Plan',
    texto: 'ECG y troponinas. Mantener losartán 50 mg c/24 h. Control con resultados.',
  },
]

const ANIO = new Date().getFullYear()

const textoPlano =(t: string) => t.replace(/\[\[|\]\]/g, '')

function Resaltado({ texto, hasta }: { texto: string; hasta: number }) {
  // Recorre el texto con marcas y corta en `hasta` caracteres visibles.
  const partes = texto.split(/(\[\[.*?\]\])/g).map((p) => {
    const esTermino = p.startsWith('[[')
    return { esTermino, limpio: esTermino ? p.slice(2, -2) : p }
  })
  const inicios = partes.map((_, i) =>
    partes.slice(0, i).reduce((n, p) => n + p.limpio.length, 0),
  )
  return (
    <>
      {partes.map(({ esTermino, limpio }, i) => {
        const restante = hasta - inicios[i]
        if (restante <= 0) return null
        const visible = limpio.slice(0, restante)
        return esTermino ? (
          <mark key={i} className="termino">
            {visible}
          </mark>
        ) : (
          <span key={i}>{visible}</span>
        )
      })}
    </>
  )
}

function DemoTranscripcion() {
  const reducido =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const total = CONSULTA.reduce((n, l) => n + textoPlano(l.texto).length, 0)
  const [chars, setChars] = useState(reducido ? total : 0)
  const terminado = chars >= total

  useEffect(() => {
    if (reducido) return
    if (terminado) {
      const t = setTimeout(() => setChars(0), 7000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setChars((c) => c + 2), 28)
    return () => clearTimeout(t)
  }, [chars, terminado, reducido])

  const lineas = CONSULTA.map((l, i) => {
    const largo = textoPlano(l.texto).length
    const previo = CONSULTA.slice(0, i).reduce((n, x) => n + textoPlano(x.texto).length, 0)
    const visibles = Math.max(0, Math.min(largo, chars - previo))
    return { ...l, visibles, largo }
  }).filter((l) => l.visibles > 0)

  const progresoNota = terminado ? NOTA.length : Math.floor((chars / total) * NOTA.length)

  return (
    <div className="demo" aria-label="Demostración de transcripción de una consulta médica">
      <div className="demo-barra">
        <span className={`grabando ${terminado ? 'pausa' : ''}`}>
          <span className="punto" /> {terminado ? 'Nota generada' : 'Escuchando consulta'}
        </span>
        <div className={`onda ${terminado ? 'quieta' : ''}`} aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 7) * 0.11}s` }} />
          ))}
        </div>
      </div>

      <div className="demo-cuerpo">
        <div className="transcripcion">
          <p className="etiqueta">Transcripción en vivo</p>
          {lineas.map((l, i) => (
            <p key={i} className={`linea ${l.quien === 'Médico' ? 'medico' : 'paciente'}`}>
              <strong>{l.quien}</strong>
              <span>
                <Resaltado texto={l.texto} hasta={l.visibles} />
                {l.visibles < l.largo && <span className="cursor" />}
              </span>
            </p>
          ))}
        </div>

        <div className="nota">
          <p className="etiqueta">Nota clínica · SOAP</p>
          {NOTA.map((n, i) => (
            <div key={n.letra} className={`soap ${i < progresoNota ? 'lista' : ''}`}>
              <span className="soap-letra">{n.letra}</span>
              <div>
                <p className="soap-titulo">
                  {n.titulo}
                  {n.codigo && <span className="codigo">{n.codigo}</span>}
                </p>
                <p className="soap-texto">{n.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PASOS = [
  {
    n: '01',
    titulo: 'Graba o importa una nota de voz de la consulta',
    texto: 'Desde el computador o el celular. Dictamed separa la voz del profesional y la del paciente.',
  },
  {
    n: '02',
    titulo: 'Transcribe con lenguaje clínico de manera inmediata',
    texto: 'Reconoce fármacos, dosis, signos vitales, abreviaturas y diagnósticos en español.',
  },
  {
    n: '03',
    titulo: 'Revisa, edita y firma el informe generado',
    texto: 'Recibes una nota estructurada lista para editar y copiar a tu ficha clínica.',
  },
]

const FUNCIONES = [
  {
    icono: 'M12 3v10m0 0a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 16v5m-3 0h6',
    titulo: 'Vocabulario médico',
    texto: 'Entrenado con terminología clínica: principios activos, posologías, procedimientos y abreviaturas de uso habitual.',
  },
  {
    icono: 'M8 4h8l3 3v13H5V4h3Zm0 6h8m-8 4h8m-8 4h5',
    titulo: 'Notas estructuradas',
    texto: 'Formato SOAP, anamnesis, epicrisis o la plantilla de tu especialidad, generadas a partir de la conversación.',
  },
  {
    icono: 'M4 7h16M4 12h10M4 17h6m9-4 2 2-4 4-2-2 4-4Z',
    titulo: 'Adaptabilidad con todo tipo de idioma',
    texto: 'Nuestro modelo puede transcribir consultas en español, inglés o cualquier tipo de idioma, sin perder precisión.',
  },
  {
    icono: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4',
    titulo: 'Privacidad del paciente',
    texto: 'Cifrado en tránsito y en reposo, control de acceso por profesional y eliminación del audio tras generar la nota.',
  },
  {
    icono: 'M7 8h10M7 12h6m-9 8 3-3h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14Z',
    titulo: 'Diarización de hablantes',
    texto: 'Distingue quién habla para que los síntomas del paciente no se confundan con las indicaciones médicas.',
  },
  {
    icono: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    titulo: 'Menos tiempo decifrando la nota',
    texto: 'Mira a tu paciente mientras hablas. La documentación se escribe sola y tú solo la revisas.',
  },
]

const ESPECIALIDADES = [
  'Medicina general',
  'Cardiología',
  'Pediatría',
  'Psiquiatría',
  'Traumatología',
  'Ginecología',
  'Medicina interna',
  'Kinesiología',
  'Nutrición',
  'Urgencias',
]

const PREGUNTAS = [
  {
    p: '¿Qué tan preciso es con términos médicos?',
    r: 'Dictamed está optimizado para el español clínico: reconoce nombres de fármacos, dosis, unidades y abreviaturas. Siempre puedes corregir la transcripción antes de guardar la nota.',
  },
  {
    p: '¿Qué pasa con el audio de mis pacientes?',
    r: 'El audio se procesa cifrado y se elimina una vez generada la nota. Solo el profesional que atendió tiene acceso al registro.',
  },
  {
    p: '¿Funciona con mi ficha clínica?',
    r: 'Puedes copiar la nota con un clic en cualquier sistema. Estamos trabajando en integraciones directas con fichas electrónicas.',
  },
  {
    p: '¿Reemplaza mi criterio clínico?',
    r: 'No. Dictamed documenta lo que se habló; las sugerencias de diagnóstico o código son solo propuestas que el profesional valida.',
  },
]

export default function Inicio() {
  return (
    <div className="inicio">

      <section className="hero">
        <div className="hero-texto">
          <span className="pildora">Transcripción de audio para profesionales de la salud</span>
          <h1>
            Tú atiendes al paciente.
            <br />
            <em>Dictamed escribe la ficha.</em>
          </h1>
          <p className="bajada">
            Convierte la conversación de tu consulta en una nota clínica estructurada, con terminología
            médica precisa, en segundos.
          </p>
          <div className="acciones">
            <a className="boton" href="#contacto">
              Probar gratis
            </a>
            <a className="boton boton-secundario" href="#como-funciona">
              Ver cómo funciona
            </a>
          </div>
          <ul className="garantias">
            <li>Español clínico</li>
            <li>Datos cifrados</li>
            <li>Sin instalar nada</li>
          </ul>
        </div>
        <DemoTranscripcion />
      </section>

      <section className="cifras" aria-label="Resultados">
        <div>
          <strong>-2 h</strong>
          <span>de documentación al día por profesional*</span>
        </div>
        <div>
          <strong>30 s</strong>
          <span>para tener la nota lista tras la consulta*</span>
        </div>
        <div>
          <strong>+10</strong>
          <span>especialidades con plantillas propias</span>
        </div>
      </section>

      <section id="como-funciona" className="seccion">
        <p className="sobretitulo">Cómo funciona</p>
        <h2>De la voz a la ficha clínica en tres pasos</h2>
        <div className="pasos">
          {PASOS.map((p) => (
            <article key={p.n} className="paso">
              <span className="paso-n">{p.n}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="comparacion seccion">
        <p className="sobretitulo">Por qué no un transcriptor genérico</p>
        <h2>Entiende cómo se habla en una consulta</h2>
        <div className="comparar">
          <div className="caja generico">
            <p className="caja-titulo">Transcriptor genérico</p>
            <p>
              “Paciente con <s>los artan</s> cincuenta, presión <s>ciento cuarenta y cinco noventa y dos</s>,
              pedimos <s>tropo ninas</s>.”
            </p>
          </div>
          <div className="caja dictamed">
            <p className="caja-titulo">Dictamed</p>
            <p>
              “Paciente con <mark className="termino">losartán 50 mg</mark>, PA{' '}
              <mark className="termino">145/92 mmHg</mark>, se solicitan{' '}
              <mark className="termino">troponinas</mark>.”
            </p>
          </div>
        </div>
      </section>

      <section id="funciones" className="seccion">
        <p className="sobretitulo">Funciones</p>
        <h2>Hecho para el trabajo clínico</h2>
        <div className="funciones">
          {FUNCIONES.map((f) => (
            <article key={f.titulo} className="funcion">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={f.icono} />
              </svg>
              <h3>{f.titulo}</h3>
              <p>{f.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seccion especialidades">
        <h2>Para cada especialidad</h2>
        <ul>
          {ESPECIALIDADES.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>

      <section id="preguntas" className="seccion preguntas">
        <p className="sobretitulo">Preguntas frecuentes</p>
        <h2>Lo que nos preguntan los profesionales</h2>
        {PREGUNTAS.map((q) => (
          <details key={q.p}>
            <summary>{q.p}</summary>
            <p>{q.r}</p>
          </details>
        ))}
      </section>

      <section id="contacto" className="cta">
        <h2>Recupera el tiempo que hoy pasas escribiendo</h2>
        <p>Agenda una demostración de 15 minutos y prueba Dictamed con tu propia consulta.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            alert('¡Gracias! Te contactaremos pronto.')
          }}
        >
          <input type="email" required placeholder="tu@correo.com" aria-label="Correo electrónico" />
          <button className="boton" type="submit">
            Solicitar demo
          </button>
        </form>
      </section>

      <footer className="pie">
        <span>© {ANIO} Dictamed</span>
        <span>* Cifras referenciales.</span>
      </footer>
    </div>
  )
}
