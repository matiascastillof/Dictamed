/**
 * Pone en mayúscula la primera letra de cada palabra y el resto en minúscula.
 * "maría  josé DE la fuente-soto" → "María José De La Fuente-Soto"
 */
export function capitalizar(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-CL')
    .replace(/(^|[\s'-])(\p{L})/gu, (_, antes: string, letra: string) => antes + letra.toLocaleUpperCase('es-CL'))
}
