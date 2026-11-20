import { useEffect, useMemo, useState } from 'react'
import { REGIONES } from '../data/regiones'
import {
  CATEGORIAS,
  centrosDeRegion,
  claveComuna,
  normalizar,
  type Categoria,
  type Centro,
} from '../data/centros'

export type Lugar =
  | { tipo: 'centro'; region: string; centro: Centro }
  | { tipo: 'particular'; region: string; nombre: string }

type Props = {
  regionInicial: string
  comunaInicial: string
  valor: Lugar | null
  alCambiar: (lugar: Lugar | null) => void
}

const POR_PAGINA = 30

export default function LugarTrabajo({ regionInicial, comunaInicial, valor, alCambiar }: Props) {
  const [region, setRegion] = useState(regionInicial)
  const [comuna, setComuna] = useState(comunaInicial)
  const [categoria, setCategoria] = useState<Categoria | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [limite, setLimite] = useState(POR_PAGINA)
  const [particular, setParticular] = useState('')
  const [modoParticular, setModoParticular] = useState(false)
  const [cargados, setCargados] = useState<{ region: string; centros: Centro[] } | null>(null)

  useEffect(() => {
    let activo = true
    centrosDeRegion(region).then((centros) => {
      if (activo) setCargados({ region, centros })
    })
    return () => {
      activo = false
    }
  }, [region])

  const cargando = cargados?.region !== region
  const centros = useMemo(() => (cargando ? [] : (cargados?.centros ?? [])), [cargando, cargados])

  // Comunas que tienen centros en la región elegida.
  const comunas = useMemo(
    () => [...new Set(centros.map((c) => c.comuna))].sort((a, b) => a.localeCompare(b, 'es')),
    [centros],
  )
  // La comuna del perfil puede venir escrita distinto ("Concón" / "Con Con").
  const comunaClave = claveComuna(comuna)
  const comunaValida = comunas.find((c) => claveComuna(c) === comunaClave) ?? ''

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda)
    return centros.filter(
      (c) =>
        (!comunaValida || c.comuna === comunaValida) &&
        (!categoria || c.categoria === categoria) &&
        (!texto || normalizar(`${c.nombre} ${c.tipo} ${c.direccion ?? ''}`).includes(texto)),
    )
  }, [centros, comunaValida, categoria, busqueda])

  if (valor) {
    return (
      <div className="lugar-elegido">
        <div>
          <strong>{valor.tipo === 'centro' ? valor.centro.nombre : valor.nombre}</strong>
          <span>
            {valor.tipo === 'centro'
              ? `${valor.centro.tipo} · ${valor.centro.comuna}`
              : `Consulta particular · ${valor.region}`}
          </span>
        </div>
        <button type="button" className="editar" onClick={() => alCambiar(null)}>
          Cambiar
        </button>
      </div>
    )
  }

  if (modoParticular) {
    return (
      <form
        className="lugar-particular"
        onSubmit={(e) => {
          e.preventDefault()
          if (particular.trim()) alCambiar({ tipo: 'particular', region, nombre: particular.trim() })
        }}
      >
        <label className="campo">
          <span className="campo-etiqueta">Nombre o dirección de tu consulta</span>
          <input
            autoFocus
            placeholder="Ej: Consulta Dr. Pérez, Av. Libertad 123"
            value={particular}
            onChange={(e) => setParticular(e.target.value)}
          />
        </label>
        <div className="lugar-botones">
          <button type="button" className="boton-volver" onClick={() => setModoParticular(false)}>
            Volver a la lista
          </button>
          <button type="submit" className="boton-registro" disabled={!particular.trim()}>
            Usar este lugar
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="lugar">
      <div className="lugar-filtros">
        <label className="campo">
          <span className="campo-etiqueta">Región</span>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setComuna('')
              setLimite(POR_PAGINA)
            }}
          >
            {REGIONES.map((r) => (
              <option key={r.nombre}>{r.nombre}</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="campo-etiqueta">Comuna</span>
          <select
            value={comunaValida}
            disabled={cargando}
            onChange={(e) => {
              setComuna(e.target.value)
              setLimite(POR_PAGINA)
            }}
          >
            <option value="">Todas las comunas</option>
            {comunas.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="lugar-categorias" role="group" aria-label="Tipo de centro">
        {[{ id: '' as const, nombre: 'Todos' }, ...CATEGORIAS].map((c) => (
          <button
            key={c.id}
            type="button"
            className={categoria === c.id ? 'activa' : ''}
            aria-pressed={categoria === c.id}
            onClick={() => {
              setCategoria(c.id)
              setLimite(POR_PAGINA)
            }}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <label className="campo">
        <span className="sr-only">Buscar centro</span>
        <input
          type="search"
          placeholder="Buscar por nombre o dirección…"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setLimite(POR_PAGINA)
          }}
        />
      </label>

      <p className="lugar-total" aria-live="polite">
        {cargando
          ? 'Cargando centros…'
          : `${filtrados.length} ${filtrados.length === 1 ? 'centro' : 'centros'}${comunaValida ? ` en ${comunaValida}` : ''}`}
      </p>

      {!cargando && (
        <ul className="lugar-lista">
          {filtrados.slice(0, limite).map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => alCambiar({ tipo: 'centro', region, centro: c })}>
                <strong>{c.nombre}</strong>
                <span>
                  {c.tipo} · {c.comuna}
                  {c.direccion ? ` · ${c.direccion}` : ''}
                </span>
              </button>
            </li>
          ))}
          {filtrados.length > limite && (
            <li>
              <button type="button" className="lugar-mas" onClick={() => setLimite((l) => l + POR_PAGINA)}>
                Ver más ({filtrados.length - limite} restantes)
              </button>
            </li>
          )}
        </ul>
      )}

      <button type="button" className="lugar-otro" onClick={() => setModoParticular(true)}>
        ¿Atiendes en una consulta particular o no encuentras tu centro? <strong>Escríbelo aquí</strong>
      </button>
    </div>
  )
}
