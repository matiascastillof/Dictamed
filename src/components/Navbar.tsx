import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../css/Navbar.css'

type Enlace = { texto: string; href: string }

const ENLACES: Enlace[] = [
  { texto: 'Inicio', href: '/' },
  { texto: 'Cómo funciona', href: '/#como-funciona' },
  { texto: 'Funciones', href: '/#funciones' },
  { texto: 'Preguntas', href: '/#preguntas' },
]

export default function Navbar({ enlaces = ENLACES }: { enlaces?: Enlace[] }) {
  const [menuUsuario, setMenuUsuario] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)
  const usuarioRef = useRef<HTMLDivElement>(null)

  // Cierra el menú de usuario al hacer clic afuera o presionar Escape.
  useEffect(() => {
    if (!menuUsuario && !menuMovil) return
    const alClic = (e: MouseEvent) => {
      if (usuarioRef.current && !usuarioRef.current.contains(e.target as Node)) {
        setMenuUsuario(false)
      }
    }
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuUsuario(false)
        setMenuMovil(false)
      }
    }
    document.addEventListener('mousedown', alClic)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', alClic)
      document.removeEventListener('keydown', alTecla)
    }
  }, [menuUsuario, menuMovil])

  return (
    <header className="navbar">
      <Link className="navbar-marca" to="/">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="9" />
          <path d="M6 16h4l2-5 3 10 3-8 2 3h6" />
        </svg>
        Dictamed
      </Link>

      <nav className={`navbar-enlaces ${menuMovil ? 'abierto' : ''}`} aria-label="Principal">
        {enlaces.map((e) => (
          <a key={e.href} href={e.href} onClick={() => setMenuMovil(false)}>
            {e.texto}
          </a>
        ))}
      </nav>

      <div className="navbar-acciones">
        <div className="navbar-usuario" ref={usuarioRef}>
          <button
            type="button"
            className="navbar-icono"
            aria-label="Cuenta de usuario"
            aria-haspopup="menu"
            aria-expanded={menuUsuario}
            onClick={() => {
              setMenuUsuario((v) => !v)
              setMenuMovil(false)
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </button>

          {menuUsuario && (
            <div className="navbar-menu" role="menu">
              <p className="navbar-menu-titulo">Bienvenido a Dictamed</p>
              <Link role="menuitem" className="navbar-menu-principal" to="/login" onClick={() => setMenuUsuario(false)}>
                Iniciar sesión
              </Link>
              <Link role="menuitem" className="navbar-menu-secundario" to="/registro" onClick={() => setMenuUsuario(false)}>
                Registrarse
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="navbar-icono navbar-hamburguesa"
          aria-label={menuMovil ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuMovil}
          onClick={() => {
            setMenuMovil((v) => !v)
            setMenuUsuario(false)
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {menuMovil ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
    </header>
  )
}
