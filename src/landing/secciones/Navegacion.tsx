import { useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';

import { Accion } from '../piezas/Accion';

const ENLACES = [
  { href: '#asi-funciona', etiqueta: 'Cómo funciona' },
  { href: '#mapa', etiqueta: 'Mapa' },
  { href: '#por-que', etiqueta: 'El sector' },
  { href: '#contacto', etiqueta: 'Contacto' },
] as const;

/** A partir de aquí el hero ya ha dejado sitio a un fondo propio. */
const UMBRAL_FONDO = 80;

/**
 * Navegación fija sobre toda la página. Transparente mientras se ve el hero
 * —que ya es oscuro, así que el texto claro sigue legible sin fondo propio—
 * y con fondo navy + blur a partir de `UMBRAL_FONDO`, para las secciones
 * claras de más abajo. Mismo `useScroll` de Motion que ya gobierna la salida
 * del hero en `Hero.tsx`, aquí sin `target`: progreso de la ventana entera,
 * no de un elemento.
 *
 * A sangre y no en la caja de `max-w-6xl` del resto de la página: la barra es
 * el marco del sitio, no una sección más, y con la caja centrada el nombre y
 * el CTA se juntaban hacia el medio en pantallas anchas. Rejilla de tres
 * columnas (`1fr auto 1fr`) en lugar de `justify-between`: así los enlaces
 * quedan centrados en la ventana de verdad, sin que los desplace lo que mida
 * el rótulo de la izquierda.
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
        {/* Marca: pegada al borde y en dos líneas apretadas —el `line-height`
            de 0.95 de `rotulo-landing` está pensado para esto—, que es lo que
            la separa de un enlace más y la hace leer como logotipo. El
            filete ámbar hace de mancha de marca sin añadir un color nuevo. */}
        <a href="#" className="flex items-center gap-3 justify-self-start">
          <span aria-hidden="true" className="h-8 w-[3px] shrink-0 bg-atencion" />
          <span className="rotulo-landing text-body-sm text-base uppercase">
            Transportistas
            <br />
            de España
          </span>
        </a>

        {/* `gap-6` hasta `lg` y no `gap-8` fijo: con la rejilla simétrica las dos
            columnas de los lados miden lo que la más ancha de las dos (el CTA),
            así que a 768 px la barra iba justa de sitio. */}
        <nav aria-label="Principal" className="hidden items-center gap-6 md:flex lg:gap-8">
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

        <Accion href="#mapa" className="hidden justify-self-end sm:inline-flex">
          Explorar el mapa
        </Accion>
      </div>
    </header>
  );
}
