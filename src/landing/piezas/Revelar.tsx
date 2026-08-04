import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';

interface Props {
  children: ReactNode;
  /** `entrada` anima al montar (lo de arriba del pliegue); `en-vista`, al llegar. */
  modo?: 'entrada' | 'en-vista';
  /** Segundos de retardo: es lo que escalona las rejillas de tarjetas. */
  retardo?: number;
  className?: string;
}

const DESPLAZAMIENTO = 14;

/**
 * Aparición de un bloque: sube unos píxeles y se funde.
 *
 * Con `prefers-reduced-motion` no hay desplazamiento ni retardo —el contenido
 * ya está ahí desde el primer fotograma—. Escalonar fundidos para alguien que
 * ha pedido menos movimiento solo consigue que el texto tarde más en poder
 * leerse, que es exactamente lo contrario de lo que ha pedido.
 */
export function Revelar({ children, modo = 'en-vista', retardo = 0, className }: Props) {
  const quieto = useMenosMovimiento();

  if (quieto) return <div className={className}>{children}</div>;

  const oculto = { opacity: 0, y: DESPLAZAMIENTO };
  const visible = { opacity: 1, y: 0 };
  const transicion = { duration: 0.55, delay: retardo, ease: [0.22, 0.61, 0.36, 1] as const };

  if (modo === 'entrada') {
    return (
      <motion.div className={className} initial={oculto} animate={visible} transition={transicion}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={oculto}
      whileInView={visible}
      // Una sola vez: un bloque que se vuelve a desvanecer al subir y bajar
      // convierte el scroll en un interruptor y marea.
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -10% 0px' }}
      transition={transicion}
    >
      {children}
    </motion.div>
  );
}
