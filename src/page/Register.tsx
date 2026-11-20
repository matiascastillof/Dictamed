import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../css/Register.css'
import { REGIONES } from '../data/regiones'
import { ESPECIALIDADES, OTRA, PROFESIONES, type Profesion } from '../data/especialidades'
import { formatearRut, limpiarRut, validarRut } from '../utils/rut'
import { ErrorRegistro, registrarProfesional } from '../services/profesionales'
import { useSesion } from '../hooks/useSesion'

export type DatosRegistro = {
  nombre: string
  apellidos: string
  rut: string
  correo: string
  contrasena: string
  confirmacion: string
  profesion: Profesion | ''
  especialidad: string
  especialidadOtra: string
  region: string
  comuna: string
}

const VACIO: DatosRegistro = {
  nombre: '',
  apellidos: '',
  rut: '',
  correo: '',
  contrasena: '',
  confirmacion: '',
  profesion: '',
  especialidad: '',
  especialidadOtra: '',
  region: '',
  comuna: '',
}

type Errores = Partial<Record<keyof DatosRegistro, string>>

const SOLO_NOMBRE = /^[\p{L}' -]+$/u
// Acepta cualquier dominio.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const ordenar = (lista: string[]) => [...lista].sort((a, b) => a.localeCompare(b, 'es'))

function validarNombre(v: string, campo: string) {
  const t = v.trim()
  if (!t) return `Ingresa tu ${campo}.`
  if (t.length < 2) return `Tu ${campo} debe tener al menos 2 letras.`
  if (!SOLO_NOMBRE.test(t)) return `Tu ${campo} solo puede contener letras.`
}

type Paso = {
  id: string
  titulo: string
  bajada: string
  validar: (d: DatosRegistro) => Errores
}

const PASOS: Paso[] = [
  {
    id: 'nombre',
    titulo: '¿Cómo te llamas?',
    bajada: 'Así aparecerá tu nombre en las notas clínicas que generes.',
    validar: (d) => ({
      nombre: validarNombre(d.nombre, 'nombre'),
      apellidos: validarNombre(d.apellidos, 'apellido'),
    }),
  },
  {
    id: 'rut',
    titulo: '¿Cuál es tu RUT?',
    bajada: 'Lo usamos para validar tu identidad como profesional de la salud.',
    validar: (d) => ({
      rut: !d.rut ? 'Ingresa tu RUT.' : !validarRut(d.rut) ? 'El RUT no es válido. Revisa el dígito verificador.' : undefined,
    }),
  },
  {
    id: 'correo',
    titulo: '¿Cuál es tu correo electrónico?',
    bajada: 'Lo usaremos para comunicarnos contigo y para que accedas a tu cuenta.',
    validar: (d) => ({
      correo: !d.correo.trim()
        ? 'Ingresa tu correo electrónico.'
        : !CORREO.test(d.correo.trim())
          ? 'Revisa el formato del correo (ej: nombre@dominio.cl).'
          : undefined,
    }),
  },
  {
    id: 'contrasena',
    titulo: 'Crea una contraseña',
    bajada: 'La usarás junto a tu correo para iniciar sesión en Dictamed.',
    validar: (d) => ({
      contrasena: !d.contrasena
        ? 'Crea una contraseña.'
        : d.contrasena.length < 8
          ? 'Debe tener al menos 8 caracteres.'
          : !/\d/.test(d.contrasena) || !/\p{L}/u.test(d.contrasena)
            ? 'Debe incluir al menos una letra y un número.'
            : undefined,
      confirmacion: !d.confirmacion
        ? 'Repite tu contraseña.'
        : d.confirmacion !== d.contrasena
          ? 'Las contraseñas no coinciden.'
          : undefined,
    }),
  },
  {
    id: 'profesion',
    titulo: '¿Cuál es tu profesión?',
    bajada: 'Adaptamos el vocabulario y las plantillas a tu rol.',
    validar: (d) => ({ profesion: d.profesion ? undefined : 'Selecciona una opción.' }),
  },
  {
    id: 'especialidad',
    titulo: '¿En qué área te especializas?',
    bajada: 'Elige el área en la que trabajas principalmente.',
    validar: (d) => ({
      especialidad: !d.especialidad
        ? 'Selecciona un área.'
        : d.especialidad === OTRA && !d.especialidadOtra.trim()
          ? 'Escribe tu área de especialización.'
          : undefined,
    }),
  },
  {
    id: 'ubicacion',
    titulo: '¿Dónde trabajas?',
    bajada: 'Indica la región y comuna de tu lugar de trabajo principal.',
    validar: (d) => ({
      region: d.region ? undefined : 'Selecciona una región.',
      comuna: d.comuna ? undefined : 'Selecciona una comuna.',
    }),
  },
  {
    id: 'resumen',
    titulo: 'Revisa tus datos',
    bajada: 'Confirma que todo esté correcto antes de crear tu cuenta.',
    validar: () => ({}),
  },
]

const limpiarErrores = (e: Errores): Errores =>
  Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errores

function Campo({
  etiqueta,
  error,
  ayuda,
  children,
}: {
  etiqueta: string
  error?: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <label className={`campo ${error ? 'con-error' : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      {children}
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : (
        ayuda && <span className="campo-ayuda">{ayuda}</span>
      )}
    </label>
  )
}

const ICONOS: Record<Profesion, string> = {
  medico: 'M6 3v5a4 4 0 0 0 8 0V3M10 12v2a6 6 0 0 0 12 0v-1m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  enfermero:
    'M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11Zm0-11.5v5m-2.5-2.5h5',
  tens: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M9 11h6M9 15h6M9 19h3',
}

export default function Register({
  alEnviar,
}: {
  alEnviar?: (datos: DatosRegistro) => void | Promise<void>
}) {
  const { usuario } = useSesion()
  const [datos, setDatos] = useState<DatosRegistro>(VACIO)
  const [pasoId, setPasoId] = useState(PASOS[0].id)
  const [errores, setErrores] = useState<Errores>({})
  const [busqueda, setBusqueda] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<{ mensaje: string; paso?: string } | null>(null)
  const slidesRef = useRef<(HTMLDivElement | null)[]>([])

  // Si ya inició sesión (por ejemplo con Google), no se piden correo ni contraseña.
  const pasos = useMemo(
    () => (usuario ? PASOS.filter((p) => p.id !== 'correo' && p.id !== 'contrasena') : PASOS),
    [usuario],
  )
  const paso = Math.max(0, pasos.findIndex((p) => p.id === pasoId))
  const actual = pasos[paso]
  const esUltimo = paso === pasos.length - 1

  // Con sesión de Google, completa correo y nombre con los datos de la cuenta (una vez por usuario).
  const [prellenadoPara, setPrellenadoPara] = useState<string | null>(null)
  if (usuario && prellenadoPara !== usuario.id) {
    setPrellenadoPara(usuario.id)
    const meta = usuario.user_metadata ?? {}
    const [nombre = '', ...resto] = String(meta.full_name ?? meta.name ?? '').trim().split(/\s+/)
    setDatos((d) => ({
      ...d,
      correo: usuario.email ?? d.correo,
      nombre: d.nombre || String(meta.given_name ?? nombre),
      apellidos: d.apellidos || String(meta.family_name ?? resto.join(' ')),
    }))
  }

  const especialidades = useMemo(() => {
    if (!datos.profesion) return []
    const lista = ordenar(ESPECIALIDADES[datos.profesion])
    const q = busqueda
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
    const filtrada = q
      ? lista.filter((e) =>
          e.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes(q),
        )
      : lista
    return [...filtrada, OTRA]
  }, [datos.profesion, busqueda])

  const comunas = useMemo(
    () => ordenar(REGIONES.find((r) => r.nombre === datos.region)?.comunas ?? []),
    [datos.region],
  )

  // Al cambiar de paso, enfoca el primer campo de la nueva diapositiva.
  useEffect(() => {
    const slide = slidesRef.current[paso]
    const primero = slide?.querySelector<HTMLElement>('input, select, button.editar')
    const t = setTimeout(() => primero?.focus({ preventScroll: true }), 320)
    return () => clearTimeout(t)
  }, [paso])

  function cambiar<K extends keyof DatosRegistro>(campo: K, valor: DatosRegistro[K]) {
    setDatos((d) => {
      const nuevo = { ...d, [campo]: valor }
      if (campo === 'profesion' && valor !== d.profesion) {
        nuevo.especialidad = ''
        nuevo.especialidadOtra = ''
      }
      if (campo === 'region' && valor !== d.region) nuevo.comuna = ''
      return nuevo
    })
    if (campo === 'profesion') setBusqueda('')
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  async function siguiente() {
    const e = limpiarErrores(actual.validar(datos))
    setErrores(e)
    if (Object.keys(e).length) return

    if (!esUltimo) {
      setPasoId(pasos[paso + 1].id)
      return
    }

    setEnviando(true)
    setErrorEnvio(null)
    try {
      const final = {
        ...datos,
        nombre: datos.nombre.trim(),
        apellidos: datos.apellidos.trim(),
        correo: datos.correo.trim().toLowerCase(),
        rut: limpiarRut(datos.rut),
      }
      await (alEnviar ?? registrarProfesional)(final)
      setListo(true)
    } catch (err) {
      if (err instanceof ErrorRegistro) {
        setErrorEnvio({ mensaje: err.message, paso: err.campo })
      } else {
        console.error(err)
        setErrorEnvio({ mensaje: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  function irA(id: string) {
    setErrores({})
    setErrorEnvio(null)
    setPasoId(id)
  }

  const nombreProfesion = PROFESIONES.find((p) => p.id === datos.profesion)?.nombre
  const especialidadFinal =
    datos.especialidad === OTRA ? datos.especialidadOtra.trim() : datos.especialidad

  if (listo) {
    return (
      <div className="registro">
        <main className="registro-contenedor">
          <div className="registro-tarjeta registro-listo">
            <div className="listo-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
            </div>
            <h1>¡Bienvenido/a, {datos.nombre.trim()}!</h1>
            <p>
              Tu cuenta quedó creada con el correo{' '}
              <strong>{datos.correo.trim().toLowerCase()}</strong> y ya iniciaste sesión.
            </p>
            <Link className="boton-registro" to="/">
              Ir al inicio
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const resumen: { etiqueta: string; valor: string; paso?: string }[] = [
    { etiqueta: 'Nombre', valor: `${datos.nombre.trim()} ${datos.apellidos.trim()}`, paso: 'nombre' },
    { etiqueta: 'RUT', valor: datos.rut, paso: 'rut' },
    // Con sesión de Google el correo viene de la cuenta y no se puede editar aquí.
    { etiqueta: 'Correo', valor: datos.correo.trim().toLowerCase(), paso: usuario ? undefined : 'correo' },
    { etiqueta: 'Profesión', valor: nombreProfesion ?? '', paso: 'profesion' },
    { etiqueta: 'Especialidad', valor: especialidadFinal, paso: 'especialidad' },
    { etiqueta: 'Ubicación', valor: `${datos.comuna}, ${datos.region}`, paso: 'ubicacion' },
  ]

  return (
    <div className="registro">
      <main className="registro-contenedor">
        <div className="registro-tarjeta">
          <div className="progreso">
            <div className="progreso-texto">
              <span>
                Paso {paso + 1} de {pasos.length}
              </span>
              <span>{Math.round(((paso + 1) / pasos.length) * 100)}%</span>
            </div>
            <div
              className="progreso-barra"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={pasos.length}
              aria-valuenow={paso + 1}
              aria-label="Progreso del registro"
            >
              <span style={{ width: `${((paso + 1) / pasos.length) * 100}%` }} />
            </div>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              siguiente()
            }}
          >
            <div className="slides">
              <div className="slides-pista" style={{ transform: `translateX(-${paso * 100}%)` }}>
                {pasos.map((p, i) => (
                  <div
                    key={p.id}
                    className="slide"
                    ref={(el) => {
                      slidesRef.current[i] = el
                    }}
                    inert={i !== paso}
                    aria-hidden={i !== paso}
                  >
                    <h1>{p.titulo}</h1>
                    <p className="slide-bajada">{p.bajada}</p>

                    {p.id === 'nombre' && (
                      <div className="campos">
                        <Campo etiqueta="Nombre" error={errores.nombre}>
                          <input
                            type="text"
                            autoComplete="given-name"
                            placeholder="Ej: Camila"
                            value={datos.nombre}
                            onChange={(e) => cambiar('nombre', e.target.value)}
                          />
                        </Campo>
                        <Campo etiqueta="Apellido(s)" error={errores.apellidos}>
                          <input
                            type="text"
                            autoComplete="family-name"
                            placeholder="Ej: Rojas Muñoz"
                            value={datos.apellidos}
                            onChange={(e) => cambiar('apellidos', e.target.value)}
                          />
                        </Campo>
                      </div>
                    )}

                    {p.id === 'rut' && (
                      <Campo
                        etiqueta="RUT"
                        error={errores.rut}
                        ayuda="Solo números y K. Los puntos y el guión se agregan solos."
                      >
                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="off"
                          placeholder="12.345.678-9"
                          maxLength={12}
                          value={datos.rut}
                          onChange={(e) => cambiar('rut', formatearRut(e.target.value))}
                          onKeyDown={(e) => {
                            // Bloquea cualquier tecla de carácter que no sea número o K.
                            if (
                              e.key.length === 1 &&
                              !e.ctrlKey &&
                              !e.metaKey &&
                              !/[0-9kK]/.test(e.key)
                            ) {
                              e.preventDefault()
                            }
                          }}
                        />
                      </Campo>
                    )}

                    {p.id === 'correo' && (
                      <Campo etiqueta="Correo electrónico" error={errores.correo}>
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="off"
                          spellCheck={false}
                          placeholder="nombre@dominio.cl"
                          value={datos.correo}
                          onChange={(e) => cambiar('correo', e.target.value)}
                        />
                      </Campo>
                    )}

                    {p.id === 'contrasena' && (
                      <div className="campos">
                        <Campo
                          etiqueta="Contraseña"
                          error={errores.contrasena}
                          ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
                        >
                          <div className="campo-contrasena">
                            <input
                              type={verContrasena ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={datos.contrasena}
                              onChange={(e) => cambiar('contrasena', e.target.value)}
                            />
                            <button
                              type="button"
                              className="ver-contrasena"
                              onClick={() => setVerContrasena((v) => !v)}
                            >
                              {verContrasena ? 'Ocultar' : 'Mostrar'}
                            </button>
                          </div>
                        </Campo>
                        <Campo etiqueta="Repite la contraseña" error={errores.confirmacion}>
                          <input
                            type={verContrasena ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={datos.confirmacion}
                            onChange={(e) => cambiar('confirmacion', e.target.value)}
                          />
                        </Campo>
                      </div>
                    )}

                    {p.id === 'profesion' && (
                      <fieldset className="opciones">
                        <legend className="sr-only">Profesión</legend>
                        {PROFESIONES.map((pr) => (
                          <label
                            key={pr.id}
                            className={`opcion ${datos.profesion === pr.id ? 'elegida' : ''}`}
                          >
                            <input
                              type="radio"
                              name="profesion"
                              value={pr.id}
                              checked={datos.profesion === pr.id}
                              onChange={() => cambiar('profesion', pr.id)}
                            />
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d={ICONOS[pr.id]} />
                            </svg>
                            <span>
                              <strong>{pr.nombre}</strong>
                              <small>{pr.detalle}</small>
                            </span>
                          </label>
                        ))}
                        {errores.profesion && (
                          <span className="campo-error" role="alert">
                            {errores.profesion}
                          </span>
                        )}
                      </fieldset>
                    )}

                    {p.id === 'especialidad' && (
                      <div className="campos">
                        <Campo etiqueta={`Buscar área${nombreProfesion ? ` · ${nombreProfesion}` : ''}`}>
                          <input
                            type="search"
                            placeholder="Ej: Cardiología"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          />
                        </Campo>
                        <fieldset className="lista-areas">
                          <legend className="sr-only">Área de especialización</legend>
                          {especialidades.map((esp) => (
                            <label
                              key={esp}
                              className={`area ${datos.especialidad === esp ? 'elegida' : ''}`}
                            >
                              <input
                                type="radio"
                                name="especialidad"
                                value={esp}
                                checked={datos.especialidad === esp}
                                onChange={() => cambiar('especialidad', esp)}
                              />
                              {esp}
                            </label>
                          ))}
                        </fieldset>
                        {datos.especialidad === OTRA && (
                          <Campo etiqueta="¿Cuál?" error={errores.especialidadOtra}>
                            <input
                              type="text"
                              placeholder="Escribe tu área"
                              value={datos.especialidadOtra}
                              onChange={(e) => cambiar('especialidadOtra', e.target.value)}
                            />
                          </Campo>
                        )}
                        {errores.especialidad && (
                          <span className="campo-error" role="alert">
                            {errores.especialidad}
                          </span>
                        )}
                      </div>
                    )}

                    {p.id === 'ubicacion' && (
                      <div className="campos">
                        <Campo etiqueta="Región" error={errores.region}>
                          <select
                            value={datos.region}
                            onChange={(e) => cambiar('region', e.target.value)}
                          >
                            <option value="" disabled>
                              Selecciona tu región
                            </option>
                            {REGIONES.map((r) => (
                              <option key={r.nombre} value={r.nombre}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        </Campo>
                        <Campo etiqueta="Comuna" error={errores.comuna}>
                          <select
                            value={datos.comuna}
                            disabled={!datos.region}
                            onChange={(e) => cambiar('comuna', e.target.value)}
                          >
                            <option value="" disabled>
                              {datos.region ? 'Selecciona tu comuna' : 'Primero elige una región'}
                            </option>
                            {comunas.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </Campo>
                      </div>
                    )}

                    {p.id === 'resumen' && (
                      <dl className="resumen">
                        {resumen.map((r) => (
                          <div key={r.etiqueta}>
                            <dt>{r.etiqueta}</dt>
                            <dd>{r.valor}</dd>
                            {r.paso ? (
                              <button type="button" className="editar" onClick={() => irA(r.paso!)}>
                                Editar
                              </button>
                            ) : (
                              <span />
                            )}
                          </div>
                        ))}
                      </dl>
                    )}

                    {p.id === 'resumen' && errorEnvio && (
                      <div className="registro-alerta" role="alert">
                        <p>{errorEnvio.mensaje}</p>
                        {errorEnvio.paso !== undefined && (
                          <button type="button" className="editar" onClick={() => irA(errorEnvio.paso!)}>
                            Corregir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="registro-botones">
              {paso > 0 && (
                <button type="button" className="boton-volver" onClick={() => irA(pasos[paso - 1].id)}>
                  Atrás
                </button>
              )}
              <button type="submit" className="boton-registro" disabled={enviando}>
                {esUltimo ? (enviando ? 'Creando cuenta…' : 'Crear cuenta') : 'Continuar'}
              </button>
            </div>
          </form>
        </div>

        <p className="registro-login">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
        <p className="registro-legal">
          Al registrarte aceptas los términos de uso y la política de privacidad de Dictamed.
        </p>
      </main>
    </div>
  )
}
