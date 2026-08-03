import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { Draggable, gsap } from '../../animation/gsap';

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
 *
 * El pulgar visual lo lleva `Draggable` (sigue el puntero libre dentro de la
 * pista y solo se ajusta al paso más cercano, con resorte elástico, al
 * soltar); por debajo sigue viviendo un `<input type="range">` real —
 * transparente pero no `opacity:0`, para que conserve el anillo de foco—
 * que es quien atiende teclado y lector de pantalla. Los dos se mantienen
 * sincronizados por índice, nunca por posición en píxeles.
 */
export function EmployeeThresholdSlider({ umbral, onCambiar }: Props) {
  const id = useId();
  const indice = indiceDe(umbral);

  const pistaRef = useRef<HTMLDivElement>(null);
  const pulgarRef = useRef<HTMLDivElement>(null);
  const arrastrandoRef = useRef(false);
  const [arrastrando, setArrastrando] = useState(false);

  const calcularX = (i: number) => {
    const pista = pistaRef.current;
    const pulgar = pulgarRef.current;
    if (!pista || !pulgar) return 0;
    const anchoUtil = pista.getBoundingClientRect().width - pulgar.getBoundingClientRect().width;
    return (i / (PASOS_UMBRAL.length - 1)) * Math.max(anchoUtil, 0);
  };

  // Posición inicial sin animar: solo se anima un cambio, nunca el primer pintado.
  useLayoutEffect(() => {
    if (pulgarRef.current) gsap.set(pulgarRef.current, { x: calcularX(indice) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instancia de Draggable, una sola vez. El paso que se reporta sale de la
  // geometría real del pulgar en cada arrastre, no de la contabilidad interna
  // de Draggable: así no depende de qué signifique exactamente `this.x` con
  // `bounds` puesto.
  useEffect(() => {
    const pista = pistaRef.current;
    const pulgar = pulgarRef.current;
    if (!pista || !pulgar) return;

    // Un único elemento (no un selector), así que siempre hay una instancia.
    const instancia = Draggable.create(pulgar, {
      type: 'x',
      bounds: pista,
      onPress() {
        arrastrandoRef.current = true;
        setArrastrando(true);
      },
      onDrag() {
        const pistaRect = pista.getBoundingClientRect();
        const pulgarRect = pulgar.getBoundingClientRect();
        const centro = pulgarRect.left + pulgarRect.width / 2;
        const proporcion = gsap.utils.clamp(0, 1, (centro - pistaRect.left) / pistaRect.width);
        const i = Math.round(proporcion * (PASOS_UMBRAL.length - 1));
        onCambiar(PASOS_UMBRAL[i]!);
      },
      onRelease() {
        arrastrandoRef.current = false;
        setArrastrando(false);
      },
    });

    return () => {
      instancia[0]!.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El pulgar se reasienta cuando `indice` cambia por una vía que no es el
  // propio arrastre: teclado sobre el input real, o el umbral pilotado desde
  // fuera (el paso 02 del scrollytelling del mapa). Con resorte elástico solo
  // al soltar el arrastre; aquí, un ajuste corto y sin rebote.
  useEffect(() => {
    if (arrastrandoRef.current || !pulgarRef.current) return;
    gsap.to(pulgarRef.current, {
      x: calcularX(indice),
      duration: 0.35,
      ease: 'power2.out',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  // Y al soltar el arrastre, el ajuste elástico y sutil que pide el brief.
  useEffect(() => {
    if (arrastrando || !pulgarRef.current) return;
    gsap.to(pulgarRef.current, {
      x: calcularX(indice),
      duration: 0.5,
      ease: 'elastic.out(1, 0.6)',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastrando]);

  useEffect(() => {
    const alRedimensionar = () => {
      if (pulgarRef.current) gsap.set(pulgarRef.current, { x: calcularX(indice) });
    };
    window.addEventListener('resize', alRedimensionar);
    return () => window.removeEventListener('resize', alRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice]);

  const etiquetaValor = umbral === 0 ? 'Todas' : `≥ ${umbral}`;

  return (
    <div className="flex w-full items-center gap-3 border border-asfalto/50 px-3 py-1.5 lg:w-auto">
      <label htmlFor={id} className="shrink-0 text-caption uppercase tracking-[0.1em] text-asfalto">
        Umbral
      </label>

      <div className="relative min-w-0 flex-1 py-3 lg:w-36 lg:flex-none">
        <div ref={pistaRef} className="relative h-0.5 w-full bg-asfalto/40">
          <div
            ref={pulgarRef}
            className={`absolute top-1/2 h-4 w-2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${
              arrastrando ? 'bg-atencion' : 'bg-navy-800'
            }`}
          >
            {arrastrando && (
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink px-1.5 py-0.5 font-mono text-caption tabular-nums text-base">
                {etiquetaValor}
              </span>
            )}
          </div>
        </div>

        {/* Real, no decorativo: teclado y lector de pantalla pasan por aquí.
            Transparente y no `opacity:0`, para no perder el anillo de foco. */}
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
          className="slider-umbral-fantasma"
        />
      </div>

      <p className="flex shrink-0 items-baseline gap-1.5" aria-hidden="true">
        <span className="font-mono text-body-sm font-medium tabular-nums">{etiquetaValor}</span>
        <span className="text-caption text-asfalto">{umbral === 0 ? 'con dato' : 'empleados'}</span>
      </p>
    </div>
  );
}
