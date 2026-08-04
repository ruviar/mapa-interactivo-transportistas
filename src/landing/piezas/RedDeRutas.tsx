import { motion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';

/**
 * Corredores radiales. No es el mapa de España ni pretende serlo: es la forma
 * que tiene la red viaria del país —seis autovías saliendo de un punto— usada
 * como textura de fondo. Coordenadas en un lienzo de 1200×720.
 */
interface Ruta {
  d: string;
  /** Posiciones normalizadas (0-1) del recorrido donde hay parada. */
  hitos: number[];
  /** Las de segundo plano van más finas y más apagadas. */
  principal?: boolean;
  /** Las que pasan por detrás del texto: casi invisibles, solo cierran la forma. */
  tenue?: boolean;
}

/**
 * El nudo va a la derecha y no en el centro: el titular ocupa la columna
 * izquierda y una red radial detrás de un texto de 5,5rem no es atmósfera, es
 * ruido. Aquí el reparto es el clásico —palabra a un lado, dibujo al otro— y
 * las dos únicas líneas que cruzan al lado del texto van al 10% de opacidad.
 */
const NUDO = { x: 902, y: 352 };

/** El nudo en fracción del lienzo: es el punto hacia el que converge la red. */
export const NUDO_RELATIVO = { x: NUDO.x / 1200, y: NUDO.y / 720 };

const RUTAS: Ruta[] = [
  { d: `M ${NUDO.x} ${NUDO.y} C 862 250, 828 160, 790 44`, hitos: [0.55, 1], principal: true },
  { d: `M ${NUDO.x} ${NUDO.y} C 1000 300, 1076 268, 1198 222`, hitos: [0.6, 1], principal: true },
  { d: `M ${NUDO.x} ${NUDO.y} C 996 432, 1064 486, 1192 548`, hitos: [0.58, 1] },
  { d: `M ${NUDO.x} ${NUDO.y} C 846 452, 800 536, 742 690`, hitos: [0.62, 1] },
  { d: `M ${NUDO.x} ${NUDO.y} C 810 372, 742 388, 640 402`, hitos: [1] },
  { d: `M 790 44 C 700 176, 690 268, 742 690`, hitos: [], tenue: true },
  { d: `M 640 402 C 470 424, 300 470, 96 556`, hitos: [], tenue: true },
];

/** Lo que tarda un corredor en dibujarse entero, y el desfase entre corredores. */
const TRAZO = 1.5;
const DESFASE = 0.16;

interface Hito {
  x: number;
  y: number;
  /** Segundo en que la línea llega a este punto: el pulso va detrás de ella. */
  llegada: number;
}

/**
 * La red de corredores dibujándose. Misma técnica que el elemento de firma del
 * mapa —la línea se traza en vez de aparecer—, aquí con `pathLength` de Motion,
 * que es esa misma cuenta de `stroke-dasharray` con el recorrido normalizado
 * a 1 y llevada por una MotionValue.
 *
 * Los hitos no laten en bucle: cada uno da un único pulso cuando la línea pasa
 * por encima. Es la diferencia entre una animación que informa de algo —la ruta
 * ha llegado aquí— y una decoración que no para nunca.
 */
export function RedDeRutas({ className = '' }: { className?: string }) {
  const quieto = useMenosMovimiento();
  const lienzo = useRef<SVGSVGElement>(null);
  const [hitos, setHitos] = useState<Hito[]>([]);

  // Los hitos se leen del propio trazado (`getPointAtLength`) en vez de
  // escribirlos a mano: así se quedan clavados en la línea aunque se retoque
  // la curva, que es justo lo que se va a retocar.
  useLayoutEffect(() => {
    const svg = lienzo.current;
    if (!svg) return;

    const medidos: Hito[] = [];
    RUTAS.forEach((ruta, i) => {
      if (ruta.hitos.length === 0) return;
      const path = svg.querySelector<SVGPathElement>(`[data-ruta="${i}"]`);
      if (!path) return;
      const largo = path.getTotalLength();
      for (const t of ruta.hitos) {
        const p = path.getPointAtLength(largo * t);
        medidos.push({ x: p.x, y: p.y, llegada: i * DESFASE + TRAZO * t });
      }
    });
    setHitos(medidos);
  }, []);

  return (
    <svg
      ref={lienzo}
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      {RUTAS.map((ruta, i) => {
        const trazo = {
          'data-ruta': i,
          d: ruta.d,
          fill: 'none',
          stroke: 'var(--color-base)',
          strokeWidth: ruta.principal ? 1.75 : 1.1,
          strokeLinecap: 'round' as const,
          opacity: ruta.tenue ? 0.1 : ruta.principal ? 0.5 : 0.26,
        };

        // Un <path> pelado y no un motion.path con la animación desactivada:
        // `pathLength` deja puesto su `stroke-dasharray` aunque el valor final
        // sea 1, y no hay razón para que quien pidió menos movimiento cargue
        // con el aparato de dibujado.
        if (quieto) return <path key={ruta.d} {...trazo} />;

        return (
          <motion.path
            key={ruta.d}
            {...trazo}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: TRAZO, delay: i * DESFASE, ease: [0.22, 0.61, 0.36, 1] }}
          />
        );
      })}

      {hitos.map((h) => (
        <Waypoint key={`${h.x}-${h.y}`} hito={h} quieto={quieto} />
      ))}

      <Waypoint hito={{ ...NUDO, llegada: 0 }} quieto={quieto} nudo />
    </svg>
  );
}

/** Parada sobre la ruta: el punto se posa y el cerco se abre una sola vez. */
function Waypoint({ hito, quieto, nudo = false }: { hito: Hito; quieto: boolean; nudo?: boolean }) {
  const r = nudo ? 4.5 : 3;

  if (quieto) {
    return <circle cx={hito.x} cy={hito.y} r={r} fill="var(--color-atencion)" opacity={0.9} />;
  }

  return (
    <g>
      <motion.circle
        cx={hito.x}
        cy={hito.y}
        r={r}
        fill="var(--color-atencion)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.9 }}
        transition={{ delay: hito.llegada, duration: 0.28, ease: 'easeOut' }}
        style={{ transformOrigin: `${hito.x}px ${hito.y}px` }}
      />
      <motion.circle
        cx={hito.x}
        cy={hito.y}
        r={r}
        fill="none"
        stroke="var(--color-atencion)"
        strokeWidth={1.25}
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: [1, 3.4], opacity: [0.55, 0] }}
        transition={{ delay: hito.llegada, duration: 1.1, ease: 'easeOut' }}
        style={{ transformOrigin: `${hito.x}px ${hito.y}px` }}
      />
    </g>
  );
}
