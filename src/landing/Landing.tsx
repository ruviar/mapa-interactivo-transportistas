import { ScrollSuave } from './scroll/ScrollSuave';
import { AsiFuncionaElMapa } from './secciones/AsiFuncionaElMapa';
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
  return (
    <div className="bg-base font-sans text-ink">
      <ScrollSuave />
      <Navegacion />

      <main>
        <Hero />
        <AsiFuncionaElMapa />
        <SeccionMapa />
        <PorQue />
        <Contacto />
      </main>

      <PieDePagina />
    </div>
  );
}
