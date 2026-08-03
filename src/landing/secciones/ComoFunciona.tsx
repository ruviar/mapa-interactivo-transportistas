import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';
import { gsap } from '../../animation/gsap';
import { PASOS } from '../datos/pasos';
import { Revelar } from '../piezas/Revelar';
import { Tarjeta } from '../piezas/Tarjeta';

const ICONOS = [MapPin, SlidersHorizontal, Search] as const;

/**
 * Cómo funciona: tres pasos, numerados como salidas de autopista, conectados
 * por la misma línea que se dibuja en el hero (`RedDeRutas`) y en el mapa
 * (`ConectorSeleccion`) — el hilo conductor del sitio, en su tercera y última
 * aparición con protagonismo.
 */
export function ComoFunciona() {
  const quieto = useMenosMovimiento();
  const seccionRef = useRef<HTMLDivElement>(null);
  const lineaRef = useRef<SVGLineElement>(null);

  useLayoutEffect(() => {
    if (quieto || !lineaRef.current || !seccionRef.current) return;

    gsap.set(lineaRef.current, { drawSVG: '0%' });
    const animacion = gsap.to(lineaRef.current, {
      drawSVG: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: seccionRef.current,
        start: 'top 75%',
        end: 'bottom 65%',
        scrub: 0.4,
      },
    });

    return () => {
      animacion.scrollTrigger?.kill();
      animacion.kill();
    };
  }, [quieto]);

  return (
    <section id="como-funciona" className="bg-base px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            Cómo funciona
          </p>
          <h2 className="rotulo-landing mt-3 max-w-2xl text-titular text-ink">
            Tres pasos, sin registro de por medio.
          </h2>
        </Revelar>

        <div ref={seccionRef} className="relative mt-10">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-7 hidden h-px w-full sm:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 1"
          >
            <line
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="var(--color-asfalto)"
              strokeOpacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              ref={lineaRef}
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="var(--color-atencion)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="grid gap-4 sm:grid-cols-3">
            {PASOS.map((paso, i) => {
              // Mismo largo que PASOS por construcción: el índice siempre cae dentro.
              const Icono = ICONOS[i]!;
              return (
                <Revelar key={paso.numero} retardo={i * 0.1}>
                  <Tarjeta className="h-full">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-label-lg text-atencion">{paso.numero}</p>
                      <Icono aria-hidden="true" className="size-5 text-asfalto" strokeWidth={1.5} />
                    </div>
                    <h3 className="rotulo mt-3 text-label-lg text-ink">{paso.titulo}</h3>
                    <p className="mt-2 text-body-sm text-ink/70">{paso.texto}</p>
                  </Tarjeta>
                </Revelar>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
