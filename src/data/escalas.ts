// Escalas clínicas de uso frecuente en Chile. Son una ayuda para documentar:
// la interpretación debe validarla siempre el profesional tratante.

export type Opcion = { texto: string; puntos: number }
export type Item = { id: string; nombre: string; opciones: Opcion[] }
export type Nivel = 'bajo' | 'medio' | 'alto'
export type Interpretacion = { texto: string; nivel: Nivel }

export type Escala = {
  id: string
  nombre: string
  area: string
  descripcion: string
  items: Item[]
  /** puntos: puntaje elegido en cada ítem, por id. */
  interpretar: (total: number, puntos: Record<string, number>) => Interpretacion
  /** Muestra el total con signo (+2) y sin máximo, como en RASS. */
  conSigno?: boolean
}

const siNo = (id: string, nombre: string, puntos = 1): Item => ({
  id,
  nombre,
  opciones: [
    { texto: 'No', puntos: 0 },
    { texto: 'Sí', puntos },
  ],
})

const de0a2 = (id: string, nombre: string, textos: [string, string, string]): Item => ({
  id,
  nombre,
  opciones: textos.map((texto, puntos) => ({ texto, puntos })),
})

export const AREAS = [
  'Urgencia y UCI',
  'Medicina interna',
  'Cardiología',
  'Neonatología y pediatría',
  'Obstetricia',
  'Enfermería',
  'Geriatría y rehabilitación',
  'Salud mental',
  'General',
] as const

export const ESCALAS: Escala[] = [
  {
    id: 'glasgow',
    nombre: 'Escala de coma de Glasgow',
    area: 'Urgencia y UCI',
    descripcion: 'Nivel de conciencia. Puntaje de 3 a 15.',
    items: [
      {
        id: 'ocular',
        nombre: 'Apertura ocular',
        opciones: [
          { texto: 'Espontánea', puntos: 4 },
          { texto: 'A la orden verbal', puntos: 3 },
          { texto: 'Al dolor', puntos: 2 },
          { texto: 'Ninguna', puntos: 1 },
        ],
      },
      {
        id: 'verbal',
        nombre: 'Respuesta verbal',
        opciones: [
          { texto: 'Orientada', puntos: 5 },
          { texto: 'Confusa', puntos: 4 },
          { texto: 'Palabras inapropiadas', puntos: 3 },
          { texto: 'Sonidos incomprensibles', puntos: 2 },
          { texto: 'Ninguna', puntos: 1 },
        ],
      },
      {
        id: 'motora',
        nombre: 'Respuesta motora',
        opciones: [
          { texto: 'Obedece órdenes', puntos: 6 },
          { texto: 'Localiza el dolor', puntos: 5 },
          { texto: 'Retira al dolor', puntos: 4 },
          { texto: 'Flexión anormal (decorticación)', puntos: 3 },
          { texto: 'Extensión (descerebración)', puntos: 2 },
          { texto: 'Ninguna', puntos: 1 },
        ],
      },
    ],
    interpretar: (t) =>
      t >= 13
        ? { texto: 'Compromiso de conciencia leve', nivel: 'bajo' }
        : t >= 9
          ? { texto: 'Compromiso de conciencia moderado', nivel: 'medio' }
          : { texto: 'Compromiso de conciencia grave (considerar protección de vía aérea)', nivel: 'alto' },
  },
  {
    id: 'rass',
    nombre: 'Escala de agitación-sedación de Richmond (RASS)',
    area: 'Urgencia y UCI',
    descripcion: 'Nivel de sedación o agitación. De +4 a −5.',
    conSigno: true,
    items: [
      {
        id: 'nivel',
        nombre: 'Estado del paciente',
        opciones: [
          { texto: 'Combativo', puntos: 4 },
          { texto: 'Muy agitado', puntos: 3 },
          { texto: 'Agitado', puntos: 2 },
          { texto: 'Inquieto', puntos: 1 },
          { texto: 'Alerta y tranquilo', puntos: 0 },
          { texto: 'Somnoliento (despierta a la voz > 10 s)', puntos: -1 },
          { texto: 'Sedación ligera (despierta a la voz < 10 s)', puntos: -2 },
          { texto: 'Sedación moderada (movimiento a la voz, sin contacto visual)', puntos: -3 },
          { texto: 'Sedación profunda (responde solo a estímulo físico)', puntos: -4 },
          { texto: 'No despertable', puntos: -5 },
        ],
      },
    ],
    interpretar: (t) =>
      t > 0
        ? { texto: 'Agitación', nivel: t >= 3 ? 'alto' : 'medio' }
        : t === 0
          ? { texto: 'Alerta y tranquilo', nivel: 'bajo' }
          : t >= -2
            ? { texto: 'Sedación ligera', nivel: 'bajo' }
            : t === -3
              ? { texto: 'Sedación moderada', nivel: 'medio' }
              : { texto: 'Sedación profunda', nivel: 'alto' },
  },
  {
    id: 'qsofa',
    nombre: 'qSOFA',
    area: 'Urgencia y UCI',
    descripcion: 'Tamizaje de mal pronóstico en sospecha de infección. De 0 a 3.',
    items: [
      siNo('fr', 'Frecuencia respiratoria ≥ 22 rpm'),
      siNo('mental', 'Alteración del estado mental (Glasgow < 15)'),
      siNo('pas', 'Presión arterial sistólica ≤ 100 mmHg'),
    ],
    interpretar: (t) =>
      t >= 2
        ? { texto: 'Positivo: alto riesgo, evaluar sepsis y disfunción orgánica', nivel: 'alto' }
        : { texto: 'Negativo', nivel: 'bajo' },
  },
  {
    id: 'curb65',
    nombre: 'CURB-65',
    area: 'Medicina interna',
    descripcion: 'Gravedad de la neumonía adquirida en la comunidad. De 0 a 5.',
    items: [
      siNo('confusion', 'Confusión de reciente aparición'),
      siNo('urea', 'Urea > 7 mmol/L (BUN > 19 mg/dL)'),
      siNo('fr', 'Frecuencia respiratoria ≥ 30 rpm'),
      siNo('pa', 'PAS < 90 mmHg o PAD ≤ 60 mmHg'),
      siNo('edad', 'Edad ≥ 65 años'),
    ],
    interpretar: (t) =>
      t <= 1
        ? { texto: 'Riesgo bajo: considerar manejo ambulatorio', nivel: 'bajo' }
        : t === 2
          ? { texto: 'Riesgo intermedio: considerar hospitalización', nivel: 'medio' }
          : { texto: 'Riesgo alto: hospitalizar, evaluar UCI si 4 o 5', nivel: 'alto' },
  },
  {
    id: 'cha2ds2vasc',
    nombre: 'CHA₂DS₂-VASc',
    area: 'Cardiología',
    descripcion: 'Riesgo de ACV en fibrilación auricular. De 0 a 9.',
    items: [
      siNo('icc', 'Insuficiencia cardíaca o disfunción ventricular izquierda'),
      siNo('hta', 'Hipertensión arterial'),
      {
        id: 'edad',
        nombre: 'Edad',
        opciones: [
          { texto: 'Menor de 65 años', puntos: 0 },
          { texto: '65 a 74 años', puntos: 1 },
          { texto: '75 años o más', puntos: 2 },
        ],
      },
      siNo('dm', 'Diabetes mellitus'),
      siNo('acv', 'ACV, AIT o tromboembolismo previo', 2),
      siNo('vascular', 'Enfermedad vascular (IAM previo, enfermedad arterial periférica, placa aórtica)'),
      {
        id: 'sexo',
        nombre: 'Sexo',
        opciones: [
          { texto: 'Masculino', puntos: 0 },
          { texto: 'Femenino', puntos: 1 },
        ],
      },
    ],
    // El sexo femenino solo es modificador de riesgo: se interpreta sin él.
    interpretar: (t, p) => {
      const sinSexo = t - (p.sexo ?? 0)
      return sinSexo === 0
        ? { texto: 'Riesgo bajo: anticoagulación no indicada', nivel: 'bajo' }
        : sinSexo === 1
          ? { texto: 'Riesgo intermedio: considerar anticoagulación oral', nivel: 'medio' }
          : { texto: 'Riesgo alto: anticoagulación oral recomendada', nivel: 'alto' }
    },
  },
  {
    id: 'apgar',
    nombre: 'APGAR',
    area: 'Neonatología y pediatría',
    descripcion: 'Adaptación del recién nacido (1 y 5 minutos). De 0 a 10.',
    items: [
      de0a2('fc', 'Frecuencia cardíaca', ['Ausente', 'Menor de 100 lpm', '100 lpm o más']),
      de0a2('resp', 'Esfuerzo respiratorio', ['Ausente', 'Lento o irregular', 'Bueno, llanto fuerte']),
      de0a2('tono', 'Tono muscular', ['Flácido', 'Alguna flexión de extremidades', 'Movimiento activo']),
      de0a2('reflejos', 'Irritabilidad refleja', ['Sin respuesta', 'Mueca', 'Llanto, tos o estornudo']),
      de0a2('color', 'Color', ['Azul o pálido', 'Cuerpo rosado, extremidades azules', 'Completamente rosado']),
    ],
    interpretar: (t) =>
      t >= 7
        ? { texto: 'Normal', nivel: 'bajo' }
        : t >= 4
          ? { texto: 'Depresión moderada', nivel: 'medio' }
          : { texto: 'Depresión severa', nivel: 'alto' },
  },
  {
    id: 'silverman',
    nombre: 'Silverman-Andersen',
    area: 'Neonatología y pediatría',
    descripcion: 'Dificultad respiratoria del recién nacido. De 0 a 10.',
    items: [
      de0a2('movimientos', 'Movimientos toracoabdominales', [
        'Rítmicos y regulares',
        'Tórax inmóvil, abdomen en movimiento',
        'Disociación toracoabdominal (balanceo)',
      ]),
      de0a2('tiraje', 'Tiraje intercostal', ['Ausente', 'Leve', 'Marcado']),
      de0a2('xifoidea', 'Retracción xifoidea', ['Ausente', 'Leve', 'Marcada']),
      de0a2('aleteo', 'Aleteo nasal', ['Ausente', 'Leve', 'Marcado']),
      de0a2('quejido', 'Quejido espiratorio', [
        'Ausente',
        'Audible con estetoscopio',
        'Audible sin estetoscopio',
      ]),
    ],
    interpretar: (t) =>
      t === 0
        ? { texto: 'Sin dificultad respiratoria', nivel: 'bajo' }
        : t <= 3
          ? { texto: 'Dificultad respiratoria leve', nivel: 'bajo' }
          : t <= 6
            ? { texto: 'Dificultad respiratoria moderada', nivel: 'medio' }
            : { texto: 'Dificultad respiratoria severa', nivel: 'alto' },
  },
  {
    id: 'bishop',
    nombre: 'Índice de Bishop',
    area: 'Obstetricia',
    descripcion: 'Condiciones del cuello uterino para inducción. De 0 a 13.',
    items: [
      {
        id: 'dilatacion',
        nombre: 'Dilatación',
        opciones: [
          { texto: '0 cm', puntos: 0 },
          { texto: '1–2 cm', puntos: 1 },
          { texto: '3–4 cm', puntos: 2 },
          { texto: '5 cm o más', puntos: 3 },
        ],
      },
      {
        id: 'borramiento',
        nombre: 'Borramiento',
        opciones: [
          { texto: '0–30 %', puntos: 0 },
          { texto: '40–50 %', puntos: 1 },
          { texto: '60–70 %', puntos: 2 },
          { texto: '80 % o más', puntos: 3 },
        ],
      },
      {
        id: 'estacion',
        nombre: 'Estación (altura de presentación)',
        opciones: [
          { texto: '−3', puntos: 0 },
          { texto: '−2', puntos: 1 },
          { texto: '−1 / 0', puntos: 2 },
          { texto: '+1 / +2', puntos: 3 },
        ],
      },
      de0a2('consistencia', 'Consistencia', ['Firme', 'Media', 'Blanda']),
      de0a2('posicion', 'Posición', ['Posterior', 'Media', 'Anterior']),
    ],
    interpretar: (t) =>
      t >= 8
        ? { texto: 'Cuello favorable', nivel: 'bajo' }
        : t === 7
          ? { texto: 'Cuello intermedio', nivel: 'medio' }
          : { texto: 'Cuello desfavorable: considerar maduración cervical', nivel: 'alto' },
  },
  {
    id: 'braden',
    nombre: 'Escala de Braden',
    area: 'Enfermería',
    descripcion: 'Riesgo de lesiones por presión. De 6 a 23.',
    items: [
      {
        id: 'percepcion',
        nombre: 'Percepción sensorial',
        opciones: [
          { texto: 'Completamente limitada', puntos: 1 },
          { texto: 'Muy limitada', puntos: 2 },
          { texto: 'Ligeramente limitada', puntos: 3 },
          { texto: 'Sin limitaciones', puntos: 4 },
        ],
      },
      {
        id: 'humedad',
        nombre: 'Exposición a la humedad',
        opciones: [
          { texto: 'Constantemente húmeda', puntos: 1 },
          { texto: 'A menudo húmeda', puntos: 2 },
          { texto: 'Ocasionalmente húmeda', puntos: 3 },
          { texto: 'Raramente húmeda', puntos: 4 },
        ],
      },
      {
        id: 'actividad',
        nombre: 'Actividad',
        opciones: [
          { texto: 'Encamado', puntos: 1 },
          { texto: 'En silla', puntos: 2 },
          { texto: 'Deambula ocasionalmente', puntos: 3 },
          { texto: 'Deambula frecuentemente', puntos: 4 },
        ],
      },
      {
        id: 'movilidad',
        nombre: 'Movilidad',
        opciones: [
          { texto: 'Completamente inmóvil', puntos: 1 },
          { texto: 'Muy limitada', puntos: 2 },
          { texto: 'Ligeramente limitada', puntos: 3 },
          { texto: 'Sin limitaciones', puntos: 4 },
        ],
      },
      {
        id: 'nutricion',
        nombre: 'Nutrición',
        opciones: [
          { texto: 'Muy pobre', puntos: 1 },
          { texto: 'Probablemente inadecuada', puntos: 2 },
          { texto: 'Adecuada', puntos: 3 },
          { texto: 'Excelente', puntos: 4 },
        ],
      },
      {
        id: 'friccion',
        nombre: 'Fricción y deslizamiento',
        opciones: [
          { texto: 'Es un problema', puntos: 1 },
          { texto: 'Es un problema potencial', puntos: 2 },
          { texto: 'Sin problema aparente', puntos: 3 },
        ],
      },
    ],
    interpretar: (t) =>
      t <= 12
        ? { texto: 'Riesgo alto', nivel: 'alto' }
        : t <= 14
          ? { texto: 'Riesgo moderado', nivel: 'medio' }
          : t <= 18
            ? { texto: 'Riesgo bajo', nivel: 'bajo' }
            : { texto: 'Sin riesgo', nivel: 'bajo' },
  },
  {
    id: 'downton',
    nombre: 'Escala de Downton',
    area: 'Enfermería',
    descripcion: 'Riesgo de caídas. Cada factor presente suma 1 punto.',
    items: [
      siNo('caidas', 'Caídas previas'),
      siNo('sedantes', 'Medicamentos: tranquilizantes o sedantes'),
      siNo('diureticos', 'Medicamentos: diuréticos'),
      siNo('hipotensores', 'Medicamentos: hipotensores (no diuréticos)'),
      siNo('antiparkinsonianos', 'Medicamentos: antiparkinsonianos'),
      siNo('antidepresivos', 'Medicamentos: antidepresivos'),
      siNo('otros', 'Medicamentos: otros'),
      siNo('visual', 'Déficit sensorial: alteraciones visuales'),
      siNo('auditivo', 'Déficit sensorial: alteraciones auditivas'),
      siNo('extremidades', 'Déficit sensorial: extremidades (ictus, neuropatía…)'),
      {
        id: 'mental',
        nombre: 'Estado mental',
        opciones: [
          { texto: 'Orientado', puntos: 0 },
          { texto: 'Confuso', puntos: 1 },
        ],
      },
      {
        id: 'deambulacion',
        nombre: 'Deambulación',
        opciones: [
          { texto: 'Normal', puntos: 0 },
          { texto: 'Segura con ayuda', puntos: 1 },
          { texto: 'Insegura con o sin ayuda', puntos: 1 },
          { texto: 'Imposible', puntos: 1 },
        ],
      },
    ],
    interpretar: (t) =>
      t >= 3 ? { texto: 'Riesgo alto de caídas', nivel: 'alto' } : { texto: 'Riesgo bajo de caídas', nivel: 'bajo' },
  },
  {
    id: 'barthel',
    nombre: 'Índice de Barthel',
    area: 'Geriatría y rehabilitación',
    descripcion: 'Dependencia en actividades básicas de la vida diaria. De 0 a 100.',
    items: [
      {
        id: 'comer',
        nombre: 'Comer',
        opciones: [
          { texto: 'Independiente', puntos: 10 },
          { texto: 'Necesita ayuda (cortar, untar)', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'banarse',
        nombre: 'Bañarse',
        opciones: [
          { texto: 'Independiente', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'vestirse',
        nombre: 'Vestirse',
        opciones: [
          { texto: 'Independiente', puntos: 10 },
          { texto: 'Necesita ayuda', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'arreglarse',
        nombre: 'Arreglarse',
        opciones: [
          { texto: 'Independiente', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'deposiciones',
        nombre: 'Deposiciones',
        opciones: [
          { texto: 'Continente', puntos: 10 },
          { texto: 'Accidente ocasional', puntos: 5 },
          { texto: 'Incontinente', puntos: 0 },
        ],
      },
      {
        id: 'miccion',
        nombre: 'Micción',
        opciones: [
          { texto: 'Continente', puntos: 10 },
          { texto: 'Accidente ocasional', puntos: 5 },
          { texto: 'Incontinente', puntos: 0 },
        ],
      },
      {
        id: 'retrete',
        nombre: 'Uso del retrete',
        opciones: [
          { texto: 'Independiente', puntos: 10 },
          { texto: 'Necesita ayuda', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'traslado',
        nombre: 'Traslado sillón-cama',
        opciones: [
          { texto: 'Independiente', puntos: 15 },
          { texto: 'Mínima ayuda', puntos: 10 },
          { texto: 'Gran ayuda (puede sentarse)', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'deambulacion',
        nombre: 'Deambulación',
        opciones: [
          { texto: 'Independiente (50 m)', puntos: 15 },
          { texto: 'Necesita ayuda', puntos: 10 },
          { texto: 'Independiente en silla de ruedas', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
      {
        id: 'escaleras',
        nombre: 'Subir y bajar escaleras',
        opciones: [
          { texto: 'Independiente', puntos: 10 },
          { texto: 'Necesita ayuda', puntos: 5 },
          { texto: 'Dependiente', puntos: 0 },
        ],
      },
    ],
    interpretar: (t) =>
      t === 100
        ? { texto: 'Independiente', nivel: 'bajo' }
        : t >= 60
          ? { texto: 'Dependencia leve', nivel: 'bajo' }
          : t >= 40
            ? { texto: 'Dependencia moderada', nivel: 'medio' }
            : t >= 20
              ? { texto: 'Dependencia severa', nivel: 'alto' }
              : { texto: 'Dependencia total', nivel: 'alto' },
  },
  {
    id: 'phq9',
    nombre: 'PHQ-9',
    area: 'Salud mental',
    descripcion: 'Síntomas depresivos en las últimas 2 semanas. De 0 a 27.',
    items: [
      'Poco interés o placer en hacer las cosas',
      'Se ha sentido decaído(a), deprimido(a) o sin esperanza',
      'Dificultad para dormir o mantenerse dormido(a), o ha dormido demasiado',
      'Se ha sentido cansado(a) o con poca energía',
      'Poco apetito o ha comido en exceso',
      'Se ha sentido mal consigo mismo(a), que es un fracaso o que ha fallado a su familia',
      'Dificultad para concentrarse (leer, ver televisión)',
      'Se mueve o habla tan lento que otros lo notan, o al contrario, muy inquieto(a)',
      'Pensamientos de que estaría mejor muerto(a) o de hacerse daño',
    ].map((nombre, i) => ({
      id: `p${i + 1}`,
      nombre,
      opciones: [
        { texto: 'Ningún día', puntos: 0 },
        { texto: 'Varios días', puntos: 1 },
        { texto: 'Más de la mitad de los días', puntos: 2 },
        { texto: 'Casi todos los días', puntos: 3 },
      ],
    })),
    interpretar: (t, p) => {
      const base: Interpretacion =
        t <= 4
          ? { texto: 'Síntomas mínimos', nivel: 'bajo' }
          : t <= 9
            ? { texto: 'Depresión leve', nivel: 'bajo' }
            : t <= 14
              ? { texto: 'Depresión moderada', nivel: 'medio' }
              : t <= 19
                ? { texto: 'Depresión moderadamente severa', nivel: 'alto' }
                : { texto: 'Depresión severa', nivel: 'alto' }
      return (p.p9 ?? 0) > 0
        ? { texto: `${base.texto}. Ítem 9 positivo: evaluar riesgo suicida`, nivel: 'alto' }
        : base
    },
  },
  {
    id: 'ena',
    nombre: 'Escala numérica del dolor (ENA / EVA)',
    area: 'General',
    descripcion: 'Intensidad del dolor referida por el paciente. De 0 a 10.',
    items: [
      {
        id: 'dolor',
        nombre: 'Intensidad del dolor',
        opciones: Array.from({ length: 11 }, (_, n) => ({ texto: String(n), puntos: n })),
      },
    ],
    interpretar: (t) =>
      t === 0
        ? { texto: 'Sin dolor', nivel: 'bajo' }
        : t <= 3
          ? { texto: 'Dolor leve', nivel: 'bajo' }
          : t <= 6
            ? { texto: 'Dolor moderado', nivel: 'medio' }
            : { texto: 'Dolor severo', nivel: 'alto' },
  },
]

/** Puntaje máximo posible de la escala. */
export function puntajeMaximo(escala: Escala): number {
  return escala.items.reduce((suma, item) => suma + Math.max(...item.opciones.map((o) => o.puntos)), 0)
}

/** "12 / 15", o "+2" en escalas con signo como RASS. */
export function formatearTotal(escala: Escala, total: number): string {
  if (escala.conSigno) return total > 0 ? `+${total}` : String(total)
  return `${total} / ${puntajeMaximo(escala)}`
}
