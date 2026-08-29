import { useEffect, useRef, type ReactNode } from 'react';

import { useMenosMovimiento } from './fisica';
import { gsap } from './gsap';

/**
 * Una cifra que late cuando cambia: pulso corto de escala con un destello
 * ámbar, y de vuelta a su color. No anima el valor en sí (para eso está el
 * `Odometro`): señala el cambio, que en un contador pequeño es lo único que
 * se alcanza a percibir.
 */
export function Latido({
  valor,
  className = '',
  children,
}: {
  /** Detecta el cambio; lo que se pinta lo deciden los `children`. */
  valor: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef(valor);
  const quieto = useMenosMovimiento();

  useEffect(() => {
    const cambio = anterior.current !== valor;
    anterior.current = valor;
    const el = ref.current;
    // En una pestaña oculta el rAF está congelado: el pulso se quedaría
    // pillado a media escala hasta volver, señalando un cambio ya viejo.
    if (!cambio || quieto || !el || document.hidden) return;

    const colorPropio = getComputedStyle(el).color;
    const animacion = gsap.fromTo(
      el,
      { scale: 1.22, color: 'var(--color-atencion)', transformOrigin: '50% 50%' },
      {
        scale: 1,
        color: colorPropio,
        duration: 0.45,
        ease: 'back.out(2)',
        onComplete: () => gsap.set(el, { clearProps: 'all' }),
      },
    );
    return () => {
      animacion.progress(1).kill();
    };
  }, [valor, quieto]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
