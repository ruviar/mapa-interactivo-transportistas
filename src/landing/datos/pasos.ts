/**
 * Los tres pasos de la herramienta. Vive aparte porque lo usan dos sitios:
 * `ComoFunciona.tsx` (recapitulación, más abajo en la página) y
 * `SeccionMapa.tsx` (el texto del scrollytelling, junto al mapa pinneado).
 * Una sola fuente evita que las dos copias del mismo paso se desincronicen.
 */
export const PASOS = [
  {
    numero: '01',
    titulo: 'Elige comunidad y provincia',
    texto:
      'Empieza por España entera y ve entrando: comunidad autónoma, luego provincia. El mapa se encuadra solo en cada paso.',
  },
  {
    numero: '02',
    titulo: 'Ajusta el umbral de plantilla',
    texto:
      'Mueve el filtro de nº de empleados —el proxy disponible de tamaño de flota— y el listado y los contadores se recalculan al momento.',
  },
  {
    numero: '03',
    titulo: 'Busca y exporta el contacto',
    texto:
      'Dentro de una provincia, busca por nombre en el listado y toma el NIF, la localidad y los empleados de cada empresa.',
  },
] as const;
