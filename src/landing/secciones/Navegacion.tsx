import { useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';

import { Accion } from '../piezas/Accion';

const ENLACES = [
  { href: '#mapa', etiqueta: 'Mapa' },
  { href: '#como-funciona', etiqueta: 'Cómo funciona' },
  { href: '#por-que', etiqueta: 'Por qué' },
  { href: '#contacto', etiqueta: 'Contacto' },
] as const;

/** A partir de aquí el hero ya ha dejado sitio a un fondo propio. */
const UMBRAL_FONDO = 80;

/**
 * Navegación fija sobre toda la página. Transparente mientras se ve el hero
 * —que ya es oscuro, así que el texto claro sigue legible sin fondo propio—
 * y con fondo navy + blur a partir de `UMBRAL_FONDO`, para las secciones
 * claras de más abajo. Mismo `useScroll` de Motion que ya gobierna la salida
 * del hero en `Hero.tsx`/`Landing.tsx`, aquí sin `target`: progreso de la
 * ventana entera, no de un elemento.
 */
export function Navegacion() {
  const { scrollY } = useScroll();
  const [conFondo, setConFondo] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => setConFondo(y > UMBRAL_FONDO));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        conFondo ? 'bg-navy-950/70 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" className="rotulo-landing text-body text-base">
          Transportistas de España
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="group relative py-1 text-body-sm text-base/85 hover:text-base"
            >
              {enlace.etiqueta}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-atencion transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <Accion href="#mapa" className="hidden sm:inline-flex">
          Explorar el mapa
        </Accion>
      </div>
    </header>
  );
}
