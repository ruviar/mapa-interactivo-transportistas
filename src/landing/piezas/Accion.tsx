import { motion } from 'motion/react';
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

import { useSombras } from '../../animation/elevacion';
import { useMenosMovimiento } from '../../animation/fisica';
import { gsap } from '../../animation/gsap';
import { ESCALA_PULSADA, RESORTE_ELEVACION, RESORTE_PULSACION } from '../../animation/resortes';

type Tono = 'atencion' | 'contorno' | 'tinta';

const TONOS: Record<Tono, string> = {
  atencion: 'bg-atencion text-ink hover:bg-atencion/90',
  contorno: 'border border-base/45 text-base hover:border-base/80',
  tinta: 'bg-ink text-base hover:bg-ink/90',
};

/** Cuánto más allá del propio botón ya empieza a tirar, y con qué fuerza. */
const ALCANCE_MAGNETICO = 40;
const FUERZA_MAGNETICA = 0.3;

interface Props {
  href: string;
  tono?: Tono;
  children: ReactNode;
  className?: string;
  /** Solo para los 2 CTA del hero — ver DESIGN_SYSTEM.md, no se generaliza. */
  magnetico?: boolean;
  /** Para los CTA que saltan de vista (landing → herramienta) en vez de anclar. */
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Llamada a la acción con la misma física que los controles de la herramienta:
 * los muelles salen de `animation/resortes.ts`, que en este repo es al
 * movimiento lo que `theme.css` es al color. Reescribir aquí otra rigidez sería
 * el mismo error que escribir un hex suelto en un componente.
 *
 * `Pulsable` no vale porque es un `<button>` y estas son anclas —el CTA
 * principal salta a la herramienta a pantalla completa y el secundario a
 * contacto—, pero el gesto es el mismo: se levanta al apuntarla y se hunde al
 * pulsarla.
 *
 * El magnetismo va en un `<span>` envoltorio y no en el propio `motion.a`: el
 * `animate` de Motion ya gobierna su `y` (el lift al apuntarlo) y reescribe el
 * `transform` entero en cada render — si `gsap.quickTo` escribiera también ahí,
 * las dos animaciones se pisarían. Con la física de gesto en un elemento y el
 * imán en el que lo envuelve, cada una escribe su propio `transform` y no hay
 * conflicto.
 */
export function Accion({
  href,
  tono = 'atencion',
  children,
  className = '',
  magnetico = false,
  onClick,
}: Props) {
  const quieto = useMenosMovimiento();
  const sombras = useSombras();
  const [realzada, setRealzada] = useState(false);
  const envoltorio = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!magnetico || quieto) return;
    const el = envoltorio.current;
    if (!el) return;

    const moverX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const moverY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

    const alMoverRaton = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dentro =
        e.clientX > rect.left - ALCANCE_MAGNETICO &&
        e.clientX < rect.right + ALCANCE_MAGNETICO &&
        e.clientY > rect.top - ALCANCE_MAGNETICO &&
        e.clientY < rect.bottom + ALCANCE_MAGNETICO;

      if (!dentro) {
        moverX(0);
        moverY(0);
        return;
      }
      moverX((e.clientX - (rect.left + rect.width / 2)) * FUERZA_MAGNETICA);
      moverY((e.clientY - (rect.top + rect.height / 2)) * FUERZA_MAGNETICA);
    };

    window.addEventListener('mousemove', alMoverRaton);
    return () => {
      window.removeEventListener('mousemove', alMoverRaton);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [magnetico, quieto]);

  const clases = `inline-flex items-center justify-center gap-2 px-6 py-3 text-body-sm font-medium tracking-wide uppercase ${TONOS[tono]} ${className}`;

  if (quieto) {
    return (
      <a href={href} onClick={onClick} className={clases}>
        {children}
      </a>
    );
  }

  const boton = (
    <motion.a
      href={href}
      onClick={onClick}
      className={clases}
      onHoverStart={() => setRealzada(true)}
      onHoverEnd={() => setRealzada(false)}
      onFocus={(e) => setRealzada(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setRealzada(false)}
      animate={{
        y: realzada ? -2 : 0,
        boxShadow: realzada ? sombras.alta : sombras.apoyo,
      }}
      whileTap={{ scale: ESCALA_PULSADA, y: 0, boxShadow: sombras.apoyo }}
      transition={{ default: RESORTE_ELEVACION, scale: RESORTE_PULSACION }}
    >
      {children}
    </motion.a>
  );

  if (!magnetico) return boton;

  return (
    <span ref={envoltorio} className="inline-block">
      {boton}
    </span>
  );
}
