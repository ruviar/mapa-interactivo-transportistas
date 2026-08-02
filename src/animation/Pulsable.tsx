import { motion } from 'motion/react';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { useSombras } from './elevacion';
import { useMenosMovimiento } from './fisica';
import { ESCALA_PULSADA, RESORTE_ELEVACION, RESORTE_PULSACION } from './resortes';

/** Motion se queda con estos nombres para sus propios gestos. */
type PropsBoton = Omit<
  ComponentProps<'button'>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'style' | 'ref'
>;

interface Props extends PropsBoton {
  /**
   * ¿El control está elevado en reposo? Solo entonces tiene sentido que la
   * sombra se comprima al pulsar. A un control plano habría que inventarle una
   * elevación para poder quitársela, y entonces flotaría media interfaz.
   */
  elevado?: boolean;
  children: ReactNode;
}

/**
 * Control con física: se hunde al pulsarlo y vuelve con resorte, no con una
 * transición. La diferencia se nota al pulsar dos veces seguidas —el muelle
 * reanuda desde la velocidad que llevaba en vez de reiniciar en seco— y es toda
 * la razón de que esto no sea un `:active` de CSS.
 */
export function Pulsable({ elevado = false, children, ...resto }: Props) {
  const quieto = useMenosMovimiento();
  const sombras = useSombras();
  const [realzado, setRealzado] = useState(false);

  if (quieto) {
    return <button {...resto}>{children}</button>;
  }

  return (
    <motion.button
      {...resto}
      onHoverStart={() => setRealzado(true)}
      onHoverEnd={() => setRealzado(false)}
      // `:focus-visible` y no `onFocus` a secas: el foco que deja un clic del
      // ratón no debe levantar nada, solo el que llega con el tabulador.
      onFocus={(e) => setRealzado(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setRealzado(false)}
      animate={
        elevado
          ? { y: realzado ? -1 : 0, boxShadow: realzado ? sombras.alta : sombras.apoyo }
          : undefined
      }
      whileTap={
        elevado
          ? { scale: ESCALA_PULSADA, y: 0, boxShadow: sombras.apoyo }
          : { scale: ESCALA_PULSADA }
      }
      transition={{ default: RESORTE_ELEVACION, scale: RESORTE_PULSACION }}
    >
      {children}
    </motion.button>
  );
}
