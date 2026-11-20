// Centros de salud vigentes por región, del listado oficial DEIS-MINSAL
// (datos.gob.cl, actualizado el 17-11-2026). Para actualizar:
//   node scripts/generar-centros.mjs establecimientos.csv

export type Categoria = 'aps' | 'urgencia' | 'hospital' | 'privado' | 'especialidad' | 'otro'

export type Centro = {
  id: string
  nombre: string
  comuna: string
  tipo: string
  categoria: Categoria
  sistema: 'publico' | 'privado'
  direccion?: string
}

export const CATEGORIAS: { id: Categoria; nombre: string }[] = [
  { id: 'aps', nombre: 'CESFAM y consultorios' },
  { id: 'hospital', nombre: 'Hospitales' },
  { id: 'privado', nombre: 'Clínicas y centros privados' },
  { id: 'urgencia', nombre: 'Urgencias (SAPU, SAR, SUR)' },
  { id: 'especialidad', nombre: 'Especialidades y COSAM' },
  { id: 'otro', nombre: 'Otros' },
]

// Nombre de la región en src/data/regiones.ts → código de región del DEIS.
const CODIGOS: Record<string, string> = {
  'Arica y Parinacota': '15',
  'Tarapacá': '01',
  'Antofagasta': '02',
  'Atacama': '03',
  'Coquimbo': '04',
  'Valparaíso': '05',
  'Metropolitana de Santiago': '13',
  "Libertador General Bernardo O'Higgins": '06',
  'Maule': '07',
  'Ñuble': '16',
  'Biobío': '08',
  'La Araucanía': '09',
  'Los Ríos': '14',
  'Los Lagos': '10',
  'Aysén del General Carlos Ibáñez del Campo': '11',
  'Magallanes y de la Antártica Chilena': '12',
}

// Cada región se descarga solo cuando se necesita.
const archivos = import.meta.glob<Centro[]>('./*.json', { import: 'default' })

export async function centrosDeRegion(region: string): Promise<Centro[]> {
  const cargar = archivos[`./${CODIGOS[region]}.json`]
  return cargar ? cargar() : []
}

/** Para comparar textos sin tildes, mayúsculas ni espacios ("Con Con" = "Concón"). */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, '')
}

// Comunas que el DEIS escribe distinto que el formulario de registro.
const ALIAS_COMUNA: Record<string, string> = {
  paihuano: 'paiguano',
  lacalera: 'calera',
  marchigue: 'marchihue',
  aysen: 'aisen',
}

/** Clave para comparar comunas aunque estén escritas de otra forma. */
export function claveComuna(comuna: string): string {
  const n = normalizar(comuna)
  return ALIAS_COMUNA[n] ?? n
}
