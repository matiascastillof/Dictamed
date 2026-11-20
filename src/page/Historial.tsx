import { useState } from 'react'
import { Link } from 'react-router-dom'

type Transcripcion = { id: string; titulo: string; fecha: string; resumen: string }

export default function Historial() {
  const [busqueda, setBusqueda] = useState('')
  // Se llenará cuando las transcripciones se guarden en la base de datos.
  const transcripciones: Transcripcion[] = []

  const texto = busqueda.trim().toLowerCase()
  const visibles = transcripciones.filter(
    (t) => !texto || t.titulo.toLowerCase().includes(texto) || t.resumen.toLowerCase().includes(texto),
  )

  return (
    <div className="privada-pagina">
      <header className="privada-cabecera">
        <h1>Mis transcripciones</h1>
        <p>Aquí encontrarás todas las notas clínicas generadas a partir de tus consultas.</p>
      </header>

      <label className="campo historial-buscar">
        <span className="sr-only">Buscar transcripciones</span>
        <input
          type="search"
          placeholder="Buscar por paciente, fecha o diagnóstico…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={transcripciones.length === 0}
        />
      </label>

      {visibles.length === 0 ? (
        <section className="registro-tarjeta historial-vacio">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />
          </svg>
          <h2>Aún no tienes transcripciones</h2>
          <p>Cuando grabes o subas tu primera consulta, aparecerá aquí.</p>
          <Link className="boton-registro" to="../transcribir">
            Crear mi primera transcripción
          </Link>
        </section>
      ) : (
        <ul className="historial-lista">
          {visibles.map((t) => (
            <li key={t.id} className="registro-tarjeta">
              <span>{t.fecha}</span>
              <h2>{t.titulo}</h2>
              <p>{t.resumen}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
