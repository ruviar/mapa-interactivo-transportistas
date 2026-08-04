import { ScrollSuave } from './scroll/ScrollSuave';
import { Contacto } from './secciones/Contacto';
import { Hero } from './secciones/Hero';
import { Navegacion } from './secciones/Navegacion';
import { PieDePagina } from './secciones/PieDePagina';
import { PorQue } from './secciones/PorQue';

/**
 * La página. El mapa ya no vive aquí: es la herramienta a pantalla completa
 * detrás de `?app` (ver `Raiz.tsx`), a la que se llega con los enlaces "Ir al
 * mapa" del `Hero` y la navegación, no con una sección embebida en el scroll.
 */
export function Landing() {
  return (
    <div className="bg-base font-sans text-ink">
      <ScrollSuave />
      <Navegacion />

      <main>
        <Hero />
        <PorQue />
        <Contacto />
      </main>

      <PieDePagina />
    </div>
  );
}
