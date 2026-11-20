import { useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import '../css/Register.css'
import '../css/Login.css'
import { ErrorAuth, enviarRecuperacion } from '../services/auth'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Recuperar() {
  const [correo, setCorreo] = useState('')
  const [errorCampo, setErrorCampo] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function alEnviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const t = correo.trim()
    const err = !t ? 'Ingresa tu correo electrónico.' : !CORREO.test(t) ? 'Revisa el formato del correo.' : undefined
    setErrorCampo(err)
    setError(null)
    if (err) return

    setEnviando(true)
    try {
      await enviarRecuperacion(t)
      setEnviado(true)
    } catch (e) {
      setError(e instanceof ErrorAuth ? e.message : 'No pudimos conectar con el servidor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="registro">
      <main className="registro-contenedor login-contenedor">
        <div className="registro-tarjeta">
          {enviado ? (
            <>
              <h1 className="login-titulo">Revisa tu correo</h1>
              <p className="slide-bajada">
                Si existe una cuenta asociada a <strong>{correo.trim().toLowerCase()}</strong>, te
                enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.
              </p>
              <Link className="boton-registro login-boton" to="/login">
                Volver a iniciar sesión
              </Link>
              <button type="button" className="login-enlace login-reenviar" onClick={() => setEnviado(false)}>
                ¿No te llegó? Enviar de nuevo
              </button>
            </>
          ) : (
            <>
              <h1 className="login-titulo">¿Olvidaste tu contraseña?</h1>
              <p className="slide-bajada">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva.
              </p>

              {error && (
                <div className="registro-alerta login-alerta" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <form noValidate onSubmit={alEnviar} className="campos">
                <label className={`campo ${errorCampo ? 'con-error' : ''}`}>
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
                      setErrorCampo(undefined)
                    }}
                  />
                  {errorCampo && (
                    <span className="campo-error" role="alert">
                      {errorCampo}
                    </span>
                  )}
                </label>
                <button type="submit" className="boton-registro login-boton" disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="registro-login">
          ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
        </p>
      </main>
    </div>
  )
}
