import { useCallback, useMemo, useState } from 'react';

import type { CodCCAA, CodProvincia, Regiones } from '../types/company';

/**
 * Nivel de zoom lógico. La provincia arrastra su CCAA para que el breadcrumb
 * y la capa de provincias visible no dependan de una búsqueda en cada render.
 */
export type Vista =
  | { nivel: 'nacional' }
  | { nivel: 'ccaa'; ccaa: CodCCAA }
  | { nivel: 'provincia'; ccaa: CodCCAA; provincia: CodProvincia };

export interface Navegacion {
  vista: Vista;
  /** Identidad estable de la vista: sirve de dependencia para reencuadrar. */
  clave: string;
  irANacional: () => void;
  irACCAA: (cod: CodCCAA) => void;
  irAProvincia: (cod: CodProvincia) => void;
  atras: () => void;
}

export function claveDe(vista: Vista): string {
  switch (vista.nivel) {
    case 'nacional':
      return 'nacional';
    case 'ccaa':
      return `ccaa:${vista.ccaa}`;
    case 'provincia':
      return `provincia:${vista.provincia}`;
  }
}

export function useMapNavigation(regiones: Regiones): Navegacion {
  const [vista, setVista] = useState<Vista>({ nivel: 'nacional' });

  const ccaaDeProvincia = useMemo(
    () => new Map(regiones.provincias.map((p) => [p.cod, p.ccaa])),
    [regiones],
  );

  const irANacional = useCallback(() => setVista({ nivel: 'nacional' }), []);
  const irACCAA = useCallback((cod: CodCCAA) => setVista({ nivel: 'ccaa', ccaa: cod }), []);

  const irAProvincia = useCallback(
    (cod: CodProvincia) => {
      const ccaa = ccaaDeProvincia.get(cod);
      if (!ccaa) return;
      setVista({ nivel: 'provincia', ccaa, provincia: cod });
    },
    [ccaaDeProvincia],
  );

  const atras = useCallback(
    () =>
      setVista((actual) =>
        actual.nivel === 'provincia' ? { nivel: 'ccaa', ccaa: actual.ccaa } : { nivel: 'nacional' },
      ),
    [],
  );

  return { vista, clave: claveDe(vista), irANacional, irACCAA, irAProvincia, atras };
}
