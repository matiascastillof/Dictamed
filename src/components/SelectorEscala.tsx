import { useState } from 'react'
import { AREAS, ESCALAS, formatearTotal } from '../data/escalas'
import type { TablaInforme } from '../utils/informe'

type Extra = { id: string; nombre: string; valor: string }

const nuevoId = () => crypto.randomUUID()

export default function SelectorEscala({ alAgregar }: { alAgregar: (tabla: TablaInforme) => void }) {
  const [area, setArea] = useState('')
  const [escalaId, setEscalaId] = useState('')
  // Índice de la opción elegida en cada ítem.
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [extras, setExtras] = useState<Extra[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoValor, setNuevoValor] = useState('')
  const [agregada, setAgregada] = useState<string | null>(null)

  const disponibles = area ? ESCALAS.filter((e) => e.area === area) : ESCALAS
  const escala = ESCALAS.find((e) => e.id === escalaId)

  function elegirEscala(id: string) {
    setEscalaId(id)
    setRespuestas({})
    setExtras([])
    setAgregada(null)
  }

  if (!escala) {
    return (
      <div className="escala">
        <div className="lugar-filtros">
          <label className="campo">
            <span className="campo-etiqueta">Área</span>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Todas las áreas</option>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="campo-etiqueta">Escala</span>
            <select value="" onChange={(e) => elegirEscala(e.target.value)}>
              <option value="" disabled>
                Selecciona una escala
              </option>
              {disponibles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        {agregada && (
          <p className="escala-agregada" role="status">
            ✓ Tabla “{agregada}” agregada al informe.
          </p>
        )}
      </div>
    )
  }

  const puntos = Object.fromEntries(
    escala.items.flatMap((item) =>
      respuestas[item.id] === undefined ? [] : [[item.id, item.opciones[respuestas[item.id]].puntos]],
    ),
  )
  const completos = Object.keys(puntos).length
  const listo = completos === escala.items.length
  const total = Object.values(puntos).reduce((a, b) => a + b, 0)
  const resultado = listo ? escala.interpretar(total, puntos) : null

  function agregarExtra() {
    if (!nuevoNombre.trim() || !nuevoValor.trim()) return
    setExtras((x) => [...x, { id: nuevoId(), nombre: nuevoNombre.trim(), valor: nuevoValor.trim() }])
    setNuevoNombre('')
    setNuevoValor('')
  }

  function agregarTabla() {
    if (!escala || !resultado) return
    alAgregar({
      id: nuevoId(),
      titulo: escala.nombre,
      filas: [
        ...escala.items.map((item) => {
          const opcion = item.opciones[respuestas[item.id]]
          return { parametro: item.nombre, valor: opcion.texto, puntos: opcion.puntos }
        }),
        ...extras.map((x) => ({ parametro: x.nombre, valor: x.valor, puntos: null })),
      ],
      total: formatearTotal(escala, total),
      interpretacion: resultado.texto,
      nivel: resultado.nivel,
    })
    setAgregada(escala.nombre)
    setEscalaId('')
    setRespuestas({})
    setExtras([])
  }

  return (
    <div className="escala">
      <div className="escala-cabecera">
        <div>
          <strong>{escala.nombre}</strong>
          <span>{escala.descripcion}</span>
        </div>
        <button type="button" className="editar" onClick={() => elegirEscala('')}>
          Cambiar
        </button>
      </div>

      <ol className="escala-items">
        {escala.items.map((item) => (
          <li key={item.id}>
            <label className="campo">
              <span className="campo-etiqueta">{item.nombre}</span>
              <select
                value={respuestas[item.id] ?? ''}
                onChange={(e) => setRespuestas((r) => ({ ...r, [item.id]: Number(e.target.value) }))}
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {item.opciones.map((o, i) => (
                  <option key={i} value={i}>
                    {o.texto} ({escala.conSigno && o.puntos > 0 ? `+${o.puntos}` : o.puntos})
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ol>

      {extras.length > 0 && (
        <ul className="escala-extras">
          {extras.map((x) => (
            <li key={x.id}>
              <span>
                <strong>{x.nombre}:</strong> {x.valor}
              </span>
              <button
                type="button"
                className="escala-quitar"
                aria-label={`Quitar ${x.nombre}`}
                onClick={() => setExtras((lista) => lista.filter((y) => y.id !== x.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="escala-nuevo">
        <legend>Agregar parámetro</legend>
        <input
          placeholder="Parámetro (ej: Pupilas)"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
        />
        <input
          placeholder="Valor (ej: Isocóricas reactivas)"
          value={nuevoValor}
          onChange={(e) => setNuevoValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregarExtra()
            }
          }}
        />
        <button
          type="button"
          className="boton-volver"
          onClick={agregarExtra}
          disabled={!nuevoNombre.trim() || !nuevoValor.trim()}
        >
          + Agregar
        </button>
        <p>Los parámetros agregados se incluyen en la tabla, pero no suman al puntaje de la escala.</p>
      </fieldset>

      <div className={`escala-resultado ${resultado ? `nivel-${resultado.nivel}` : ''}`} aria-live="polite">
        {resultado ? (
          <>
            <strong>{formatearTotal(escala, total)}</strong>
            <span>{resultado.texto}</span>
          </>
        ) : (
          <span>
            Completa los parámetros ({completos} de {escala.items.length})
          </span>
        )}
      </div>

      <button type="button" className="boton-registro escala-agregar" onClick={agregarTabla} disabled={!listo}>
        Agregar tabla
      </button>
    </div>
  )
}
