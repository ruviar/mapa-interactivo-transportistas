import { useEffect, useState } from 'react';

import type { ColeccionRegiones } from '../types/geo';
import { cargarProvincias } from '../utils/cartografia';

/**
 * Capa de provincias. Se pide al montar, no al pulsar una comunidad: así el
 * chunk ya está en memoria cuando hace falta y el clic no espera a la red.
 */
export function useProvincias(): ColeccionRegiones | null {
  const [capa, setCapa] = useState<ColeccionRegiones | null>(null);

  useEffect(() => {
    let vigente = true;
    void cargarProvincias().then((c) => vigente && setCapa(c));
    return () => {
      vigente = false;
    };
  }, []);

  return capa;
}
