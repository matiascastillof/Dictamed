export type FilaTabla = { parametro: string; valor: string; puntos: number | null }

export type TablaInforme = {
  id: string
  titulo: string
  filas: FilaTabla[]
  total: string
  interpretacion: string
  nivel: 'bajo' | 'medio' | 'alto'
}

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Informe en texto plano: para pegar en cualquier sistema. */
export function informeEnTexto(texto: string, tablas: TablaInforme[]): string {
  const partes = texto.trim() ? [texto.trim()] : []
  for (const t of tablas) {
    const filas = t.filas.map(
      (f) => `- ${f.parametro}: ${f.valor}${f.puntos === null ? '' : ` (${f.puntos})`}`,
    )
    partes.push([t.titulo.toUpperCase(), ...filas, `Puntaje: ${t.total} — ${t.interpretacion}`].join('\n'))
  }
  return partes.join('\n\n')
}

/** Informe en HTML: al pegar en Word o en una ficha clínica, las tablas se mantienen. */
export function informeEnHtml(texto: string, tablas: TablaInforme[]): string {
  const parrafos = texto
    .trim()
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p>${escapar(p)}</p>`)
  const celda = 'style="border:1px solid #999;padding:4px 8px;text-align:left"'
  const html = tablas.map(
    (t) =>
      `<table style="border-collapse:collapse;margin:12px 0">` +
      `<caption style="text-align:left;font-weight:bold;padding-bottom:4px">${escapar(t.titulo)}</caption>` +
      `<thead><tr><th ${celda}>Parámetro</th><th ${celda}>Respuesta</th><th ${celda}>Puntos</th></tr></thead>` +
      `<tbody>${t.filas
        .map(
          (f) =>
            `<tr><td ${celda}>${escapar(f.parametro)}</td><td ${celda}>${escapar(f.valor)}</td><td ${celda}>${f.puntos ?? '—'}</td></tr>`,
        )
        .join('')}</tbody>` +
      `<tfoot><tr><th ${celda} colspan="2">${escapar(t.interpretacion)}</th><th ${celda}>${escapar(t.total)}</th></tr></tfoot>` +
      `</table>`,
  )
  return [...parrafos, ...html].join('')
}
