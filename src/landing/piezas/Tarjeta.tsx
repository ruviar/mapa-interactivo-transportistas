import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';

import { useSombras } from '../../animation/elevacion';
import { useMenosMovimiento } from '../../animation/fisica';
import { RESORTE_ELEVACION } from '../../animation/resortes';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Tarjeta con la misma física de elevación que el resto de la interfaz
 * (`Pulsable`, `Accion`): se levanta al apuntarla —traslación en Y y sombra
 * creciente, no un `scale`— y vuelve con el muelle de `RESORTE_ELEVACION`
 * de `animation/resortes.ts`. Nunca antes de la interacción: no hay bucle
 * decorativo aquí, solo respuesta a que alguien la ha mirado.
 */
export function Tarjeta({ children, className = '' }: Props) {
  const quieto = useMenosMovimiento();
  const sombras = useSombras();
  const [realzada, setRealzada] = useState(false);

  const base = `border border-asfalto/25 bg-base p-6 ${className}`;

  if (quieto) {
    return <div className={base}>{children}</div>;
  }

  return (
    <motion.div
      className={base}
      onHoverStart={() => setRealzada(true)}
      onHoverEnd={() => setRealzada(false)}
      animate={{ y: realzada ? -4 : 0, boxShadow: realzada ? sombras.alta : sombras.apoyo }}
      transition={RESORTE_ELEVACION}
    >
      {children}
    </motion.div>
  );
}
