import { useState } from 'react'
import { REQUISITOS } from '../utils/contrasena'

type Props = {
  contrasena: string
  confirmacion: string
  onContrasena: (v: string) => void
  onConfirmacion: (v: string) => void
  errorContrasena?: string
  errorConfirmacion?: string
  etiqueta?: string
}

/** Campos de contraseña nueva + confirmación, con la lista de requisitos en vivo. */
export default function NuevaContrasena({
  contrasena,
  confirmacion,
  onContrasena,
  onConfirmacion,
  errorContrasena,
  errorConfirmacion,
  etiqueta = 'Contraseña',
}: Props) {
  const [ver, setVer] = useState(false)
  const cumplidos = REQUISITOS.filter((r) => r.cumple(contrasena)).length
  const nivel = cumplidos / REQUISITOS.length
  const textoNivel =
    !contrasena ? '' : nivel === 1 ? 'Segura' : nivel >= 0.66 ? 'Casi lista' : 'Débil'

  return (
    <>
      <label className={`campo ${errorContrasena ? 'con-error' : ''}`}>
        <span className="campo-etiqueta">{etiqueta}</span>
        <div className="campo-contrasena">
          <input
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            value={contrasena}
            aria-describedby="requisitos-contrasena"
            onChange={(e) => onContrasena(e.target.value)}
          />
          <button type="button" className="ver-contrasena" onClick={() => setVer((v) => !v)}>
            {ver ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <div className="fuerza" aria-hidden="true">
          <span
            className={`fuerza-barra ${nivel === 1 ? 'segura' : nivel >= 0.66 ? 'media' : 'debil'}`}
            style={{ width: `${nivel * 100}%` }}
          />
        </div>
        {textoNivel && <span className="fuerza-texto">Seguridad: {textoNivel}</span>}

        <ul className="requisitos" id="requisitos-contrasena">
          {REQUISITOS.map((r) => {
            const ok = r.cumple(contrasena)
            return (
              <li key={r.id} className={ok ? 'cumple' : ''}>
                <span aria-hidden="true">{ok ? '✓' : '•'}</span>
                {r.texto}
                <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
              </li>
            )
          })}
        </ul>
        {errorContrasena && (
          <span className="campo-error" role="alert">
            {errorContrasena}
          </span>
        )}
      </label>

      <label className={`campo ${errorConfirmacion ? 'con-error' : ''}`}>
        <span className="campo-etiqueta">Repite la contraseña</span>
        <input
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => onConfirmacion(e.target.value)}
        />
        {errorConfirmacion && (
          <span className="campo-error" role="alert">
            {errorConfirmacion}
          </span>
        )}
      </label>
    </>
  )
}
