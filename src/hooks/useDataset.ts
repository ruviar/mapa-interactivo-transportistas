import { useEffect, useState } from 'react';

import type { Dataset } from '../types/company';

/**
 * companies.json son ~12 MB (≈1 MB comprimido) y se sirve desde public/,
 * así que se pide una sola vez por sesión y se reparte desde esta promesa.
 */
let pendiente: Promise<Dataset> | null = null;

export function cargarDataset(): Promise<Dataset> {
  pendiente ??= fetch(`${import.meta.env.BASE_URL}data/companies.json`).then((res) => {
    if (!res.ok) throw new Error(`No se pudo cargar el dataset (HTTP ${res.status})`);
    return res.json() as Promise<Dataset>;
  });
  return pendiente;
}

export type EstadoCarga =
  | { estado: 'cargando' }
  | { estado: 'listo'; dataset: Dataset }
  | { estado: 'error'; error: Error };

export function useDataset(): EstadoCarga {
  const [carga, setCarga] = useState<EstadoCarga>({ estado: 'cargando' });

  useEffect(() => {
    let vigente = true;
    cargarDataset().then(
      (dataset) => vigente && setCarga({ estado: 'listo', dataset }),
      (error: unknown) =>
        vigente &&
        setCarga({ estado: 'error', error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      vigente = false;
    };
  }, []);

  return carga;
}
