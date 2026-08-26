import { ScrollSuave } from './scroll/ScrollSuave';
import { Contacto } from './secciones/Contacto';
import { Hero } from './secciones/Hero';
import { Navegacion } from './secciones/Navegacion';
import { PieDePagina } from './secciones/PieDePagina';
import { PorQue } from './secciones/PorQue';
import { SeccionMapa } from './secciones/SeccionMapa';

/**
 * La página. La herramienta de verdad vive a pantalla completa detrás de
 * `?app` (ver `Raiz.tsx`); `SeccionMapa` la asoma aquí como preview borroso
 * e inerte cuyo único uso posible es el CTA que salta a ella.
 */
export function Landing() {
  return (
    <div className="bg-base font-sans text-ink">
      <ScrollSuave />
      <Navegacion />

      <main>
        <Hero />
        <SeccionMapa />
        <PorQue />
        <Contacto />
      </main>

      <PieDePagina />
    </div>
  );
}
