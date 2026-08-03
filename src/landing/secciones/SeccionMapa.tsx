import { motion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import App from '../../App';
import { useIrAVista } from '../../Raiz';
import { useMenosMovimiento } from '../../animation/fisica';
import { gsap, ScrollTrigger } from '../../animation/gsap';
import { PASOS } from '../datos/pasos';
import { MarcoNavegador } from '../piezas/MarcoNavegador';
import { Revelar } from '../piezas/Revelar';

/**
 * La herramienta, incrustada en la página, con scrollytelling en escritorio:
 * el mapa queda anclado (`sticky`, no `ScrollTrigger.pin`) mientras el texto
 * de los tres pasos recorre varias pantallas a su lado, y el mapa real
 * reacciona en vivo a cada paso vía la prop `demo` de `App` — no son
 * capturas, es la misma herramienta.
 *
 * `sticky` y no el `pin` de ScrollTrigger a propósito: `pin` alterna
 * `position: fixed` cuadro a cuadro contra la posición de scroll, y Lenis
 * (`ScrollSuave.tsx`) interpola esa posición sin avisar a ScrollTrigger —
 * la combinación sin una integración expresa entre las dos librerías tiende
 * a notarse a tirones. `sticky` no depende de ninguna librería de scroll, así
 * que da el mismo anclaje visual sin ese riesgo. Lo que sí sigue siendo de
 * ScrollTrigger es la detección de qué paso está a la vista (`onEnter`),
 * que solo dispara un cambio de estado y tolera perfectamente ese medio
 * fotograma de margen que sí le pesaría a un `pin`.
 *
 * Decisiones que vienen del spike de la Fase 0 y no son de estilo:
 *
 * - `data-lenis-prevent` en el marco. Lenis se come la rueda para interpolar
 *   el scroll y Leaflet la necesita entera para su zoom. Con el atributo,
 *   Lenis ve el evento, encuentra la marca subiendo por el `composedPath` y
 *   vuelve sin tocarlo.
 *
 * - Por debajo de `lg` (1024 px) el marco es la ventana entera, sin recuadro
 *   ni margen — la misma cifra a la que `useBottomSheet` cambia al patrón de
 *   hoja inferior (`CONSULTA_HOJA` en ese hook), y por eso tampoco hay
 *   scrollytelling ahí: no hay sitio para una columna de texto al lado y el
 *   mapa ya es toda la pantalla. `ComoFunciona`, más abajo, cubre los tres
 *   pasos para quien está en ese ancho.
 *
 * - `contain-layout` en el marco. Que el marco mida ya lo mismo que la
 *   ventana no basta: `position: fixed` se ancla al primer antecesor que
 *   forme contenedor de posicionamiento, y por defecto ninguno lo forma. Con
 *   `contain: layout` el propio marco pasa a serlo, así el `fixed` de la
 *   hoja se resuelve contra él y no contra la ventana real.
 */
export function SeccionMapa() {
  const quieto = useMenosMovimiento();
  const irAVista = useIrAVista();
  const [paso, setPaso] = useState<1 | 2 | 3 | null>(null);
  const pasoRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    if (quieto) return;

    // `gsap.matchMedia` y no un `if` suelto: la columna de pasos está
    // `hidden` por debajo de `lg` (`display:none`, rect a cero), y un
    // trigger sobre un elemento sin caja dispara `onEnter` en cuanto se
    // crea. Con `matchMedia` el efecto ni se monta fuera de escritorio, y si
    // la ventana cruza el punto de corte (girar la tablet, redimensionar)
    // GSAP se encarga solo de crear/deshacer los triggers.
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const disparadores = PASOS.map((_, i) => {
        const el = pasoRefs.current[i];
        if (!el) return null;
        const numero = (i + 1) as 1 | 2 | 3;
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => setPaso(numero),
          onEnterBack: () => setPaso(numero),
          // Salir por arriba del primer paso es salir del recorrido entero:
          // vuelve a España. Entre pasos no hace falta un `onLeave` — el
          // `onEnter` del vecino ya deja el paso correcto.
          onLeaveBack: () => {
            if (numero === 1) setPaso(null);
          },
        });
      });

      return () => disparadores.forEach((d) => d?.kill());
    });

    return () => mm.revert();
  }, [quieto]);

  return (
    <section id="mapa" className="bg-base py-16 sm:py-20 lg:px-8">
      <div className="mx-auto mb-8 max-w-6xl px-4 sm:px-6 lg:px-0">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            La herramienta
          </p>
          <h2 className="rotulo-landing mt-3 max-w-3xl text-titular text-ink">
            Empieza por el mapa. Baja hasta la empresa.
          </h2>
          <p className="mt-4 max-w-2xl text-body-sm text-ink/70">
            Elige comunidad, luego provincia, y mueve el umbral de plantilla para quedarte solo
            con las empresas del tamaño que buscas. El listado y los contadores se recalculan
            mientras arrastras.
          </p>
        </Revelar>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-10 lg:px-0">
        {/* Columna de pasos: solo escritorio, con recorrido de scroll de sobra
            para que el mapa anclado tenga tiempo de reaccionar a cada uno. */}
        <div className="hidden lg:flex lg:flex-col lg:gap-[55vh] lg:py-[16vh]">
          {PASOS.map((p, i) => (
            <div
              key={p.numero}
              data-paso={i + 1}
              ref={(el) => {
                pasoRefs.current[i] = el;
              }}
              className="transition-opacity duration-300"
              style={{ opacity: paso === i + 1 ? 1 : 0.35 }}
            >
              <p className="font-mono text-label-lg text-atencion">{p.numero}</p>
              <h3 className="rotulo mt-3 text-label-lg text-ink">{p.titulo}</h3>
              <p className="mt-2 max-w-xs text-body-sm text-ink/70">{p.texto}</p>
            </div>
          ))}
        </div>

        <motion.div
          className="lg:sticky lg:top-[8vh]"
          initial={quieto ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <MarcoNavegador
            data-lenis-prevent
            data-testid="marco-mapa"
            className="h-dvh w-full contain-layout lg:h-[78svh]"
          >
            <App demo={quieto ? undefined : { paso }} />
          </MarcoNavegador>
        </motion.div>
      </div>

      <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 sm:px-6 lg:px-0">
        <p className="font-mono text-caption uppercase tracking-[0.16em] text-asfalto">
          Sobre el mapa la rueda acerca · fuera del marco continúa la página
        </p>
        <a
          href="?app"
          onClick={(e) => {
            e.preventDefault();
            irAVista('app');
          }}
          className="border-b border-atencion/40 text-body-sm text-atencion hover:border-atencion"
        >
          Abrir la herramienta a pantalla completa
        </a>
      </div>
    </section>
  );
}
