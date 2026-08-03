import { useScroll } from 'motion/react';
import { useRef } from 'react';

import { ScrollSuave } from './scroll/ScrollSuave';
import { ComoFunciona } from './secciones/ComoFunciona';
import { Contacto } from './secciones/Contacto';
import { Hero } from './secciones/Hero';
import { Navegacion } from './secciones/Navegacion';
import { PieDePagina } from './secciones/PieDePagina';
import { PorQue } from './secciones/PorQue';
import { SeccionMapa } from './secciones/SeccionMapa';

/**
 * La página. El mapa es una sección más y no se le cambia nada por dentro: lo
 * único que la landing le da es una caja y el atributo que mantiene a Lenis
 * lejos de su rueda (ver `SeccionMapa`).
 */
export function Landing() {
  const hero = useRef<HTMLDivElement>(null);

  // 0 con el hero encuadrado, 1 cuando su borde inferior alcanza el alto de la
  // ventana: exactamente el tramo en que el hero se va y el mapa llega.
  const { scrollYProgress: salidaHero } = useScroll({
    target: hero,
    offset: ['start start', 'end start'],
  });

  return (
    <div className="bg-base font-sans text-ink">
      <ScrollSuave />
      <Navegacion />

      <main>
        <div ref={hero}>
          <Hero salida={salidaHero} />
        </div>
        <SeccionMapa />
        <ComoFunciona />
        <PorQue />
        <Contacto />
      </main>

      <PieDePagina />
    </div>
  );
}
