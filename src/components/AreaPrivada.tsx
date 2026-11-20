import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import '../css/Register.css'
import '../css/AreaPrivada.css'
import { useSesion } from '../hooks/useSesion'
import type { ContextoPrivado } from '../hooks/useAreaPrivada'
import { cerrarSesion } from '../services/auth'
import { obtenerPerfil, type Perfil } from '../services/profesionales'

const SECCIONES = [
  {
    ruta: 'transcribir',
    texto: 'Nueva transcripción',
    icono: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />,
  },
  {
    ruta: 'historial',
    texto: 'Mis transcripciones',
    icono: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  },
  {
    ruta: 'perfil',
    texto: 'Mi perfil',
    icono: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
]

/** Si el enlace del correo de confirmación falló, Supabase lo indica en la URL. */
function enlaceInvalido() {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1))
  return Boolean(params.get('error') || params.get('error_code'))
}

/**
 * Contenedor de las páginas solo para usuarios registrados: sin sesión lleva a
 * /login y si falta la ficha profesional lleva a /registro.
 */
export default function AreaPrivada() {
  const navigate = useNavigate()
  const { usuario, cargando } = useSesion()
  const [invalido] = useState(enlaceInvalido)
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    if (cargando) return
    if (!usuario) {
      if (!invalido) navigate('/login', { replace: true })
      return
    }
    let activo = true
    obtenerPerfil(usuario.id).then((p) => {
      if (!activo) return
      // Entró con Google pero no ha completado su ficha.
      if (!p) navigate('/registro', { replace: true })
      else setPerfil(p)
    })
    return () => {
      activo = false
    }
  }, [usuario, cargando, invalido, navigate])

  if (!cargando && !usuario && invalido) {
    return (
      <div className="registro privada">
        <main className="privada-centro">
          <div className="registro-tarjeta privada-aviso">
            <h1>El enlace no es válido</h1>
            <p>El enlace expiró o ya fue usado. Si ya confirmaste tu cuenta, inicia sesión.</p>
            <Link className="boton-registro" to="/login">
              Iniciar sesión
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!usuario || !perfil || perfil.id !== usuario.id) {
    return (
      <div className="registro privada">
        <main className="privada-centro">
          <p className="privada-cargando">Cargando tu espacio…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="registro privada">
      <div className="privada-layout">
        <aside className="privada-menu">
          <div className="privada-usuario">
            <span className="privada-avatar" aria-hidden="true">
              {`${perfil.nombre[0] ?? ''}${perfil.apellidos[0] ?? ''}`.toUpperCase()}
            </span>
            <div>
              <strong>{perfil.nombre}</strong>
              <span>{perfil.especialidad}</span>
            </div>
          </div>

          <nav aria-label="Mi espacio">
            {SECCIONES.map((s) => (
              <NavLink key={s.ruta} to={s.ruta} className="privada-enlace">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {s.icono}
                </svg>
                {s.texto}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="privada-salir"
            onClick={async () => {
              await cerrarSesion()
              navigate('/')
            }}
          >
            Cerrar sesión
          </button>
        </aside>

        <main className="privada-contenido">
          <Outlet context={{ usuario, perfil } satisfies ContextoPrivado} />
        </main>
      </div>
    </div>
  )
}
