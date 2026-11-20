import { useEffect, useState } from 'react'
import '../css/Perfil.css'
import { useAreaPrivada } from '../hooks/useAreaPrivada'
import { CONFIRMAR_CORREO } from '../config'
import { PROFESIONES } from '../data/especialidades'
import { formatearRut } from '../utils/rut'

export default function Perfil() {
  const { perfil } = useAreaPrivada()
  // ?bienvenida=1 llega al crear la cuenta o desde el botón "Confirmar cuenta".
  const [bienvenida] = useState(() => new URLSearchParams(window.location.search).get('bienvenida') === '1')

  // Quita ?bienvenida=1 de la barra de direcciones sin recargar.
  useEffect(() => {
    if (bienvenida) window.history.replaceState(null, '', window.location.pathname)
  }, [bienvenida])

  const iniciales = `${perfil.nombre[0] ?? ''}${perfil.apellidos[0] ?? ''}`.toUpperCase()
  const profesion = PROFESIONES.find((p) => p.id === perfil.profesion)?.nombre ?? perfil.profesion
  const desde = perfil.creado_en
    ? new Date(perfil.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const datos = [
    { etiqueta: 'RUT', valor: formatearRut(perfil.rut) },
    { etiqueta: 'Correo electrónico', valor: perfil.correo },
    { etiqueta: 'Profesión', valor: profesion },
    { etiqueta: 'Especialidad', valor: perfil.especialidad },
    { etiqueta: 'Región', valor: perfil.region },
    { etiqueta: 'Comuna', valor: perfil.comuna },
  ]

  return (
    <div className="perfil-contenedor">
      {bienvenida && (
        <div className="perfil-bienvenida" role="status">
          <span aria-hidden="true">🎉</span>
          <div>
            <strong>{CONFIRMAR_CORREO ? '¡Tu cuenta está confirmada!' : '¡Tu cuenta fue creada con éxito!'}</strong>
            <p>Gracias por unirte a Dictamed, {perfil.nombre}. Ya puedes comenzar a usar la plataforma.</p>
          </div>
        </div>
      )}

      <section className="registro-tarjeta perfil-cabecera">
        <div className="perfil-avatar" aria-hidden="true">
          {iniciales}
        </div>
        <div>
          <h1>
            {perfil.nombre} {perfil.apellidos}
          </h1>
          <p>
            {profesion} · {perfil.especialidad}
          </p>
          {desde && <p className="perfil-desde">Miembro desde el {desde}</p>}
        </div>
      </section>

      <section className="registro-tarjeta">
        <h2 className="perfil-subtitulo">Tus datos</h2>
        <dl className="perfil-datos">
          {datos.map((d) => (
            <div key={d.etiqueta}>
              <dt>{d.etiqueta}</dt>
              <dd>{d.valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
