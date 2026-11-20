import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/Register.css'
import '../css/Login.css'
import { useSesion } from '../hooks/useSesion'
import { ErrorAuth, iniciarConGoogle, iniciarSesion, tienePerfil } from '../services/auth'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Si Google o Supabase devuelven un error en la URL al volver, lo muestra. */
function errorEnUrl(): string | null {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1))
  return params.get('error_description') || params.get('error')
    ? 'No pudimos iniciar sesión con Google. Inténtalo nuevamente.'
    : null
}

export default function Login() {
  const navigate = useNavigate()
  const { usuario, cargando } = useSesion()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({})
  const [error, setError] = useState<string | null>(errorEnUrl)
  const [enviando, setEnviando] = useState<'correo' | 'google' | null>(null)

  // Con sesión iniciada: al inicio si ya tiene ficha, o a completar el registro si no.
  useEffect(() => {
    if (!usuario) return
    let activo = true
    tienePerfil(usuario.id).then((existe) => {
      if (activo) navigate(existe ? '/' : '/registro', { replace: true })
    })
    return () => {
      activo = false
    }
  }, [usuario, navigate])

  async function alEnviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const nuevos = {
      correo: !correo.trim()
        ? 'Ingresa tu correo electrónico.'
        : !CORREO.test(correo.trim())
          ? 'Revisa el formato del correo.'
          : undefined,
      contrasena: contrasena ? undefined : 'Ingresa tu contraseña.',
    }
    setErrores(nuevos)
    setError(null)
    if (nuevos.correo || nuevos.contrasena) return

    setEnviando('correo')
    try {
      await iniciarSesion(correo, contrasena)
      // La redirección la hace el efecto de arriba cuando llega la sesión.
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No pudimos conectar con el servidor.')
      setEnviando(null)
    }
  }

  async function conGoogle() {
    setError(null)
    setEnviando('google')
    try {
      await iniciarConGoogle()
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No pudimos conectar con Google.')
      setEnviando(null)
    }
  }

  const ocupado = enviando !== null || Boolean(usuario)

  return (
    <div className="registro">
      <main className="registro-contenedor login-contenedor">
        <div className="registro-tarjeta">
          <h1 className="login-titulo">Inicia sesión</h1>
          <p className="slide-bajada">Accede a tu cuenta de Dictamed para seguir documentando.</p>

          {error && (
            <div className="registro-alerta login-alerta" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form noValidate onSubmit={alEnviar} className="campos">
            <label className={`campo ${errores.correo ? 'con-error' : ''}`}>
              <span className="campo-etiqueta">Correo electrónico</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="nombre@dominio.cl"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  setErrores((x) => ({ ...x, correo: undefined }))
                }}
              />
              {errores.correo && (
                <span className="campo-error" role="alert">
                  {errores.correo}
                </span>
              )}
            </label>

            <label className={`campo ${errores.contrasena ? 'con-error' : ''}`}>
              <span className="campo-etiqueta">Contraseña</span>
              <div className="campo-contrasena">
                <input
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value)
                    setErrores((x) => ({ ...x, contrasena: undefined }))
                  }}
                />
                <button
                  type="button"
                  className="ver-contrasena"
                  onClick={() => setVerContrasena((v) => !v)}
                >
                  {verContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errores.contrasena && (
                <span className="campo-error" role="alert">
                  {errores.contrasena}
                </span>
              )}
            </label>

            <button type="submit" className="boton-registro login-boton" disabled={ocupado || cargando}>
              {enviando === 'correo' || usuario ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="login-separador">
            <span>o</span>
          </div>

          <button
            type="button"
            className="boton-google"
            onClick={conGoogle}
            disabled={ocupado || cargando}
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5Z" />
            </svg>
            {enviando === 'google' ? 'Conectando con Google…' : 'Continuar con Google'}
          </button>
        </div>

        <p className="registro-login">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </main>
    </div>
  )
}
