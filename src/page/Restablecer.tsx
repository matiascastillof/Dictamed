import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/Register.css'
import '../css/Login.css'
import NuevaContrasena from '../components/NuevaContrasena'
import { useSesion } from '../hooks/useSesion'
import { ErrorAuth, cambiarContrasena } from '../services/auth'
import { validarConfirmacion, validarContrasena } from '../utils/contrasena'
import { supabase } from '../lib/supabase'

/** Lee el error que Supabase deja en la URL si el enlace es inválido o expiró. */
function enlaceInvalido(): boolean {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1))
  return Boolean(params.get('error') || params.get('error_code'))
}

// Página a la que llega el usuario desde el enlace del correo de recuperación.
export default function Restablecer() {
  const navigate = useNavigate()
  const { usuario, cargando } = useSesion()
  const [invalido] = useState(enlaceInvalido)
  // Solo se permite cambiar la contraseña si la sesión viene del enlace de recuperación.
  const [recuperacion, setRecuperacion] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<{ contrasena?: string; confirmacion?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperacion(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function alEnviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const nuevos = {
      contrasena: validarContrasena(contrasena, usuario?.email ?? ''),
      confirmacion: validarConfirmacion(contrasena, confirmacion),
    }
    setErrores(nuevos)
    setError(null)
    if (nuevos.contrasena || nuevos.confirmacion) return

    setEnviando(true)
    try {
      await cambiarContrasena(contrasena)
      setListo(true)
    } catch (err) {
      setError(err instanceof ErrorAuth ? err.message : 'No pudimos conectar con el servidor.')
    } finally {
      setEnviando(false)
    }
  }

  let contenido
  if (listo) {
    contenido = (
      <>
        <h1 className="login-titulo">Contraseña actualizada</h1>
        <p className="slide-bajada">Ya puedes usar tu nueva contraseña. Tu sesión quedó iniciada.</p>
        <button type="button" className="boton-registro login-boton" onClick={() => navigate('/')}>
          Ir al inicio
        </button>
      </>
    )
  } else if (cargando) {
    contenido = <p className="slide-bajada">Verificando enlace…</p>
  } else if (invalido || !usuario || !recuperacion) {
    contenido = (
      <>
        <h1 className="login-titulo">Enlace no válido</h1>
        <p className="slide-bajada">
          El enlace para restablecer tu contraseña expiró o ya fue usado. Solicita uno nuevo.
        </p>
        <Link className="boton-registro login-boton" to="/recuperar">
          Solicitar nuevo enlace
        </Link>
      </>
    )
  } else {
    contenido = (
      <>
        <h1 className="login-titulo">Crea una nueva contraseña</h1>
        <p className="slide-bajada">
          Para la cuenta <strong>{usuario.email}</strong>.
        </p>

        {error && (
          <div className="registro-alerta login-alerta" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form noValidate onSubmit={alEnviar} className="campos">
          <NuevaContrasena
            etiqueta="Nueva contraseña"
            contrasena={contrasena}
            confirmacion={confirmacion}
            onContrasena={(v) => {
              setContrasena(v)
              setErrores((x) => ({ ...x, contrasena: undefined }))
            }}
            onConfirmacion={(v) => {
              setConfirmacion(v)
              setErrores((x) => ({ ...x, confirmacion: undefined }))
            }}
            errorContrasena={errores.contrasena}
            errorConfirmacion={errores.confirmacion}
          />
          <button type="submit" className="boton-registro login-boton" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </>
    )
  }

  return (
    <div className="registro">
      <main className="registro-contenedor login-contenedor">
        <div className="registro-tarjeta">{contenido}</div>
      </main>
    </div>
  )
}
