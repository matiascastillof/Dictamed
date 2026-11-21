// Genera src/data/centros/<codigo-region>.json a partir del listado oficial de
// establecimientos de salud del DEIS-MINSAL (datos.gob.cl → "Establecimientos de Salud").
//
// Uso: node scripts/generar-centros.mjs ruta/al/establecimientos.csv

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const archivo = process.argv[2]
if (!archivo) {
  console.error('Uso: node scripts/generar-centros.mjs establecimientos.csv')
  process.exit(1)
}

// Tipos que no son lugares donde se atiende a pacientes en consulta.
const EXCLUIDOS = new Set([
  'Laboratorio Clínico',
  'Vacunatorio',
  'Sala  Externa de Toma de Muestras (SETM)',
  'Clínica Dental',
  'Dispositivo Incorporado por Crisis Sanitaria',
  'Atención Remota',
])

// Tipo DEIS → [categoría para filtrar, nombre corto para mostrar]
const TIPOS = {
  'Centro de Salud Familiar (CESFAM)': ['aps', 'CESFAM'],
  'Centro Comunitario de Salud Familiar (CECOSF)': ['aps', 'CECOSF'],
  'Posta de Salud Rural (PSR)': ['aps', 'Posta rural'],
  'Consultorio General Rural (CGR)': ['aps', 'Consultorio rural'],
  'Consultorio General Urbano (CGU)': ['aps', 'Consultorio urbano'],
  'Centro de Especialidades de Atención Primaria (CEAP)': ['aps', 'CEAP'],
  'Servicio de Atención Primaria de Urgencia (SAPU)': ['urgencia', 'SAPU'],
  'Servicio de Atención Primaria de Urgencia de Alta Resolutividad (SAR)': ['urgencia', 'SAR'],
  'Servicio de Urgencia Rural (SUR)': ['urgencia', 'SUR'],
  'Centro de Regulación Médica de las Urgencias (SAMU)': ['urgencia', 'SAMU'],
  Hospital: ['hospital', 'Hospital'],
  'Hospital de Día': ['hospital', 'Hospital de día'],
  Clínica: ['privado', 'Clínica'],
  'Centro de Salud Privado': ['privado', 'Centro privado'],
  'Centros de Diagnóstico y Tratamiento Privados': ['privado', 'CDT privado'],
  'Centro de Especialidades': ['especialidad', 'Centro de especialidades'],
  'Centro Comunitario de Salud Mental  (COSAM)': ['especialidad', 'COSAM'],
  'Centro de Diálisis': ['especialidad', 'Centro de diálisis'],
  'Centro de Rehabilitación': ['especialidad', 'Rehabilitación'],
  'Centro Terapeútico': ['especialidad', 'Centro terapéutico'],
  'Centro de Salud Comunitario para Personas con Demencia': ['especialidad', 'Centro de memoria'],
  'Centro Corporación para la Nutrición Infantil (CONIN)': ['especialidad', 'CONIN'],
}

const texto = readFileSync(archivo, 'utf8').replace(/^﻿/, '')
const [cabecera, ...lineas] = texto.split(/\r?\n/).filter(Boolean)
const columnas = cabecera.split(';')
const filas = lineas.map((l) => {
  const celdas = l.split(';')
  return Object.fromEntries(columnas.map((c, i) => [c, (celdas[i] ?? '').trim()]))
})

const porRegion = {}
let total = 0
for (const f of filas) {
  if (f.EstadoFuncionamiento.toLowerCase() === 'cerrado') continue
  if (EXCLUIDOS.has(f.TipoEstablecimientoGlosa)) continue
  const [categoria, tipo] = TIPOS[f.TipoEstablecimientoGlosa] ?? ['otro', 'Otro']
  const sistema = f.TipoSistemaSaludGlosa === 'Privado' ? 'privado' : 'publico'
  // El código se usa como nombre de archivo: solo se aceptan dos dígitos (evita path traversal).
  if (!/^\d{2}$/.test(f.RegionCodigo)) {
    console.warn(`Fila omitida: código de región no válido (${JSON.stringify(f.RegionCodigo)}) en ${f.EstablecimientoCodigo}`)
    continue
  }
  const direccion = [f.NombreVia, f.Numero].filter(Boolean).join(' ')
  ;(porRegion[f.RegionCodigo] ??= []).push({
    id: f.EstablecimientoCodigo,
    nombre: f.EstablecimientoGlosa.replace(/\s+/g, ' '),
    comuna: f.ComunaGlosa,
    tipo,
    categoria,
    sistema,
    ...(direccion && { direccion }),
  })
  total++
}

const destino = join('src', 'data', 'centros')
mkdirSync(destino, { recursive: true })
for (const [codigo, centros] of Object.entries(porRegion)) {
  centros.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  writeFileSync(join(destino, `${codigo}.json`), JSON.stringify(centros))
}
console.log(`${total} centros en ${Object.keys(porRegion).length} regiones → ${destino}`)
