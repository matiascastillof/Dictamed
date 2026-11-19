// Utilidades para el RUT chileno (cuerpo de 7-8 dígitos + dígito verificador 0-9 o K).

/** Deja solo dígitos y una K final, con un máximo de 9 caracteres. */
export function limpiarRut(valor: string): string {
  const c = valor.toUpperCase().replace(/[^0-9K]/g, '')
  if (!c) return ''
  const cuerpo = c.slice(0, -1).replace(/K/g, '')
  const dv = c.slice(-1)
  return (cuerpo + dv).slice(0, 9)
}

/** "123456785" -> "12.345.678-5" */
export function formatearRut(valor: string): string {
  const c = limpiarRut(valor)
  if (c.length < 2) return c
  const cuerpo = c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${c.slice(-1)}`
}

export function calcularDv(cuerpo: string): string {
  let suma = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const r = 11 - (suma % 11)
  return r === 11 ? '0' : r === 10 ? 'K' : String(r)
}

export function validarRut(valor: string): boolean {
  const c = limpiarRut(valor)
  if (c.length < 8) return false
  const cuerpo = c.slice(0, -1)
  if (!/^\d+$/.test(cuerpo)) return false
  return calcularDv(cuerpo) === c.slice(-1)
}
