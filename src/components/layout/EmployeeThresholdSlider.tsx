import { useId } from 'react';

/**
 * Paradas del umbral de tamaño.
 *
 * No es una escala lineal a propósito: el 94% de las empresas con dato tiene
 * menos de 10 empleados, así que un recorrido 0–100 lineal gastaría casi todo
 * el slider en un tramo sin nadie. Las paradas se aprietan donde está la masa
 * de datos y se abren en la cola.
 */
export const PASOS_UMBRAL = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100];

/** Parada más cercana a un valor, para colocar el pulgar sin saltos raros. */
function indiceDe(umbral: number): number {
  let mejor = 0;
  for (let i = 1; i < PASOS_UMBRAL.length; i++) {
    if (Math.abs(PASOS_UMBRAL[i]! - umbral) < Math.abs(PASOS_UMBRAL[mejor]! - umbral)) mejor = i;
  }
  return mejor;
}

interface Props {
  umbral: number;
  onCambiar: (umbral: number) => void;
}

/**
 * Filtro global de tamaño. Recolorea la coropleta y recalcula los contadores
 * en cuanto se mueve — el trabajo pesado va en un `useDeferredValue` desde
 * `App`, así que el pulgar nunca se queda pegado al arrastrar.
 */
export function EmployeeThresholdSlider({ umbral, onCambiar }: Props) {
  const id = useId();
  const indice = indiceDe(umbral);

  return (
    // A todo el ancho en móvil (el slider necesita recorrido para el pulgar),
    // caja compacta a la derecha de la cabecera en escritorio.
    <div className="flex w-full items-center gap-3 border border-asfalto/50 px-3 py-1.5 lg:w-auto">
      <label
        htmlFor={id}
        className="shrink-0 text-caption uppercase tracking-[0.1em] text-asfalto"
      >
        Umbral
      </label>

      <input
        id={id}
        type="range"
        min={0}
        max={PASOS_UMBRAL.length - 1}
        step={1}
        value={indice}
        onChange={(e) => onCambiar(PASOS_UMBRAL[Number(e.target.value)]!)}
        aria-valuetext={
          umbral === 0 ? 'sin umbral, todas las empresas con dato' : `${umbral} empleados o más`
        }
        className="slider-umbral min-w-0 flex-1 lg:w-36 lg:flex-none"
      />

      <p className="flex shrink-0 items-baseline gap-1.5" aria-hidden="true">
        <span className="font-mono text-body-sm font-medium tabular-nums">
          {umbral === 0 ? 'Todas' : `≥ ${umbral}`}
        </span>
        <span className="text-caption text-asfalto">{umbral === 0 ? 'con dato' : 'empleados'}</span>
      </p>
    </div>
  );
}
